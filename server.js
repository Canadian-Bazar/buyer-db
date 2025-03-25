import 'dotenv/config.js'
import './config/startup.js'

import bodyParser from 'body-parser'
import chalk from 'chalk'
import ConnectMongoDBSession from 'connect-mongodb-session'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import  expressRateLimit  from 'express-rate-limit'
import expressSession from 'express-session'
import helmet from 'helmet'
import httpStatus from 'http-status'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'

import { verifyAWSConnection } from './api/controllers/upload.controller.js'
import v1Routes from './api/routes/index.js'
import buildErrorObject from './api/utils/buildErrorObject.js'
import init from './config/mongo.js'
import sessionManager from './config/sessionManager.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const api = express()
const rateLimit = expressRateLimit({
  statusCode: httpStatus.TOO_MANY_REQUESTS,
  limit: 40,
  message: 'TOO_MANY_REQUESTS',
  windowMs: 10 * 60 * 1000,
})

init().then((dbStatus) => {
  const mongoDBSession = ConnectMongoDBSession(expressSession)
  const store = new mongoDBSession({
    uri:
      process.env.NODE_ENV === 'test'
        ? process.env.MONGO_URI_TEST
        : process.env.MONGO_URI,
    collection: 'Sessions',
  })

  verifyAWSConnection()


  api.use(bodyParser.json({ limit: '32mb' }))
  api.use(bodyParser.urlencoded({ limit: '32mb', extended: false }))
  api.use(cookieParser())
  api.use(
    cors({
      allowedHeaders: 'Content-Type',
      credentials: true,
      methods: 'POST, GET, PATCH, PUT, DELETE, HEAD, OPTIONS',
      origin: 'http://localhost:3000',
    }),
  )

  api.use('/public', express.static(path.join(__dirname, 'public')))

  api.use(
    expressSession({
      cookie: { maxAge: parseInt(process.env.SESSION_MAX_AGE) },
      resave: false,
      secret: process.env.SESSION_SECRET,
      saveUninitialized: true,
      store,
    }),
  )

  api.use(helmet())
  api.use(morgan('dev'))
  api.use(rateLimit)

  
  api.use('', v1Routes)

  api.get('/', (_req, res) =>
    res
      .status(httpStatus.OK)
      .sendFile(path.join(__dirname, './pages/index.html')),
  )

  api.all('*', (_req, res) =>
    res
      .status(httpStatus.NOT_FOUND)
      .json(buildErrorObject(httpStatus.NOT_FOUND, 'URL_NOT_FOUND')),
  )

  const server = api.listen(process.env.PORT, () => {
    const port = server.address().port
    console.log(chalk.cyan.bold('********************************'))
    console.log(chalk.green.bold('   🚀 Server Information 🚀'))
    console.log(chalk.cyan.bold('********************************'))
    console.log(chalk.yellow.bold('Api Name:    Server'))
    console.log(chalk.yellow.bold(`Port:        ${port}`))
    console.log(chalk.yellow.bold(`Database:    ${dbStatus}`))
    console.log(chalk.cyan.bold('********************************'))
    console.log(chalk.green.bold('🚀 Server is up and running! 🚀'))
    console.log(chalk.cyan.bold('********************************'))
  })
})

// For testing
export default api
