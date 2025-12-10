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
var SchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const supabase_service_1 = require("../supabase/supabase.service");
const queues_service_1 = require("../queues/queues.service");
let SchedulerService = SchedulerService_1 = class SchedulerService {
    supabase;
    queueService;
    logger = new common_1.Logger(SchedulerService_1.name);
    constructor(supabase, queueService) {
        this.supabase = supabase;
        this.queueService = queueService;
    }
    async scanScheduledCampaigns() {
        const nowIso = new Date().toISOString();
        console.log('[scheduler] scanScheduledCampaigns start', { nowIso });
        const { data: campaigns, error } = await this.supabase
            .getClient()
            .from('campaigns')
            .select('*')
            .eq('status', 'scheduled')
            .lte('scheduled_at', nowIso);
        if (error) {
            this.logger.error('Failed to load scheduled campaigns', error);
            return;
        }
        if (!campaigns?.length) {
            console.log('[scheduler] no scheduled campaigns');
            return;
        }
        console.log('[scheduler] scheduled campaigns found', { count: campaigns.length });
        for (const campaign of campaigns) {
            try {
                await this.enqueueCampaign(campaign);
                await this.supabase
                    .getClient()
                    .from('campaigns')
                    .update({ status: 'sending' })
                    .eq('id', campaign.id);
            }
            catch (err) {
                this.logger.error(`Failed to enqueue campaign ${campaign.id}`, err);
            }
        }
    }
    async enqueueCampaign(campaign) {
        const template = campaign.template_id &&
            (await this.supabase
                .getClient()
                .from('templates')
                .select('subject,body_html,body_text')
                .eq('id', campaign.template_id)
                .single()).data;
        const { data: audienceLinks, error: linkError } = await this.supabase
            .getClient()
            .from('campaign_audiences')
            .select('audience_id')
            .eq('campaign_id', campaign.id);
        if (linkError) {
            throw linkError;
        }
        const audienceIds = (audienceLinks ?? []).map((row) => row.audience_id);
        if (!audienceIds.length) {
            this.logger.warn(`Campaign ${campaign.id} has no audiences`);
            return;
        }
        const { data: contacts, error: contactError } = await this.supabase
            .getClient()
            .from('contacts')
            .select('id,email,attributes,audience_id')
            .in('audience_id', audienceIds);
        if (contactError) {
            throw contactError;
        }
        for (const contact of contacts ?? []) {
            const { data: message, error: messageError } = await this.supabase
                .getClient()
                .from('messages')
                .upsert({
                campaign_id: campaign.id,
                contact_id: contact.id,
                status: 'queued',
            }, { onConflict: 'campaign_id,contact_id' })
                .select()
                .single();
            if (messageError || !message) {
                this.logger.error('Failed to create message record', messageError);
                continue;
            }
            const sendAfter = campaign.scheduled_at ? new Date(campaign.scheduled_at) : new Date();
            await this.queueService.enqueueMail({
                messageId: message.id,
                campaignId: campaign.id,
                contactId: contact.id,
                email: contact.email,
                subject: campaign.subject_override ?? template?.subject,
                bodyHtml: template?.body_html ?? undefined,
                bodyText: template?.body_text ?? undefined,
                variables: contact.attributes ?? {},
                sendAfter,
                replyTo: campaign.reply_to ?? undefined,
            });
            console.log('[scheduler] enqueued mail', {
                campaignId: campaign.id,
                contactId: contact.id,
                email: contact.email,
            });
        }
    }
};
exports.SchedulerService = SchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "scanScheduledCampaigns", null);
exports.SchedulerService = SchedulerService = SchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        queues_service_1.QueueService])
], SchedulerService);
//# sourceMappingURL=scheduler.service.js.map