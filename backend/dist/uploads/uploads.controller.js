"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const uploads_service_1 = require("./uploads.service");
const upload_csv_dto_1 = require("./dto/upload-csv.dto");
const send_csv_dto_1 = require("./dto/send-csv.dto");
const filter_csv_dto_1 = require("./dto/filter-csv.dto");
let UploadsController = class UploadsController {
    uploadsService;
    constructor(uploadsService) {
        this.uploadsService = uploadsService;
    }
    uploadCsv(file, dto) {
        return this.uploadsService.uploadCsv(file, dto);
    }
    sendCsv(file, dto) {
        return this.uploadsService.sendCsv(file, dto);
    }
    filterCsv(file, dto) {
        return this.uploadsService.filterCsv(file, dto);
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)('csv'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, upload_csv_dto_1.UploadCsvDto]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "uploadCsv", null);
__decorate([
    (0, common_1.Post)('csv/send'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, send_csv_dto_1.SendCsvDto]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "sendCsv", null);
__decorate([
    (0, common_1.Post)('csv/filter'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, filter_csv_dto_1.FilterCsvDto]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "filterCsv", null);
exports.UploadsController = UploadsController = __decorate([
    (0, common_1.Controller)('uploads'),
    __metadata("design:paramtypes", [uploads_service_1.UploadsService])
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map