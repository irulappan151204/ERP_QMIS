import React, { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

const RejectRequestModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Reject Request',
    description = 'Please provide a mandatory reason for rejecting this request.',
    requestId = '',
}) => {
    const [reason, setReason] = useState('')
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleConfirm = () => {
        const trimmed = reason.trim()
        if (!trimmed) {
            setError('Please enter a rejection reason.')
            return
        }
        if (trimmed.length < 5) {
            setError('Rejection reason must be at least 5 characters long.')
            return
        }
        setError('')
        onConfirm(trimmed)
        setReason('')
        onClose()
    }

    const handleClose = () => {
        setError('')
        setReason('')
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">{title}</h3>
                            {requestId && (
                                <p className="text-xs font-mono text-slate-500 mt-0.5">ID: {requestId}</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-4 space-y-3">
                    <p className="text-xs text-slate-600">{description}</p>
                    <div>
                        <label htmlFor="rejection-reason" className="block text-xs font-semibold text-slate-700 mb-1">
                            Rejection Rationale / Description <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            id="rejection-reason"
                            rows={3}
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value)
                                if (error) setError('')
                            }}
                            placeholder="Explain why this request is declined (e.g. Budget ceiling exceeded, missing documents, duplicate submission)..."
                            className={`w-full rounded-xl border p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                                error
                                    ? 'border-rose-400 focus:ring-rose-200'
                                    : 'border-slate-200 focus:border-rose-500 focus:ring-rose-100'
                            }`}
                        />
                        {error && (
                            <p className="text-[11px] text-rose-600 mt-1 font-medium">{error}</p>
                        )}
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
                    >
                        Confirm Rejection
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RejectRequestModal
