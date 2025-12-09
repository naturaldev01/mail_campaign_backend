import { UploadsService } from './uploads.service';
import { UploadCsvDto } from './dto/upload-csv.dto';
import { SendCsvDto } from './dto/send-csv.dto';
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    uploadCsv(file: Express.Multer.File, dto: UploadCsvDto): Promise<{
        batchId: any;
        totalRows: number;
        validRows: number;
        invalidRows: number;
    }>;
    sendCsv(file: Express.Multer.File, dto: SendCsvDto): Promise<{
        campaignId: any;
        audienceId: any;
        queued: number;
    }>;
}
