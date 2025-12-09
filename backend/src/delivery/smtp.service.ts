import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

export interface SmtpSendParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);
  private readonly from: string;
  private readonly transporter;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    const secure = this.config.get<string>('SMTP_SECURE') === 'true';
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.from = this.config.get<string>('SMTP_FROM') ?? user ?? 'no-reply@example.com';

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not fully configured; emails may fail.');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendEmail(params: SmtpSendParams) {
    const info = await this.transporter.sendMail({
      from: params.replyTo ?? this.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      replyTo: params.replyTo,
    });
    this.logger.log(`SMTP sent: ${info.messageId}`);
    return { id: info.messageId };
  }
}

