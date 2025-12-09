import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '@nestjs/config';
interface MailgunWebhookPayload {
    signature: {
        timestamp: string;
        token: string;
        signature: string;
    };
    'event-data': {
        event: string;
        id: string;
        message?: {
            headers?: {
                'message-id'?: string;
            };
        };
        recipient?: string;
    };
}
export declare class MailgunWebhookController {
    private readonly supabase;
    private readonly config;
    constructor(supabase: SupabaseService, config: ConfigService);
    handleWebhook(payload: MailgunWebhookPayload, userAgent: string): Promise<{
        ok: boolean;
        reason: string;
    } | {
        ok: boolean;
        reason?: undefined;
    }>;
    private verifySignature;
}
export {};
