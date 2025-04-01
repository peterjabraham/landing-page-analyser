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
        const { channelResults, processedData } = await processCSV(file)

        // Return the processed data
        return NextResponse.json({
            channelResults,
            processedData
        })
    } catch (error: unknown) {
        console.error('Error processing CSV:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to process CSV file'
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        )
    }
} 