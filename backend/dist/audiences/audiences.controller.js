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
exports.AudiencesController = void 0;
const common_1 = require("@nestjs/common");
const audiences_service_1 = require("./audiences.service");
const create_audience_dto_1 = require("./dto/create-audience.dto");
let AudiencesController = class AudiencesController {
    audiencesService;
    constructor(audiencesService) {
        this.audiencesService = audiencesService;
    }
    createAudience(dto) {
        return this.audiencesService.createAudience(dto);
    }
    listAudiences() {
        return this.audiencesService.listAudiences();
    }
    addContact(audienceId, dto) {
        return this.audiencesService.addContact({ ...dto, audienceId });
    }
    listContacts(audienceId) {
        return this.audiencesService.listContacts(audienceId);
    }
    triggerSync(audienceId) {
        return this.audiencesService.syncAudience(audienceId);
    }
};
exports.AudiencesController = AudiencesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_audience_dto_1.CreateAudienceDto]),
    __metadata("design:returntype", void 0)
], AudiencesController.prototype, "createAudience", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AudiencesController.prototype, "listAudiences", null);
__decorate([
    (0, common_1.Post)(':id/contacts'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AudiencesController.prototype, "addContact", null);
__decorate([
    (0, common_1.Get)(':id/contacts'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AudiencesController.prototype, "listContacts", null);
__decorate([
    (0, common_1.Post)(':id/sync'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AudiencesController.prototype, "triggerSync", null);
exports.AudiencesController = AudiencesController = __decorate([
    (0, common_1.Controller)('audiences'),
    __metadata("design:paramtypes", [audiences_service_1.AudiencesService])
], AudiencesController);
//# sourceMappingURL=audiences.controller.js.map