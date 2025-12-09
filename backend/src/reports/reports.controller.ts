import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('campaigns/:id')
  getCampaignStats(@Param('id') id: string) {
    return this.reportsService.campaignStats(id);
  }

  @Get('campaigns/:id/messages')
  getCampaignMessages(
    @Param('id') id: string,
    @Query('status') status?: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit = 100,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset = 0,
  ) {
    const statuses = status
      ? status
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    return this.reportsService.campaignMessages(id, { statuses, limit, offset });
  }
}

