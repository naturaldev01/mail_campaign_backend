export declare class AudienceFilterRule {
    field: string;
    operator: string;
    value?: any;
    values?: any[];
    source?: string;
}
export declare class AudienceSyncConfig {
    resource?: string;
    auth?: Record<string, any>;
    cursor?: Record<string, any>;
    rules?: AudienceFilterRule[];
}
