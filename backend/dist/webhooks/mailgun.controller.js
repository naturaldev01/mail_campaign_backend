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
exports.MailgunWebhookController = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const supabase_service_1 = require("../supabase/supabase.service");
const config_1 = require("@nestjs/config");
let MailgunWebhookController = class MailgunWebhookController {
    supabase;
    config;
    constructor(supabase, config) {
        this.supabase = supabase;
        this.config = config;
    }
    async handleWebhook(payload, userAgent) {
        if (!this.verifySignature(payload)) {
            return { ok: false, reason: 'invalid signature' };
        }
        const event = payload['event-data'];
        const eventType = event.event;
        const providerId = event.message?.headers?.['message-id'];
        const recipient = event.recipient;
        if (!providerId) {
            return { ok: true };
        }
        const supabase = this.supabase.getClient();
        const { data: messages } = await supabase
            .from('messages')
            .select('id')
            .eq('provider_message_id', providerId)
            .limit(1);
        const messageId = messages?.[0]?.id;
        if (messageId) {
            await supabase.from('email_events').insert({
                message_id: messageId,
                event_type: eventType,
                metadata: { recipient, userAgent },
            });
            if (['bounced', 'complained'].includes(eventType)) {
                await supabase.from('messages').update({ status: eventType }).eq('id', messageId);
            }
        }
        return { ok: true };
    }
    verifySignature(payload) {
        const apiKey = this.config.get('MAILGUN_API_KEY');
        if (!apiKey)
            return false;
        const signature = payload.signature;
        const hmac = (0, crypto_1.createHmac)('sha256', apiKey);
        hmac.update(signature.timestamp + signature.token);
        const digest = hmac.digest('hex');
        return digest === signature.signature;
    }
};
exports.MailgunWebhookController = MailgunWebhookController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MailgunWebhookController.prototype, "handleWebhook", null);
exports.MailgunWebhookController = MailgunWebhookController = __decorate([
    (0, common_1.Controller)('webhooks/mailgun'),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        config_1.ConfigService])
], MailgunWebhookController);
//# sourceMappingURL=mailgun.controller.js.map