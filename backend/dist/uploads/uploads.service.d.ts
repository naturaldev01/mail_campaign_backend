import { SupabaseService } from '../supabase/supabase.service';
import { UploadCsvDto } from './dto/upload-csv.dto';
import { SendCsvDto } from './dto/send-csv.dto';
import { FilterCsvDto } from './dto/filter-csv.dto';
import { QueueService } from '../queues/queues.service';
export declare class UploadsService {
    private readonly supabase;
    private readonly queueService;
    private readonly logger;
    constructor(supabase: SupabaseService, queueService: QueueService);
    private parseCsvRecords;
    filterCsv(file: Express.Multer.File, dto: FilterCsvDto): Promise<{
        audienceId: any;
        filteredRows: number;
    }>;
    uploadCsv(file: Express.Multer.File, dto: UploadCsvDto): Promise<{
        batchId: any;
        totalRows: number;
        validRows: number;
        invalidRows: number;
        storagePath: string | null;
    }>;
    sendCsv(file: Express.Multer.File, dto: SendCsvDto): Promise<{
        campaignId: any;
        audienceId: any;
        queued: number;
        storagePath: string | null;
    }>;
}
