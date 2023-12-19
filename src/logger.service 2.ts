import { LoggerService, Injectable, Logger } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';


const transports = {
    console: new winston.transports.Console({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }),
            winston.format.colorize({
                colors: {
                    info: 'blue',
                    debug: 'yellow',
                    error: 'red',
                },
            }),
            winston.format.printf((info) => {
                return `${info.timestamp} [${info.level}] [${info.context ? info.context : info.stack
                    }] ${info.message}`;
            }),
            // winston.format.align(),
        ),
    }),
    dailyRotateFile: new DailyRotateFile({
        filename: './logs/log-%DATE%.log',  // the name of the log files
        datePattern: 'YYYY-MM-DD',  // create a new log file every day
        zippedArchive: true,  // compress the log files
        maxSize: '20m',  // limit the size of each log file to 20 MB
        maxFiles: '14d',  // keep a maximum of 14 days of log files
    }),
};

// create a new winston logger
const winstonLogger = winston.createLogger({
    transports: [transports.dailyRotateFile, transports.console],
});

@Injectable()
export class MyLoggerService implements LoggerService {
    private context: string;

    constructor(context: string) {
        this.context = context;
    }


    public log(message: any, ...optionalParams: [...any, string?]) {
        const context = optionalParams[optionalParams.length - 1];
        winstonLogger.info(this.formatMessage(message, context), optionalParams.slice(0, -1));
    }

    public error(message: any, trace?: string, ...optionalParams: [...any, string?]) {
        const context = optionalParams[optionalParams.length - 1];
        winstonLogger.error(this.formatMessage(message, context), trace, optionalParams.slice(0, -1));
    }

    public warn(message: any, ...optionalParams: [...any, string?]) {
        const context = optionalParams[optionalParams.length - 1];
        winstonLogger.warn(this.formatMessage(message, context), optionalParams.slice(0, -1));
    }

    public debug(message: any, ...optionalParams: [...any, string?]) {
        const context = optionalParams[optionalParams.length - 1];
        winstonLogger.debug(this.formatMessage(message, context), optionalParams.slice(0, -1));
    }

    public verbose(message: any, ...optionalParams: [...any, string?]) {
        const context = optionalParams[optionalParams.length - 1];
        winstonLogger.verbose(this.formatMessage(message, context), optionalParams.slice(0, -1));
    }

    private formatMessage(message: any, context?: string): string {
        const formattedMessage = `[${context || this.context}] ${JSON.stringify(message)}`;
        return formattedMessage;
    }
}

















