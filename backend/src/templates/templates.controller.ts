import { Body, Controller, Get, Post } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.createTemplate(dto);
  }

  @Get()
  list() {
    return this.templatesService.listTemplates();
  }
}

