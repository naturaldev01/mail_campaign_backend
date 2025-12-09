import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class AudiencesService {
  constructor(private readonly supabase: SupabaseService) {}

  async createAudience(dto: CreateAudienceDto) {
    const payload = {
      name: dto.name,
      description: dto.description,
      type: dto.type ?? 'static',
      filter_rules: dto.filterRules ?? [],
      sync_provider: dto.syncProvider,
      sync_config: dto.syncConfig ?? {},
    };
    const { data, error } = await this.supabase
      .getClient()
      .from('audiences')
      .insert(payload)
      .select()
      .single();
    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async listAudiences() {
    const { data, error } = await this.supabase.getClient().from('audiences').select('*');
    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async addContact(dto: CreateContactDto) {
    const attributes = {
      ...(dto.attributes ?? {}),
      ...(dto.timezone ? { timezone: dto.timezone } : {}),
    };
    const { data, error } = await this.supabase
      .getClient()
      .from('contacts')
      .upsert(
        {
          audience_id: dto.audienceId,
          email: dto.email.toLowerCase(),
          attributes,
          status: 'active',
        },
        { onConflict: 'audience_id,email' },
      )
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async listContacts(audienceId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('contacts')
      .select('*')
      .eq('audience_id', audienceId);
    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async syncAudience(audienceId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('audiences')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', audienceId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      audience: data,
      message: 'Sync triggered; downstream connector processing is pending.',
    };
  }
}

