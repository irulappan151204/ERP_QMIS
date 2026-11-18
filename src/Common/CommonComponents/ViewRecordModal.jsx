import React from 'react'
import { X, Eye, Printer } from 'lucide-react'

export default function ViewRecordModal({ isOpen, onClose, title = 'Record Details', data, record }) {
    const rawData = data || record
    if (!isOpen || !rawData) return null

    const entries = Array.isArray(rawData)
        ? rawData
        : Object.entries(rawData || {}).map(([key, val]) => ({
            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
            value: typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '—'),
        }))

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-indigo-50 text-[var(--erp-indigo)] flex items-center justify-center">
                            <Eye size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">{title}</h3>
                            <p className="text-xs text-slate-500">Official enterprise record overview</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Details Grid */}
                <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {entries.map((item, idx) => (
                            <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                    {item.label}
                                </span>
                                <span className="text-sm font-bold text-slate-800 mt-1 block break-words">
                                    {item.value || '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 bg-slate-50/30">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                    >
                        <Printer size={13} />
                        Print Record
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-[#3F46C7] text-white text-xs font-semibold hover:bg-[#3038A8] transition shadow-xs cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
