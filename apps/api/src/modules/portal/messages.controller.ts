import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser } from '@alpha/types';
import { SendCoachMessageDto } from '@alpha/validation';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly portalService: PortalService) {}

  @Get('conversations')
  async listConversations(@CurrentUser() user: IAuthUser) {
    return this.portalService.listConversations(user.id);
  }

  @Get('thread/:clientId')
  async getMessages(
    @CurrentUser() user: IAuthUser,
    @Param('clientId') clientId: string,
  ) {
    return this.portalService.getMessages(user.id, clientId);
  }

  @Post('thread/:clientId')
  async sendMessage(
    @CurrentUser() user: IAuthUser,
    @Param('clientId') clientId: string,
    @Body() dto: SendCoachMessageDto,
  ) {
    return this.portalService.sendMessage(user.id, clientId, dto);
  }
}
