"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import {
    ClipboardCheck,
    FileUp,
    FileX,
    Upload,
    Download,
    Check,
    HelpCircle,
    Loader2,
    ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip } from "@/components/ui/tooltip"
import { formatBytes } from "@/lib/utils"
import { DataTable } from "@/components/data-table"

type CSVData = {
    [key: string]: string | number
}

export function FileUploader() {
    const [file, setFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [data, setData] = useState<CSVData[]>([])
    const [columns, setColumns] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)
    const [keyEventsName, setKeyEventsName] = useState("Key events")
    const [currentStep, setCurrentStep] = useState(1)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0]
        if (selectedFile?.type !== "text/csv" && !selectedFile?.name.endsWith(".csv")) {
            setError("Please upload a CSV file")
            return
        }

        setFile(selectedFile)
        setError(null)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "text/csv": [".csv"],
        },
        maxFiles: 1,
    })

    const handleProcessFile = async () => {
        if (!file) return

        setIsProcessing(true)
        setError(null)

        try {
            // Process the file with the API
            const formData = new FormData()
            formData.append("file", file)
            formData.append("keyEventsName", keyEventsName)

            // Send to the API
            const response = await fetch("/api/process-csv", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                throw new Error("Failed to process CSV file")
            }

            const result = await response.json()

            if (result.success) {
                setData(result.data)
                setColumns(result.columns)
                setCurrentStep(2)
            } else {
                setError(result.error || "Error processing CSV file")
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error occurred")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleReset = () => {
        setFile(null)
        setData([])
        setColumns([])
        setError(null)
        setCurrentStep(1)
    }

    const handleDownloadCSV = (csvData: CSVData[]) => {
        if (!csvData.length) return

        // Convert data to CSV
        const headers = Object.keys(csvData[0]).join(",")
        const rows = csvData.map(row => Object.values(row).join(","))
        const csvContent = [headers, ...rows].join("\n")

        // Create download link
        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "processed_data.csv"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            1
                        </div>
                        <div className="font-medium">Upload & Configure</div>
                    </div>
                    <div className="flex-1 mx-4 border-t border-border"></div>
                    <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            2
                        </div>
                        <div className="font-medium">Results & Download</div>
                    </div>
                </div>
            </div>

            {currentStep === 1 && (
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="flex items-center text-2xl font-extrabold">
                            <Upload className="mr-2 h-5 w-5" />
                            Upload CSV File
                        </CardTitle>
                        <CardDescription className="font-light">
                            Upload your landing page data in CSV format to analyze performance.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="keyEventsName" className="flex items-center text-sm font-medium">
                                        Custom name for "Key events" column
                                        <Tooltip content="Rename the 'Key events' column to match your naming convention">
                                            <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground" />
                                        </Tooltip>
                                    </Label>
                                </div>
                                <Input
                                    id="keyEventsName"
                                    value={keyEventsName}
                                    onChange={(e) => setKeyEventsName(e.target.value)}
                                    placeholder="Key events"
                                    className="font-light"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="csvFile" className="flex items-center text-sm font-medium">
                                    Upload CSV File
                                    <Tooltip content="Select a CSV file that includes columns for Landing page, Sessions, Key events, and Total Revenue">
                                        <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground" />
                                    </Tooltip>
                                </Label>

                                {!file ? (
                                    <div
                                        {...getRootProps()}
                                        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 cursor-pointer transition-colors ${isDragActive
                                            ? "border-primary bg-primary/5"
                                            : "border-border bg-background hover:bg-secondary/50"
                                            }`}
                                    >
                                        <input {...getInputProps()} id="csvFile" />
                                        <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                                        {isDragActive ? (
                                            <p className="text-sm text-muted-foreground text-center font-light">
                                                Drop the CSV file here...
                                            </p>
                                        ) : (
                                            <div className="space-y-2 text-center">
                                                <p className="text-sm text-muted-foreground font-light">
                                                    Drag and drop your CSV file here or click to browse
                                                </p>
                                                <p className="text-xs text-muted-foreground font-light">
                                                    Your file should include columns for Landing page, Sessions, Key events, and Total Revenue
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                                        <ClipboardCheck className="h-8 w-8 text-primary" />
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">{file.name}</p>
                                            <p className="text-xs text-muted-foreground font-light">
                                                {formatBytes(file.size)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setFile(null)}
                                        >
                                            <FileX className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm font-light">
                                    {error}
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="ghost" onClick={handleReset} disabled={!file || isProcessing}>
                            Reset
                        </Button>
                        <Button
                            onClick={handleProcessFile}
                            disabled={!file || isProcessing}
                        >
                            {isProcessing ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Process CSV
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {currentStep === 2 && data.length > 0 && (
                <Card className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center text-2xl font-extrabold">
                                <Check className="mr-2 h-5 w-5 text-green-500" />
                                Processing Complete
                            </CardTitle>
                            <CardDescription className="font-light">
                                Your CSV has been processed and analyzed
                            </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="outline" onClick={handleReset}>
                                Upload Another
                            </Button>
                            <Tooltip content="Download the processed data as a CSV file">
                                <Button onClick={() => handleDownloadCSV(data)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download CSV
                                </Button>
                            </Tooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DataTable data={data} columns={columns} />
                    </CardContent>
                </Card>
            )}
        </>
    )
} 