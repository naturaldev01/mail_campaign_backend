import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailgunService } from './mailgun.service';
import { SupabaseService } from '../supabase/supabase.service';
import { MailJobPayload } from '../queues/queues.service';
import { SmtpService } from './smtp.service';
export declare class MailProcessor extends WorkerHost {
    private readonly mailgun;
    private readonly supabase;
    private readonly smtp;
    private readonly logger;
    constructor(mailgun: MailgunService, supabase: SupabaseService, smtp: SmtpService);
    process(job: Job<MailJobPayload>): Promise<void>;
}
