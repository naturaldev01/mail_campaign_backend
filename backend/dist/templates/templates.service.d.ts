import { SupabaseService } from '../supabase/supabase.service';
import { CreateTemplateDto } from './dto/create-template.dto';
export declare class TemplatesService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    createTemplate(dto: CreateTemplateDto): Promise<any>;
    listTemplates(): Promise<any[]>;
}
