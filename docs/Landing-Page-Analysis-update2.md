### Landing-Page-Analysis-update2

This application allows you to upload a CSV file of campaign performance data and automatically:
1 Cleans and processes the data by:
	* Removing any rows above the main table headings
	* Filtering out landing pages containing "book", "checkout", or "purchase"
	* Excluding sessions with less than 50 sessions
	* Excluding entries with less than 10 transactions
	* Calculating conversion rates (transactions ÷ sessions) as percentages to 2 decimal places
2 Groups the data by default channel grouping
3 For each channel grouping, identifies and displays:
	* Top 5 landing pages by conversion rate
	* Bottom 5 landing pages by conversion rate
4 Displays results in tables sorted by sessions, showing:
	* Traffic source (Default channel grouping)
	* Sessions
	* Landing page URL
	* Conversion rate (%)
5 Allows downloading the processed data as a CSV file

Upload your CSV file containing landing page data with columns for Sessions, Default channel grouping, and Key results (transactions).

Now update the code files to implement these requirements:
// app/api/process-csv/route.js
import { NextResponse } from "next/server";
import Papa from 'papaparse';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Read the file content
    const fileContent = await file.text();
    
    // Parse the CSV file
    const parsedCsv = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    // Process the data
    const { processedData, channelAnalysis } = processCSV(parsedCsv.data);
    
    return NextResponse.json({ 
      data: processedData,
      channelAnalysis: channelAnalysis
    });
  } catch (error) {
    console.error("Error processing CSV:", error);
    return NextResponse.json(
      { error: error.message || "Error processing CSV" },
      { status: 500 }
    );
  }
}

function processCSV(data) {
  // Skip any header rows - look for the row that contains "Default channel grouping" and "Sessions"
  let startIndex = 0;
  for (let i = 0; i < data.length; i++) {
    const rowKeys = Object.keys(data[i]).map(key => key.toLowerCase());
    if (
      rowKeys.some(key => key.includes('default channel') || key.includes('channel grouping')) &&
      rowKeys.some(key => key.includes('session'))
    ) {
      startIndex = i;
      break;
    }
  }
  
  // Get the row with headers
  const headerRow = data[startIndex];
  
  // Extract the actual data rows
  const dataRows = data.slice(startIndex + 1);
  
  // Identify key column names (accounting for variations)
  const findColumn = (possibleNames) => {
    const headers = Object.keys(headerRow);
    for (const name of possibleNames) {
      const found = headers.find(header => 
        header.toLowerCase().includes(name.toLowerCase())
      );
      if (found) return found;
    }
    return null;
  };
  
  const landingPageColumn = findColumn(['landing page', 'landingpage', 'url', 'page']);
  const sessionsColumn = findColumn(['sessions', 'session', 'visits', 'traffic']);
  const channelGroupingColumn = findColumn(['default channel', 'channel grouping', 'source']);
  const transactionsColumn = findColumn(['key results', 'transactions', 'conversions', 'goals']);
  
  // Ensure we found all required columns
  if (!landingPageColumn || !sessionsColumn || !channelGroupingColumn || !transactionsColumn) {
    throw new Error("Could not identify all required columns in the CSV data");
  }
  
  // Clean and process the data
  const processedData = dataRows
    .filter(row => {
      // Filter out empty rows or rows with insufficient data
      if (!row[landingPageColumn] || !row[sessionsColumn] || !row[channelGroupingColumn]) return false;
      
      // Parse numeric values (handle commas and other formatting)
      const sessions = parseInt(String(row[sessionsColumn]).replace(/[^0-9]/g, '')) || 0;
      const transactions = parseInt(String(row[transactionsColumn]).replace(/[^0-9]/g, '')) || 0;
      
      // Filter based on requirements:
      // 1. At least 50 sessions
      if (sessions < 50) return false;
      
      // 2. At least 10 transactions
      if (transactions < 10) return false;
      
      // 3. URL doesn't contain excluded terms
      const url = String(row[landingPageColumn]).toLowerCase();
      if (url.includes('book') || url.includes('checkout') || url.includes('purchase')) return false;
      
      return true;
    })
    .map(row => {
      // Convert to a standardized format
      const sessions = parseInt(String(row[sessionsColumn]).replace(/[^0-9]/g, '')) || 0;
      const transactions = parseInt(String(row[transactionsColumn]).replace(/[^0-9]/g, '')) || 0;
      
      // Calculate conversion rate
      const conversionRate = sessions > 0 ? (transactions / sessions) * 100 : 0;
      
      return {
        "Landing Page": row[landingPageColumn],
        "Sessions": sessions,
        "Default Channel Grouping": row[channelGroupingColumn],
        "Transactions": transactions,
        "Conversion Rate": parseFloat(conversionRate.toFixed(2))
      };
    });
  
  // Group by channel type
  const channelGroups = {};
  
  processedData.forEach(row => {
    const channel = row["Default Channel Grouping"];
    if (!channelGroups[channel]) {
      channelGroups[channel] = [];
    }
    channelGroups[channel].push(row);
  });
  
  // For each channel, get top 5 and bottom 5 landing pages by conversion rate
  const channelAnalysis = {};
  
  Object.keys(channelGroups).forEach(channel => {
    // Sort by conversion rate
    const sorted = [...channelGroups[channel]].sort((a, b) => b["Conversion Rate"] - a["Conversion Rate"]);
    
    // Get top 5 if available
    const top5 = sorted.slice(0, Math.min(5, sorted.length));
    
    // Get bottom 5 if available
    const bottom5 = sorted.slice(Math.max(0, sorted.length - 5)).reverse();
    
    // Sort each by sessions (high to low)
    top5.sort((a, b) => b["Sessions"] - a["Sessions"]);
    bottom5.sort((a, b) => b["Sessions"] - a["Sessions"]);
    
    channelAnalysis[channel] = {
      top5: top5,
      bottom5: bottom5
    };
  });
  
  // Format data for display
  const formattedData = processedData.map(row => ({
    ...row,
    "Sessions": row["Sessions"].toLocaleString(),
    "Transactions": row["Transactions"].toLocaleString(),
    "Conversion Rate": `${row["Conversion Rate"].toFixed(2)}%`
  }));
  
  return {
    processedData: formattedData,
    channelAnalysis: channelAnalysis
  };
}

THEN: update the main component to handle this new analysis and display the results in tables:
// app/page.js
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/tooltip";
import { 
  Loader2, 
  HelpCircle, 
  Upload, 
  FileText, 
  Download,
  Check,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  BarChart3
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [channelAnalysis, setChannelAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file first");
      return;
    }

    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/process-csv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process CSV");
      }

      const result = await response.json();
      setData(result.data);
      setChannelAnalysis(result.channelAnalysis);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error processing CSV:", error);
      setError("Error processing CSV file. Please check the file format and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!data) return;

    // Convert data to CSV
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).join(","));
    const csvContent = [headers, ...rows].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "processed_campaign_data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Campaign Performance Analyzer</h1>
          <p className="text-lg font-light text-gray-600">Identify top and bottom performing landing pages by channel</p>
        </header>
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <div className="font-medium">Upload Campaign Data</div>
            </div>
            <div className="flex-1 mx-4 border-t border-gray-200"></div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <div className="font-medium">Performance Analysis</div>
            </div>
          </div>
        </div>
        
        {currentStep === 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Upload Campaign Data
              </CardTitle>
              <CardDescription>
                Upload your CSV file containing landing page performance data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800 mb-4">
                  <h3 className="font-bold mb-2 flex items-center">
                    <HelpCircle className="mr-2 h-5 w-5" />
                    What data should I upload?
                  </h3>
                  <p className="text-sm font-light">
                    Upload a CSV file containing landing page data with columns for:
                  </p>
                  <ul className="text-sm font-light mt-2 list-disc pl-5">
                    <li>Landing Page URLs</li>
                    <li>Sessions</li>
                    <li>Default Channel Grouping</li>
                    <li>Transactions (might be labeled as "Key Results")</li>
                  </ul>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="csvFile" className="flex items-center">
                    Upload CSV File
                    <Tooltip content="The system will automatically clean and process your data according to the requirements">
                      <HelpCircle className="ml-1 h-4 w-4 text-gray-400" />
                    </Tooltip>
                  </Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8">
                    <div className="flex flex-col items-center justify-center text-center">
                      <FileText className="h-10 w-10 text-gray-400 mb-4" />
                      <div className="mb-4">
                        <p className="font-medium text-sm text-gray-700 mb-1">
                          {file ? `Selected: ${file.name}` : "Drag and drop a CSV file, or click to browse"}
                        </p>
                        <p className="text-xs text-gray-500 font-light">
                          Your file will be processed to identify top and bottom performing landing pages
                        </p>
                      </div>
                      <label className="cursor-pointer">
                        <Input
                          id="csvFile"
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Button variant="outline" type="button" className="font-light">
                          {file ? "Change File" : "Select File"}
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm font-light">
                    {error}
                  </div>
                )}
                
                <Button 
                  onClick={handleUpload} 
                  disabled={!file || loading}
                  className="w-full font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Analyze Performance
                      <BarChart3 className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && channelAnalysis && (
          <>
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Check className="mr-2 h-5 w-5 text-green-500" />
                    Analysis Complete
                  </CardTitle>
                  <CardDescription>
                    Performance analysis by channel grouping
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Upload Another
                  </Button>
                  <Tooltip content="Download the processed data as a CSV file">
                    <Button onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download CSV
                    </Button>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={Object.keys(channelAnalysis)[0]} className="w-full">
                  <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-4">
                    {Object.keys(channelAnalysis).map((channel) => (
                      <TabsTrigger key={channel} value={channel} className="text-xs">
                        {channel}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {Object.keys(channelAnalysis).map((channel) => (
                    <TabsContent key={channel} value={channel} className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold flex items-center text-green-700 mb-3">
                          <ArrowUp className="mr-2 h-5 w-5" />
                          Top 5 Landing Pages - {channel}
                        </h3>
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-green-50">
                                <TableHead className="font-extrabold text-xs uppercase text-green-800 w-48">Channel</TableHead>
                                <TableHead className="font-extrabold text-xs uppercase text-green-800 w-24">Sessions</TableHead>
                                <TableHead className="font-extrabold text-xs uppercase text-green-800">Landing Page</TableHead>
                                <TableHead className="font-extrabold text-xs uppercase text-green-800 w-32">Conv. Rate</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {channelAnalysis[channel].top5.map((row, i) => (
                                <TableRow key={i} className="font-light">
                                  <TableCell className="font-medium">{row["Default Channel Grouping"]}</TableCell>
                                  <TableCell>{row["Sessions"]}</TableCell>
                                  <TableCell className="truncate max-w-xs">
                                    <Tooltip content={row["Landing Page"]}>
                                      <span>{row["Landing Page"]}</span>
                                    </Tooltip>
                                  </TableCell>
                                  <TableCell className="font-bold text-green-700">{row["Conversion Rate"]}</TableCell>
                                </TableRow>
                              ))}
                              {channelAnalysis[channel].top5.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                    No data available for this channel
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold flex items-center text-red-700 mb-3">
                          <ArrowDown className="mr-2 h-5 w-5" />
                          Bottom 5 Landing Pages - {channel}
                        </h3>
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-red-50">
                                <TableHead className="font-extrabold text-xs uppercase text-red-800 w-48">Channel</TableHead>
                                <TableHead className="font-extrabold text-xs uppercase text-red-800 w-24">Sessions</TableHead>
                                <TableHead className="font-extrabold text-xs uppercase text-red-800">Landing Page</TableHead>
                                <TableHead className="font-extrabold text-xs uppercase text-red-800 w-32">Conv. Rate</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {channelAnalysis[channel].bottom5.map((row, i) => (
                                <TableRow key={i} className="font-light">
                                  <TableCell className="font-medium">{row["Default Channel Grouping"]}</TableCell>
                                  <TableCell>{row["Sessions"]}</TableCell>
                                  <TableCell className="truncate max-w-xs">
                                    <Tooltip content={row["Landing Page"]}>
                                      <span>{row["Landing Page"]}</span>
                                    </Tooltip>
                                  </TableCell>
                                  <TableCell className="font-bold text-red-700">{row["Conversion Rate"]}</TableCell>
                                </TableRow>
                              ))}
                              {channelAnalysis[channel].bottom5.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                    No data available for this channel
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800 mb-6">
              <h3 className="font-bold mb-2 flex items-center">
                <HelpCircle className="mr-2 h-5 w-5" />
                About This Analysis
              </h3>
              <p className="text-sm font-light">
                This analysis shows the top and bottom performing landing pages for each channel grouping based on conversion rate. 
                We've filtered the data to include only:
              </p>
              <ul className="text-sm font-light mt-2 list-disc pl-5">
                <li>Landing pages with at least 50 sessions</li>
                <li>Landing pages with at least 10 transactions</li>
                <li>URLs that don't contain "book", "checkout", or "purchase"</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

THEN: add the Tabs component to our component library:
// components/ui/tabs.jsx
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

THEN: update the package.json to include the tabs dependencies:
{
  "name": "csv-analyzer",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.299.0",
    "next": "^15.0.0",
    "papaparse": "^5.4.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-config-next": "^15.0.0",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0"
  }
}

Finally, let's update the README to reflect the new functionality:
# Campaign Performance Analyzer
A Next.js 15 web application for analyzing PPC campaign performance data, helping marketing teams identify top and bottom performing landing pages by channel.
# Features
* CSV file upload and comprehensive data processing
* Automatic data cleaning and filtering:
  * Removes rows above table headings
  * Excludes sessions with less than 50 sessions
  * Excludes entries with less than 10 transactions
  * Filters out landing pages containing "book", "checkout", or "purchase"
* Groups data by default channel grouping
* Identifies top 5 and bottom 5 landing pages by conversion rate for each channel
* Displays results in intuitive, sortable tables
* Allows downloading the processed data as a CSV file
* Responsive design with Google's Inter font
* Informative tooltips for enhanced user experience

⠀Analysis Details
For each traffic source (default channel grouping), the application:
1 Calculates conversion rates (transactions ÷ sessions) as percentages to 2 decimal places
2 Identifies the top 5 and bottom 5 landing pages by conversion rate
3 Sorts results by sessions (high to low)
4 Presents the data in organized tables showing:
	* Traffic source
	* Sessions
	* Landing page URL
	* Conversion rate

⠀Deploying to Vercel
This application is configured to work seamlessly with Vercel deployment. Follow these steps to deploy:
**1** **Push to GitHub**:
	* Push this codebase to a GitHub repository
**2** **Import to Vercel**:
	* Go to ~[Vercel Dashboard](https://vercel.com/dashboard)~
	* Click "New Project"
	* Import your GitHub repository
	* Vercel will automatically detect the Next.js configuration
**3** **Deploy**:
	* Click "Deploy"
	* Vercel will build and deploy your application

⠀Running Locally
### # Install dependencies
### npm install

### # Run development server
### npm run dev

### # Build for production
### npm run build

### # Start production server
### npm start
# Required CSV Format
The application expects CSV files with the following columns (the system will attempt to detect variations in column names):
* Landing page URLs
* Sessions
* Default Channel Grouping
* Transactions (might be labeled as "Key Results")

⠀Technologies Used
* Next.js 15
* shadcn/ui components
* Tailwind CSS
* Google Fonts (Inter)
* PapaParse for CSV processing
* Radix UI primitives



I’ve also provided a sample output, sample-output-table.svg in the docs folder) to show you how the processed data will appear in a sample table in the application. It’s a visual representation of what you can expect when analyzing campaign data:
This visualization shows you how the processed data will look in the application. Let me explain the key elements:
### Sample Output Structure
**1** **Channel-Based Tabs**:
	* In this example, we're viewing the "Organic Search" channel, with tabs for other channels (Paid Search, Social, Direct)
	* Each channel's data is presented separately for easy comparison
**2** **Top 5 Performers Table**:
	* Green-colored header for visual distinction
	* Shows the channel name, sessions count, landing page URL, and conversion rate
	* Landing pages are sorted by sessions (highest first)
	* Conversion rates are displayed prominently with green highlighting
**3** **Bottom 5 Performers Table**:
	* Red-colored header to distinguish from top performers
	* Same column structure as the top performers table
	* Lower conversion rates highlighted in red
	* Also sorted by sessions count

⠀What we’ll See in the Actual Data
The actual application will process the CSV file with these specific behaviors:
**1** **Data Filtering**:
	* Only includes landing pages with 50+ sessions
	* Only includes pages with 10+ transactions
	* Excludes URLs containing "book", "checkout", or "purchase"
**2** **Conversion Rate Calculation**:
	* Calculated as (transactions ÷ sessions) × 100
	* Formatted to 2 decimal places with % symbol
**3** **Channel Categorization**:
	* All entries are grouped by their "Default Channel Grouping" value
	* Each channel gets its own tab with separate top 5 and bottom 5 tables
**4** **CSV Download**:
	* A download button allows you to export the complete processed dataset as a CSV

The sample visualization provides a clear representation of what you'll see when you upload and process your campaign data. The actual tables will be fully interactive, with tooltips for long URLs and responsive design for different screen sizes.
