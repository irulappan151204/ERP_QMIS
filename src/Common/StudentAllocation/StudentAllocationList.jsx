import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon } from 'lucide-react'
import {
    ALLOCATION_STATUSES,
    allocationStatusColor,
    emptyAllocationFilters,
    filterStudentAllocations,
    getAllocationDisplayClass,
    getAllocationDisplayRollNo,
    getAllocationDisplaySection,
    getAllocationProfileImage,
    getPendingApprovalCount,
    getStudentAllocationContext,
    getStudentAllocations,
} from './studentAllocationData'
import Dropdown from '../CommonComponents/Dropdown'
import ExportModal from '../CommonComponents/ExportModal'
import DeleteRequestModal from '../CommonComponents/DeleteRequestModal'
import { Button } from '../ui'
import { inputClass, selectClass, labelClass } from '../ui/formStyles'

const StudentAllocationList = ({
    mode,
    listPath: listPathProp,
    defaultStatusFilter = '',
}) => {
    const location = useLocation()
    const context = getStudentAllocationContext(location.pathname)
    const routePrefix = context.routePrefix
    const isApprover = mode ? mode === 'approver' : context.isApprover
    const listPath = listPathProp ?? context.listPath

    const [records, setRecords] = useState(() => getStudentAllocations())
    const [filters, setFilters] = useState({
        ...emptyAllocationFilters,
        status: defaultStatusFilter,
    })
    const [exportModal, setExportModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)

    const pendingApprovalCount = useMemo(() => getPendingApprovalCount(records), [records])

    const listRecords = useMemo(
        () =>
            isApprover
                ? records.filter((record) => record.allocationStatus !== 'Pending Allocation')
                : records,
        [records, isApprover],
    )

    const filteredRecords = useMemo(
        () => filterStudentAllocations(listRecords, filters),
        [listRecords, filters],
    )

    useEffect(() => {
        setRecords(getStudentAllocations())
    }, [location.key])

    const updateFilter = (key, value) => {
        setFilters((current) => ({ ...current, [key]: value }))
    }

    const clearFilters = () => {
        setFilters(emptyAllocationFilters)
    }

    const exportDescription = (
        <>
            You are exporting {String(filteredRecords.length).padStart(2, '0')} records
            {filters.status ? (
                <>
                    {' '}
                    <span className='text-indigo-600 font-semibold'>( Filtered: Status: {filters.status} )</span>
                </>
            ) : null}
        </>
    )

    const canAllocate = (record) =>
        !isApprover &&
        (record.allocationStatus === 'Pending Allocation' || record.allocationStatus === 'Rejected')

    const canReview = (record) =>
        isApprover && record.allocationStatus === 'Pending Approval'

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5'>
                <p className='text-xs text-slate-500 mb-4'>
                    {routePrefix === '/principal'
                        ? 'Pending students are allocated by the Principal. Choose a class and section to complete allocation.'
                        : isApprover
                          ? 'Review section allocations submitted by Teachers and Coordinators.'
                          : 'Assign enrolled students to a class section and submit for Principal approval.'}
                </p>
                {isApprover && pendingApprovalCount > 0 ? (
                    <button
                        type='button'
                        onClick={() => updateFilter('status', filters.status === 'Pending Approval' ? '' : 'Pending Approval')}
                        className={`mb-4 text-left w-full sm:w-auto rounded-xl border px-4 py-3 transition-all cursor-pointer ${
                            filters.status === 'Pending Approval'
                                ? 'border-[#3F46C7] bg-indigo-50/50 ring-2 ring-[#3F46C7]'
                                : 'border-slate-200 hover:border-[#3F46C7]'
                        }`}
                    >
                        <p className='text-xs font-medium text-slate-500'>Pending approvals</p>
                        <p className='text-2xl font-bold text-slate-900 mt-0.5'>{pendingApprovalCount}</p>
                        <p className='text-xs font-semibold text-[#3F46C7] mt-0.5'>
                            {filters.status === 'Pending Approval' ? 'Filter active — click to clear' : 'Click to filter pending'}
                        </p>
                    </button>
                ) : null}
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-4'>
                    <Button
                        variant='secondary'
                        size='sm'
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </Button>
                    <select className={`w-full md:max-w-xs sm:max-w-full ${selectClass}`}>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4'>
                    <div className='flex flex-col'>
                        <label htmlFor='search' className={labelClass}>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            placeholder='Student, roll no, admission no...'
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col'>
                        <label htmlFor='status' className={labelClass}>Status</label>
                        <select
                            id='status'
                            value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value)}
                            className={selectClass}
                        >
                            <option value=''>All</option>
                            {ALLOCATION_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col'>
                        <label className={labelClass}>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={filters.fromDate}
                                onChange={(date) => updateFilter('fromDate', date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className={inputClass}
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col'>
                        <label className={labelClass}>To</label>
                        <div className='relative'>
                            <DatePicker
                                selected={filters.toDate}
                                onChange={(date) => updateFilter('toDate', date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className={inputClass}
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-lg font-bold text-slate-900'>
                        {isApprover ? 'Student Allocation Approval' : 'Student Allocation'}
                    </h2>
                    <Button
                        variant='secondary'
                        icon={<Download size={15} />}
                        onClick={() => setExportModal(true)}
                    >
                        Export
                    </Button>
                </div>
                <div className='flex gap-x-2 items-center my-3'>
                    <select className='px-2.5 py-1 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-lg'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                    </select>
                    <span className='text-xs font-medium text-slate-500'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto rounded-xl border border-slate-200/80'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-[11px] bg-slate-50/90 text-slate-600 font-semibold uppercase tracking-wider whitespace-nowrap border-b border-slate-200/80'>
                            <tr>
                                <th className='px-4 py-3'>Profile</th>
                                <th className='px-4 py-3'>Student</th>
                                <th className='px-4 py-3'>Roll No</th>
                                <th className='px-4 py-3'>Class</th>
                                <th className='px-4 py-3'>Class Section</th>
                                <th className='px-4 py-3'>Admission Number</th>
                                {isApprover ? (
                                    <>
                                        <th className='px-4 py-3'>Submitted By</th>
                                        <th className='px-4 py-3'>Submitted At</th>
                                    </>
                                ) : null}
                                <th className='px-4 py-3'>Status</th>
                                <th className='px-4 py-3 text-center'>Actions</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={isApprover ? 11 : 9} className='px-4 py-12 text-center text-slate-500'>
                                        {records.length === 0 && !isApprover
                                            ? 'No enrolled students found. Enroll students from the Admission List first.'
                                            : isApprover && filters.status === 'Pending Approval'
                                              ? 'All caught up — no pending allocation approvals.'
                                              : 'No student records match the selected filters.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className='hover:bg-slate-50/80 text-slate-700 transition-colors'>
                                        <td className='px-4 py-3.5'>
                                            <img
                                                src={getAllocationProfileImage(record)}
                                                alt=''
                                                className='w-9 h-9 object-cover rounded-full ring-1 ring-slate-200'
                                            />
                                        </td>
                                        <td className='px-4 py-3.5 font-medium text-slate-900'>{record.studentName}</td>
                                        <td className='px-4 py-3.5'>{getAllocationDisplayRollNo(record)}</td>
                                        <td className='px-4 py-3.5'>{getAllocationDisplayClass(record)}</td>
                                        <td className='px-4 py-3.5'>{getAllocationDisplaySection(record)}</td>
                                        <td className='px-4 py-3.5 font-mono text-xs'>{record.admissionNumber}</td>
                                        {isApprover ? (
                                            <>
                                                <td className='px-4 py-3.5 whitespace-nowrap'>
                                                    {record.submittedBy ? (
                                                        <>
                                                            <span className='block text-slate-900 font-medium'>{record.submittedBy}</span>
                                                            <span className='text-xs text-slate-500'>{record.submittedByRole}</span>
                                                        </>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className='px-4 py-3.5 whitespace-nowrap text-xs text-slate-500'>{record.submittedAt || '—'}</td>
                                            </>
                                        ) : null}
                                        <td className='px-4 py-3.5'>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${allocationStatusColor[record.allocationStatus]}`}>
                                                {record.allocationStatus}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3.5 text-center'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-slate-600' />}>
                                                {canAllocate(record) ? (
                                                    <NavLink
                                                        to={`${listPath}/allocate/${record.id}`}
                                                        className='block w-full text-left p-2 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg cursor-pointer'
                                                    >
                                                        Allocate
                                                    </NavLink>
                                                ) : null}
                                                {canReview(record) ? (
                                                    <NavLink
                                                        to={`${listPath}/review/${record.id}`}
                                                        className='block w-full text-left p-2 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg cursor-pointer'
                                                    >
                                                        Review
                                                    </NavLink>
                                                ) : null}
                                                {(isApprover && !canReview(record)) || (!isApprover && !canAllocate(record)) ? (
                                                    <NavLink
                                                        to={`${listPath}/${isApprover ? 'review' : 'allocate'}/${record.id}`}
                                                        className='block w-full text-left p-2 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg cursor-pointer'
                                                    >
                                                        View
                                                    </NavLink>
                                                ) : null}
                                                <button
                                                    type='button'
                                                    onClick={() => setDeleteRequestModal(true)}
                                                    className='w-full text-left p-2 hover:bg-rose-50 text-rose-700 text-xs font-medium rounded-lg cursor-pointer'
                                                >
                                                    Delete
                                                </button>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className='flex justify-between items-center px-2 mt-4'>
                    <p className='text-xs font-medium text-slate-500'>
                        Showing 1 to {filteredRecords.length} of {filteredRecords.length} entries
                    </p>
                    <div className='flex items-center gap-1.5'>
                        <Button
                            variant='secondary'
                            size='icon-sm'
                            icon={<ChevronLeft size={16} />}
                            disabled
                        />
                        <span className='px-2.5 py-1 text-xs font-bold text-white bg-[#3F46C7] rounded-lg shadow-2xs'>
                            1
                        </span>
                        <Button
                            variant='secondary'
                            size='icon-sm'
                            icon={<ChevronRight size={16} />}
                            disabled
                        />
                    </div>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} exportDescription={exportDescription} />
            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />
        </section>
    )
}

export default StudentAllocationList
