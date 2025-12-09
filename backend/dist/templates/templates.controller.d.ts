import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
export declare class TemplatesController {
    private readonly templatesService;
    constructor(templatesService: TemplatesService);
    create(dto: CreateTemplateDto): Promise<any>;
    list(): Promise<any[]>;
}
