import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@alpha/utils';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const requestId = (request.headers['x-request-id'] as string) || 'req_' + Date.now();

    return next.handle().pipe(
      map((data) => {
        // If data is already in standard ApiResponse format, pass it through
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }
        return ApiResponse.success(data, { requestId });
      }),
    );
  }
}
