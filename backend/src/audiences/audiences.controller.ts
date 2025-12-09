import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AudiencesService } from './audiences.service';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('audiences')
export class AudiencesController {
  constructor(private readonly audiencesService: AudiencesService) {}

  @Post()
  createAudience(@Body() dto: CreateAudienceDto) {
    return this.audiencesService.createAudience(dto);
  }

  @Get()
  listAudiences() {
    return this.audiencesService.listAudiences();
  }

  @Post(':id/contacts')
  addContact(@Param('id') audienceId: string, @Body() dto: Omit<CreateContactDto, 'audienceId'>) {
    return this.audiencesService.addContact({ ...dto, audienceId });
  }

  @Get(':id/contacts')
  listContacts(@Param('id') audienceId: string) {
    return this.audiencesService.listContacts(audienceId);
  }

  @Post(':id/sync')
  triggerSync(@Param('id') audienceId: string) {
    return this.audiencesService.syncAudience(audienceId);
  }
}

