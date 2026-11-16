import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Truck,
    Fuel,
    Wrench,
    User,
    Calendar,
    Printer,
    FileText,
} from 'lucide-react'
import {
    getRequestById,
    updateRequestStatus,
    statusBadgeColor,
} from './requestApprovalsData'
import { RejectRequestModal, RejectionAlertBanner } from '../../../Common/ui'

const ViewRequest = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [request, setRequest] = useState(null)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [showApproveModal, setShowApproveModal] = useState(false)
    const [approveRemarks, setApproveRemarks] = useState('')
    const [toastMessage, setToastMessage] = useState('')

    const loadRequest = () => {
        if (!id) return
        const found = getRequestById(id)
        setRequest(found)
    }

    useEffect(() => {
        loadRequest()
    }, [id])

    const handleRejectConfirm = ({ reason }) => {
        const updated = updateRequestStatus(
            request.id,
            'Rejected',
            reason,
            'Transport Manager'
        )
        if (updated) {
            setRequest(updated)
            setShowRejectModal(false)
            setToastMessage('Request has been rejected with mandatory rationale recorded.')
            setTimeout(() => setToastMessage(''), 4000)
        }
    }

    const handleApproveConfirm = () => {
        const updated = updateRequestStatus(
            request.id,
            'Approved',
            approveRemarks || 'Approved by Transport Manager',
            'Transport Manager'
        )
        if (updated) {
            setRequest(updated)
            setShowApproveModal(false)
            setToastMessage('Request successfully approved.')
            setTimeout(() => setToastMessage(''), 4000)
        }
    }

    const handleInProcess = () => {
        const updated = updateRequestStatus(
            request.id,
            'In-Process',
            'Assigned to workshop / vendor for processing',
            'Transport Manager'
        )
        if (updated) {
            setRequest(updated)
            setToastMessage('Request marked as In-Process.')
            setTimeout(() => setToastMessage(''), 4000)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    if (!request) {
        return (
            <div className='p-6 bg-white rounded-2xl shadow-sm text-center'>
                <AlertTriangle className='w-12 h-12 text-amber-500 mx-auto mb-3' />
                <h2 className='text-xl font-bold text-gray-800 mb-2'>Request Not Found</h2>
                <p className='text-gray-500 mb-6'>
                    The request with identifier "{id}" does not exist or may have been archived.
                </p>
                <Link
                    to='/transport-manager/request-approvals'
                    className='inline-flex items-center gap-2 px-5 py-2.5 bg-[#515DEF] text-white rounded-lg hover:bg-opacity-90 font-medium text-sm'
                >
                    <ArrowLeft className='w-4 h-4' />
                    Back to Request Approvals
                </Link>
            </div>
        )
    }

    const isFuel = request.type === 'Fuel' || request.requestId?.startsWith('FR')

    return (
        <section className='space-y-6 pb-12'>
            {/* Header */}
            <div className='flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm'>
                <div className='flex items-center gap-3'>
                    <button
                        type='button'
                        onClick={() => navigate('/transport-manager/request-approvals')}
                        className='p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer'
                        title='Back'
                    >
                        <ArrowLeft className='w-5 h-5' />
                    </button>
                    <div>
                        <div className='flex items-center gap-3'>
                            <h1 className='text-2xl font-bold text-gray-900'>
                                {request.requestId || request.id}
                            </h1>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    statusBadgeColor[request.status] || 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                {request.status}
                            </span>
                        </div>
                        <p className='text-sm text-gray-500 mt-0.5 flex items-center gap-2'>
                            <span>{request.type || (isFuel ? 'Fuel' : 'Maintenance')} Request</span>
                            <span>•</span>
                            <span className='flex items-center gap-1'>
                                <Calendar className='w-3.5 h-3.5' />
                                {request.requestDate || request.requestedDate}
                            </span>
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={handlePrint}
                        className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer'
                    >
                        <Printer className='w-4 h-4' />
                        Print Dossier
                    </button>

                    {request.status === 'Pending' && (
                        <>
                            <button
                                type='button'
                                onClick={handleInProcess}
                                className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer'
                            >
                                <Clock className='w-4 h-4' />
                                Mark In-Process
                            </button>
                            <button
                                type='button'
                                onClick={() => setShowRejectModal(true)}
                                className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer'
                            >
                                <XCircle className='w-4 h-4' />
                                Reject
                            </button>
                            <button
                                type='button'
                                onClick={() => setShowApproveModal(true)}
                                className='inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm'
                            >
                                <CheckCircle className='w-4 h-4' />
                                Approve
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Toast Banner */}
            {toastMessage && (
                <div className='p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center justify-between'>
                    <span>{toastMessage}</span>
                    <button
                        type='button'
                        onClick={() => setToastMessage('')}
                        className='text-emerald-700 hover:text-emerald-900 font-bold ml-4'
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Dedicated Rejection Alert Banner if Rejected */}
            {request.status === 'Rejected' && (
                <RejectionAlertBanner
                    reason={request.rejectionReason}
                    rejectedBy={request.rejectedBy || 'Approving Authority'}
                    rejectedAt={request.rejectedAt}
                />
            )}

            {/* Approval Notice Banner if Approved */}
            {request.status === 'Approved' && (
                <div className='p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-start gap-3'>
                    <CheckCircle className='w-5 h-5 text-emerald-600 shrink-0 mt-0.5' />
                    <div>
                        <h4 className='font-semibold text-emerald-900 text-sm'>Request Sanctioned & Approved</h4>
                        <p className='text-xs text-emerald-800 mt-0.5'>
                            Approved by <strong>{request.approvedBy || 'Transport Manager'}</strong>
                            {request.approvedAt && ` on ${request.approvedAt}`}.
                        </p>
                        {request.approverRemarks && (
                            <p className='text-xs text-emerald-800 mt-1 italic'>
                                Note: "{request.approverRemarks}"
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Main Details Grid */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Left 2 Cols: Details */}
                <div className='lg:col-span-2 space-y-6'>
                    {/* Primary Vehicle & Driver Card */}
                    <div className='bg-white p-6 rounded-2xl shadow-sm'>
                        <h3 className='text-base font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                            <Truck className='w-5 h-5 text-[#515DEF]' />
                            Vehicle & Personnel Details
                        </h3>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                            <div className='p-3 bg-gray-50 rounded-xl'>
                                <span className='text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1'>
                                    Vehicle Number
                                </span>
                                <span className='text-base font-semibold text-gray-900'>
                                    {request.vehicleNumber}
                                </span>
                            </div>

                            <div className='p-3 bg-gray-50 rounded-xl'>
                                <span className='text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1'>
                                    {isFuel ? 'Assigned Driver' : 'Reported By'}
                                </span>
                                <span className='text-base font-semibold text-gray-900'>
                                    {request.driverName || request.reportedBy}
                                </span>
                                {request.driverId && (
                                    <span className='text-xs text-gray-500 block mt-0.5'>
                                        ID: {request.driverId}
                                    </span>
                                )}
                            </div>

                            {request.routeName && (
                                <div className='p-3 bg-gray-50 rounded-xl'>
                                    <span className='text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1'>
                                        Assigned Route
                                    </span>
                                    <span className='text-base font-semibold text-gray-900'>
                                        {request.routeName}
                                    </span>
                                </div>
                            )}

                            {request.currentOdometerReading && (
                                <div className='p-3 bg-gray-50 rounded-xl'>
                                    <span className='text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1'>
                                        Odometer Reading
                                    </span>
                                    <span className='text-base font-semibold text-gray-900'>
                                        {request.currentOdometerReading} km
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Operational Details Card */}
                    <div className='bg-white p-6 rounded-2xl shadow-sm'>
                        <h3 className='text-base font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                            {isFuel ? (
                                <Fuel className='w-5 h-5 text-amber-500' />
                            ) : (
                                <Wrench className='w-5 h-5 text-indigo-500' />
                            )}
                            {isFuel ? 'Fuel Requirement Details' : 'Maintenance & Repair Details'}
                        </h3>

                        {isFuel ? (
                            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm'>
                                <div className='p-3 bg-amber-50/60 border border-amber-100 rounded-xl'>
                                    <span className='text-xs font-medium text-amber-800 uppercase tracking-wider block mb-1'>
                                        Requested Quantity
                                    </span>
                                    <span className='text-lg font-bold text-amber-900'>
                                        {request.requestedQuantity}
                                    </span>
                                </div>

                                <div className='p-3 bg-gray-50 rounded-xl'>
                                    <span className='text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1'>
                                        Fuel Type
                                    </span>
                                    <span className='text-base font-semibold text-gray-900'>
                                        {request.fuelType || 'High-Speed Diesel (HSD)'}
                                    </span>
                                </div>

                                <div className='p-3 bg-gray-50 rounded-xl'>
                                    <span className='text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1'>
                                        Estimated Total Cost
                                    </span>
                                    <span className='text-base font-semibold text-gray-900'>
                                        {request.estimatedCost ? `₹${Number(request.estimatedCost).toLocaleString('en-IN')}` : '₹4,700'}
                                    </span>
                                </div>

                                {request.fuelStation && (
                                    <div className='sm:col-span-3 p-3 bg-gray-50 rounded-xl'>
                                        <span className='text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1'>
                                            Designated Fuel Station / Vendor
                                        </span>
                                        <span className='text-sm font-medium text-gray-800'>
                                            {request.fuelStation}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className='space-y-4 text-sm'>
                                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                                    <div className='p-3 bg-gray-50 rounded-xl'>
                                        <span className='text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1'>
                                            Issue Category
                                        </span>
                                        <span className='text-base font-semibold text-gray-900'>
                                            {request.issueType}
                                        </span>
                                    </div>

                                    <div className='p-3 bg-gray-50 rounded-xl'>
                                        <span className='text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1'>
                                            Priority Level
                                        </span>
                                        <span
                                            className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                                                request.priority === 'High'
                                                    ? 'bg-red-100 text-red-700'
                                                    : request.priority === 'Medium'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                            }`}
                                        >
                                            {request.priority}
                                        </span>
                                    </div>

                                    <div className='p-3 bg-gray-50 rounded-xl'>
                                        <span className='text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1'>
                                            Estimated Cost
                                        </span>
                                        <span className='text-base font-semibold text-gray-900'>
                                            {request.estimatedCost
                                                ? `₹${Number(request.estimatedCost).toLocaleString('en-IN')}`
                                                : 'Pending Estimation'}
                                        </span>
                                    </div>
                                </div>

                                <div className='p-4 bg-gray-50 rounded-xl'>
                                    <span className='text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1'>
                                        Detailed Issue Description
                                    </span>
                                    <p className='text-sm text-gray-800 leading-relaxed whitespace-pre-wrap'>
                                        {request.description || 'No detailed description provided.'}
                                    </p>
                                </div>

                                {request.workshop && (
                                    <div className='p-3 bg-gray-50 rounded-xl'>
                                        <span className='text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1'>
                                            Assigned Workshop / Service Centre
                                        </span>
                                        <span className='text-sm font-semibold text-gray-900'>
                                            {request.workshop}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right 1 Col: Audit & Workflow Trail */}
                <div className='space-y-6'>
                    <div className='bg-white p-6 rounded-2xl shadow-sm'>
                        <h3 className='text-base font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                            <FileText className='w-5 h-5 text-gray-600' />
                            Lifecycle & Audit Trail
                        </h3>

                        <ol className='relative border-s border-gray-200 ml-3 space-y-6 text-sm'>
                            {/* Step 1: Created */}
                            <li className='ms-6'>
                                <span className='absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -start-3 ring-8 ring-white'>
                                    <CheckCircle className='w-3.5 h-3.5 text-blue-600' />
                                </span>
                                <h4 className='font-semibold text-gray-900 text-sm'>
                                    Request Submitted
                                </h4>
                                <time className='block mb-1 text-xs font-normal text-gray-400'>
                                    {request.requestDate || request.requestedDate}
                                </time>
                                <p className='text-xs text-gray-600'>
                                    Created by {request.reportedBy || request.driverName || 'Operator'}
                                </p>
                            </li>

                            {/* Step 2: Processing Status */}
                            {request.status !== 'Pending' && (
                                <li className='ms-6'>
                                    <span
                                        className={`absolute flex items-center justify-center w-6 h-6 rounded-full -start-3 ring-8 ring-white ${
                                            request.status === 'Rejected'
                                                ? 'bg-red-100 text-red-600'
                                                : 'bg-emerald-100 text-emerald-600'
                                        }`}
                                    >
                                        {request.status === 'Rejected' ? (
                                            <XCircle className='w-3.5 h-3.5' />
                                        ) : (
                                            <CheckCircle className='w-3.5 h-3.5' />
                                        )}
                                    </span>
                                    <h4 className='font-semibold text-gray-900 text-sm'>
                                        Decision: {request.status}
                                    </h4>
                                    <time className='block mb-1 text-xs font-normal text-gray-400'>
                                        {request.rejectedAt || request.approvedAt || 'Recently updated'}
                                    </time>
                                    <p className='text-xs text-gray-600'>
                                        Actioned by{' '}
                                        <strong>{request.rejectedBy || request.approvedBy || 'Transport Manager'}</strong>
                                    </p>
                                    {request.rejectionReason && (
                                        <div className='mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800'>
                                            <strong>Rationale:</strong> {request.rejectionReason}
                                        </div>
                                    )}
                                    {request.approverRemarks && (
                                        <div className='mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800'>
                                            <strong>Remarks:</strong> {request.approverRemarks}
                                        </div>
                                    )}
                                </li>
                            )}
                        </ol>
                    </div>
                </div>
            </div>

            {/* Rejection Modal with Mandatory Description */}
            <RejectRequestModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onConfirm={handleRejectConfirm}
                title={`Reject Request ${request.requestId || request.id}`}
                itemDescription={`${request.type || 'Transport'} Request for ${request.vehicleNumber}`}
                confirmLabel='Confirm Rejection'
            />

            {/* Approval Modal */}
            {showApproveModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-xl'>
                        <h3 className='text-lg font-bold text-gray-900 mb-2'>
                            Approve Request {request.requestId || request.id}
                        </h3>
                        <p className='text-sm text-gray-600 mb-4'>
                            Sanction this request for vehicle <strong>{request.vehicleNumber}</strong>. You may provide optional remarks or instructions for the driver / workshop.
                        </p>
                        <div className='mb-4'>
                            <label className='block text-xs font-medium text-gray-700 mb-1'>
                                Sanction Remarks (Optional)
                            </label>
                            <textarea
                                value={approveRemarks}
                                onChange={(e) => setApproveRemarks(e.target.value)}
                                rows={3}
                                placeholder='e.g. Approved. Proceed with authorized vendor...'
                                className='w-full text-sm p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#515DEF]'
                            />
                        </div>
                        <div className='flex justify-end gap-3'>
                            <button
                                type='button'
                                onClick={() => setShowApproveModal(false)}
                                className='px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200'
                            >
                                Cancel
                            </button>
                            <button
                                type='button'
                                onClick={handleApproveConfirm}
                                className='px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 font-medium'
                            >
                                Confirm Approval
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default ViewRequest
