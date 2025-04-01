import Papa from 'papaparse';
import { CsvRow, ChannelData, LandingPageData } from './types';

export async function processCSV(file: File): Promise<ChannelData[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            beforeFirstChunk: (chunk) => {
                // Find the first line that doesn't start with '#'
                const lines = chunk.split('\n');
                const dataStartIndex = lines.findIndex(line => !line.startsWith('#'));

                if (dataStartIndex > 0) {
                    return lines.slice(dataStartIndex).join('\n');
                }
                return chunk;
            },
            complete: (results) => {
                try {
                    // Process and transform data
                    const processedData = transformData(results.data);
                    resolve(processedData);
                } catch (error) {
                    reject(error);
                }
            },
            error: (error) => {
                reject(error);
            }
        });
    });
}

function transformData(rawData: any[]): ChannelData[] {
    // Map column names to our expected format
    const data = mapColumns(rawData);

    // Filter out invalid data
    const filteredData = data
        .filter(row => row.sessions && row.channelGrouping && row.landingPage)
        .filter(row => {
            // Convert sessions and transactions to numbers
            row.sessions = parseInt(String(row.sessions), 10);
            row.transactions = parseInt(String(row.transactions), 10);

            return !isNaN(row.sessions) && !isNaN(row.transactions);
        })
        .filter(row => {
            // Apply business rules
            const landingPage = row.landingPage.toLowerCase();
            const hasMinSessions = row.sessions >= 50;
            const hasMinTransactions = row.transactions >= 10;
            const isNotPurchasePage = !landingPage.includes('book') &&
                !landingPage.includes('checkout') &&
                !landingPage.includes('purchase');

            return hasMinSessions && hasMinTransactions && isNotPurchasePage;
        });

    // Calculate conversion rates
    const dataWithConversionRates = filteredData.map(row => {
        const conversionRate = (row.transactions / row.sessions) * 100;
        return {
            ...row,
            conversionRate: parseFloat(conversionRate.toFixed(2))
        };
    });

    // Group by channel
    const channelGroups = groupByChannel(dataWithConversionRates);

    // Create result object
    return Object.entries(channelGroups).map(([channelName, channelData]) => {
        // Sort by conversion rate
        const sortedData = [...channelData].sort((a, b) => b.conversionRate - a.conversionRate);

        // Get top 5 and bottom 5 landing pages by conversion rate
        // If there are fewer than 10 items, distribute them proportionally
        const top5 = sortedData.slice(0, 5);
        const bottom5 = sortedData.length > 5
            ? sortedData.slice(-5).reverse()
            : [];

        // Sort by sessions (high to low) within each group
        const sortBySessionsDesc = (a: LandingPageData, b: LandingPageData) => b.sessions - a.sessions;

        return {
            channelName,
            top5: top5.sort(sortBySessionsDesc),
            bottom5: bottom5.sort(sortBySessionsDesc)
        };
    });
}

function mapColumns(data: any[]): CsvRow[] {
    if (!data.length) return [];

    // Check the first row to determine column mapping
    const firstRow = data[0];
    const keys = Object.keys(firstRow);

    // Try to map columns to expected format
    const columnMap = {
        landingPage: keys.find(k => /landing.?page/i.test(k)) || 'Landing page',
        sessions: keys.find(k => /session/i.test(k)) || 'Sessions',
        channelGrouping: keys.find(k => /channel/i.test(k)) || 'Session default channel group',
        transactions: keys.find(k => /key.?event|transaction/i.test(k)) || 'Key events'
    };

    console.log('Column Mapping:', columnMap);

    // Map data using the column mapping
    return data.map(row => ({
        landingPage: row[columnMap.landingPage] || '',
        channelGrouping: row[columnMap.channelGrouping] || '',
        sessions: row[columnMap.sessions] || 0,
        transactions: row[columnMap.transactions] || 0
    }));
}

function groupByChannel(data: LandingPageData[]): Record<string, LandingPageData[]> {
    return data.reduce((groups, row) => {
        // Skip landing pages that are just "/"
        if (row.landingPage === '/') {
            return groups;
        }

        // Create array for this channel if it doesn't exist yet
        const channelName = row.channelGrouping;
        if (!groups[channelName]) {
            groups[channelName] = [];
        }

        // Add row to the channel group
        groups[channelName].push(row);
        return groups;
    }, {} as Record<string, LandingPageData[]>);
} 