import React, { useState } from 'react'
import {
    X,
    CheckCircle2,
    Clock,
    AlertTriangle,
    FileText,
    History,
    Shield,
    Printer,
    Download,
    ExternalLink,
    Tag,
    User,
    Building2,
    Calendar,
    DollarSign
} from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function RecordDetailDrawer({
    isOpen,
    onClose,
    title,
    subtitle,
    recordId,
    status,
    overviewFields = [],
    timelineSteps = [],
    activityEvents = [],
    onPrint,
    actions
}) {
    const [activeTab, setActiveTab] = useState('overview')

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm transition-opacity animate-in fade-in">
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col transform transition ease-in-out duration-300">
                    {/* Drawer Header */}
                    <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 border border-sky-300 px-2 py-0.5 rounded">
                                        {recordId}
                                    </span>
                                    {status && <StatusBadge status={status} />}
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                                {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                {onPrint && (
                                    <button
                                        type="button"
                                        onClick={onPrint}
                                        className="p-2 text-slate-600 hover:text-sky-700 hover:bg-white rounded-lg border border-slate-200 transition"
                                        title="Print / Export View"
                                    >
                                        <Printer className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-slate-200 mt-5 -mb-5 space-x-6">
                            <button
                                type="button"
                                onClick={() => setActiveTab('overview')}
                                className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                                    activeTab === 'overview'
                                        ? 'border-sky-600 text-sky-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <FileText className="w-4 h-4" /> Overview
                            </button>
                            {timelineSteps.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('timeline')}
                                    className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                                        activeTab === 'timeline'
                                            ? 'border-sky-600 text-sky-700'
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <Clock className="w-4 h-4" /> Approvals & Timeline
                                </button>
                            )}
                            {activityEvents.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('activity')}
                                    className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                                        activeTab === 'activity'
                                            ? 'border-sky-600 text-sky-700'
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <History className="w-4 h-4" /> Audit History
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Drawer Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {overviewFields.map((field, idx) => (
                                        <div key={idx} className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{field.label}</p>
                                            <p className="text-sm font-semibold text-slate-900 mt-1 break-words">
                                                {field.value !== undefined && field.value !== null && field.value !== '' ? String(field.value) : '—'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'timeline' && (
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Multi-Tier Lifecycle History</h4>
                                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                    {timelineSteps.map((step, idx) => {
                                        const isDone = step.status === 'Approved' || step.status === 'Completed' || step.status === 'Submitted'
                                        const isReject = step.status === 'Rejected'
                                        return (
                                            <div key={idx} className="relative">
                                                <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-white ${
                                                    isDone ? 'bg-emerald-500' : isReject ? 'bg-rose-500' : 'bg-amber-400'
                                                }`}>
                                                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : isReject ? <X className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                                </div>
                                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-800">{step.tier || step.title}</span>
                                                        <span className="text-[11px] text-slate-400 font-mono">{step.timestamp || step.date}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 mt-1">
                                                        Actor: <strong className="text-slate-800">{step.approver || step.actor || 'System'}</strong>
                                                    </p>
                                                    {step.notes && (
                                                        <p className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                                                            "{step.notes}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entity Telemetry Audit Trail</h4>
                                {activityEvents.map((evt, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sky-800">{evt.action}</span>
                                            <span className="text-slate-400 font-mono">{evt.timestamp}</span>
                                        </div>
                                        <p className="text-slate-700">{evt.description}</p>
                                        <div className="text-[11px] text-slate-500 flex gap-3 pt-1">
                                            <span>User: <strong>{evt.userName}</strong></span>
                                            <span>Role: <strong>{evt.userRole}</strong></span>
                                            <span>Status: <strong className={evt.status === 'SUCCESS' ? 'text-emerald-600' : 'text-amber-600'}>{evt.status}</strong></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Drawer Footer Actions */}
                    {actions && (
                        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
