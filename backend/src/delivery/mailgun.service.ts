import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fetch } from 'undici';

export interface MailgunSendParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  variables?: Record<string, any>;
  from?: string;
  replyTo?: string;
}

@Injectable()
export class MailgunService {
  private readonly logger = new Logger(MailgunService.name);
  private readonly apiKey: string;
  private readonly domain: string;
  private readonly defaultFrom: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('MAILGUN_API_KEY') ?? '';
    this.domain = this.config.get<string>('MAILGUN_DOMAIN') ?? '';
    this.defaultFrom = this.config.get<string>('MAILGUN_FROM') ?? `no-reply@${this.domain}`;
  }

  async sendEmail(params: MailgunSendParams) {
    if (!this.apiKey || !this.domain) {
      this.logger.error('Mailgun credentials are missing');
      throw new Error('Mailgun not configured');
    }
    console.log('[mailgun] sendEmail', {
      to: params.to,
      subject: params.subject,
      from: params.from ?? this.defaultFrom,
      domain: this.domain,
    });

    const auth = Buffer.from(`api:${this.apiKey}`).toString('base64');
    const body = new URLSearchParams({
      from: params.from ?? this.defaultFrom,
      to: params.to,
      subject: params.subject,
    });
    if (params.text) body.append('text', params.text);
    if (params.html) body.append('html', params.html);
    if (params.replyTo) body.append('h:Reply-To', params.replyTo);
    if (params.variables) {
      body.append('h:X-Mailgun-Variables', JSON.stringify(params.variables));
    }

    const response = await fetch(`https://api.mailgun.net/v3/${this.domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Mailgun send failed: ${response.status} - ${text}`);
      throw new Error(`Mailgun send failed: ${response.statusText}`);
    }

    const result = (await response.json()) as { id: string; message: string };
    return result;
  }
}

