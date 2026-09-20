import { NotificationCategory } from '@alpha/types';

export interface IPushPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
  category?: NotificationCategory;
  deepLinkUrl?: string;
}

export interface IPushResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
  isInvalidToken?: boolean;
}

export interface IPushNotificationProvider {
  readonly name: string;
  sendPush(token: string, payload: IPushPayload): Promise<IPushResult>;
  sendBatchPush(tokens: string[], payload: IPushPayload): Promise<Map<string, IPushResult>>;
}
