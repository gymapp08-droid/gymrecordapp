import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser } from '@alpha/types';
import { CreateOrganizationDto } from '@alpha/validation';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly portalService: PortalService) {}

  @Post()
  async createOrganization(
    @CurrentUser() user: IAuthUser,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.portalService.createOrganization(user.id, user.role, dto);
  }

  @Get('me')
  async getMyOrganization(@CurrentUser() user: IAuthUser) {
    return this.portalService.getOrganization(user.id, user.organizationId);
  }

  @Get(':id')
  async getOrganizationById(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
  ) {
    return this.portalService.getOrganization(user.id, user.organizationId, id);
  }
}
