import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { QueuesModule } from './queues/queues.module';
import { UploadsModule } from './uploads/uploads.module';
import { AudiencesModule } from './audiences/audiences.module';
import { TemplatesModule } from './templates/templates.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { DeliveryModule } from './delivery/delivery.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    QueuesModule,
    UploadsModule,
    AudiencesModule,
    TemplatesModule,
    CampaignsModule,
    SchedulerModule,
    DeliveryModule,
    WebhooksModule,
    ReportsModule,
  ],
})
export class AppModule {}
