import fs from 'fs'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const loadModels = () => {
  fs.readdirSync(path.join(__dirname, '../api/models')).forEach(
    async (model) => (await import(`../api/models/${model}`)).default,
  )
}

const init = () => {
  return new Promise((resolve) => {
    const mongoURI =
      process.env.NODE_ENV === 'test'
        ? process.env.MONGO_URI_TEST
        : process.env.MONGO_URI

    mongoose.connect(mongoURI)
    const conn = mongoose.connection
    conn.once('open', () => {
      loadModels()
      resolve('Database connected')
    })

    conn.on('error', (err) => {
      console.log(err)
      resolve('Database connection error')
    })
  })
}

export default init
