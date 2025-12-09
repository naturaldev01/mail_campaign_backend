import { Module } from '@nestjs/common';
import { AudiencesController } from './audiences.controller';
import { AudiencesService } from './audiences.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [AudiencesController],
  providers: [AudiencesService],
  exports: [AudiencesService],
})
export class AudiencesModule {}

