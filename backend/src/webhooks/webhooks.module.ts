import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from '../supabase/supabase.module';
import { MailgunWebhookController } from './mailgun.controller';

@Module({
  imports: [ConfigModule, SupabaseModule],
  controllers: [MailgunWebhookController],
})
export class WebhooksModule {}

