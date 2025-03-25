import crypto from 'crypto'

const decrypt = (encrypted = '') => {
  const algorithm = process.env.ENCRYPTION_ALGORITHM
  const encyptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  const encyptionIV = Buffer.from(process.env.ENCRYPTION_IV, 'hex')

  const decipher = crypto.createDecipheriv(
    algorithm,
    encyptionKey,
    encyptionIV,
  )
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

export default decrypt
