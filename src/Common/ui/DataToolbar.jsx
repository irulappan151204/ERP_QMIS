import React, { useState, useRef, useEffect } from 'react'
import { RotateCcw, Search, Download, ChevronDown, FileSpreadsheet, FileText, Printer } from 'lucide-react'

const DataToolbar = ({
    query = '',
    onQueryChange,
    searchLabel = 'Search records',
    searchPlaceholder = 'Search…',
    filters,
    actions,
    onReset,
    onExport,
    exportFormats = ['excel', 'csv', 'pdf'],
    resultCount,
    className = '',
}) => {
    const [exportOpen, setExportOpen] = useState(false)
    const exportRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportRef.current && !exportRef.current.contains(e.target)) {
                setExportOpen(false)
            }
        }
        if (exportOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [exportOpen])

    return (
        <div className={`border-b border-[var(--erp-line)] bg-white px-4 py-4 sm:px-5 ${className}`}>
            <div className='flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between'>
                <div className='flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:flex-wrap md:items-end'>
                    <label className='min-w-0 flex-1 md:max-w-sm'>
                        <span className='sr-only'>{searchLabel}</span>
                        <span className='relative block'>
                            <Search aria-hidden='true' className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--erp-muted)]' size={16} />
                            <input
                                type='search'
                                value={query}
                                onChange={(event) => onQueryChange?.(event.target.value)}
                                placeholder={searchPlaceholder}
                                className='min-h-10 w-full rounded-lg border border-[var(--erp-line-strong)] bg-white py-2 pl-9 pr-3 text-sm text-[var(--erp-ink)]'
                            />
                        </span>
                    </label>
                    {filters}
                    {onReset && (
                        <button type='button' onClick={onReset} className='inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-[var(--erp-indigo)] hover:bg-[#F1F2FF] cursor-pointer'>
                            <RotateCcw aria-hidden='true' size={15} /> Reset
                        </button>
                    )}
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                    {onExport && (
                        <div className='relative' ref={exportRef}>
                            <button
                                type='button'
                                onClick={() => setExportOpen((prev) => !prev)}
                                aria-expanded={exportOpen}
                                className='inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3.5 text-xs font-semibold text-[var(--erp-ink)] hover:bg-slate-50 transition shadow-2xs cursor-pointer'
                            >
                                <Download size={14} className='text-slate-600' />
                                <span>Export</span>
                                <ChevronDown size={13} className='text-slate-400' />
                            </button>
                            {exportOpen && (
                                <div className='absolute right-0 z-50 mt-1.5 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg font-inter'>
                                    {exportFormats.includes('excel') && (
                                        <button
                                            type='button'
                                            onClick={() => {
                                                setExportOpen(false)
                                                onExport('excel')
                                            }}
                                            className='flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer'
                                        >
                                            <FileSpreadsheet size={15} className='text-emerald-600' />
                                            <span>Excel (.xlsx)</span>
                                        </button>
                                    )}
                                    {exportFormats.includes('csv') && (
                                        <button
                                            type='button'
                                            onClick={() => {
                                                setExportOpen(false)
                                                onExport('csv')
                                            }}
                                            className='flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
                                        >
                                            <FileText size={15} className='text-blue-600' />
                                            <span>CSV (.csv)</span>
                                        </button>
                                    )}
                                    {exportFormats.includes('pdf') && (
                                        <button
                                            type='button'
                                            onClick={() => {
                                                setExportOpen(false)
                                                onExport('pdf')
                                            }}
                                            className='flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 cursor-pointer'
                                        >
                                            <Printer size={15} className='text-rose-600' />
                                            <span>PDF / Print</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {actions}
                </div>
            </div>
            {Number.isFinite(resultCount) && <p className='mt-3 text-xs text-[var(--erp-muted)]' aria-live='polite'>{resultCount} matching record{resultCount === 1 ? '' : 's'}</p>}
        </div>
    )
}

export default DataToolbar
