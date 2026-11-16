import React from 'react'
import { XCircle, AlertCircle, Calendar, User } from 'lucide-react'

const RejectionAlertBanner = ({
    reason,
    rejectedBy = 'Approver',
    rejectedAt,
    className = '',
}) => {
    if (!reason && !rejectedBy) return null

    return (
        <div
            className={`rounded-2xl border border-rose-200 bg-rose-50/90 p-4 shadow-xs text-rose-900 ${className}`}
            role="alert"
        >
            <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-xl bg-rose-100 text-rose-600 shrink-0 mt-0.5">
                    <XCircle size={18} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                            Request Rejected
                        </span>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-rose-950">
                        {reason || 'No specific rationale provided.'}
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-rose-700">
                        {rejectedBy && (
                            <span className="flex items-center gap-1">
                                <User size={13} className="text-rose-500" />
                                Rejected by: <strong>{rejectedBy}</strong>
                            </span>
                        )}
                        {rejectedAt && (
                            <span className="flex items-center gap-1">
                                <Calendar size={13} className="text-rose-500" />
                                Date: <strong>{rejectedAt}</strong>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RejectionAlertBanner
