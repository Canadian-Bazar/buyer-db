import crypto from 'crypto'

const encrypt = (text = '') => {
  const algorithm = process.env.ENCRYPTION_ALGORITHM
  const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  const encryptionIV = Buffer.from(process.env.ENCRYPTION_IV, 'hex')

  const cipher = crypto.createCipheriv(algorithm, encryptionKey, encryptionIV)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return encrypted
}

export default encrypt
