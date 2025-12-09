import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [MulterModule.register({}), SupabaseModule, QueuesModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}

