### Landing-Page-Analysis-update1

We need this to be hosted on vercel.
To host this application on Vercel, you'll need to make a few adjustments to ensure it works properly in Vercel's deployment environment. The main challenge is that Vercel doesn't support running Python scripts directly within serverless functions as we're doing in our current API route.
Here are the necessary changes:

Vercel-Compatible API Route for CSV Processing:
// app/api/process-csv/route.js
import { NextResponse } from "next/server";
import Papa from 'papaparse';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const keyEventsName = formData.get("keyEventsName") || "Key events";
    
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

    // Process the data in JavaScript instead of Python
    const processedData = processCSV(parsedCsv.data, keyEventsName);
    
    return NextResponse.json({ data: processedData });
  } catch (error) {
    console.error("Error processing CSV:", error);
    return NextResponse.json(
      { error: error.message || "Error processing CSV" },
      { status: 500 }
    );
  }
}

function processCSV(data, keyEventsName) {
  // Map column variants to standard names
  const columnVariants = {
    'landing page': 'Landing page',
    'landingpage': 'Landing page',
    'url': 'Landing page',
    'page': 'Landing page',
    
    'sessions': 'Sessions',
    'session': 'Sessions',
    'visits': 'Sessions',
    'traffic': 'Sessions',
    
    'key events': 'Key events',
    'keyevents': 'Key events',
    'events': 'Key events',
    'conversions': 'Key events',
    
    'total revenue': 'Total revenue',
    'totalrevenue': 'Total revenue',
    'revenue': 'Total revenue',
    'sales': 'Total revenue'
  };

  // Standardize column names
  const originalHeaders = Object.keys(data[0] || {});
  const headerMapping = {};
  
  originalHeaders.forEach(header => {
    const headerLower = header.toLowerCase();
    if (columnVariants[headerLower]) {
      headerMapping[header] = columnVariants[headerLower];
    }
  });
  
  // Rename Key events to custom name if it exists
  if (headerMapping['Key events'] || originalHeaders.includes('Key events')) {
    headerMapping['Key events'] = keyEventsName;
  }
  
  // Apply the column mapping
  const processedData = data.map(row => {
    const newRow = {};
    Object.keys(row).forEach(key => {
      const newKey = headerMapping[key] || key;
      newRow[newKey] = row[key];
    });
    return newRow;
  });
  
  // Process each row of data
  return processedData.map(row => {
    const newRow = { ...row };
    
    // Ensure Sessions is numeric
    newRow['Sessions'] = parseInt(String(newRow['Sessions']).replace(/,/g, '')) || 0;
    
    // Handle Total revenue if it exists
    if ('Total revenue' in newRow) {
      // Extract numeric value from Total revenue
      const revenueStr = String(newRow['Total revenue']);
      const revenueValue = parseFloat(revenueStr.replace(/[^0-9.]/g, '') || '0');
      
      // Calculate conversion rate
      const conversionRate = newRow['Sessions'] > 0 
        ? ((revenueValue > 0 ? 1 : 0) / newRow['Sessions'] * 100).toFixed(2)
        : "0.00";
      
      // Format values
      newRow['Total revenue'] = `£${revenueValue.toFixed(2)}`;
      newRow['Conversion rate'] = `${conversionRate}%`;
    } else {
      // If no revenue column, create a conversion rate based on key events if available
      if (keyEventsName in newRow) {
        const eventsValue = parseInt(String(newRow[keyEventsName]).replace(/,/g, '')) || 0;
        const conversionRate = newRow['Sessions'] > 0 
          ? (eventsValue / newRow['Sessions'] * 100).toFixed(2)
          : "0.00";
        
        newRow['Conversion rate'] = `${conversionRate}%`;
        newRow['Total revenue'] = "£0.00";
      } else {
        // Both revenue and key events missing, create placeholder columns
        newRow['Total revenue'] = "£0.00";
        newRow['Conversion rate'] = "0.00%";
      }
    }
    
    // Format sessions with thousands separator
    newRow['Sessions'] = newRow['Sessions'].toLocaleString();
    
    return newRow;
  });
}

THEN:update the package.json to include papaparse for CSV processing:
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

THEN: add a Vercel configuration file to ensure proper setup:
{
  "version": 2,
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}

THEN: create a README file with deployment instructions:
# CSV Data Analyzer
A Next.js 15 web application for uploading, cleaning, and analyzing CSV data with an emphasis on conversion rate analysis.
# Features
* CSV file upload and processing
* Data cleaning and column standardization
* Conversion rate calculation
* Interactive data table display
* CSV download of processed data
* Clean UI with Google's Inter font
* Helpful tooltips for user guidance

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
**4** **Environment Variables (if needed)**:
	* Add any required environment variables in the Vercel project settings


**⠀Running Locally**
###### # Install dependencies
###### npm install

###### # Run development server
###### npm run dev

###### # Build for production
###### npm run build

###### # Start production server
###### npm start

# Project Structure
* app/page.js - Main UI component
* app/api/process-csv/route.js - API route for CSV processing
* components/ui/ - UI components using shadcn/ui
* public/ - Static assets

⠀CSV File Format
The application expects CSV files with the following columns (though it can handle variations):
* Landing page - URL or page name
* Sessions - Traffic or visit count
* Key events - Event metrics (name customizable)
* Total revenue - Revenue indicator

⠀Technologies Used
* Next.js 15
* shadcn/ui components
* Tailwind CSS
* Google Fonts (Inter)
* PapaParse for CSV processing

