import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async createCampaign(dto: CreateCampaignDto) {
    const { data: campaign, error } = await this.supabase
      .getClient()
      .from('campaigns')
      .insert({
        name: dto.name,
        template_id: dto.templateId,
        scheduled_at: dto.scheduledAt,
        from_name: dto.fromName,
        from_email: dto.fromEmail,
        reply_to: dto.replyTo,
        subject_override: dto.subjectOverride,
        send_options: dto.sendOptions ?? {},
        status: dto.scheduledAt ? 'scheduled' : 'draft',
      })
      .select()
      .single();

    if (error || !campaign) {
      throw new BadRequestException(error?.message ?? 'Failed to create campaign');
    }

    if (dto.audienceIds?.length) {
      const linkRows = dto.audienceIds.map((audienceId) => ({
        campaign_id: campaign.id,
        audience_id: audienceId,
      }));
      const { error: linkError } = await this.supabase
        .getClient()
        .from('campaign_audiences')
        .insert(linkRows);
      if (linkError) {
        this.logger.error('Failed to link audiences', linkError);
        throw new BadRequestException(linkError.message);
      }
    }

    return campaign;
  }

  async listCampaigns() {
    const { data, error } = await this.supabase.getClient().from('campaigns').select('*');
    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async getCampaign(id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async updateStatus(id: string, status: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('campaigns')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }
}

