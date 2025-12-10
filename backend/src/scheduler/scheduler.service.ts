import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { QueueService } from '../queues/queues.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly queueService: QueueService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async scanScheduledCampaigns() {
    const nowIso = new Date().toISOString();
    console.log('[scheduler] scanScheduledCampaigns start', { nowIso });
    const { data: campaigns, error } = await this.supabase
      .getClient()
      .from('campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', nowIso);

    if (error) {
      this.logger.error('Failed to load scheduled campaigns', error);
      return;
    }
    if (!campaigns?.length) {
      console.log('[scheduler] no scheduled campaigns');
      return;
    }
    console.log('[scheduler] scheduled campaigns found', { count: campaigns.length });

    for (const campaign of campaigns) {
      try {
        await this.enqueueCampaign(campaign);
        await this.supabase
          .getClient()
          .from('campaigns')
          .update({ status: 'sending' })
          .eq('id', campaign.id);
      } catch (err) {
        this.logger.error(`Failed to enqueue campaign ${campaign.id}`, err as any);
      }
    }
  }

  private async enqueueCampaign(campaign: any) {
    const template =
      campaign.template_id &&
      (await this.supabase
        .getClient()
        .from('templates')
        .select('subject,body_html,body_text')
        .eq('id', campaign.template_id)
        .single()).data;

    const { data: audienceLinks, error: linkError } = await this.supabase
      .getClient()
      .from('campaign_audiences')
      .select('audience_id')
      .eq('campaign_id', campaign.id);

    if (linkError) {
      throw linkError;
    }
    const audienceIds = (audienceLinks ?? []).map((row) => row.audience_id);
    if (!audienceIds.length) {
      this.logger.warn(`Campaign ${campaign.id} has no audiences`);
      return;
    }

    const { data: contacts, error: contactError } = await this.supabase
      .getClient()
      .from('contacts')
      .select('id,email,attributes,audience_id')
      .in('audience_id', audienceIds);
    if (contactError) {
      throw contactError;
    }

    for (const contact of contacts ?? []) {
      const { data: message, error: messageError } = await this.supabase
        .getClient()
        .from('messages')
        .upsert(
          {
            campaign_id: campaign.id,
            contact_id: contact.id,
            status: 'queued',
          },
          { onConflict: 'campaign_id,contact_id' },
        )
        .select()
        .single();

      if (messageError || !message) {
        this.logger.error('Failed to create message record', messageError);
        continue;
      }

      const sendAfter = campaign.scheduled_at ? new Date(campaign.scheduled_at) : new Date();
      await this.queueService.enqueueMail({
        messageId: message.id,
        campaignId: campaign.id,
        contactId: contact.id,
        email: contact.email,
        subject: campaign.subject_override ?? template?.subject,
        bodyHtml: template?.body_html ?? undefined,
        bodyText: template?.body_text ?? undefined,
        variables: contact.attributes ?? {},
        sendAfter,
        replyTo: campaign.reply_to ?? undefined,
      });
      console.log('[scheduler] enqueued mail', {
        campaignId: campaign.id,
        contactId: contact.id,
        email: contact.email,
      });
    }
  }
}

