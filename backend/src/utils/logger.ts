import path from 'node:path';
import winston from 'winston';
import { config } from '../config/env.js';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'oysloe-backend' },
  transports: [

    new winston.transports.File({
      filename: config.logging.filePath,
      maxsize: 5242880,
      maxFiles: 5,
    }),

    new winston.transports.File({
      filename: path.join(path.dirname(config.logging.filePath), 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

if (config.server.isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

if (config.server.isProduction) {
  logger.add(
    new winston.transports.Console({
      format: logFormat,
    })
  );
}

export const logInfo = (message: string, meta?: Record<string, unknown>) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error | unknown) => {
  logger.error(message, {
    error: error instanceof Error ? error.stack : error,
  });
};

export const logWarn = (message: string, meta?: Record<string, unknown>) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, unknown>) => {
  logger.debug(message, meta);
};
