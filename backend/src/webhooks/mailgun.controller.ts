import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { createHmac } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '@nestjs/config';

interface MailgunWebhookPayload {
  signature: {
    timestamp: string;
    token: string;
    signature: string;
  };
  'event-data': {
    event: string;
    id: string;
    message?: { headers?: { 'message-id'?: string } };
    recipient?: string;
  };
}

@Controller('webhooks/mailgun')
export class MailgunWebhookController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(@Body() payload: MailgunWebhookPayload, @Headers('user-agent') userAgent: string) {
    if (!this.verifySignature(payload)) {
      return { ok: false, reason: 'invalid signature' };
    }

    const event = payload['event-data'];
    const eventType = event.event;
    const providerId = event.message?.headers?.['message-id'];
    const recipient = event.recipient;

    if (!providerId) {
      return { ok: true };
    }

    const supabase = this.supabase.getClient();
    const { data: messages } = await supabase
      .from('messages')
      .select('id')
      .eq('provider_message_id', providerId)
      .limit(1);

    const messageId = messages?.[0]?.id;
    if (messageId) {
      await supabase.from('email_events').insert({
        message_id: messageId,
        event_type: eventType,
        metadata: { recipient, userAgent },
      });

      if (['bounced', 'complained'].includes(eventType)) {
        await supabase.from('messages').update({ status: eventType }).eq('id', messageId);
      }
    }

    return { ok: true };
  }

  private verifySignature(payload: MailgunWebhookPayload) {
    const apiKey = this.config.get<string>('MAILGUN_API_KEY');
    if (!apiKey) return false;
    const signature = payload.signature;
    const hmac = createHmac('sha256', apiKey);
    hmac.update(signature.timestamp + signature.token);
    const digest = hmac.digest('hex');
    return digest === signature.signature;
  }
}

