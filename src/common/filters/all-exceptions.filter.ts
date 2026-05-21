import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger('AllExceptionsFilter');

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        // Log the error for internal debugging
        this.logger.error(
            `Http Status: ${status} Error Message: ${JSON.stringify(message)}`,
            exception instanceof Error ? exception.stack : '',
        );

        // Sanitize response for production
        const isProduction = process.env.NODE_ENV === 'production';

        let errorResponse: any;

        if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
            errorResponse = {
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: request.url,
                message: 'Internal server error', // Generic message for users
            };
        } else {
            console.log('sdfadsadsadasdasdasdasdasd')
            // For non-500 errors (like validation), we can return the actual message
            errorResponse = {
                statusCode: status,
                timestamp: new Date().toISOString(), 
                path: request.url,
                message: typeof message === 'object' && (message as any).message
                    ? (message as any).message
                    : message,
            };
        }

        response.status(status).json(errorResponse);
    }
}
