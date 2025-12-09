import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ReportsService {
  constructor(private readonly supabase: SupabaseService) {}

  async campaignMessages(
    campaignId: string,
    opts: { statuses?: string[]; limit: number; offset: number },
  ) {
    const { statuses, limit, offset } = opts;
    const supabase = this.supabase.getClient();

    let query = supabase
      .from('messages')
      .select('id,status,last_error,sent_at,created_at,contact:contact_id(email)', { count: 'exact' })
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (statuses?.length) {
      query = query.in('status', statuses);
    }

    const { data, error, count } = await query;
    if (error) {
      throw new BadRequestException(error.message);
    }

    const items =
      data?.map((m: any) => ({
        messageId: m.id,
        email: m.contact?.email,
        status: m.status,
        lastError: m.last_error,
        sentAt: m.sent_at,
        createdAt: m.created_at,
      })) ?? [];

    return {
      items,
      total: count ?? items.length,
      limit,
      offset,
    };
  }

  async campaignStats(campaignId: string) {
    const supabase = this.supabase.getClient();
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id,status')
      .eq('campaign_id', campaignId);
    if (error) {
      throw new BadRequestException(error.message);
    }

    const statusCounts: Record<string, number> = {};
    for (const msg of messages ?? []) {
      statusCounts[msg.status] = (statusCounts[msg.status] ?? 0) + 1;
    }

    const messageIds = (messages ?? []).map((m) => m.id);
    const { data: events } = await supabase
      .from('email_events')
      .select('event_type')
      .in('message_id', messageIds.length ? messageIds : ['00000000-0000-0000-0000-000000000000']);

    const eventCounts: Record<string, number> = {};
    for (const evt of events ?? []) {
      eventCounts[evt.event_type] = (eventCounts[evt.event_type] ?? 0) + 1;
    }

    return { statusCounts, eventCounts };
  }
}

