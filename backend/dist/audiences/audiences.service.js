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
exports.AudiencesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let AudiencesService = class AudiencesService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async createAudience(dto) {
        const payload = {
            name: dto.name,
            description: dto.description,
            type: dto.type ?? 'static',
            filter_rules: dto.filterRules ?? [],
            sync_provider: dto.syncProvider,
            sync_config: dto.syncConfig ?? {},
        };
        const { data, error } = await this.supabase
            .getClient()
            .from('audiences')
            .insert(payload)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return data;
    }
    async listAudiences() {
        const { data, error } = await this.supabase.getClient().from('audiences').select('*');
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return data;
    }
    async addContact(dto) {
        const attributes = {
            ...(dto.attributes ?? {}),
            ...(dto.timezone ? { timezone: dto.timezone } : {}),
        };
        const { data, error } = await this.supabase
            .getClient()
            .from('contacts')
            .upsert({
            audience_id: dto.audienceId,
            email: dto.email.toLowerCase(),
            attributes,
            status: 'active',
        }, { onConflict: 'audience_id,email' })
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return data;
    }
    async listContacts(audienceId) {
        const { data, error } = await this.supabase
            .getClient()
            .from('contacts')
            .select('*')
            .eq('audience_id', audienceId);
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return data;
    }
    async syncAudience(audienceId) {
        const { data, error } = await this.supabase
            .getClient()
            .from('audiences')
            .update({ last_synced_at: new Date().toISOString() })
            .eq('id', audienceId)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return {
            audience: data,
            message: 'Sync triggered; downstream connector processing is pending.',
        };
    }
};
exports.AudiencesService = AudiencesService;
exports.AudiencesService = AudiencesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AudiencesService);
//# sourceMappingURL=audiences.service.js.map