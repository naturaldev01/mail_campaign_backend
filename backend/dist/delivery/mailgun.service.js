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
var MailgunService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailgunService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const undici_1 = require("undici");
let MailgunService = MailgunService_1 = class MailgunService {
    config;
    logger = new common_1.Logger(MailgunService_1.name);
    apiKey;
    domain;
    defaultFrom;
    constructor(config) {
        this.config = config;
        this.apiKey = this.config.get('MAILGUN_API_KEY') ?? '';
        this.domain = this.config.get('MAILGUN_DOMAIN') ?? '';
        this.defaultFrom = this.config.get('MAILGUN_FROM') ?? `no-reply@${this.domain}`;
    }
    async sendEmail(params) {
        if (!this.apiKey || !this.domain) {
            this.logger.error('Mailgun credentials are missing');
            throw new Error('Mailgun not configured');
        }
        console.log('[mailgun] sendEmail', {
            to: params.to,
            subject: params.subject,
            from: params.from ?? this.defaultFrom,
            domain: this.domain,
        });
        const auth = Buffer.from(`api:${this.apiKey}`).toString('base64');
        const body = new URLSearchParams({
            from: params.from ?? this.defaultFrom,
            to: params.to,
            subject: params.subject,
        });
        if (params.text)
            body.append('text', params.text);
        if (params.html)
            body.append('html', params.html);
        if (params.replyTo)
            body.append('h:Reply-To', params.replyTo);
        if (params.variables) {
            body.append('h:X-Mailgun-Variables', JSON.stringify(params.variables));
        }
        const response = await (0, undici_1.fetch)(`https://api.mailgun.net/v3/${this.domain}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${auth}`,
            },
            body,
        });
        if (!response.ok) {
            const text = await response.text();
            this.logger.error(`Mailgun send failed: ${response.status} - ${text}`);
            throw new Error(`Mailgun send failed: ${response.statusText}`);
        }
        const result = (await response.json());
        return result;
    }
};
exports.MailgunService = MailgunService;
exports.MailgunService = MailgunService = MailgunService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailgunService);
//# sourceMappingURL=mailgun.service.js.map