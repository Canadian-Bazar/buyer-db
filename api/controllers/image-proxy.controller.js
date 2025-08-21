import { getImageS3Proxy } from "../helpers/aws-s3.js";
import { matchedData } from "express-validator";
import handleError from "../utils/handleError.js";
const EXT_BY_MIME = {
"application/pdf": "pdf",
"application/msword": "doc",
"application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
"application/vnd.ms-excel": "xls",
"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
"image/jpeg": "jpg",
"image/png": "png",
"image/gif": "gif",
"image/webp": "webp",
"video/mp4": "mp4",
"video/webm": "webm",
"video/x-msvideo": "avi",
"video/quicktime": "mov",
"video/x-ms-wmv": "wmv",
"audio/mpeg": "mp3",
"audio/wav": "wav",
"audio/ogg": "ogg",
};
const MIME_BY_EXT = {
jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
bmp: "image/bmp", ico: "image/x-icon",
mp4: "video/mp4", avi: "video/x-msvideo", mov: "video/quicktime", wmv: "video/x-ms-wmv", flv: "video/x-flv",
webm: "video/webm", mkv: "video/x-matroska", "3gp": "video/3gpp",
pdf: "application/pdf",
doc: "application/msword",
docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
xls: "application/vnd.ms-excel",
xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
};
const isVideoExt = (ext) => ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv", "3gp"].includes(ext);
const isPdfExt = (ext) => ext === "pdf";
const getContentType = (fileExtension, fallback) => MIME_BY_EXT[fileExtension] || fallback || "application/octet-stream";
const ensureFilenameWithExt = (keyOrName, contentType, extFromKey) => {
const explicitExt = EXT_BY_MIME[contentType];
// Keep existing extension if present; otherwise use contentType
if (extFromKey) return keyOrName.includes(".") ? keyOrName : `${keyOrName}.${extFromKey}`;
if (keyOrName.includes(".")) return keyOrName;
return explicitExt ? `${keyOrName}.${explicitExt}` : keyOrName;
};
const getCacheControl = (fileExtension) => {
const imageExts = ["jpg","jpeg","png","gif","webp","svg","bmp","ico"];
const videoExts = ["mp4","avi","mov","wmv","flv","webm","mkv","3gp"];
if (imageExts.includes(fileExtension)) return "public, max-age=2592000, immutable";
if (videoExts.includes(fileExtension)) return "public, max-age=86400";
return "public, max-age=604800";
};
const handleVideoStreaming = (req, res, mediaData) => {
const range = req.headers.range;
const fileSize = mediaData.contentLength || mediaData.data.length;
res.setHeader("Accept-Ranges", "bytes");
res.setHeader("Content-Disposition", "inline");
if (!range) {
res.setHeader("Content-Length", fileSize);
res.status(200).end(mediaData.data);
return;
}
const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
const start = parseInt(startStr, 10) || 0;
const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
const actualEnd = Math.min(end, fileSize - 1);
const chunkSize = actualEnd - start + 1;
res.status(206);
res.setHeader("Content-Range", bytes `${start}-${actualEnd}/${fileSize}`);
res.setHeader("Content-Length", chunkSize);
const chunk = Buffer.isBuffer(mediaData.data)
? mediaData.data.subarray(start, actualEnd + 1)
: mediaData.data.slice(start, actualEnd + 1);
res.end(chunk);
};
// Use this for all media (images, videos, PDFs, docs)
export const getMediaProxyController = async (req, res) => {
try {
const validatedData = matchedData(req);
const { fileName } = validatedData;
const mediaData = await getImageS3Proxy(fileName);
// Prefer S3-provided headers when available
const s3Type = mediaData.contentType; // if your helper returns it
const extFromKey = (fileName.toLowerCase().split(".").pop() || "").replace(/[^a-z0-9]/g, "");
const inferredType = getContentType(extFromKey, s3Type);
const fileExtension = (Object.keys(MIME_BY_EXT).find((k) => MIME_BY_EXT[k] === inferredType) || extFromKey || "").toLowerCase();
// Toggle: download=1 forces download with correct extension
const forceDownload = req.query.download === "1";
// Content-Type
res.setHeader("Content-Type", inferredType);
// Length/Last-Modified if available
if (mediaData.contentLength) res.setHeader("Content-Length", mediaData.contentLength);
if (mediaData.lastModified) res.setHeader("Last-Modified", new Date(mediaData.lastModified).toUTCString());
// Cache control
res.setHeader("Cache-Control", getCacheControl(fileExtension));
// Content-Disposition logic
let dispositionType = "inline";
if (forceDownload) dispositionType = "attachment";
else if (!isPdfExt(fileExtension) && !isVideoExt(fileExtension) && !inferredType.startsWith("image/")) {
// Non-image, non-pdf, non-video: default to download unless overridden
dispositionType = "attachment";
}
// Ensure filename has proper extension for download or inline naming
const suggestedName = ensureFilenameWithExt(fileName, inferredType, fileExtension);
// RFC 5987 filename*
res.setHeader(
"Content-Disposition",
`${dispositionType}; filename="${encodeURIComponent(suggestedName)}"; filename*=UTF-8''${encodeURIComponent(suggestedName)}
`);
// Render or stream
if (isVideoExt(fileExtension)) {
res.setHeader("Accept-Ranges", "bytes");
return handleVideoStreaming(req, res, mediaData);
}
// PDFs render inline; images render inline; other docs download unless forced otherwise above
return res.end(mediaData.data);
} catch (err) {
console.error("Media proxy error:", err);
handleError(res, err);
}
};
// If you keep a separate image proxy, also set Content-Disposition inline there
export const getImageProxyController = async (req, res) => {
try {
const validatedData = matchedData(req);
const imageData = await getImageS3Proxy(validatedData.fileName);
const ext = validatedData.fileName.toLowerCase().split(".").pop();
const contentType = getContentType(ext, imageData.contentType);
res.setHeader("Content-Type", contentType);
if (imageData.contentLength) res.setHeader("Content-Length", imageData.contentLength);
if (imageData.lastModified) res.setHeader("Last-Modified", new Date(imageData.lastModified).toUTCString());
res.setHeader("Cache-Control", getCacheControl(ext));
res.setHeader("Content-Disposition", "inline");
res.end(imageData.data);
} catch (err) {
handleError(res, err);
}
};