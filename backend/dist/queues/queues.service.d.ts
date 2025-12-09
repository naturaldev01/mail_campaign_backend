import { Queue } from 'bullmq';
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
export declare class QueueService {
    private readonly queue;
    private readonly logger;
    constructor(queue: Queue);
    enqueueMail(job: MailJobPayload): Promise<void>;
}
