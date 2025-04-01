import { NextRequest, NextResponse } from 'next/server'
import { processCSV } from '@/lib/csvProcessor'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            )
        }

        // Process the CSV file
        const channelResults = await processCSV(file)

        // Return the processed data
        return NextResponse.json({
            channelResults,
        })
    } catch (error: any) {
        console.error('Error processing CSV:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to process CSV file' },
            { status: 500 }
        )
    }
} 