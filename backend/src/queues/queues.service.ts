import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MAIL_QUEUE } from './queue.constants';

export interface MailJobPayload {
  messageId: string;
  campaignId: string;
  contactId: string;
  email: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  variables?: Record<string, any>;
  sendAfter?: Date;
  replyTo?: string;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@InjectQueue(MAIL_QUEUE) private readonly queue: Queue) {}

  async enqueueMail(job: MailJobPayload) {
    const delay = job.sendAfter ? Math.max(job.sendAfter.getTime() - Date.now(), 0) : 0;
    console.log('[queue] enqueueMail', {
      messageId: job.messageId,
      email: job.email,
      campaignId: job.campaignId,
      delayMs: delay,
    });
    await this.queue.add(MAIL_QUEUE, job, { delay });
    this.logger.log(`Enqueued mail for ${job.email} (campaign ${job.campaignId})`);
  }
}

