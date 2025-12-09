import { SupabaseService } from '../supabase/supabase.service';
export declare class ReportsService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    campaignMessages(campaignId: string, opts: {
        statuses?: string[];
        limit: number;
        offset: number;
    }): Promise<{
        items: {
            messageId: any;
            email: any;
            status: any;
            lastError: any;
            sentAt: any;
            createdAt: any;
        }[];
        total: number;
        limit: number;
        offset: number;
    }>;
    campaignStats(campaignId: string): Promise<{
        statusCounts: Record<string, number>;
        eventCounts: Record<string, number>;
    }>;
}
