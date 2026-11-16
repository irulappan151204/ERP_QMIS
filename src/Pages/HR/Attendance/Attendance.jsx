import React, { useMemo, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { RefreshCw, Users, CheckCircle2, Clock, CalendarX, FileText } from 'lucide-react'
import { employeeName, getAttendance, saveAttendance } from '../domain/hrStore'
import { PageIntro, SearchBox, Select, TableWrap } from '../components/HrUi'
import { matches, useFilters, useHrTick } from '../components/hrUiState'
import { DataTable } from '../../../Common/ui'
import { syncEsslDevices } from '../../../Common/AttendanceAndLeave/esslBiometricEngine'

const Attendance = () => {
    const tick = useHrTick()
    const [localRefresh, setLocalRefresh] = useState(0)

    useEffect(() => {
        const handleHrUpdate = () => {
            setLocalRefresh((v) => v + 1)
        }
        if (typeof window !== 'undefined') {
            window.addEventListener('schoolerp-hr-updated', handleHrUpdate)
            return () => window.removeEventListener('schoolerp-hr-updated', handleHrUpdate)
        }
    }, [])

    const rows = useMemo(() => {
        void tick
        void localRefresh
        return getAttendance()
    }, [tick, localRefresh])

    const availableDates = useMemo(() => {
        const dates = Array.from(new Set(rows.map((r) => r.date).filter(Boolean)))
        return dates.sort()
    }, [rows])

    const { filters, set } = useFilters({ search: '', status: '', date: '' })

    const filtered = useMemo(() => {
        return rows.filter((row) => {
            if (filters.status && row.status !== filters.status) return false
            if (filters.date && row.date !== filters.date) return false
            if (filters.search && !matches(`${employeeName(row.employeeId)} ${row.employeeId}`, filters.search)) return false
            return true
        })
    }, [rows, filters])

    const kpis = useMemo(() => {
        const targetRows = filters.date ? rows.filter((r) => r.date === filters.date) : rows
        return {
            total: targetRows.length,
            present: targetRows.filter((r) => r.status === 'Present').length,
            late: targetRows.filter((r) => r.status === 'Late').length,
            leave: targetRows.filter((r) => r.status === 'Leave').length,
            absent: targetRows.filter((r) => r.status === 'Absent').length,
        }
    }, [rows, filters.date])

    const changeStatus = (row, status) => {
        if (row.status === status) return
        saveAttendance(getAttendance().map((item) => item.id === row.id ? { ...item, previousStatus: item.status, status, statusChangedBy: 'HR', statusChangedAt: new Date().toLocaleDateString('en-GB') } : item))
        toast.success(`${row.status} changed to ${status}. Payroll uses the saved status.`)
    }

    const handleSyncBiometric = () => {
        const res = syncEsslDevices()
        setLocalRefresh((v) => v + 1)
        toast.success(`eSSL Biometric punches synced successfully (${res.totalPunchesProcessed || 0} punches processed).`)
    }

    const columns = [
        {
            key: 'employeeId',
            label: 'Employee',
            required: true,
            render: (row) => (
                <>
                    <span className='font-semibold text-[var(--erp-ink)]'>{employeeName(row.employeeId)}</span>
                    <span className='block text-xs text-[var(--erp-muted)]'>{row.employeeId}</span>
                </>
            ),
        },
        { key: 'date', label: 'Date' },
        { key: 'punchIn', label: 'Punch in', render: (row) => row.punchIn || row.checkIn || '—' },
        { key: 'punchOut', label: 'Punch out', render: (row) => row.punchOut || row.checkOut || '—' },
        {
            key: 'status',
            label: 'Status',
            required: true,
            render: (row) => (
                <>
                    <select
                        aria-label={`Attendance status for ${employeeName(row.employeeId)}`}
                        className={`min-h-9 rounded-md border border-[var(--erp-line-strong)] px-2 text-sm font-medium ${
                            row.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-800'
                                : row.status === 'Late'
                                ? 'bg-amber-50 text-amber-800'
                                : row.status === 'Leave'
                                ? 'bg-blue-50 text-blue-800'
                                : 'bg-rose-50 text-rose-800'
                        }`}
                        value={row.status}
                        onChange={(event) => changeStatus(row, event.target.value)}
                    >
                        {['Present', 'Late', 'Leave', 'Absent'].map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                    {row.previousStatus ? <span className='mt-1 block text-xs text-[var(--erp-muted)]'>Was {row.previousStatus}</span> : null}
                </>
            ),
        },
        { key: 'source', label: 'Source', render: (row) => row.source || 'eSSL Biometric' },
    ]

    return (
        <section className='space-y-4'>
            {/* KPI Summary Cards */}
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
                <div className='bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs'>
                    <div className='flex items-center justify-between text-slate-500'>
                        <span className='text-xs font-semibold uppercase tracking-wider'>Total Staff</span>
                        <Users className='w-4 h-4 text-slate-400' />
                    </div>
                    <div className='mt-1.5 text-2xl font-bold text-slate-900'>{kpis.total}</div>
                </div>

                <div className='bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 shadow-2xs'>
                    <div className='flex items-center justify-between text-emerald-700'>
                        <span className='text-xs font-semibold uppercase tracking-wider'>Present</span>
                        <CheckCircle2 className='w-4 h-4 text-emerald-500' />
                    </div>
                    <div className='mt-1.5 text-2xl font-bold text-emerald-800'>{kpis.present}</div>
                </div>

                <div className='bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 shadow-2xs'>
                    <div className='flex items-center justify-between text-amber-700'>
                        <span className='text-xs font-semibold uppercase tracking-wider'>Late Arrival</span>
                        <Clock className='w-4 h-4 text-amber-500' />
                    </div>
                    <div className='mt-1.5 text-2xl font-bold text-amber-800'>{kpis.late}</div>
                </div>

                <div className='bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 shadow-2xs'>
                    <div className='flex items-center justify-between text-blue-700'>
                        <span className='text-xs font-semibold uppercase tracking-wider'>On Leave</span>
                        <FileText className='w-4 h-4 text-blue-500' />
                    </div>
                    <div className='mt-1.5 text-2xl font-bold text-blue-800'>{kpis.leave}</div>
                </div>

                <div className='bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 shadow-2xs'>
                    <div className='flex items-center justify-between text-rose-700'>
                        <span className='text-xs font-semibold uppercase tracking-wider'>Absent</span>
                        <CalendarX className='w-4 h-4 text-rose-500' />
                    </div>
                    <div className='mt-1.5 text-2xl font-bold text-rose-800'>{kpis.absent}</div>
                </div>
            </div>

            <PageIntro text='Review attendance status and exception history before payroll processing.'>
                <div className='grid md:grid-cols-3 gap-4'>
                    <SearchBox value={filters.search} onChange={set('search')} placeholder='Employee Name or ID' />
                    <Select label='Status' value={filters.status} onChange={set('status')} options={['Present', 'Late', 'Leave', 'Absent']} />
                    {availableDates.length > 1 && (
                        <Select label='Date' value={filters.date} onChange={set('date')} options={availableDates} allLabel='All Dates' />
                    )}
                </div>
            </PageIntro>

            <TableWrap
                title='HR Attendance Register'
                action={
                    <button
                        type='button'
                        onClick={handleSyncBiometric}
                        className='inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2 rounded-lg font-semibold shadow-xs transition-colors cursor-pointer'
                        title='Sync punch records from eSSL biometric / RFID devices'
                    >
                        <RefreshCw className='w-3.5 h-3.5' />
                        Sync eSSL Biometric
                    </button>
                }
            >
                <DataTable
                    caption='HR attendance register'
                    rows={filtered}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No attendance records found'
                    emptyDescription='Change the search or status filter to review other attendance records.'
                />
            </TableWrap>
        </section>
    )
}

export default Attendance
