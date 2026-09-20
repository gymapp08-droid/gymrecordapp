import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '@alpha/utils';

function sanitizeErrorMessage(msg: string): string {
  if (
    /prisma|pg_|syntax error|relation.*does not exist|violates.*constraint|foreign key|unique constraint|column.*does not exist|select.*from/i.test(
      msg,
    )
  ) {
    return 'A database operation failed. Details have been logged securely.';
  }
  return msg;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) || 'req_' + Date.now();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected internal server error occurred';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = sanitizeErrorMessage(res);
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        code = (obj.code as string) || HttpStatus[status] || 'ERROR';
        message = sanitizeErrorMessage((obj.message as string) || message);
        details = typeof obj.details === 'string' ? sanitizeErrorMessage(obj.details) : obj.details || obj.message;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`[${requestId}] ${exception.name}: ${exception.message}`, exception.stack);
    }

    const payload = ApiResponse.error(code, message, details, { requestId });
    response.status(status).json(payload);
  }
}
