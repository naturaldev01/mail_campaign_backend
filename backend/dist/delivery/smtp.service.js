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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SmtpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer_1 = __importDefault(require("nodemailer"));
let SmtpService = SmtpService_1 = class SmtpService {
    config;
    logger = new common_1.Logger(SmtpService_1.name);
    from;
    transporter;
    constructor(config) {
        this.config = config;
        const host = this.config.get('SMTP_HOST');
        const port = Number(this.config.get('SMTP_PORT') ?? 587);
        const secure = this.config.get('SMTP_SECURE') === 'true';
        const user = this.config.get('SMTP_USER');
        const pass = this.config.get('SMTP_PASS');
        this.from = this.config.get('SMTP_FROM') ?? user ?? 'no-reply@example.com';
        if (!host || !user || !pass) {
            this.logger.warn('SMTP not fully configured; emails may fail.');
        }
        this.transporter = nodemailer_1.default.createTransport({
            host,
            port,
            secure,
            auth: user && pass ? { user, pass } : undefined,
        });
    }
    async sendEmail(params) {
        const info = await this.transporter.sendMail({
            from: params.replyTo ?? this.from,
            to: params.to,
            subject: params.subject,
            text: params.text,
            html: params.html,
            replyTo: params.replyTo,
        });
        this.logger.log(`SMTP sent: ${info.messageId}`);
        return { id: info.messageId };
    }
};
exports.SmtpService = SmtpService;
exports.SmtpService = SmtpService = SmtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmtpService);
//# sourceMappingURL=smtp.service.js.map