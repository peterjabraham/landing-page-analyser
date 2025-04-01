# Campaign Performance Analyzer

A Next.js 15 web application for analyzing PPC campaign performance data, helping marketing teams identify top and bottom performing landing pages by channel.

## Features

* CSV file upload and comprehensive data processing
* Automatic data cleaning and filtering:
  * Removes rows above table headings
  * Excludes sessions with less than 50 sessions
  * Excludes entries with less than 10 transactions
  * Filters out landing pages containing "book", "checkout", or "purchase"
* Groups data by default channel grouping
* Identifies top 5 and bottom 5 landing pages by conversion rate for each channel
* Displays results in intuitive, sortable tables
* Responsive design with Google's Inter font
* Informative tooltips for enhanced user experience

## Analysis Details

For each traffic source (default channel grouping), the application:
1. Calculates conversion rates (transactions ÷ sessions) as percentages to 2 decimal places
2. Identifies the top 5 and bottom 5 landing pages by conversion rate
3. Sorts results by sessions (high to low)
4. Presents the data in organized tables showing:
   * Traffic source
   * Sessions
   * Landing page URL
   * Conversion rate

## Deploying to Vercel

This application is configured to work seamlessly with Vercel deployment. Follow these steps to deploy:

1. **Push to GitHub**:
   - Push this codebase to a GitHub repository

2. **Import to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the Next.js configuration

3. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your application

## Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Required CSV Format

The application expects CSV files with the following columns (the system will attempt to detect variations in column names):

* Landing page URLs
* Sessions
* Default Channel Grouping
* Transactions (might be labeled as "Key Results")

## Technologies Used

* Next.js 15
* PapaParse for CSV processing
* Tailwind CSS
* Google Fonts (Inter)
* Radix UI components 