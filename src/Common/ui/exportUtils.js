/**
 * Enterprise Universal Data Export Utility
 * Standardized exporter for School ERP across all tabular and reporting modules.
 * 
 * Supports:
 * 1. CSV (.csv) with UTF-8 BOM and formula injection neutralization (=, +, -, @, \t, \r).
 * 2. Excel (.xls / .xlsx SpreadsheetML) with structured XML formatting, column widths and data types.
 * 3. PDF (.pdf) via high-fidelity institutional print document with CSS media styles.
 */

import { toast } from 'react-toastify'
import { captureActivityEvent } from '../EmployeeActivityMonitoring/employeeActivityMonitoringData.js'

/**
 * Neutralizes potential CSV injection characters (=, +, -, @, \t, \r)
 * to protect against spreadsheet formula execution when opened in Excel/Calc.
 */
export const sanitizeCsvValue = (val) => {
    if (val === null || val === undefined) return ''
    let str = String(val).trim()
    // If field starts with formula trigger characters, prefix with single quote
    if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str
    }
    // Escape double quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`
}

/**
 * Triggers a real browser file download using Blob URL.
 */
export const downloadFileBlob = (content, fileName, mimeType) => {
    try {
        if (typeof window === 'undefined' || typeof document === 'undefined') return
        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
        console.warn('File download error:', err)
    }
}

/**
 * Formats a clean file basename from title and dates.
 */
export const generateExportFilename = (baseTitle = 'report', extension = 'csv') => {
    const dateStr = new Date().toISOString().split('T')[0]
    const cleanName = String(baseTitle)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
    return `${cleanName}_${dateStr}.${extension}`
}

/**
 * Exports tabular rows to CSV.
 * @param {string} filename 
 * @param {Array<{ key: string, label: string } | string>} columns 
 * @param {Array<Object>} rows 
 */
export const exportToCsv = (filename, columns = [], rows = []) => {
    if (!rows || rows.length === 0) {
        toast.warn('No records match the current filters to export.')
        return false
    }

    const columnDefs = columns.map((col) => {
        if (typeof col === 'string') return { key: col, label: col }
        return { key: col.key, label: col.label || col.key }
    })

    const headerLine = columnDefs.map((col) => sanitizeCsvValue(col.label)).join(',')
    const dataLines = rows.map((row) => {
        return columnDefs
            .map((col) => {
                const cellVal = row?.[col.key] ?? ''
                return sanitizeCsvValue(cellVal)
            })
            .join(',')
    })

    // UTF-8 BOM (\uFEFF) ensures Excel renders characters properly without encoding issues
    const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n')
    const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`

    downloadFileBlob(csvContent, finalFilename, 'text/csv;charset=utf-8;')
    toast.success(`Exported ${rows.length} record${rows.length === 1 ? '' : 's'} to CSV (${finalFilename})`)
    return true
}

/**
 * Exports tabular rows to Excel (.xls XML / SpreadsheetML).
 * @param {string} filename 
 * @param {Array<{ key: string, label: string } | string>} columns 
 * @param {Array<Object>} rows 
 * @param {string} sheetName 
 */
export const exportToExcel = (filename, columns = [], rows = []) => {
    if (!rows || rows.length === 0) {
        toast.warn('No records match the current filters to export.')
        return false
    }

    const columnDefs = columns.map((col) => {
        if (typeof col === 'string') return { key: col, label: col }
        return { key: col.key, label: col.label || col.key }
    })

    const escapeXml = (unsafe) => {
        if (unsafe === null || unsafe === undefined) return ''
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
    }

    const xmlRows = rows.map((row) => {
        const cells = columnDefs.map((col) => {
            const raw = row?.[col.key] ?? ''
            const isNum = typeof raw === 'number' || (!isNaN(raw) && raw !== '' && typeof raw !== 'boolean')
            const cellType = isNum ? 'Number' : 'String'
            return `<Cell><Data ss:Type="${cellType}">${escapeXml(raw)}</Data></Cell>`
        }).join('')
        return `<Row>${cells}</Row>`
    }).join('\n')

    const headerCells = columnDefs.map((col) => {
        return `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(col.label)}</Data></Cell>`
    }).join('')
    const headerRow = `<Row>${headerCells}</Row>`

    const excelTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Records">
  <Table ss:DefaultRowHeight="20">
   ${columnDefs.map(() => '<Column ss:AutoFitWidth="1" ss:Width="140"/>').join('\n')}
   ${headerRow}
   ${xmlRows}
  </Table>
 </Worksheet>
</Workbook>`

    const finalFilename = filename.endsWith('.xls') || filename.endsWith('.xlsx')
        ? filename
        : `${filename}.xls`

    downloadFileBlob(excelTemplate, finalFilename, 'application/vnd.ms-excel;charset=utf-8')
    toast.success(`Exported ${rows.length} record${rows.length === 1 ? '' : 's'} to Excel (${finalFilename})`)
    return true
}

/**
 * Opens a formatted print preview designed to produce clean institutional PDFs.
 * @param {string} title 
 * @param {string} subtitle 
 * @param {Array<{ key: string, label: string } | string>} columns 
 * @param {Array<Object>} rows 
 * @param {Object} metadata 
 */
export const exportToPdf = (title = 'Institutional Report', subtitle = '', columns = [], rows = [], metadata = {}) => {
    if (!rows || rows.length === 0) {
        toast.warn('No records match the current filters to export.')
        return false
    }

    const columnDefs = columns.map((col) => {
        if (typeof col === 'string') return { key: col, label: col }
        return { key: col.key, label: col.label || col.key }
    })

    const escapeHtml = (unsafe) => {
        if (unsafe === null || unsafe === undefined) return ''
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
    }

    const tableHeadersHtml = columnDefs
        .map(
            (c) =>
                `<th style="border:1px solid #cbd5e1;padding:8px 10px;background:#f8fafc;text-align:left;font-size:11px;font-weight:600;color:#0f172a;white-space:nowrap;">${escapeHtml(
                    c.label
                )}</th>`
        )
        .join('')

    const tableRowsHtml = rows
        .map((row, idx) => {
            const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc'
            const cells = columnDefs
                .map(
                    (col) =>
                        `<td style="border:1px solid #e2e8f0;padding:6px 10px;font-size:11px;color:#334155;">${escapeHtml(
                            row?.[col.key] ?? '—'
                        )}</td>`
                )
                .join('')
            return `<tr style="background:${bg};">${cells}</tr>`
        })
        .join('')

    const metaItems = Object.entries(metadata)
        .map(([k, v]) => `<span style="margin-right:16px;"><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</span>`)
        .join('')

    const html = `<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)} - School ERP Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; margin: 0; background: #fff; }
        .header { border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 16px; }
        h1 { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; color: #0f172a; }
        p.subtitle { font-size: 12px; color: #64748b; margin: 0; }
        .meta { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-bottom: 16px; font-size: 11px; color: #475569; background: #f1f5f9; padding: 8px 12px; border-radius: 6px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
        @media print {
            @page { margin: 12mm; size: landscape; }
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
    </div>
    <div class="meta">
        <span><strong>Generated:</strong> ${new Date().toLocaleString()}</span>
        <span><strong>Total Records:</strong> ${rows.length}</span>
        ${metaItems}
    </div>
    <table>
        <thead><tr>${tableHeadersHtml}</tr></thead>
        <tbody>${tableRowsHtml}</tbody>
    </table>
    <div class="footer">
        <span>School ERP Institutional Intelligence</span>
        <span>Page 1 of 1</span>
    </div>
</body>
</html>`

    if (typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank', 'width=1000,height=750')
        if (printWindow) {
            printWindow.document.write(html)
            printWindow.document.close()
            printWindow.focus()
            setTimeout(() => {
                printWindow.print()
            }, 300)
            toast.info(`Generated printable PDF dossier for "${title}"`)
            return true
        } else {
            window.print()
            return true
        }
    }
    return false
}

/**
 * Universal export dispatcher.
 * Supports both function signatures:
 * 1. exportDataset(format, { title, subtitle, columns, rows, metadata, filename })
 * 2. exportDataset({ data, columns, format, filename, title, subtitle, metadata })
 */
export const exportDataset = (arg1 = 'excel', arg2 = {}) => {
    let format = 'excel'
    let options = {}

    if (typeof arg1 === 'object' && arg1 !== null) {
        options = arg1
        format = arg1.format || 'excel'
    } else {
        format = arg1
        options = arg2 || {}
    }

    const title = options.title || 'Data Export'
    const subtitle = options.subtitle || ''
    const filename = options.filename || null
    const columns = options.columns || []
    const rows = options.rows || options.data || []
    const metadata = options.metadata || {}

    const effectiveFilename = filename || generateExportFilename(title, format === 'excel' ? 'xls' : 'csv')

    let success = false
    switch (format.toLowerCase()) {
        case 'csv':
            success = exportToCsv(effectiveFilename, columns, rows)
            break
        case 'excel':
        case 'xlsx':
        case 'xls':
            success = exportToExcel(effectiveFilename, columns, rows)
            break
        case 'pdf':
            success = exportToPdf(title, subtitle, columns, rows, metadata)
            break
        default:
            toast.error(`Unsupported export format: ${format}`)
            return false
    }

    if (success) {
        try {
            captureActivityEvent({
                action: 'EXPORT',
                activityType: 'Download / Export',
                title: `Exported Dataset: ${title}`,
                description: `Exported ${rows.length} records in ${format.toUpperCase()} format (${effectiveFilename}).`,
                moduleRef: 'Data Export Engine',
                referenceId: `EXP-${Date.now().toString(36).toUpperCase()}`,
                statusBefore: '-',
                statusAfter: 'Completed',
                updatedValues: { format, recordCount: rows.length, filename: effectiveFilename }
            })
        } catch {
            /* ignore */
        }
    }
    return success
}
