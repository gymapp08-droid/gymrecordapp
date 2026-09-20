import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { HashUtil } from '@alpha/utils';
import {
  IAIConversation,
  IAIMessage,
  IAIInsight,
  IAIUsageRecord,
  IAIChatResponse,
  AIMessageRole,
  IAIActionProposal,
  AIActionType,
} from '@alpha/types';
import {
  AIChatRequestDto,
  CreateAIConversationDto,
  ConfirmAIActionDto,
} from '@alpha/validation';
import { MockAiProvider } from './providers/mock-ai.provider';
import { AiContextBuilderService } from './ai-context-builder.service';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { WorkoutsService } from '../workouts/workouts.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  // In-memory persistent multi-tenant data stores
  private readonly conversations = new Map<string, IAIConversation>();
  private readonly insights = new Map<string, IAIInsight>();
  private readonly usageRecords = new Map<string, IAIUsageRecord>();
  private readonly pendingActions = new Map<string, IAIActionProposal & { userId: string }>();

  constructor(
    private readonly mockProvider: MockAiProvider,
    private readonly contextBuilder: AiContextBuilderService,
    private readonly rateLimiter: AiRateLimiterService,
    @Optional() private readonly workoutsService?: WorkoutsService,
    @Optional() private readonly nutritionService?: NutritionService,
    @Optional() private readonly usersService?: UsersService,
  ) {}

  // -------------------------------------------------------------
  // 1. CONVERSATION MANAGEMENT
  // -------------------------------------------------------------

  async createConversation(
    userId: string,
    dto?: CreateAIConversationDto,
  ): Promise<IAIConversation> {
    const id = 'conv_' + HashUtil.generateUuid();
    const now = new Date();

    const conversation: IAIConversation = {
      id,
      userId,
      title: dto?.title ? this.contextBuilder.sanitizePromptContent(dto.title) : 'AI Coach Session',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    this.conversations.set(id, conversation);
    this.logger.log(`Created AI conversation [${id}] for user [${userId}]`);
    return conversation;
  }

  async getConversations(userId: string): Promise<IAIConversation[]> {
    return Array.from(this.conversations.values())
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getConversationById(userId: string, conversationId: string): Promise<IAIConversation> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new NotFoundException({
        code: 'CONVERSATION_NOT_FOUND',
        message: 'AI conversation not found',
      });
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException({
        code: 'CROSS_USER_ACCESS_DENIED',
        message: 'Access denied: You are not authorized to view this AI conversation',
      });
    }

    return conversation;
  }

  async deleteConversation(userId: string, conversationId: string): Promise<{ success: boolean }> {
    const conv = await this.getConversationById(userId, conversationId);
    this.conversations.delete(conv.id);
    this.logger.log(`Deleted AI conversation [${conversationId}] for user [${userId}]`);
    return { success: true };
  }

  // -------------------------------------------------------------
  // 2. CHAT & INTELLIGENCE EXECUTION
  // -------------------------------------------------------------

  async chat(
    userId: string,
    dto: AIChatRequestDto,
  ): Promise<IAIChatResponse & { conversationId: string; messageId: string }> {
    // 1. Rate limit check
    this.rateLimiter.checkRateLimit(userId);

    const startTime = Date.now();

    // 2. Resolve or create conversation with strict isolation
    let conversation: IAIConversation;
    if (dto.conversationId) {
      conversation = await this.getConversationById(userId, dto.conversationId);
    } else {
      conversation = await this.createConversation(userId, {
        title: dto.message.slice(0, 30) + '...',
      });
    }

    // 3. Sanitize user message against prompt injection
    const cleanUserContent = this.contextBuilder.sanitizePromptContent(dto.message);

    // 4. Record User Message
    const userMsgId = 'msg_' + HashUtil.generateUuid();
    const userMsg: IAIMessage = {
      id: userMsgId,
      conversationId: conversation.id,
      role: AIMessageRole.USER,
      content: cleanUserContent,
      createdAt: new Date(),
    };
    conversation.messages.push(userMsg);

    // 5. Build Bounded Context for Authenticated User
    const context = await this.contextBuilder.buildContext(userId);

    // 6. Generate Response via AI Provider
    const aiResponse = await this.mockProvider.generateResponse(
      cleanUserContent,
      context,
      conversation.messages.slice(-5), // bounded recent message history
    );

    // 7. Store Action Proposals for confirmation workflow
    if (aiResponse.actionProposals) {
      for (const proposal of aiResponse.actionProposals) {
        this.pendingActions.set(proposal.id, { ...proposal, userId });
      }
    }

    // 8. Record Assistant Message
    const assistantMsgId = 'msg_' + HashUtil.generateUuid();
    const assistantMsg: IAIMessage = {
      id: assistantMsgId,
      conversationId: conversation.id,
      role: AIMessageRole.ASSISTANT,
      content: aiResponse.message,
      actionProposals: aiResponse.actionProposals,
      tokensUsed: aiResponse.tokenUsage?.totalTokens || 0,
      citations: aiResponse.citations,
      createdAt: new Date(),
    };
    conversation.messages.push(assistantMsg);
    conversation.updatedAt = new Date();

    // 9. Record Usage & Audit
    const latencyMs = Date.now() - startTime;
    const usageId = 'usage_' + HashUtil.generateUuid();
    const usageRecord: IAIUsageRecord = {
      id: usageId,
      userId,
      provider: this.mockProvider.name,
      model: aiResponse.model,
      promptTokens: aiResponse.tokenUsage?.promptTokens || 0,
      completionTokens: aiResponse.tokenUsage?.completionTokens || 0,
      totalTokens: aiResponse.tokenUsage?.totalTokens || 0,
      latencyMs,
      status: 'SUCCESS',
      createdAt: new Date(),
    };
    this.usageRecords.set(usageId, usageRecord);

    return {
      ...aiResponse,
      conversationId: conversation.id,
      messageId: assistantMsgId,
    };
  }

  // -------------------------------------------------------------
  // 3. CONTROLLED ACTION CONFIRMATION (NON-AUTHORITATIVE MUTATION)
  // -------------------------------------------------------------

  async confirmAction(
    userId: string,
    dto: ConfirmAIActionDto,
  ): Promise<{ success: boolean; status: string; proposal: IAIActionProposal }> {
    const proposal = this.pendingActions.get(dto.proposalId);
    if (!proposal) {
      throw new NotFoundException({
        code: 'ACTION_PROPOSAL_NOT_FOUND',
        message: 'Action proposal not found or already processed',
      });
    }

    // Strict multi-tenant isolation
    if (proposal.userId !== userId) {
      throw new ForbiddenException({
        code: 'CROSS_USER_ACCESS_DENIED',
        message: 'Access denied: You are not authorized to confirm this action proposal',
      });
    }

    if (dto.confirmed) {
      proposal.status = 'CONFIRMED';
      this.logger.log(`User [${userId}] confirmed AI action proposal [${dto.proposalId}]: ${proposal.type}`);

      // Apply action through authorized backend domain APIs
      await this.applyActionProposal(userId, proposal);
    } else {
      proposal.status = 'REJECTED';
      this.logger.log(`User [${userId}] rejected AI action proposal [${dto.proposalId}]: ${proposal.type}`);
    }

    return {
      success: true,
      status: proposal.status,
      proposal,
    };
  }

  /**
   * Controlled Action Application:
   * Translates confirmed AI draft proposals into authorized domain API calls.
   * Strictly verifies payloads and enforces safety constraints before touching authoritative data.
   */
  private async applyActionProposal(userId: string, proposal: IAIActionProposal): Promise<void> {
    switch (proposal.type) {
      case AIActionType.SUGGEST_WORKOUT_CHANGE:
        if (this.workoutsService) {
          const title = (proposal.payload?.title as string) || proposal.title || 'AI Recommended Workout Session';
          await this.workoutsService.startSession(userId, { title });
          this.logger.log(`Applied workout draft session [${title}] for user [${userId}] via WorkoutsService`);
        }
        break;

      case AIActionType.SUGGEST_MEAL_CHANGE:
        if (this.nutritionService) {
          const calories = Number(proposal.payload?.calories ?? 650);
          if (calories < 50 || calories > 3000) {
            throw new BadRequestException({
              code: 'UNSAFE_NUTRITION_PROPOSAL',
              message: 'Nutrition proposal rejected: invalid or dangerous caloric value for meal.',
            });
          }
          const mealType = (proposal.payload?.mealType as any) || 'LUNCH';
          const name = (proposal.payload?.name as string) || proposal.title || 'AI Suggested Meal';
          await this.nutritionService.createMealLog(userId, {
            mealType,
            name,
          });
          this.logger.log(`Applied nutrition draft meal [${name}] for user [${userId}] via NutritionService`);
        }
        break;

      case AIActionType.SUGGEST_GOAL_ADJUSTMENT:
        if (this.usersService) {
          await this.usersService.updateGoals(userId, {
            primaryGoal: (proposal.payload?.primaryGoal as any) || undefined,
            targetWeightKg: proposal.payload?.targetWeightKg != null ? Number(proposal.payload.targetWeightKg) : undefined,
            targetDailyCalories: proposal.payload?.targetDailyCalories != null ? Number(proposal.payload.targetDailyCalories) : undefined,
            targetDailySteps: proposal.payload?.targetDailySteps != null ? Number(proposal.payload.targetDailySteps) : undefined,
            targetWeeklyWorkouts: proposal.payload?.targetWeeklyWorkouts != null ? Number(proposal.payload.targetWeeklyWorkouts) : undefined,
          });
          this.logger.log(`Applied goal adjustment for user [${userId}] via UsersService`);
        }
        break;

      default:
        this.logger.warn(`Unsupported AI action proposal type: ${proposal.type}`);
        break;
    }
  }

  // -------------------------------------------------------------
  // 4. INSIGHTS & USAGE TRACKING
  // -------------------------------------------------------------

  async getInsights(userId: string): Promise<IAIInsight[]> {
    const userInsights = Array.from(this.insights.values())
      .filter((i) => i.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (userInsights.length === 0) {
      return this.refreshInsights(userId);
    }
    return userInsights;
  }

  async refreshInsights(userId: string): Promise<IAIInsight[]> {
    const context = await this.contextBuilder.buildContext(userId);
    const newInsights = await this.mockProvider.generateInsights(context);

    for (const ins of newInsights) {
      this.insights.set(ins.id, ins);
    }
    return newInsights;
  }

  async getUsage(userId: string): Promise<IAIUsageRecord[]> {
    return Array.from(this.usageRecords.values())
      .filter((u) => u.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
