export interface CsvRow {
    landingPage: string;
    channelGrouping: string;
    sessions: number;
    transactions: number;
    conversionRate?: number;
}

export interface LandingPageData {
    landingPage: string;
    channelGrouping: string;
    sessions: number;
    transactions: number;
    conversionRate: number;
}

export interface ChannelData {
    channelName: string;
    top5: LandingPageData[];
    bottom5: LandingPageData[];
} 