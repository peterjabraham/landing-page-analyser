'use client';

import { useState } from 'react';
import { ChannelData } from '@/lib/types';

interface ResultsTabsProps {
    channelResults: ChannelData[];
}

export default function ResultsTabs({ channelResults }: ResultsTabsProps) {
    const [activeTab, setActiveTab] = useState<string>(
        channelResults.length > 0 ? channelResults[0].channelName : ''
    );

    if (channelResults.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
                <p className="text-gray-500">No results available.</p>
            </div>
        );
    }

    const handleTabClick = (channelName: string) => {
        setActiveTab(channelName);
    };

    // Find the active channel data
    const activeChannelData = channelResults.find(
        (result) => result.channelName === activeTab
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="flex overflow-x-auto border-b">
                {channelResults.map((result) => (
                    <button
                        key={result.channelName}
                        onClick={() => handleTabClick(result.channelName)}
                        className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === result.channelName
                                ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {result.channelName}
                    </button>
                ))}
            </div>

            {activeChannelData && (
                <div className="p-6">
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                                />
                            </svg>
                            Top 5 Landing Pages by Conversion Rate
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-green-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                                            Channel
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                                            Sessions
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                                            Landing Page
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                                            Conv. Rate
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {activeChannelData.top5.length > 0 ? (
                                        activeChannelData.top5.map((page, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {page.channelGrouping}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {page.sessions.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                                                    <div
                                                        className="truncate cursor-help"
                                                        title={page.landingPage}
                                                    >
                                                        {page.landingPage}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                                                    {page.conversionRate.toFixed(2)}%
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-6 py-4 text-center text-sm text-gray-500"
                                            >
                                                No data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                />
                            </svg>
                            Bottom 5 Landing Pages by Conversion Rate
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-red-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                                            Channel
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                                            Sessions
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                                            Landing Page
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">
                                            Conv. Rate
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {activeChannelData.bottom5.length > 0 ? (
                                        activeChannelData.bottom5.map((page, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {page.channelGrouping}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {page.sessions.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                                                    <div
                                                        className="truncate cursor-help"
                                                        title={page.landingPage}
                                                    >
                                                        {page.landingPage}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-700">
                                                    {page.conversionRate.toFixed(2)}%
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-6 py-4 text-center text-sm text-gray-500"
                                            >
                                                No data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 bg-gray-50 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    About This Analysis
                </h3>
                <p className="text-xs text-gray-600">
                    This analysis shows the top and bottom performing landing pages for
                    each channel based on conversion rate. Results are filtered to include
                    only landing pages with:
                </p>
                <ul className="mt-2 text-xs text-gray-600 space-y-1 list-disc pl-5">
                    <li>At least 50 sessions</li>
                    <li>At least 10 transactions</li>
                    <li>URLs that don't contain "book", "checkout", or "purchase"</li>
                </ul>
            </div>
        </div>
    );
} 