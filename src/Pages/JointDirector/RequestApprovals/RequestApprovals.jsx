import React, { useState, useEffect, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    EllipsisIcon,
    IndianRupee,
    Download,
    RotateCcw,
    Plus,
    CheckCircle,
    XCircle,
} from 'lucide-react'
import { toast } from 'react-toastify'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    getJdRequests,
    updateJdRequestStatus,
    REQUEST_TYPES,
    statusBadgeColor,
    requestTypeBadgeColor,
    formatAmount,
} from './requestApprovalData'
import { RejectRequestModal } from '../../../Common/ui'

const RequestApprovals = () => {
    const [requests, setRequests] = useState(() => getJdRequests())
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [entriesPerPage, setEntriesPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(1)
    const [exportModal, setExportModal] = useState(false)

    // Rejection modal
    const [rejectTarget, setRejectTarget] = useState(null)
    const [showRejectModal, setShowRejectModal] = useState(false)

    const loadData = () => {
        setRequests(getJdRequests())
    }

    useEffect(() => {
        loadData()
        const handleUpdate = () => loadData()
        window.addEventListener('jd_requests_updated', handleUpdate)
        window.addEventListener('storage', handleUpdate)
        return () => {
            window.removeEventListener('jd_requests_updated', handleUpdate)
            window.removeEventListener('storage', handleUpdate)
        }
    }, [])

    const handleClearFilters = () => {
        setSearchQuery('')
        setTypeFilter('')
        setStatusFilter('')
        setFromDate(null)
        setToDate(null)
        setCurrentPage(1)
    }

    const filteredRequests = useMemo(() => {
        return requests.filter((req) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const match =
                    req.requestId?.toLowerCase().includes(q) ||
                    req.purpose?.toLowerCase().includes(q) ||
                    req.requestedBy?.toLowerCase().includes(q) ||
                    req.department?.toLowerCase().includes(q)
                if (!match) return false
            }
            if (typeFilter && req.requestType !== typeFilter) return false
            if (statusFilter && req.status.toLowerCase() !== statusFilter.toLowerCase()) return false
            return true
        })
    }, [requests, searchQuery, typeFilter, statusFilter, fromDate, toDate])

    const totalPages = Math.ceil(filteredRequests.length / entriesPerPage) || 1
    const paginatedRequests = useMemo(() => {
        const start = (currentPage - 1) * entriesPerPage
        return filteredRequests.slice(start, start + entriesPerPage)
    }, [filteredRequests, currentPage, entriesPerPage])

    const handleQuickApprove = (req) => {
        updateJdRequestStatus(req.requestId, 'Approved', 'Approved via Joint Director Portal', 'Joint Director')
        loadData()
        toast.success(`Request ${req.requestId} approved successfully!`)
    }

    const handleRejectClick = (req) => {
        setRejectTarget(req)
        setShowRejectModal(true)
    }

    const handleConfirmReject = ({ reason }) => {
        if (!rejectTarget) return
        updateJdRequestStatus(rejectTarget.requestId, 'Rejected', reason, 'Joint Director')
        loadData()
        setShowRejectModal(false)
        setRejectTarget(null)
        toast.info(`Request ${rejectTarget.requestId} rejected with documented rationale.`)
    }

    return (
        <section className='space-y-6 pb-12'>
            {/* Filter Section */}
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={handleClearFilters}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white uppercase text-xs font-semibold px-4 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer shadow-sm'
                    >
                        <RotateCcw size={14} />
                        Clear Filters
                    </button>
                    <span className='text-xs font-medium text-gray-500'>
                        {filteredRequests.length} requests matching filters
                    </span>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:mt-6 mt-3'>
                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-semibold text-gray-600'>Search</label>
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            placeholder='ID, purpose, department...'
                            className='text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#515DEF]'
                        />
                    </div>

                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-semibold text-gray-600'>Request Type</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value)
                                setCurrentPage(1)
                            }}
                            className='text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#515DEF]'
                        >
                            <option value=''>All Types</option>
                            {REQUEST_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-semibold text-gray-600'>Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value)
                                setCurrentPage(1)
                            }}
                            className='text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#515DEF]'
                        >
                            <option value=''>All Statuses</option>
                            <option value='pending'>Pending</option>
                            <option value='approved'>Approved</option>
                            <option value='rejected'>Rejected</option>
                        </select>
                    </div>

                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-semibold text-gray-600'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => {
                                    setFromDate(date)
                                    setCurrentPage(1)
                                }}
                                isClearable
                                placeholderText='Start Date'
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-[#515DEF]'
                            />
                            <Calendar
                                size={15}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
                            />
                        </div>
                    </div>

                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-semibold text-gray-600'>To</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => {
                                    setToDate(date)
                                    setCurrentPage(1)
                                }}
                                isClearable
                                placeholderText='End Date'
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-[#515DEF]'
                            />
                            <Calendar
                                size={15}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* List Table Card */}
            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div>
                        <h2 className='text-xl font-bold text-gray-900'>Request Approvals List</h2>
                        <p className='text-xs text-gray-500 mt-0.5'>
                            Inter-departmental approvals and procurement sanctions.
                        </p>
                    </div>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2 font-medium shadow-sm'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>

                <div className='flex gap-x-2 items-center my-3'>
                    <select
                        value={entriesPerPage}
                        onChange={(e) => {
                            setEntriesPerPage(Number(e.target.value))
                            setCurrentPage(1)
                        }}
                        className='px-2.5 py-1 text-sm bg-white text-[#515DEF] border border-[#515DEF] rounded-md font-medium'
                    >
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                        <option value='50'>50</option>
                    </select>
                    <span className='text-xs font-medium text-gray-600'>Entries Per Page</span>
                </div>

                <div className='relative overflow-x-auto rounded-lg border border-gray-100'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase rounded-s-lg'>Request ID</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Request Type</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Request Date</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Purpose</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Amount</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Requested By</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Department</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Status</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase text-center rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-100'>
                            {paginatedRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className='text-center py-8 text-gray-500 text-sm'>
                                        No requests found matching your filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                paginatedRequests.map((request) => (
                                    <tr
                                        key={request.requestId}
                                        className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg transition-colors'
                                    >
                                        <td className='px-3 py-4 font-semibold text-[#1E1E1E] rounded-s-lg whitespace-nowrap'>
                                            {request.requestId}
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap'>
                                            <span
                                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${requestTypeBadgeColor[request.requestType]}`}
                                            >
                                                {request.requestType}
                                            </span>
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap'>{request.requestDate}</td>
                                        <td className='px-3 py-4 font-medium text-[#1E1E1E] max-w-xs truncate' title={request.purpose}>
                                            {request.purpose}
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap'>
                                            {request.requestedAmount != null ? (
                                                <>
                                                    <span className='font-semibold text-gray-900'>
                                                        ₹{request.requestedAmount.toLocaleString('en-IN')}
                                                    </span>
                                                    {request.exceedsBudget && (
                                                        <span className='block text-xs text-[#FF9800] mt-0.5 font-medium'>
                                                            Over budget
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className='text-[#808080]'>—</span>
                                            )}
                                        </td>
                                        <td className='px-3 py-4 whitespace-nowrap'>{request.requestedBy}</td>
                                        <td className='px-3 py-4 whitespace-nowrap'>{request.department}</td>
                                        <td className='px-3 py-4 whitespace-nowrap'>
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadgeColor[request.status]}`}
                                            >
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className='px-3 py-4 text-center rounded-e-lg whitespace-nowrap'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={`/joint-director/request-approvals/view-request?requestId=${request.requestId}`}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer block text-sm'
                                                >
                                                    View Details
                                                </NavLink>
                                                {request.status === 'Pending' && (
                                                    <>
                                                        <button
                                                            type='button'
                                                            onClick={() => handleQuickApprove(request)}
                                                            className='w-full text-left p-2 hover:bg-emerald-600 hover:text-white rounded cursor-pointer block text-sm text-emerald-700 font-medium'
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            type='button'
                                                            onClick={() => handleRejectClick(request)}
                                                            className='w-full text-left p-2 hover:bg-red-600 hover:text-white rounded cursor-pointer block text-sm text-red-600 font-medium'
                                                        >
                                                            Reject...
                                                        </button>
                                                    </>
                                                )}
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing {paginatedRequests.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{' '}
                    {Math.min(currentPage * entriesPerPage, filteredRequests.length)} of {filteredRequests.length} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button
                        type='button'
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full text-xs font-semibold'>
                        {currentPage}
                    </span>
                    <button
                        type='button'
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Rejection Modal with Mandatory Rationale */}
            {rejectTarget && (
                <RejectRequestModal
                    isOpen={showRejectModal}
                    onClose={() => {
                        setShowRejectModal(false)
                        setRejectTarget(null)
                    }}
                    onConfirm={handleConfirmReject}
                    title={`Reject Request ${rejectTarget.requestId}`}
                    itemDescription={`${rejectTarget.requestType} from ${rejectTarget.department} (${rejectTarget.purpose})`}
                    confirmLabel='Reject Request'
                />
            )}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default RequestApprovals
