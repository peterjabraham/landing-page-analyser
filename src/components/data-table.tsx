"use client"

import React, { useState } from "react"
import {
    ArrowUpDown,
    ChevronDown,
    Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { downloadCSV } from "@/lib/utils"

type SortConfig = {
    key: string
    direction: 'asc' | 'desc'
}

type DataTableProps = {
    data: any[]
    columns: string[]
}

export function DataTable({ data, columns }: DataTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)

    const sortedData = React.useMemo(() => {
        let sortableData = [...data]
        if (sortConfig !== null) {
            sortableData.sort((a, b) => {
                // Handle string comparisons
                if (typeof a[sortConfig.key] === 'string' && typeof b[sortConfig.key] === 'string') {
                    return sortConfig.direction === 'asc'
                        ? a[sortConfig.key].localeCompare(b[sortConfig.key])
                        : b[sortConfig.key].localeCompare(a[sortConfig.key])
                }

                // Handle number comparisons
                if (sortConfig.direction === 'asc') {
                    return a[sortConfig.key] - b[sortConfig.key]
                }
                return b[sortConfig.key] - a[sortConfig.key]
            })
        }
        return sortableData
    }, [data, sortConfig])

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc'

        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }

        setSortConfig({ key, direction })
    }

    const getSortDirectionIcon = (columnName: string) => {
        if (!sortConfig || sortConfig.key !== columnName) {
            return <ArrowUpDown className="ml-2 h-4 w-4" />
        }

        return sortConfig.direction === 'asc'
            ? <ChevronDown className="ml-2 h-4 w-4 rotate-180" />
            : <ChevronDown className="ml-2 h-4 w-4" />
    }

    const handleDownload = () => {
        if (data.length === 0) return

        // Prepare CSV content
        const csvRows = [
            columns.join(','),
            ...data.map(item =>
                columns.map(column =>
                    typeof item[column] === 'string' && item[column].includes(',')
                        ? `"${item[column]}"`
                        : item[column]
                ).join(',')
            )
        ]

        const csvContent = csvRows.join('\n')
        downloadCSV(csvContent, `landing-page-analysis-${new Date().toISOString().split('T')[0]}.csv`)
    }

    return (
        <div className="rounded-md border overflow-hidden">
            <div className="w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column}
                                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                                >
                                    <Button
                                        variant="ghost"
                                        onClick={() => requestSort(column)}
                                        className="flex items-center gap-1 hover:bg-transparent p-0"
                                    >
                                        {column}
                                        {getSortDirectionIcon(column)}
                                    </Button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {sortedData.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="border-b transition-colors hover:bg-muted/50"
                            >
                                {columns.map((column, columnIndex) => (
                                    <td
                                        key={`${rowIndex}-${columnIndex}`}
                                        className="p-4 align-middle"
                                    >
                                        {typeof row[column] === 'number'
                                            ? column === 'Conversion rate'
                                                ? `${row[column]}%`
                                                : row[column]
                                            : row[column]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center justify-end p-4">
                <Button variant="outline" onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download CSV
                </Button>
            </div>
        </div>
    )
} 