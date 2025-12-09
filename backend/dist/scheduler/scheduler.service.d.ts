import { SupabaseService } from '../supabase/supabase.service';
import { QueueService } from '../queues/queues.service';
export declare class SchedulerService {
    private readonly supabase;
    private readonly queueService;
    private readonly logger;
    constructor(supabase: SupabaseService, queueService: QueueService);
    scanScheduledCampaigns(): Promise<void>;
    private enqueueCampaign;
}
