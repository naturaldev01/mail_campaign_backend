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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let ReportsService = class ReportsService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async campaignMessages(campaignId, opts) {
        const { statuses, limit, offset } = opts;
        const supabase = this.supabase.getClient();
        let query = supabase
            .from('messages')
            .select('id,status,last_error,sent_at,created_at,contact:contact_id(email)', { count: 'exact' })
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (statuses?.length) {
            query = query.in('status', statuses);
        }
        const { data, error, count } = await query;
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        const items = data?.map((m) => ({
            messageId: m.id,
            email: m.contact?.email,
            status: m.status,
            lastError: m.last_error,
            sentAt: m.sent_at,
            createdAt: m.created_at,
        })) ?? [];
        return {
            items,
            total: count ?? items.length,
            limit,
            offset,
        };
    }
    async campaignStats(campaignId) {
        const supabase = this.supabase.getClient();
        const { data: messages, error } = await supabase
            .from('messages')
            .select('id,status')
            .eq('campaign_id', campaignId);
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        const statusCounts = {};
        for (const msg of messages ?? []) {
            statusCounts[msg.status] = (statusCounts[msg.status] ?? 0) + 1;
        }
        const messageIds = (messages ?? []).map((m) => m.id);
        const { data: events } = await supabase
            .from('email_events')
            .select('event_type')
            .in('message_id', messageIds.length ? messageIds : ['00000000-0000-0000-0000-000000000000']);
        const eventCounts = {};
        for (const evt of events ?? []) {
            eventCounts[evt.event_type] = (eventCounts[evt.event_type] ?? 0) + 1;
        }
        return { statusCounts, eventCounts };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map