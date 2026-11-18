import React, { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import { Button } from '../../../../Common/ui'
import { inputClass, selectClass, labelClass } from '../../../../Common/ui/formStyles'
import {
    EMPLOYEE_ATTENDANCE,
    filterEmployeeAttendance,
    ROLE_OPTIONS,
    STATUS_OPTIONS,
    statusBadgeColor,
} from './employeeAttendanceData'

const emptyFilters = { search: '', role: '', status: '' }

const EmployeesList = () => {
    const [filters, setFilters] = useState(emptyFilters)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)

    const filteredRecords = useMemo(
        () => filterEmployeeAttendance(EMPLOYEE_ATTENDANCE, filters),
        [filters],
    )

    const clearFilters = () => {
        setFilters(emptyFilters)
        setSelectedDate(new Date())
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4 mb-4'>
                    <Button
                        variant='secondary'
                        size='sm'
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </Button>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <div className='flex flex-col'>
                        <label htmlFor='search' className={labelClass}>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={filters.search}
                            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                            placeholder='Employee ID, name...'
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col'>
                        <label htmlFor='role-filter' className={labelClass}>Role</label>
                        <select
                            id='role-filter'
                            value={filters.role}
                            onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
                            className={selectClass}
                        >
                            <option value=''>All Roles</option>
                            {ROLE_OPTIONS.map((role) => (
                                <option key={role} value={role}>{role}</option>
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
                    <div className='flex flex-col'>
                        <label htmlFor='status-filter' className={labelClass}>Status</label>
                        <select
                            id='status-filter'
                            value={filters.status}
                            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                            className={selectClass}
                        >
                            <option value=''>All Status</option>
                            {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-lg font-bold text-slate-900'>Employee Attendance List</h2>
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
                                <th className='px-4 py-3'>Employee ID</th>
                                <th className='px-4 py-3'>Employee Name</th>
                                <th className='px-4 py-3'>Employee Role</th>
                                <th className='px-4 py-3'>Punch In Time</th>
                                <th className='px-4 py-3'>Out Time</th>
                                <th className='px-4 py-3'>Status</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {filteredRecords.map((record) => (
                                <tr key={record.id} className='hover:bg-slate-50/80 text-slate-700 transition-colors'>
                                    <td className='px-4 py-3.5 font-medium text-slate-900'>{record.employeeId}</td>
                                    <td className='px-4 py-3.5'>{record.employeeName}</td>
                                    <td className='px-4 py-3.5'>{record.role}</td>
                                    <td className='px-4 py-3.5'>{record.punchInTime}</td>
                                    <td className='px-4 py-3.5'>{record.punchOutTime}</td>
                                    <td className='px-4 py-3.5'>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadgeColor[record.status]}`}>
                                            {record.status}
                                        </span>
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

export default EmployeesList
