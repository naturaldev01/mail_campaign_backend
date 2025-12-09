"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudiencesModule = void 0;
const common_1 = require("@nestjs/common");
const audiences_controller_1 = require("./audiences.controller");
const audiences_service_1 = require("./audiences.service");
const supabase_module_1 = require("../supabase/supabase.module");
let AudiencesModule = class AudiencesModule {
};
exports.AudiencesModule = AudiencesModule;
exports.AudiencesModule = AudiencesModule = __decorate([
    (0, common_1.Module)({
        imports: [supabase_module_1.SupabaseModule],
        controllers: [audiences_controller_1.AudiencesController],
        providers: [audiences_service_1.AudiencesService],
        exports: [audiences_service_1.AudiencesService],
    })
], AudiencesModule);
//# sourceMappingURL=audiences.module.js.map