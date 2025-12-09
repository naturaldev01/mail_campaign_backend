import { SupabaseService } from '../supabase/supabase.service';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { CreateContactDto } from './dto/create-contact.dto';
export declare class AudiencesService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    createAudience(dto: CreateAudienceDto): Promise<any>;
    listAudiences(): Promise<any[]>;
    addContact(dto: CreateContactDto): Promise<any>;
    listContacts(audienceId: string): Promise<any[]>;
    syncAudience(audienceId: string): Promise<{
        audience: any;
        message: string;
    }>;
}
