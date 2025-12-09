import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MAIL_QUEUE } from './queue.constants';
import { QueueService } from './queues.service';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL'),
        },
        defaultJobOptions: {
          removeOnComplete: 1000,
          removeOnFail: 5000,
          attempts: 3,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: MAIL_QUEUE }),
  ],
  providers: [QueueService],
  exports: [QueueService, BullModule],
})
export class QueuesModule {}

