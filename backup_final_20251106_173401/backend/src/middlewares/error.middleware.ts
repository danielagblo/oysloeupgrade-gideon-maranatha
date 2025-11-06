import type { NextFunction, Request, Response } from 'express';
import { config } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { logError } from '../utils/logger.js';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logError(err.message, err);

  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
  }

  const response: {
    success: false;
    message: string;
    error: { code: string };
    stack?: string;
    errors?: Record<string, string[]>;
  } = {
    success: false,
    message,
    error: { code },
    ...(config.server.isDevelopment && { stack: err.stack }),
  };

  if ('errors' in err && err instanceof AppError) {
    response.errors = (err as AppError & { errors?: Record<string, string[]> }).errors;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
