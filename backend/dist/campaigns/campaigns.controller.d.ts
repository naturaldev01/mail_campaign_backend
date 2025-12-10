import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    create(dto: CreateCampaignDto): Promise<any>;
    list(): Promise<any[]>;
    getOne(id: string): Promise<any>;
    updateStatus(id: string, status: string): Promise<any>;
}
