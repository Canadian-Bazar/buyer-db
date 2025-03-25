import 'dotenv/config.js'

import { Seeder } from 'mongo-seeding'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const config = {
  database:
    process.env.NODE_ENV === 'test'
      ? process.env.MONGO_URI_TEST
      : process.env.MONGO_URI,
  dropDatabase: false,
}

const seeder = new Seeder(config)
const collections = seeder.readCollectionsFromPath(
  path.join(__dirname, '/data')
)

const seed = async () => {
  try {
    await seeder.import(collections)
    console.log('Database seeding completed')
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

seed()
