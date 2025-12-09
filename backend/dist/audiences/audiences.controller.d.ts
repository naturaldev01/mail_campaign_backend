import { AudiencesService } from './audiences.service';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { CreateContactDto } from './dto/create-contact.dto';
export declare class AudiencesController {
    private readonly audiencesService;
    constructor(audiencesService: AudiencesService);
    createAudience(dto: CreateAudienceDto): Promise<any>;
    listAudiences(): Promise<any[]>;
    addContact(audienceId: string, dto: Omit<CreateContactDto, 'audienceId'>): Promise<any>;
    listContacts(audienceId: string): Promise<any[]>;
    triggerSync(audienceId: string): Promise<{
        audience: any;
        message: string;
    }>;
}
