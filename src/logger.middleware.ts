import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MyLoggerService } from './logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private logger = new MyLoggerService(`HTTP`);
    use(req: Request, res: Response, next: NextFunction) {
        this.logger.log(`Logging HTTP request ${req.method} ${req.url} ${res.statusCode}`,);
        this.logger.log(`Logging HTTP RequestBody ${req.body}`);
        console.log("Request Method for "+req.url,req.method);
        console.log("Request Body for "+req.url,req.body);
        next();
    }
}