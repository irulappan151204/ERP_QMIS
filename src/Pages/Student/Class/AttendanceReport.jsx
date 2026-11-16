import React, { useMemo, useState } from 'react'
import { Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import { getStudentAttendanceSummary } from '../../../Common/AttendanceAndLeave/attendanceLeaveData'

const AttendanceReport = () => {
    const { activeStudentId, activeStudent } = useActiveStudent()
    const [selectMonth, setSelectMonth] = useState(new Date())
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [searchTerm, setSearchTerm] = useState('')
    const [entriesPerPage, setEntriesPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(1)
    const [exportModal, setExportModal] = useState(false)

    const summary = useMemo(() => {
        return getStudentAttendanceSummary(activeStudentId || 'STU-2025-1001')
    }, [activeStudentId])

    // Generate monthly logs dynamically for the selected month
    const attendanceLogs = useMemo(() => {
        const year = selectMonth.getFullYear()
        const month = selectMonth.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        const list = []
        for (let d = daysInMonth; d >= 1; d--) {
            const dateObj = new Date(year, month, d)
            const dayOfWeek = dateObj.getDay()
            const dayName = dayNames[dayOfWeek]
            const formattedDate = `${String(d).padStart(2, '0')} ${monthNames[month]} ${year}`

            if (dayOfWeek === 0) {
                list.push({
                    date: formattedDate,
                    status: 'Holiday',
                    day: dayName,
                    remarks: 'Weekend Holiday',
                    timing: '—',
                })
            } else if (dayOfWeek === 6 && d % 2 === 0) {
                list.push({
                    date: formattedDate,
                    status: 'Holiday',
                    day: dayName,
                    remarks: 'Second / Fourth Saturday Institutional Holiday',
                    timing: '—',
                })
            } else if (d === 14 || d === 22) {
                list.push({
                    date: formattedDate,
                    status: 'Absent',
                    day: dayName,
                    remarks: d === 14 ? 'Medical Leave — Doctor Certificate Submitted' : 'Unnotified Leave',
                    timing: '—',
                })
            } else if (d === 7) {
                list.push({
                    date: formattedDate,
                    status: 'Late Arrival',
                    day: dayName,
                    remarks: 'Late Bus Transit Entry (09:12 AM)',
                    timing: '09:15 AM - 03:45 PM',
                })
            } else {
                list.push({
                    date: formattedDate,
                    status: 'Present',
                    day: dayName,
                    remarks: 'Regular Academic Day — Full Day Attended',
                    timing: '08:30 AM - 03:30 PM',
                })
            }
        }
        return list
    }, [selectMonth])

    const filteredLogs = useMemo(() => {
        return attendanceLogs.filter((item) => {
            if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
            if (searchTerm.trim()) {
                const q = searchTerm.toLowerCase()
                return (
                    item.date.toLowerCase().includes(q) ||
                    item.day.toLowerCase().includes(q) ||
                    item.remarks.toLowerCase().includes(q)
                )
            }
            return true
        })
    }, [attendanceLogs, statusFilter, searchTerm])

    const totalPages = Math.ceil(filteredLogs.length / entriesPerPage) || 1
    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * entriesPerPage
        return filteredLogs.slice(start, start + entriesPerPage)
    }, [filteredLogs, currentPage, entriesPerPage])

    const handleClearFilters = () => {
        setSelectMonth(new Date())
        setStatusFilter('ALL')
        setSearchTerm('')
        setCurrentPage(1)
    }

    const badgeStyle = {
        Present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Absent: 'bg-red-50 text-red-700 border-red-200',
        'Late Arrival': 'bg-amber-50 text-amber-700 border-amber-200',
        Holiday: 'bg-slate-100 text-slate-700 border-slate-200',
    }

    return (
        <section className='space-y-6'>
            {/* Filter Card */}
            <div className='bg-white rounded-2xl shadow-md p-5'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end'>
                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-bold text-slate-600 uppercase'>Select Month</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={selectMonth}
                                onChange={(date) => {
                                    setSelectMonth(date || new Date())
                                    setCurrentPage(1)
                                }}
                                dateFormat='MMMM yyyy'
                                showMonthYearPicker
                                className='w-full text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:border-[#515DEF]'
                            />
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
                            />
                        </div>
                    </div>

                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-bold text-slate-600 uppercase'>Status Filter</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value)
                                setCurrentPage(1)
                            }}
                            className='text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 w-full bg-white focus:outline-none focus:border-[#515DEF]'
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late Arrival">Late Arrival</option>
                            <option value="Holiday">Holiday</option>
                        </select>
                    </div>

                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white flex items-center gap-x-2 justify-center uppercase text-xs font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all cursor-pointer'
                    >
                        <Download className='w-4 h-4' />
                        Export Log
                    </button>

                    <button
                        type='button'
                        onClick={handleClearFilters}
                        className='bg-slate-100 text-slate-700 uppercase text-xs font-bold px-6 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer'
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Attendance Roster Table */}
            <div className='bg-white rounded-2xl shadow-md p-5 space-y-4'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                    <div>
                        <h2 className='text-lg font-bold text-slate-900'>
                            Daily Attendance Ledger — {selectMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </h2>
                        <p className='text-xs text-slate-500'>
                            Official biometric and roll-call records for student: <strong className='text-slate-800'>{activeStudent?.name || summary?.studentName || 'Student'}</strong>
                        </p>
                    </div>

                    <div className='flex items-center gap-2'>
                        <span className='text-xs text-slate-500'>Rows per page:</span>
                        <select
                            value={entriesPerPage}
                            onChange={(e) => {
                                setEntriesPerPage(Number(e.target.value))
                                setCurrentPage(1)
                            }}
                            className='px-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-700'
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={30}>30</option>
                        </select>
                    </div>
                </div>

                <div className="relative overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-[#EDEEF5] text-slate-700 uppercase text-[10px] font-bold">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3">Day</th>
                                <th className="px-4 py-3">Class Timing</th>
                                <th className="px-4 py-3">Attendance Remarks</th>
                            </tr>
                        </thead>

                        <tbody className='divide-y divide-slate-100 font-medium'>
                            {paginatedLogs.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-4 py-3.5 font-bold text-slate-900">{row.date}</td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle[row.status] || 'bg-slate-100 text-slate-700'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-600">{row.day}</td>
                                    <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">{row.timing}</td>
                                    <td className="px-4 py-3.5 text-slate-700">{row.remarks}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500'>
                    <p>
                        Showing {(currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, filteredLogs.length)} of {filteredLogs.length} days
                    </p>

                    <div className="flex items-center gap-1.5 self-center">
                        <button
                            type='button'
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="size-7 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className='px-2 font-bold text-slate-800'>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            type='button'
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="size-7 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default AttendanceReport
