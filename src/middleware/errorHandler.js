import { config } from '../config/env.js';


export function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ERROR:`, err);

  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] ?? 'field';
    return res.status(409).json({
      code: 'DUPLICATE_VALUE',
      message: `A record with this ${field} already exists`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      code: 'NOT_FOUND',
      message: err.meta?.cause ?? 'Record not found',
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Invalid token',
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      code: err.code ?? 'ERROR',
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
    ...(config.NODE_ENV === 'development' && { debug: err.message }),
  });
}
