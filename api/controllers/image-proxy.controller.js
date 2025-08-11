import { getImageS3Proxy } from "../helpers/aws-s3.js";
import { matchedData } from "express-validator";
import handleError from "../utils/handleError.js";

// Just use your existing function for all media types
export const getMediaProxyController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        
        console.log('Media request for:', validatedData.fileName);
        
        // Use getImageS3Proxy for all media - it works for videos/PDFs too!
        const mediaData = await getImageS3Proxy(validatedData.fileName);

        // Get file extension to determine media type
        const fileExtension = validatedData.fileName.toLowerCase().split('.').pop();
        
        console.log('File extension:', fileExtension, 'Is video:', isVideoFile(fileExtension));
        
        // Set appropriate Content-Type based on file extension
        const contentType = getContentType(fileExtension);
        res.setHeader('Content-Type', contentType);
        
        console.log('Content-Type set to:', contentType);

        // Set Content-Length if available
        if (mediaData.contentLength) {
            res.setHeader('Content-Length', mediaData.contentLength);
        }

        // Set Last-Modified if available
        if (mediaData.lastModified) {
            res.setHeader('Last-Modified', mediaData.lastModified.toUTCString());
        }

        // Set appropriate cache control based on media type
        const cacheControl = getCacheControl(fileExtension);
        res.setHeader('Cache-Control', cacheControl);

        // For videos, support range requests (important for video streaming)
        if (isVideoFile(fileExtension)) {
            console.log('Handling as video file');
            // CRITICAL: Set these headers BEFORE calling handleVideoStreaming
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Content-Disposition', 'inline'); // Prevents download!
            handleVideoStreaming(req, res, mediaData);
        } else {
            console.log('Handling as non-video file');
            // For images and PDFs, serve normally
            if (fileExtension === 'pdf') {
                res.setHeader('Content-Disposition', 'inline'); // Display PDFs inline too
            }
            res.end(mediaData.data);
        }

    } catch (err) {
        console.error('Media proxy error:', err);
        handleError(res, err);
    }
};

// Helper functions (same as before)
const getContentType = (fileExtension) => {
    const mimeTypes = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
        'webp': 'image/webp', 'svg': 'image/svg+xml', 'bmp': 'image/bmp', 'ico': 'image/x-icon',
        'mp4': 'video/mp4', 'avi': 'video/x-msvideo', 'mov': 'video/quicktime', 'wmv': 'video/x-ms-wmv',
        'flv': 'video/x-flv', 'webm': 'video/webm', 'mkv': 'video/x-matroska', '3gp': 'video/3gpp',
        'pdf': 'application/pdf', 'doc': 'application/msword',
        'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg'
    };
    return mimeTypes[fileExtension] || 'application/octet-stream';
};

const getCacheControl = (fileExtension) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'];
    
    if (imageExtensions.includes(fileExtension)) {
        return 'public, max-age=2592000, immutable'; // 30 days
    } else if (videoExtensions.includes(fileExtension)) {
        return 'public, max-age=86400'; // 1 day
    } else {
        return 'public, max-age=604800'; // 7 days
    }
};

const isVideoFile = (fileExtension) => {
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'];
    return videoExtensions.includes(fileExtension);
};

const handleVideoStreaming = (req, res, mediaData) => {
    const range = req.headers.range;
    const fileSize = mediaData.contentLength || mediaData.data.length;
    
    console.log('Video streaming - Range:', range, 'File size:', fileSize);
    
    // ALWAYS set these headers for videos
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Disposition', 'inline');
    
    if (!range) {
        // No range header - serve full file but STILL set proper headers
        console.log('No range - serving full video file');
        res.setHeader('Content-Length', fileSize);
        res.status(200);
        res.end(mediaData.data);
        return;
    }

    console.log('Range request detected - handling partial content');
    
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10) || 0;
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const actualEnd = Math.min(end, fileSize - 1);
    const chunksize = (actualEnd - start) + 1;

    console.log(`Serving bytes ${start}-${actualEnd}/${fileSize} (${chunksize} bytes)`);

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${actualEnd}/${fileSize}`);
    res.setHeader('Content-Length', chunksize);

    if (Buffer.isBuffer(mediaData.data)) {
        const chunk = mediaData.data.subarray(start, actualEnd + 1);
        res.end(chunk);
    } else {
        const chunk = mediaData.data.slice(start, actualEnd + 1);
        res.end(chunk);
    }
};

// Keep your existing getImageProxyController
export const getImageProxyController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const imageData = await getImageS3Proxy(validatedData.fileName);
        
        const fileExtension = validatedData.fileName.toLowerCase().split('.').pop();
        const contentType = getContentType(fileExtension);
        
        res.setHeader('Content-Type', contentType);
        if (imageData.contentLength) {
            res.setHeader('Content-Length', imageData.contentLength);
        }
        if (imageData.lastModified) {
            res.setHeader('Last-Modified', imageData.lastModified.toUTCString());
        }
        
        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
        res.end(imageData.data);
        
    } catch (err) {
        handleError(res, err);
    }
};