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
var MailProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const queue_constants_1 = require("../queues/queue.constants");
const mailgun_service_1 = require("./mailgun.service");
const supabase_service_1 = require("../supabase/supabase.service");
const smtp_service_1 = require("./smtp.service");
let MailProcessor = MailProcessor_1 = class MailProcessor extends bullmq_1.WorkerHost {
    mailgun;
    supabase;
    smtp;
    logger = new common_1.Logger(MailProcessor_1.name);
    constructor(mailgun, supabase, smtp) {
        super();
        this.mailgun = mailgun;
        this.supabase = supabase;
        this.smtp = smtp;
    }
    async process(job) {
        const payload = job.data;
        const supabase = this.supabase.getClient();
        await supabase.from('messages').update({ status: 'sending' }).eq('id', payload.messageId);
        try {
            const provider = process.env.MAIL_PROVIDER ?? 'mailgun';
            let result;
            if (provider === 'smtp') {
                result = await this.smtp.sendEmail({
                    to: payload.email,
                    subject: payload.subject ?? '(no subject)',
                    text: payload.bodyText ?? undefined,
                    html: payload.bodyHtml ?? undefined,
                    replyTo: payload.replyTo,
                });
            }
            else {
                result = await this.mailgun.sendEmail({
                    to: payload.email,
                    subject: payload.subject ?? '(no subject)',
                    text: payload.bodyText ?? undefined,
                    html: payload.bodyHtml ?? undefined,
                    variables: payload.variables,
                    replyTo: payload.replyTo,
                });
            }
            await supabase
                .from('messages')
                .update({ status: 'sent', provider_message_id: result.id, sent_at: new Date().toISOString() })
                .eq('id', payload.messageId);
        }
        catch (err) {
            const errorMessage = err.message;
            this.logger.error(`Failed to send mail for message ${payload.messageId}`, err);
            await supabase
                .from('messages')
                .update({ status: 'failed', last_error: errorMessage })
                .eq('id', payload.messageId);
            throw err;
        }
    }
};
exports.MailProcessor = MailProcessor;
exports.MailProcessor = MailProcessor = MailProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queue_constants_1.MAIL_QUEUE),
    __metadata("design:paramtypes", [mailgun_service_1.MailgunService,
        supabase_service_1.SupabaseService,
        smtp_service_1.SmtpService])
], MailProcessor);
//# sourceMappingURL=mail.processor.js.map