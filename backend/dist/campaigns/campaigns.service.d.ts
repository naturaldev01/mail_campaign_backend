import { SupabaseService } from '../supabase/supabase.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
export declare class CampaignsService {
    private readonly supabase;
    private readonly logger;
    constructor(supabase: SupabaseService);
    createCampaign(dto: CreateCampaignDto): Promise<any>;
    listCampaigns(): Promise<any[]>;
    getCampaign(id: string): Promise<any>;
    updateStatus(id: string, status: string): Promise<any>;
}
