import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create(@Body() dto: CreateCampaignDto) {
    console.log('[campaigns] create payload', {
      name: dto.name,
      scheduledAt: dto.scheduledAt,
      sendOptions: dto.sendOptions,
      templateId: dto.templateId,
      audienceIdsCount: dto.audienceIds?.length ?? 0,
    });
    return this.campaignsService.createCampaign(dto);
  }

  @Get()
  list() {
    return this.campaignsService.listCampaigns();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.campaignsService.getCampaign(id);
  }

  @Patch(':id/status/:status')
  updateStatus(@Param('id') id: string, @Param('status') status: string) {
    return this.campaignsService.updateStatus(id, status);
  }
}

