import Papa from 'papaparse';
import { CsvRow, ChannelData, LandingPageData } from './types';

export async function processCSV(file: File): Promise<{ channelResults: ChannelData[], processedData: any[] }> {
    // Get file content as text first to avoid FileReaderSync issues on server
    const csvText = await file.text();

    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
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
                    const { channelResults, processedData } = transformData(results.data);
                    resolve({ channelResults, processedData });
                } catch (error: unknown) {
                    reject(error);
                }
            },
            error: (error: Error) => {
                reject(error);
            }
        });
    });
}

function transformData(rawData: any[]): { channelResults: ChannelData[], processedData: any[] } {
    console.log('Raw data sample:', rawData.slice(0, 2));

    // Map column names to our expected format
    const data = mapColumns(rawData);
    console.log('Mapped data sample:', data.slice(0, 2));

    // Count initial rows for diagnostics
    const initialCount = data.length;
    console.log(`Initial row count: ${initialCount}`);

    // Filter out invalid data
    const filteredData = data
        .filter(row => {
            const hasRequired = row.sessions && row.channelGrouping && row.landingPage;
            if (!hasRequired) console.log('Filtering out row missing required fields:', row);
            return hasRequired;
        })
        .filter(row => {
            // Convert sessions and transactions to numbers
            row.sessions = parseInt(String(row.sessions), 10);
            row.transactions = parseInt(String(row.transactions), 10);

            const isValid = !isNaN(row.sessions) && !isNaN(row.transactions);
            if (!isValid) console.log('Filtering out row with invalid numbers:', row);
            return isValid;
        })
        .filter(row => {
            // Apply business rules
            const landingPage = row.landingPage.toLowerCase();
            const hasMinSessions = row.sessions >= 50;
            const hasMinTransactions = row.transactions >= 10;
            const isNotPurchasePage = !landingPage.includes('book') &&
                !landingPage.includes('checkout') &&
                !landingPage.includes('purchase');

            if (!hasMinSessions) console.log(`Filtering out row with insufficient sessions (${row.sessions}):`, row);
            if (!hasMinTransactions) console.log(`Filtering out row with insufficient transactions (${row.transactions}):`, row);
            if (!isNotPurchasePage) console.log(`Filtering out purchase page:`, row);

            return hasMinSessions && hasMinTransactions && isNotPurchasePage;
        });

    console.log(`After filtering: ${filteredData.length} rows remain out of ${initialCount}`);

    if (filteredData.length === 0) {
        console.warn('WARNING: All data was filtered out. Check filter criteria and data format.');
    }

    // Calculate conversion rates
    const dataWithConversionRates = filteredData.map(row => {
        const conversionRate = (row.transactions / row.sessions) * 100;
        return {
            ...row,
            conversionRate: parseFloat(conversionRate.toFixed(2))
        };
    });

    // Create formatted data for download
    const processedData = dataWithConversionRates.map(row => ({
        "Landing Page": row.landingPage,
        "Channel": row.channelGrouping,
        "Sessions": row.sessions,
        "Transactions": row.transactions,
        "Conversion Rate (%)": row.conversionRate.toFixed(2)
    }));

    // Group by channel
    const channelGroups = groupByChannel(dataWithConversionRates);
    console.log(`Identified ${Object.keys(channelGroups).length} channel groups:`, Object.keys(channelGroups));

    // Create result object
    const channelResults = Object.entries(channelGroups).map(([channelName, channelData]) => {
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

    return { channelResults, processedData };
}

function mapColumns(data: any[]): CsvRow[] {
    if (!data.length) return [];

    // Check the first row to determine column mapping
    const firstRow = data[0];
    const keys = Object.keys(firstRow);

    console.log('Available CSV columns:', keys);

    // Try to map columns to expected format - use more specific regex patterns
    const columnMap = {
        landingPage: keys.find(k => /^landing.?page$/i.test(k)) || keys.find(k => /landing.?page/i.test(k)) || 'Landing page',
        sessions: keys.find(k => /^sessions$/i.test(k)) || keys.find(k => /^session$/i.test(k)) || 'Sessions',
        channelGrouping: keys.find(k => /channel.?group/i.test(k)) || 'Session default channel group',
        transactions: keys.find(k => /key.?event|transaction/i.test(k)) || 'Key events'
    };

    console.log('Column Mapping:', columnMap);

    // Validate the mapping - we must have valid column names
    if (!keys.includes(columnMap.sessions)) {
        console.error('Sessions column not found in CSV. Available columns:', keys);
        console.error('Current mapping:', columnMap);
        throw new Error('Cannot find Sessions column in CSV file');
    }

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