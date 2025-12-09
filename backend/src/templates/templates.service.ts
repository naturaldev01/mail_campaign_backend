import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly supabase: SupabaseService) {}

  async createTemplate(dto: CreateTemplateDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('templates')
      .insert({
        name: dto.name,
        subject: dto.subject,
        body_html: dto.bodyHtml,
        body_text: dto.bodyText,
      })
      .select()
      .single();
    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async listTemplates() {
    const { data, error } = await this.supabase.getClient().from('templates').select('*');
    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }
}

