import { ConfigService } from '@nestjs/config';
export interface MailgunSendParams {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    variables?: Record<string, any>;
    from?: string;
    replyTo?: string;
}
export declare class MailgunService {
    private readonly config;
    private readonly logger;
    private readonly apiKey;
    private readonly domain;
    private readonly defaultFrom;
    constructor(config: ConfigService);
    sendEmail(params: MailgunSendParams): Promise<{
        id: string;
        message: string;
    }>;
}
