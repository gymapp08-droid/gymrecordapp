import { IAIContext, IAIChatResponse, IAIInsight, IAIMessage } from '@alpha/types';

export interface IAIProvider {
  name: string;
  generateResponse(
    query: string,
    context: IAIContext,
    history?: IAIMessage[],
  ): Promise<IAIChatResponse>;
  generateInsights(context: IAIContext): Promise<IAIInsight[]>;
}
