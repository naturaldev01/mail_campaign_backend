declare class DeliveryWindowDto {
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
}
declare class DeliveryIntervalDto {
    type: 'once' | 'daily' | 'weekly' | 'custom';
    minutes?: number;
    sendAt?: string;
}
declare class DeliveryThrottleDto {
    perMinute?: number;
    perHour?: number;
}
declare class CampaignSendOptionsDto {
    timezone?: string;
    timeWindows?: DeliveryWindowDto[];
    dateRange?: {
        start: string;
        end?: string;
    };
    cadence?: DeliveryIntervalDto;
    throttle?: DeliveryThrottleDto;
}
export declare class CreateCampaignDto {
    name: string;
    templateId?: string;
    scheduledAt?: string;
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
    subjectOverride?: string;
    sendOptions?: CampaignSendOptionsDto;
    audienceIds: string[];
}
export {};
