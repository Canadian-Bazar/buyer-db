import { getImageS3Proxy } from "../helpers/aws-s3.js";
import { matchedData } from "express-validator";
import handleError from "../utils/handleError.js";


export const getImageProxyController = async (req  , res)=>{
    try {
        const validatedData = matchedData(req)
        const imageUrl = await getImageS3Proxy(validatedData.fileName)
        res.setHeader('Content-Type', imageUrl.contentType);
        if (imageUrl.contentLength) {
          res.setHeader('Content-Length', imageUrl.contentLength);
        }
        if (imageUrl.lastModified) {
          res.setHeader('Last-Modified', imageUrl.lastModified.toUTCString());
        }
        
        res.setHeader('Cache-Control', 'public, max-age=86400'); 
        
        res.end(imageUrl.data);  
      } catch (err) {
        handleError(res, err)
    }
}