import 'dotenv/config.js'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import init from './config/mongo.js'

init()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const removeFromDB = (model) => {
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        model = (await import(`./api/models/${model}`)).default
        resolve(await model.deleteMany({}))
      } catch (err) {
        reject(err)
      }
    })()
  })
}

const clean = async () => {
  try {
    const models = fs.readdirSync(path.join(__dirname, '/api/models'))
    await Promise.all(
      models.map(async (model) => {
        await removeFromDB(model)
      })
    )

    console.log('Database cleanup completed')
    process.exit(0)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

clean()