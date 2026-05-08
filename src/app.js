import express from 'express';
import cors from 'cors';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'express-async-errors';

import { config } from './config/env.js';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({
  origin: config.NODE_ENV === 'production'
    ? config.CORS_ORIGIN       
    : 'http://localhost:5173',
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: false }));

try {
  const openapiPath = join(__dirname, '..', 'openapi.yaml');
  const openapiSpec = parse(readFileSync(openapiPath, 'utf8'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
  console.log(' Swagger UI available at /api/docs');
} catch {
  console.warn('openapi.yaml not found — Swagger UI disabled');
}

app.use('/api/v1', router);

app.use((req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

app.use(errorHandler);

export default app;
