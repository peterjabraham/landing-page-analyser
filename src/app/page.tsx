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
            setIsUploaded(true);
        } catch (err) {
            setError('Error processing the CSV file. Please try again.');
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
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
                        <button
                            onClick={() => setIsUploaded(false)}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Upload New File
                        </button>
                    </div>

                    <ResultsTabs channelResults={channelResults} />
                </div>
            )}
        </div>
    );
} 