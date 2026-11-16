import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import {
    getJdRequests,
    getJdRequestById,
    updateJdRequestStatus,
    statusBadgeColor,
    requestTypeBadgeColor,
    formatAmount,
    BUDGET_THRESHOLD,
} from './requestApprovalData'
import { RejectRequestModal, RejectionAlertBanner } from '../../../Common/ui'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value}</span>
    </div>
)

const ViewRequestApproval = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const requestId = searchParams.get('requestId')
    const [request, setRequest] = useState(() => getJdRequestById(requestId) ?? getJdRequests()[0])
    const [showRejectModal, setShowRejectModal] = useState(false)

    useEffect(() => {
        const item = getJdRequestById(requestId)
        if (item) setRequest(item)
    }, [requestId])

    const isFinancial = request?.requestType === 'Financial Request'

    const handleApprove = () => {
        const updated = updateJdRequestStatus(
            request.requestId,
            'Approved',
            'Approved by Joint Director Operations',
            'Joint Director'
        )
        if (updated) {
            setRequest(updated)
            toast.success(`Request ${request.requestId} approved successfully!`)
        }
    }

    const handleRejectConfirm = ({ reason }) => {
        const updated = updateJdRequestStatus(
            request.requestId,
            'Rejected',
            reason,
            'Joint Director'
        )
        if (updated) {
            setRequest(updated)
            setShowRejectModal(false)
            toast.info(`Request ${request.requestId} rejected with recorded rationale.`)
        }
    }

    if (!request) {
        return (
            <div className='p-6 bg-white rounded-2xl shadow text-center'>
                <p className='text-gray-500'>Request not found.</p>
                <button
                    type='button'
                    onClick={() => navigate('/joint-director/request-approvals')}
                    className='mt-4 px-4 py-2 bg-[#515DEF] text-white rounded-lg text-sm'
                >
                    Back to List
                </button>
            </div>
        )
    }

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/joint-director/request-approvals')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>

                {request.status === 'Pending' && (
                    <div className='flex flex-wrap gap-2'>
                        <button
                            type='button'
                            onClick={handleApprove}
                            className='inline-flex items-center gap-1.5 bg-[#4CAF50] text-white text-sm px-5 py-2 rounded-lg hover:opacity-90 transition-all cursor-pointer font-medium shadow-sm'
                        >
                            <CheckCircle size={16} />
                            Approve
                        </button>
                        <button
                            type='button'
                            onClick={() => setShowRejectModal(true)}
                            className='inline-flex items-center gap-1.5 bg-[#FF0000] text-white text-sm px-5 py-2 rounded-lg hover:opacity-90 transition-all cursor-pointer font-medium shadow-sm'
                        >
                            <XCircle size={16} />
                            Reject
                        </button>
                    </div>
                )}
            </div>

            {/* Dedicated Rejection Alert Banner if Rejected */}
            {request.status === 'Rejected' && (
                <RejectionAlertBanner
                    reason={request.rejectionReason}
                    rejectedBy={request.rejectedBy || 'Joint Director'}
                    rejectedAt={request.rejectedAt}
                />
            )}

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <div className='flex flex-wrap items-center gap-2 mb-2'>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${requestTypeBadgeColor[request.requestType]}`}>
                                {request.requestType}
                            </span>
                        </div>
                        <h1 className='text-2xl font-semibold text-black'>{request.requestId}</h1>
                        <p className='text-sm text-[#667085] mt-1'>{request.purpose}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap self-start ${statusBadgeColor[request.status]}`}>
                        {request.status}
                    </span>
                </div>
            </div>

            <Section title='Request information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Request ID' value={request.requestId} />
                    <Field label='Request type' value={request.requestType} />
                    <Field label='Request date' value={request.requestDate} />
                    <Field label='Status' value={request.status} />
                    <Field label='Requested by' value={request.requestedBy} />
                    <Field label='Department' value={request.department} />
                    {isFinancial && (
                        <>
                            <Field
                                label='Requested amount'
                                value={
                                    <span>
                                        {formatAmount(request.requestedAmount)}
                                        {request.exceedsBudget && (
                                            <span className='block text-xs text-[#FF9800] mt-1 font-semibold'>
                                                Exceeds budget threshold of {formatAmount(BUDGET_THRESHOLD)}
                                            </span>
                                        )}
                                    </span>
                                }
                            />
                            <Field label='Budget status' value={request.exceedsBudget ? 'Over budget' : 'Within budget'} />
                            <Field label='Items / Breakdown' value={request.items ?? '—'} />
                        </>
                    )}
                    {!isFinancial && (
                        <Field label='General details' value={request.generalDetails ?? '—'} />
                    )}
                    <div className='sm:col-span-2 lg:col-span-3'>
                        <Field label='Purpose & Description' value={request.description ?? request.purpose} />
                    </div>
                    {request.remarks && (
                        <div className='sm:col-span-2 lg:col-span-3'>
                            <Field label='Submission Remarks' value={request.remarks} />
                        </div>
                    )}
                    {request.approverRemarks && (
                        <div className='sm:col-span-2 lg:col-span-3'>
                            <Field label='Approver Remarks' value={request.approverRemarks} />
                        </div>
                    )}
                </div>
            </Section>

            {/* Rejection Modal with Mandatory Rationale */}
            <RejectRequestModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onConfirm={handleRejectConfirm}
                title={`Reject Request ${request.requestId}`}
                itemDescription={`${request.requestType} from ${request.department} (${request.purpose})`}
                confirmLabel='Confirm Rejection'
            />
        </section>
    )
}

export default ViewRequestApproval
