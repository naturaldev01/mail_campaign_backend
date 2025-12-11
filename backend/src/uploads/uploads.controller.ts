import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { UploadCsvDto } from './dto/upload-csv.dto';
import { SendCsvDto } from './dto/send-csv.dto';
import { FilterCsvDto } from './dto/filter-csv.dto';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('csv')
  @UseInterceptors(FileInterceptor('file'))
  uploadCsv(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadCsvDto) {
    return this.uploadsService.uploadCsv(file, dto);
  }

  @Post('csv/send')
  @UseInterceptors(FileInterceptor('file'))
  sendCsv(@UploadedFile() file: Express.Multer.File, @Body() dto: SendCsvDto) {
    return this.uploadsService.sendCsv(file, dto);
  }

  @Post('csv/filter')
  @UseInterceptors(FileInterceptor('file'))
  filterCsv(@UploadedFile() file: Express.Multer.File, @Body() dto: FilterCsvDto) {
    return this.uploadsService.filterCsv(file, dto);
  }
}

