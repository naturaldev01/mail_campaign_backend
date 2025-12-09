"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_module_1 = require("./supabase/supabase.module");
const queues_module_1 = require("./queues/queues.module");
const uploads_module_1 = require("./uploads/uploads.module");
const audiences_module_1 = require("./audiences/audiences.module");
const templates_module_1 = require("./templates/templates.module");
const campaigns_module_1 = require("./campaigns/campaigns.module");
const scheduler_module_1 = require("./scheduler/scheduler.module");
const delivery_module_1 = require("./delivery/delivery.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const reports_module_1 = require("./reports/reports.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            supabase_module_1.SupabaseModule,
            queues_module_1.QueuesModule,
            uploads_module_1.UploadsModule,
            audiences_module_1.AudiencesModule,
            templates_module_1.TemplatesModule,
            campaigns_module_1.CampaignsModule,
            scheduler_module_1.SchedulerModule,
            delivery_module_1.DeliveryModule,
            webhooks_module_1.WebhooksModule,
            reports_module_1.ReportsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map