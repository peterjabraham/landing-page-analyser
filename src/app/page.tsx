"use client";

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import ResultsTabs from '@/components/ResultsTabs';
import { processCSV } from '@/lib/csvProcessor';
import { ChannelData } from '@/lib/types';

export default function Home() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploaded, setIsUploaded] = useState(false);
    const [channelResults, setChannelResults] = useState<ChannelData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [processedData, setProcessedData] = useState<any[] | null>(null);

    const handleFileUpload = async (file: File) => {
        setIsProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/process-csv', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to process CSV file');
            }

            const data = await response.json();
            setChannelResults(data.channelResults);
            setProcessedData(data.processedData || []);
            setIsUploaded(true);
        } catch (err) {
            setError('Error processing the CSV file. Please try again.');
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadCSV = () => {
        if (!processedData || processedData.length === 0) return;

        // Extract headers from the first row
        const headers = Object.keys(processedData[0]).join(',');

        // Convert data to CSV rows
        const rows = processedData.map(row =>
            Object.values(row).map(value =>
                // Handle values with commas by enclosing in quotes
                typeof value === 'string' && value.includes(',')
                    ? `"${value}"`
                    : value
            ).join(',')
        );

        // Combine headers and rows into a CSV string
        const csvContent = [headers, ...rows].join('\n');

        // Create a blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'processed_landing_page_data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-center mb-8">Campaign Performance Analyzer</h1>

            {!isUploaded ? (
                <div className="max-w-xl mx-auto">
                    <FileUpload
                        onFileUpload={handleFileUpload}
                        isProcessing={isProcessing}
                    />

                    {error && (
                        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div className="mb-6 flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Analysis Results</h2>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setIsUploaded(false)}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                                Upload New File
                            </button>

                            {processedData && processedData.length > 0 && (
                                <button
                                    onClick={handleDownloadCSV}
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download CSV
                                </button>
                            )}
                        </div>
                    </div>

                    <ResultsTabs channelResults={channelResults} />
                </div>
            )}
        </div>
    );
} 