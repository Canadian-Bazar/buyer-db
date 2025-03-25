import dotenv from 'dotenv'
import fs from 'fs'

const exampleEnv = fs.readFileSync('.env.example').toString()
const requiredEnv = dotenv.parse(exampleEnv)

const missingVars = Object.keys(requiredEnv).filter((key) => !process.env[key])

if (missingVars.length > 0) {
  console.log(`Missing .env variables: ${missingVars.join(', ')}`)
  process.exit(1)
}
