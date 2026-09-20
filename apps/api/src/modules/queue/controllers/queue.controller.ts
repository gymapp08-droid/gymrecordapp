import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { QueueService } from '../services/queue.service';
import { QueueJobQueryDto } from '@alpha/validation';
import { IJobRecord, IQueueMetrics } from '@alpha/types';

@Controller('queue')
@UseGuards(JwtAuthGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('metrics')
  async getMetrics(): Promise<IQueueMetrics> {
    return this.queueService.getMetrics();
  }

  @Get('jobs')
  async listJobs(@Query() query: QueueJobQueryDto): Promise<{
    data: IJobRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.queueService.listJobs(query);
  }

  @Get('jobs/:id')
  async getJob(@Param('id') id: string): Promise<IJobRecord | null> {
    return this.queueService.getJob(id);
  }

  @Post('jobs/:id/retry')
  async retryJob(@Param('id') id: string): Promise<IJobRecord> {
    return this.queueService.retryJob(id);
  }

  @Delete('jobs/:id')
  async cancelJob(@Param('id') id: string): Promise<{ cancelled: boolean }> {
    const cancelled = await this.queueService.cancelJob(id);
    return { cancelled };
  }

  @Post('purge')
  async purge(): Promise<{ purgedCount: number }> {
    const purgedCount = await this.queueService.purge(undefined, 'COMPLETED');
    return { purgedCount };
  }
}
