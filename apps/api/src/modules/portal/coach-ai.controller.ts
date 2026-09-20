import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser } from '@alpha/types';
import { GenerateCoachAiDraftDto, ApplyCoachAiDraftDto } from '@alpha/validation';

@Controller('coach-ai')
@UseGuards(JwtAuthGuard)
export class CoachAiController {
  constructor(private readonly portalService: PortalService) {}

  @Post('draft')
  async generateDraft(
    @CurrentUser() user: IAuthUser,
    @Body() dto: GenerateCoachAiDraftDto,
  ) {
    return this.portalService.generateCoachAiDraft(user.id, dto);
  }

  @Post('draft/:id/apply')
  async applyDraft(
    @CurrentUser() user: IAuthUser,
    @Param('id') draftId: string,
    @Body() dto?: ApplyCoachAiDraftDto,
  ) {
    return this.portalService.applyCoachAiDraft(user.id, draftId, dto?.actionPayload);
  }

  @Get('drafts')
  async listDrafts(
    @CurrentUser() user: IAuthUser,
    @Query('clientId') clientId?: string,
  ) {
    return this.portalService.listCoachAiDrafts(user.id, clientId);
  }
}
