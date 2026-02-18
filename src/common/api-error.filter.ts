import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    let status = 500;
    let message = 'internal_error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse() as any;
      if (typeof resp === 'string') message = resp;
      else if (resp && resp.message) message = Array.isArray(resp.message) ? resp.message.join('|') : String(resp.message);
      else message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message || message;
    }

    res.status(status).json({
      successful: false,
      error_code: message,
      data: null
    });
  }
}
