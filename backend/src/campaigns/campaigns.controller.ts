import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this.campaignsService.createCampaign(dto);
  }

  @Get()
  list() {
    return this.campaignsService.listCampaigns();
  }

  @Patch(':id/status/:status')
  updateStatus(@Param('id') id: string, @Param('status') status: string) {
    return this.campaignsService.updateStatus(id, status);
  }
}

