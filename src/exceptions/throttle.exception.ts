import { ArgumentsHost, ExceptionFilter, Catch, HttpException } from "@nestjs/common";
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';

@Catch(ThrottlerException)
export class ThrottleExceptionFilter implements ExceptionFilter {

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        let status = exception.getStatus();
        let cause = exception.message;
        
	console.log(`A throttle exception was thrown ... caused by ${cause}`)
                          
        response
         .status(status)
         .json({
            statusCode: status,
            message: 'Too many requests made within a minute, Try again in a few minute'
      });
    }

} 
