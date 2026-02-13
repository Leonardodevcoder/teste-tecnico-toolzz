import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
    constructor(private readonly logger: LoggerService) { }

    use(req: Request, res: Response, next: NextFunction) {
        const startTime = Date.now();

        // Log incoming request
        this.logger.logRequest(req);

        // Capture response
        res.on('finish', () => {
            const responseTime = Date.now() - startTime;
            this.logger.logResponse(req, res, responseTime);

            // Log slow requests
            if (responseTime > 1000) {
                this.logger.warn(`Slow request detected: ${req.method} ${req.url}`, 'Performance');
            }
        });

        next();
    }
}
