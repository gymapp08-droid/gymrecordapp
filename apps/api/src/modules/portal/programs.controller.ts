import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser, ProgramStatus } from '@alpha/types';
import {
  CreateProgramDto,
  UpdateProgramDto,
  AssignProgramDto,
  ReplaceProgramDto,
  CreateCustomExerciseDto,
} from '@alpha/validation';

@Controller('programs')
@UseGuards(JwtAuthGuard)
export class ProgramsController {
  constructor(private readonly portalService: PortalService) {}

  @Post()
  async createProgram(
    @CurrentUser() user: IAuthUser,
    @Body() dto: CreateProgramDto,
  ) {
    return this.portalService.createProgram(user.id, user.role, dto);
  }

  @Get()
  async listPrograms(
    @CurrentUser() user: IAuthUser,
    @Query('status') status?: ProgramStatus,
  ) {
    return this.portalService.listPrograms(user.id, user.role, status);
  }

  @Get(':id')
  async getProgram(
    @CurrentUser() user: IAuthUser,
    @Param('id') programId: string,
  ) {
    return this.portalService.getProgram(user.id, user.role, programId);
  }

  @Post(':id/version')
  async versionProgram(
    @CurrentUser() user: IAuthUser,
    @Param('id') programId: string,
    @Body() dto: UpdateProgramDto,
  ) {
    return this.portalService.versionProgram(user.id, user.role, programId, dto);
  }

  @Post('assign')
  async assignProgram(
    @CurrentUser() user: IAuthUser,
    @Body() dto: AssignProgramDto,
  ) {
    return this.portalService.assignProgram(user.id, user.role, dto);
  }

  @Post('replace')
  async replaceProgram(
    @CurrentUser() user: IAuthUser,
    @Body() dto: ReplaceProgramDto,
  ) {
    return this.portalService.replaceProgram(user.id, user.role, dto);
  }

  @Post('exercises/custom')
  async createCustomExercise(
    @CurrentUser() user: IAuthUser,
    @Body() dto: CreateCustomExerciseDto,
  ) {
    return this.portalService.createCustomExercise(user.id, user.role, dto);
  }
}
