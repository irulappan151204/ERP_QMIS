import React, { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, CheckCircle2 } from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import { Button } from '../../../../Common/ui'
import { inputClass, selectClass, labelClass } from '../../../../Common/ui/formStyles'
import {
    CLASS_OPTIONS,
    filterStudentAttendance,
    SECTION_OPTIONS,
    statusBadgeColor,
    getStoredStudentAttendance,
    saveStoredStudentAttendance,
} from './studentAttendanceData'

const emptyFilters = { search: '', className: '', section: '' }

const StudentsList = () => {
    const [filters, setFilters] = useState(emptyFilters)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [records, setRecords] = useState(() => getStoredStudentAttendance())

    const filteredRecords = useMemo(
        () => filterStudentAttendance(records, filters),
        [records, filters],
    )

    const clearFilters = () => {
        setFilters(emptyFilters)
        setSelectedDate(new Date())
    }

    const toggleStudentStatus = (id) => {
        const updated = records.map((r) => {
            if (r.id === id) {
                const nextStatus = r.status === 'Present' ? 'Absent' : 'Present'
                return {
                    ...r,
                    status: nextStatus,
                    onTime: nextStatus === 'Present' ? '08:15 AM' : '—',
                    outTime: nextStatus === 'Present' ? '03:30 PM' : '—',
                }
            }
            return r
        })
        setRecords(updated)
        saveStoredStudentAttendance(updated)
    }

    const markAllPresent = () => {
        const updated = records.map((r) => ({
            ...r,
            status: 'Present',
            onTime: r.onTime === '—' ? '08:15 AM' : r.onTime,
            outTime: r.outTime === '—' ? '03:30 PM' : r.outTime,
        }))
        setRecords(updated)
        saveStoredStudentAttendance(updated)
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4 mb-4'>
                    <div className='flex items-center gap-2'>
                        <Button
                            variant='secondary'
                            size='sm'
                            onClick={clearFilters}
                        >
                            Clear Filters
                        </Button>
                        <Button
                            variant='success'
                            size='sm'
                            icon={<CheckCircle2 size={15} />}
                            onClick={markAllPresent}
                        >
                            Mark All Present
                        </Button>
                    </div>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <div className='flex flex-col'>
                        <label htmlFor='search' className={labelClass}>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={filters.search}
                            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                            placeholder='Admission no, student name...'
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col'>
                        <label htmlFor='class-filter' className={labelClass}>Class</label>
                        <select
                            id='class-filter'
                            value={filters.className}
                            onChange={(event) => setFilters((current) => ({ ...current, className: event.target.value }))}
                            className={selectClass}
                        >
                            <option value=''>All Classes</option>
                            {CLASS_OPTIONS.map((className) => (
                                <option key={className} value={className}>{className}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col'>
                        <label htmlFor='section-filter' className={labelClass}>Section</label>
                        <select
                            id='section-filter'
                            value={filters.section}
                            onChange={(event) => setFilters((current) => ({ ...current, section: event.target.value }))}
                            className={selectClass}
                        >
                            <option value=''>All Sections</option>
                            {SECTION_OPTIONS.map((section) => (
                                <option key={section} value={section}>{section}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col'>
                        <label className={labelClass}>Date</label>
                        <div className='relative'>
                            <DatePicker
                                selected={selectedDate}
                                onChange={setSelectedDate}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                className={inputClass}
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-lg font-bold text-slate-900'>Student Attendance List</h2>
                    <Button
                        variant='secondary'
                        icon={<Download size={15} />}
                        onClick={() => setExportModal(true)}
                    >
                        Export
                    </Button>
                </div>
                <div className='relative overflow-x-auto rounded-xl border border-slate-200/80'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-[11px] bg-slate-50/90 text-slate-600 font-semibold uppercase tracking-wider whitespace-nowrap border-b border-slate-200/80'>
                            <tr>
                                <th className='px-4 py-3'>Admission No</th>
                                <th className='px-4 py-3'>Student Name</th>
                                <th className='px-4 py-3'>Class</th>
                                <th className='px-4 py-3'>Section</th>
                                <th className='px-4 py-3'>On Time</th>
                                <th className='px-4 py-3'>Out Time</th>
                                <th className='px-4 py-3'>Status</th>
                                <th className='px-4 py-3 text-right'>Action</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {filteredRecords.map((record) => (
                                <tr key={record.id} className='hover:bg-slate-50/80 text-slate-700 transition-colors'>
                                    <td className='px-4 py-3.5 font-medium text-slate-900'>{record.admissionNo}</td>
                                    <td className='px-4 py-3.5'>{record.studentName}</td>
                                    <td className='px-4 py-3.5'>{record.className}</td>
                                    <td className='px-4 py-3.5'>{record.section}</td>
                                    <td className='px-4 py-3.5'>{record.onTime}</td>
                                    <td className='px-4 py-3.5'>{record.outTime}</td>
                                    <td className='px-4 py-3.5'>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadgeColor[record.status]}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className='px-4 py-3.5 text-right'>
                                        <Button
                                            variant='outline'
                                            size='xs'
                                            onClick={() => toggleStudentStatus(record.id)}
                                        >
                                            Toggle Status
                                        </Button>
                                    </td>
                                </tr>
                            ))}
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

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default StudentsList
