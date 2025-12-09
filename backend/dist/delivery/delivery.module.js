"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const config_1 = require("@nestjs/config");
const mailgun_service_1 = require("./mailgun.service");
const mail_processor_1 = require("./mail.processor");
const supabase_module_1 = require("../supabase/supabase.module");
const queue_constants_1 = require("../queues/queue.constants");
const smtp_service_1 = require("./smtp.service");
let DeliveryModule = class DeliveryModule {
};
exports.DeliveryModule = DeliveryModule;
exports.DeliveryModule = DeliveryModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, supabase_module_1.SupabaseModule, bullmq_1.BullModule.registerQueue({ name: queue_constants_1.MAIL_QUEUE })],
        providers: [mailgun_service_1.MailgunService, smtp_service_1.SmtpService, mail_processor_1.MailProcessor],
        exports: [mailgun_service_1.MailgunService, smtp_service_1.SmtpService],
    })
], DeliveryModule);
//# sourceMappingURL=delivery.module.js.map