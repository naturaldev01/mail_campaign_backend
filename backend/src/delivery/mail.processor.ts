import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MAIL_QUEUE } from '../queues/queue.constants';
import { MailgunService } from './mailgun.service';
import { SupabaseService } from '../supabase/supabase.service';
import { MailJobPayload } from '../queues/queues.service';
import { SmtpService } from './smtp.service';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly mailgun: MailgunService,
    private readonly supabase: SupabaseService,
    private readonly smtp: SmtpService,
  ) {
    super();
  }

  async process(job: Job<MailJobPayload>) {
    const payload = job.data;
    const supabase = this.supabase.getClient();

    console.log('[mail.processor] start', {
      messageId: payload.messageId,
      email: payload.email,
      campaignId: payload.campaignId,
    });
    await supabase.from('messages').update({ status: 'sending' }).eq('id', payload.messageId);

    try {
      const provider = process.env.MAIL_PROVIDER ?? 'mailgun';
      console.log('[mail.processor] provider selected', { provider });

      let result: { id: string };
      if (provider === 'smtp') {
        result = await this.smtp.sendEmail({
          to: payload.email,
          subject: payload.subject ?? '(no subject)',
          text: payload.bodyText ?? undefined,
          html: payload.bodyHtml ?? undefined,
          replyTo: payload.replyTo,
        });
      } else {
        result = await this.mailgun.sendEmail({
          to: payload.email,
          subject: payload.subject ?? '(no subject)',
          text: payload.bodyText ?? undefined,
          html: payload.bodyHtml ?? undefined,
          variables: payload.variables,
          replyTo: payload.replyTo,
        });
      }

      await supabase
        .from('messages')
        .update({ status: 'sent', provider_message_id: result.id, sent_at: new Date().toISOString() })
        .eq('id', payload.messageId);
      console.log('[mail.processor] sent', { messageId: payload.messageId, providerId: result.id });
    } catch (err) {
      const errorMessage = (err as Error).message;
      this.logger.error(`Failed to send mail for message ${payload.messageId}`, err as any);
      console.log('[mail.processor] failed', { messageId: payload.messageId, error: errorMessage });
      await supabase
        .from('messages')
        .update({ status: 'failed', last_error: errorMessage })
        .eq('id', payload.messageId);
      throw err;
    }
  }
}

