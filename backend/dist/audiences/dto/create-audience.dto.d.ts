import { AudienceFilterRule, AudienceSyncConfig } from './audience-filter.dto';
export declare class CreateAudienceDto {
    name: string;
    description?: string;
    type?: 'static' | 'dynamic';
    filterRules?: AudienceFilterRule[];
    syncProvider?: 'zoho' | 'manual';
    syncConfig?: AudienceSyncConfig;
}
