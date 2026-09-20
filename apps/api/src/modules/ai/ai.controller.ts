import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser } from '@alpha/types';
import { AiService } from './ai.service';
import {
  AIChatRequestDto,
  CreateAIConversationDto,
  ConfirmAIActionDto,
} from '@alpha/validation';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // -------------------------------------------------------------
  // CHAT & EXECUTION
  // -------------------------------------------------------------

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(
    @CurrentUser() user: IAuthUser,
    @Body() dto: AIChatRequestDto,
  ) {
    return this.aiService.chat(user.id, dto);
  }

  // -------------------------------------------------------------
  // CONVERSATIONS
  // -------------------------------------------------------------

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  async createConversation(
    @CurrentUser() user: IAuthUser,
    @Body() dto: CreateAIConversationDto,
  ) {
    return this.aiService.createConversation(user.id, dto);
  }

  @Get('conversations')
  async getConversations(@CurrentUser() user: IAuthUser) {
    return this.aiService.getConversations(user.id);
  }

  @Get('conversations/:id')
  async getConversationById(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
  ) {
    return this.aiService.getConversationById(user.id, id);
  }

  @Delete('conversations/:id')
  async deleteConversation(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
  ) {
    return this.aiService.deleteConversation(user.id, id);
  }

  // -------------------------------------------------------------
  // ACTION CONFIRMATION WORKFLOW
  // -------------------------------------------------------------

  @Post('actions/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmAction(
    @CurrentUser() user: IAuthUser,
    @Body() dto: ConfirmAIActionDto,
  ) {
    return this.aiService.confirmAction(user.id, dto);
  }

  // -------------------------------------------------------------
  // INSIGHTS & USAGE
  // -------------------------------------------------------------

  @Get('insights')
  async getInsights(@CurrentUser() user: IAuthUser) {
    return this.aiService.getInsights(user.id);
  }

  @Post('insights/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshInsights(@CurrentUser() user: IAuthUser) {
    return this.aiService.refreshInsights(user.id);
  }

  @Get('usage')
  async getUsage(@CurrentUser() user: IAuthUser) {
    return this.aiService.getUsage(user.id);
  }
}
