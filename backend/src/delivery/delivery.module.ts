import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { MailgunService } from './mailgun.service';
import { MailProcessor } from './mail.processor';
import { SupabaseModule } from '../supabase/supabase.module';
import { MAIL_QUEUE } from '../queues/queue.constants';
import { SmtpService } from './smtp.service';

@Module({
  imports: [ConfigModule, SupabaseModule, BullModule.registerQueue({ name: MAIL_QUEUE })],
  providers: [MailgunService, SmtpService, MailProcessor],
  exports: [MailgunService, SmtpService],
})
export class DeliveryModule {}

