import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnershipGuard } from '../../common/guards/ownership.guard';
import { CheckOwnership } from '../../common/decorators/check-ownership.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { IAuthUser, IUserProfile, IUserPreference } from '@alpha/types';
import { UpdateProfileDto, UpdatePreferencesDto } from '@alpha/validation';

@Controller('users')
@UseGuards(JwtAuthGuard, OwnershipGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Protected route: Get authenticated user's profile
   */
  @Get('me')
  async getMe(@CurrentUser() user: IAuthUser): Promise<IUserProfile> {
    return this.usersService.getProfile(user.id);
  }

  /**
   * Protected route: Get authenticated user's preferences & localization settings
   */
  @Get('me/preferences')
  async getMePreferences(@CurrentUser() user: IAuthUser): Promise<IUserPreference> {
    return this.usersService.getPreferences(user.id);
  }

  /**
   * Protected route: Update authenticated user's preferences & localization settings
   */
  @Put('me/preferences')
  async updateMePreferences(
    @CurrentUser() user: IAuthUser,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<IUserPreference> {
    return this.usersService.updatePreferences(user.id, dto as Partial<IUserPreference>);
  }

  /**
   * Protected route with strict User Isolation:
   * Only the owner of userId or an Admin can access this resource.
   */
  @Get(':userId/profile')
  @CheckOwnership('userId')
  async getUserProfile(
    @Param('userId') userId: string,
  ): Promise<IUserProfile> {
    return this.usersService.getProfile(userId);
  }

  /**
   * Protected route with strict User Isolation:
   * Only the owner of userId or an Admin can modify this resource.
   */
  @Put(':userId/profile')
  @CheckOwnership('userId')
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<IUserProfile> {
    return this.usersService.updateProfile(userId, dto as Partial<IUserProfile>);
  }

  /**
   * Protected route with strict User Isolation:
   * Only the owner of userId or an Admin can access preferences.
   */
  @Get(':userId/preferences')
  @CheckOwnership('userId')
  async getUserPreferences(
    @Param('userId') userId: string,
  ): Promise<IUserPreference> {
    return this.usersService.getPreferences(userId);
  }

  /**
   * Protected route with strict User Isolation:
   * Only the owner of userId or an Admin can modify preferences.
   */
  @Put(':userId/preferences')
  @CheckOwnership('userId')
  async updateUserPreferences(
    @Param('userId') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<IUserPreference> {
    return this.usersService.updatePreferences(userId, dto as Partial<IUserPreference>);
  }
}

