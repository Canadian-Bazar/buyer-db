import { GetObjectCommand , ListBucketsCommand, PutObjectCommand , S3Client } from "@aws-sdk/client-s3";
import fs from 'fs'
import handleError from "../utils/handleError.js";


const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


export const verifyAWSConnection = async () => {
  console.log('Verifying AWS connection...');
  try{
    const command = new ListBucketsCommand({})
    const response = await s3.send(command)
    console.log('AWS Connection Verified. Buckets:', response.Buckets);

  }catch(err){
    console.error('Failed to connect to AWS:', err.message);
    process.exit(1);
  }
}


export const uploadFile = async (files) => {
  try {
    const bucketName = process.env.S3_BUCKET;
    if (!bucketName) {
      console.error('S3_BUCKET_NAME is not set in environment variables');
      throw new Error('S3_BUCKET_NAME is not set');
    }
    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    const uploadPromises = files.map(async (file) => {
      const fileStream = fs.createReadStream(file.path);
      const uploadParams = {
        Bucket: bucketName,
        Key: file.filename,
        Body: fileStream,
        ContentType: file.mimetype, 
        ContentDisposition: 'inline', 
      };
      await s3.send(new PutObjectCommand(uploadParams));
      
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error(`Error deleting file ${file.path}:`, err.message);
      }
      
      return `${file.filename}`;
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    return uploadedFiles;
  } catch (err) {
    console.error('Error uploading file:', err.message);
    throw new Error('Error uploading file');
  }
}



export const getImageS3Proxy = async (fileName) => {
  try {
    const bucket = process.env.S3_BUCKET;
    
    if (!bucket) {
      throw new Error('S3_BUCKET is not set in environment variables');
    }
    
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileName,
    });
    
    const s3Object = await s3.send(command);
    
    const bodyContents = await s3Object.Body.transformToByteArray();
    const fileData = Buffer.from(bodyContents);
    
    return {
      data: fileData,
      contentType: s3Object.ContentType || 'application/octet-stream',
      contentLength: s3Object.ContentLength,
      lastModified: s3Object.LastModified
    };
  } catch (err) {
    console.error('Error retrieving file from S3:', err.message);
    throw err;
  }
};

