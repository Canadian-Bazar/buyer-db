import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const getSignedURL = async (objectKey) => {
  if (!objectKey) {
    console.log('No object Key exist ')
    return ''
  }

  try {
    const getCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: objectKey,
    })

    const signUrl = await getSignedUrl(s3, getCommand, {
      expiresIn: process.env.S3_EXPIRATION,
    })
    return String(signUrl)
  } catch (err) {
    console.log(err)
    console.log('error occured while fetching signUrl')
    return ''
  }


}

export default getSignedURL
