export declare class FilterCsvDto {
    filterField: string;
    operator: 'equals' | 'contains' | 'in';
    value?: string;
    values?: string[];
    audienceName?: string;
    timezoneFallback?: string;
}
