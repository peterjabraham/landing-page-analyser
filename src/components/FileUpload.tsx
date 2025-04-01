'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
    onFileUpload: (file: File) => void;
    isProcessing: boolean;
}

export default function FileUpload({ onFileUpload, isProcessing }: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length) {
                const selectedFile = acceptedFiles[0];

                if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                    setError('Please upload a valid CSV file');
                    return;
                }

                setFile(selectedFile);
                setError(null);
            }
        },
        []
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
        },
        maxFiles: 1,
        disabled: isProcessing,
    });

    const handleUpload = () => {
        if (!file) {
            setError('Please select a CSV file first');
            return;
        }

        onFileUpload(file);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Upload Campaign Data</h2>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg text-sm">
                <p className="font-medium text-blue-800 mb-2">Upload a CSV file with the following data:</p>
                <ul className="list-disc pl-5 text-blue-700 space-y-1">
                    <li>Landing page URLs</li>
                    <li>Sessions count</li>
                    <li>Default channel grouping</li>
                    <li>Transaction/conversion events</li>
                </ul>
            </div>

            <div
                {...getRootProps()}
                className={`
          border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors mb-4
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}
          ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}
        `}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center justify-center text-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-gray-400 mb-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>

                    {isDragActive ? (
                        <p className="text-blue-500 font-medium">Drop the CSV file here...</p>
                    ) : (
                        <div>
                            <p className="text-gray-700 font-medium mb-1">
                                {file ? `Selected: ${file.name}` : 'Drag and drop a CSV file, or click to browse'}
                            </p>
                            {file && (
                                <p className="text-sm text-gray-500">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
                    {error}
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={!file || isProcessing}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                    </div>
                ) : (
                    'Analyze Campaign Data'
                )}
            </button>
        </div>
    );
} 