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
var CampaignsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let CampaignsService = CampaignsService_1 = class CampaignsService {
    supabase;
    logger = new common_1.Logger(CampaignsService_1.name);
    constructor(supabase) {
        this.supabase = supabase;
    }
    async createCampaign(dto) {
        const { data: campaign, error } = await this.supabase
            .getClient()
            .from('campaigns')
            .insert({
            name: dto.name,
            template_id: dto.templateId,
            scheduled_at: dto.scheduledAt,
            from_name: dto.fromName,
            from_email: dto.fromEmail,
            reply_to: dto.replyTo,
            subject_override: dto.subjectOverride,
            send_options: dto.sendOptions ?? {},
            status: dto.scheduledAt ? 'scheduled' : 'draft',
        })
            .select()
            .single();
        if (error || !campaign) {
            throw new common_1.BadRequestException(error?.message ?? 'Failed to create campaign');
        }
        if (dto.audienceIds?.length) {
            const linkRows = dto.audienceIds.map((audienceId) => ({
                campaign_id: campaign.id,
                audience_id: audienceId,
            }));
            const { error: linkError } = await this.supabase
                .getClient()
                .from('campaign_audiences')
                .insert(linkRows);
            if (linkError) {
                this.logger.error('Failed to link audiences', linkError);
                throw new common_1.BadRequestException(linkError.message);
            }
        }
        return campaign;
    }
    async listCampaigns() {
        const { data, error } = await this.supabase.getClient().from('campaigns').select('*');
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return data;
    }
    async updateStatus(id, status) {
        const { data, error } = await this.supabase
            .getClient()
            .from('campaigns')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return data;
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = CampaignsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map