import { ConfigService } from '@nestjs/config';
export interface SmtpSendParams {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    replyTo?: string;
}
export declare class SmtpService {
    private readonly config;
    private readonly logger;
    private readonly from;
    private readonly transporter;
    constructor(config: ConfigService);
    sendEmail(params: SmtpSendParams): Promise<{
        id: any;
    }>;
}
