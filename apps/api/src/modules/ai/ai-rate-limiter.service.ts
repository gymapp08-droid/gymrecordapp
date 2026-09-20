import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class AiRateLimiterService {
  private readonly requestWindows = new Map<string, number[]>();
  private readonly MAX_REQUESTS_PER_MINUTE = 30;

  checkRateLimit(userId: string): void {
    const now = Date.now();
    const windowStart = now - 60000;

    let timestamps = this.requestWindows.get(userId) || [];
    // Evict expired timestamps
    timestamps = timestamps.filter((t) => t >= windowStart);

    if (timestamps.length >= this.MAX_REQUESTS_PER_MINUTE) {
      throw new HttpException(
        {
          code: 'AI_RATE_LIMIT_EXCEEDED',
          message: 'Too many AI requests. Please wait a moment before sending more queries.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    timestamps.push(now);
    this.requestWindows.set(userId, timestamps);
  }
}
