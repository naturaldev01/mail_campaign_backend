import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getCampaignStats(id: string): Promise<{
        statusCounts: Record<string, number>;
        eventCounts: Record<string, number>;
    }>;
    getCampaignMessages(id: string, status?: string, limit?: number, offset?: number): Promise<{
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
}
