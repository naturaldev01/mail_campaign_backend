import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SupabaseModule } from '../supabase/supabase.module';
import { QueuesModule } from '../queues/queues.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot(), SupabaseModule, QueuesModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}

