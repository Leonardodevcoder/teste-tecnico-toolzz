import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { Format } from 'logform';

@Injectable()
export class LoggerService implements NestLoggerService {
    private logger: winston.Logger;

    constructor() {
        const logFormat: Format = winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.splat(),
            winston.format.json()
        );

        const consoleFormat: Format = winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, context, trace, ...metadata }) => {
                let msg = `${timestamp} [${level}] ${context ? `[${context}]` : ''} ${message}`;

                if (Object.keys(metadata).length > 0) {
                    msg += ` ${JSON.stringify(metadata)}`;
                }

                if (trace) {
                    msg += `\n${trace}`;
                }

                return msg;
            })
        );

        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: logFormat,
            defaultMeta: {
                service: 'toolzz-api',
                environment: process.env.NODE_ENV || 'development',
            },
            transports: [
                // Console transport
                new winston.transports.Console({
                    format: consoleFormat,
                }),
                // File transport for errors
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
                // File transport for all logs
                new winston.transports.File({
                    filename: 'logs/combined.log',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
            ],
            exceptionHandlers: [
                new winston.transports.File({ filename: 'logs/exceptions.log' }),
            ],
            rejectionHandlers: [
                new winston.transports.File({ filename: 'logs/rejections.log' }),
            ],
        });
    }

    log(message: string, context?: string) {
        this.logger.info(message, { context });
    }

    error(message: string, trace?: string, context?: string) {
        this.logger.error(message, { context, trace });
    }

    warn(message: string, context?: string) {
        this.logger.warn(message, { context });
    }

    debug(message: string, context?: string) {
        this.logger.debug(message, { context });
    }

    verbose(message: string, context?: string) {
        this.logger.verbose(message, { context });
    }

    // Custom methods for structured logging
    logRequest(req: any) {
        this.logger.info('HTTP Request', {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
    }

    logResponse(req: any, res: any, responseTime: number) {
        this.logger.info('HTTP Response', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
        });
    }

    logDatabaseQuery(query: string, duration: number) {
        this.logger.debug('Database Query', {
            query,
            duration: `${duration}ms`,
        });
    }

    logPerformance(operation: string, duration: number, metadata?: any) {
        this.logger.info('Performance Metric', {
            operation,
            duration: `${duration}ms`,
            ...metadata,
        });
    }

    logSecurity(event: string, metadata?: any) {
        this.logger.warn('Security Event', {
            event,
            ...metadata,
        });
    }
}
