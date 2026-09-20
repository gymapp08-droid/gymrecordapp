import { Injectable, Logger } from '@nestjs/common';
import { IPushNotificationProvider, IPushPayload, IPushResult } from './push-provider.interface';

export interface ISentPushLog {
  token: string;
  payload: IPushPayload;
  messageId: string;
  timestamp: Date;
}

@Injectable()
export class MockPushNotificationProvider implements IPushNotificationProvider {
  readonly name = 'mock-push-provider';
  private readonly logger = new Logger(MockPushNotificationProvider.name);
  private readonly sentLogs: ISentPushLog[] = [];

  async sendPush(token: string, payload: IPushPayload): Promise<IPushResult> {
    if (!token || token.trim() === '' || token.startsWith('invalid-')) {
      return {
        success: false,
        error: 'INVALID_DEVICE_TOKEN',
        isInvalidToken: true,
      };
    }

    const messageId = `mock_msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const logEntry: ISentPushLog = {
      token,
      payload,
      messageId,
      timestamp: new Date(),
    };

    this.sentLogs.push(logEntry);
    this.logger.debug(`[MockPush] Sent push to token: ${token.substring(0, 10)}... with ID: ${messageId}`);

    return {
      success: true,
      providerMessageId: messageId,
    };
  }

  async sendBatchPush(tokens: string[], payload: IPushPayload): Promise<Map<string, IPushResult>> {
    const results = new Map<string, IPushResult>();
    for (const token of tokens) {
      const res = await this.sendPush(token, payload);
      results.set(token, res);
    }
    return results;
  }

  getSentLogs(): ISentPushLog[] {
    return [...this.sentLogs];
  }

  clearLogs(): void {
    this.sentLogs.length = 0;
  }
}
