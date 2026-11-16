import React, { useState, useEffect, useMemo } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react'
import { toast } from 'react-toastify'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    ATTENDANCE_LIST,
    ATTENDANCE_STATUSES,
    CLASSES,
    SECTIONS,
    statusBadgeColor,
    inOutStatusBadgeColor,
} from './attendanceData'
import { syncEsslDevices } from '../../../Common/AttendanceAndLeave/esslBiometricEngine'

const CLASS_ATTENDANCE_STORAGE_KEY = 'schoolerp-class-attendance-records'

const ClassAttendance = () => {
    const [records, setRecords] = useState(() => {
        try {
            if (typeof localStorage !== 'undefined') {
                const stored = localStorage.getItem(CLASS_ATTENDANCE_STORAGE_KEY)
                if (stored) {
                    const parsed = JSON.parse(stored)
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed
                }
            }
        } catch {
            /* ignore */
        }
        return ATTENDANCE_LIST
    })
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [search, setSearch] = useState('')
    const [classFilter, setClassFilter] = useState('')
    const [sectionFilter, setSectionFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [entriesPerPage, setEntriesPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        const handleSync = () => {
            try {
                if (typeof localStorage !== 'undefined') {
                    const stored = localStorage.getItem(CLASS_ATTENDANCE_STORAGE_KEY)
                    if (stored) {
                        const parsed = JSON.parse(stored)
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setRecords(parsed)
                        }
                    }
                }
            } catch {
                /* ignore */
            }
        }
        window.addEventListener('schoolerp-student-attendance-sync', handleSync)
        return () => window.removeEventListener('schoolerp-student-attendance-sync', handleSync)
    }, [])

    const handleClearFilters = () => {
        setSearch('')
        setClassFilter('')
        setSectionFilter('')
        setStatusFilter('')
        setCurrentPage(1)
    }

    const handleSyncBiometric = () => {
        const res = syncEsslDevices()
        try {
            const stored = localStorage.getItem(CLASS_ATTENDANCE_STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setRecords(parsed)
                }
            }
        } catch {
            /* ignore */
        }
        toast.success(`Biometric sync complete (${res.totalPunchesProcessed || 0} punches processed).`)
    }

    const filteredRecords = useMemo(() => {
        return records.filter((record) => {
            if (search) {
                const q = search.toLowerCase()
                const matchesSearch =
                    (record.studentId && record.studentId.toLowerCase().includes(q)) ||
                    (record.studentName && record.studentName.toLowerCase().includes(q))
                if (!matchesSearch) return false
            }
            if (classFilter && String(record.className) !== String(classFilter)) {
                return false
            }
            if (sectionFilter && String(record.section).toUpperCase() !== String(sectionFilter).toUpperCase()) {
                return false
            }
            if (statusFilter && record.attendanceStatus !== statusFilter) {
                return false
            }
            return true
        })
    }, [records, search, classFilter, sectionFilter, statusFilter])

    const totalEntries = filteredRecords.length
    const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1
    const paginatedRecords = useMemo(() => {
        const start = (currentPage - 1) * entriesPerPage
        return filteredRecords.slice(start, start + entriesPerPage)
    }, [filteredRecords, currentPage, entriesPerPage])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={handleClearFilters}
                            className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                        >
                            Clear Filters
                        </button>
                        <button
                            type='button'
                            onClick={handleSyncBiometric}
                            className='inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-1.5 rounded-lg transition-all cursor-pointer font-medium'
                        >
                            <RefreshCw size={14} />
                            Sync eSSL Biometric
                        </button>
                    </div>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            placeholder='Student ID, name...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='class-filter' className='text-base font-medium text-[#808080]'>Class</label>
                        <select
                            id='class-filter'
                            value={classFilter}
                            onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {CLASSES.map((item) => (
                                <option key={item} value={item}>Class {item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='section-filter' className='text-base font-medium text-[#808080]'>Section</label>
                        <select
                            id='section-filter'
                            value={sectionFilter}
                            onChange={(e) => { setSectionFilter(e.target.value); setCurrentPage(1); }}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {SECTIONS.map((item) => (
                                <option key={item} value={item}>Section {item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status-filter' className='text-base font-medium text-[#808080]'>Attendance Status</label>
                        <select
                            id='status-filter'
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {ATTENDANCE_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='date' className='text-base font-medium text-[#808080]'>Date</label>
                        <div className='relative'>
                            <DatePicker
                                selected={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                                className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                                dateFormat='dd-MM-yyyy'
                            />
                            <Calendar className='absolute right-2 top-2.5 size-4 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex items-end'>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                        >
                            <Download size={16} />
                            Export Report
                        </button>
                    </div>
                </div>

                <div className='flex gap-x-2 items-center my-4'>
                    <select
                        value={entriesPerPage}
                        onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'
                    >
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                        <option value='40'>40</option>
                        <option value='50'>50</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Student ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Student Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Section</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Attendance Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>In & out Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='px-4 py-8 text-center text-slate-500 font-medium'>
                                        No student attendance records match the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((record) => (
                                    <tr key={record.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.studentId}</td>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{record.studentName}</td>
                                        <td className='px-2 py-4'>{record.className}</td>
                                        <td className='px-2 py-4'>{record.section}</td>
                                        <td className='px-2 py-4'>{record.time || '—'}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[record.attendanceStatus] || 'bg-slate-100 text-slate-700'}`}>
                                                {record.attendanceStatus}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 rounded-e-lg'>
                                            {!record.inOutStatus || record.inOutStatus === '—' ? (
                                                '—'
                                            ) : (
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${inOutStatusBadgeColor[record.inOutStatus] || 'bg-slate-100 text-slate-700'}`}>
                                                    {record.inOutStatus}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing {totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} to {Math.min(currentPage * entriesPerPage, totalEntries)} of {totalEntries} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button
                        type='button'
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={`size-8 flex justify-center items-center p-2 rounded-full cursor-pointer ${
                            currentPage <= 1
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : 'bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white'
                        }`}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className='px-3 py-1 text-sm font-medium text-[#515DEF] flex items-center'>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        type='button'
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={`size-8 flex justify-center items-center p-2 rounded-full cursor-pointer ${
                            currentPage >= totalPages
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : 'bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white'
                        }`}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default ClassAttendance
