import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { IAuthUser, IDevice } from '@alpha/types';
import { RegisterDeviceDto } from '@alpha/validation';
import { DevicesService } from '../services/devices.service';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  async register(
    @CurrentUser() user: IAuthUser,
    @Body() dto: RegisterDeviceDto,
  ): Promise<IDevice> {
    return this.devicesService.registerDevice(user.id, dto);
  }

  @Delete(':id')
  async unregister(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.devicesService.unregisterDevice(user.id, id);
  }

  @Get()
  async list(@CurrentUser() user: IAuthUser): Promise<IDevice[]> {
    return this.devicesService.getUserDevices(user.id);
  }
}
