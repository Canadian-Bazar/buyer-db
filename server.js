import 'dotenv/config.js';
import './config/startup.js';

import bodyParser from 'body-parser';
import chalk from 'chalk';
import ConnectMongoDBSession from 'connect-mongodb-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import expressRateLimit from 'express-rate-limit';
import expressSession from 'express-session';
import helmet from 'helmet';
import httpStatus from 'http-status';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import prerender from 'prerender-node';

import v1Routes from './api/routes/index.js';
import buildErrorObject from './api/utils/buildErrorObject.js';
import init from './config/mongo.js';
import sessionManager from './config/sessionManager.js';
import imageProxyRoutes from './api/routes/image-proxy.routes.js';
import { redisClient } from './api/redis/redis.config.js';
import { scheduleAnalyticsCronJobs } from './api/cron/cron.js';
import { verifyAWSConnection } from './api/helpers/aws-s3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const api = express();

// Optional IP allowlist for integrations (comma-separated in env)
const integrationAllowlist = new Set(
  (process.env.INTEGRATION_ALLOWLIST_IPS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

const rateLimit = expressRateLimit({
  statusCode: httpStatus.TOO_MANY_REQUESTS,
  limit: 500,
  message: 'TOO_MANY_REQUESTS',
  windowMs: 10 * 60 * 1000,
  // Skip rate limiting for allowlisted IPs and known integration bots (e.g., Prerender)
  skip: (req) => {
    const ip = (req.ip || '').replace('::ffff:', '');
    const ua = req.headers['user-agent'] || '';
    if (integrationAllowlist.has(ip)) return true;
    if (/prerender/i.test(ua)) return true;
    return false;
  },
});

init().then((dbStatus) => {
  const mongoDBSession = ConnectMongoDBSession(expressSession);
  const store = new mongoDBSession({
    uri:
      process.env.NODE_ENV === 'test'
        ? process.env.MONGO_URI_TEST
        : process.env.MONGO_URI,
    collection: 'Sessions',
  });

  verifyAWSConnection();

  api.use(bodyParser.json({ limit: '32mb' }));
  api.use(bodyParser.urlencoded({ limit: '32mb', extended: false }));

  api.use(cookieParser());
  api.use(
    cors({
      allowedHeaders: ['Content-Type', 'x-user-role'],
      credentials: true,

      methods: 'POST, GET, PATCH, PUT, DELETE, HEAD, OPTIONS',
      origin: [
        process.env.FRONTEND_URL,
        'http://localhost:5173',
        'https://canadian-bazaar.ca',
        ' http://192.168.29.187:5173',
      ],
    }),
  );

  // Prerender middleware (set token via env PRERENDER_TOKEN)
  if (process.env.PRERENDER_TOKEN) {
    api.use(prerender.set('prerenderToken', process.env.PRERENDER_TOKEN));
  }

  api.use('/public', express.static(path.join(__dirname, 'public')));
  // Serve verification files under /.well-known with no-cache
  api.use(
    '/.well-known',
    express.static(path.join(__dirname, 'public', '.well-known'), {
      setHeaders: (res) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      },
    }),
  );

  api.use(
    expressSession({
      cookie: { maxAge: parseInt(process.env.SESSION_MAX_AGE) },
      resave: false,
      secret: process.env.SESSION_SECRET,
      saveUninitialized: true,
      store,
    }),
  );

  api.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  api.use(morgan('dev'));
  api.use(rateLimit);

  api.use('/', v1Routes);
  api.use('/media', imageProxyRoutes);

  // Integration health endpoint (no-cache)
  api.get('/integration/health', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.status(httpStatus.OK).json({
      success: true,
      code: httpStatus.OK,
      response: {
        status: 'ok',
        service: 'buyer-db',
        timestamp: Date.now(),
      },
    });
  });

  api.get('/', (_req, res) =>
    res
      .status(httpStatus.OK)
      .sendFile(path.join(__dirname, './pages/index.html')),
  );

  api.all('*', (_req, res) =>
    res
      .status(httpStatus.NOT_FOUND)
      .json(buildErrorObject(httpStatus.NOT_FOUND, 'URL_NOT_FOUND')),
  );

  const server = api.listen(process.env.PORT, () => {
    const port = server.address().port;
    console.log(chalk.cyan.bold('********************************'));
    console.log(chalk.green.bold('   🚀 Canadian Bazaar Buyer DB 🚀'));
    console.log(chalk.cyan.bold('********************************'));
    console.log(chalk.yellow.bold('Api Name:    Server'));
    console.log(chalk.yellow.bold(`Port:        ${port}`));
    console.log(chalk.yellow.bold(`Database:    ${dbStatus}`));
    console.log(chalk.cyan.bold('********************************'));
    console.log(chalk.green.bold('🚀 Server is up and running! 🚀'));
    console.log(chalk.cyan.bold('********************************'));
  });
});

// redisClient.ping()
//                  .then(()=>{

//                   console.log('Redis connected')

//                   scheduleAnalyticsCronJobs()

//                  })

// For testing
export default api;
