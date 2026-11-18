import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Search,
    RotateCcw,
    Download,
    Eye,
    ChevronLeft,
    ChevronRight,
    Users,
    UserCheck,
    Briefcase,
    UserX,
} from 'lucide-react'
import ExportModal from '../CommonComponents/ExportModal'
import { Button } from '../ui'
import { inputClass, selectClass } from '../ui/formStyles'
import {
    getIntegratedTeachersList,
    DEFAULT_ACADEMIC_YEARS,
    CURRENT_ACADEMIC_YEAR,
    TEACHER_DEPARTMENTS,
} from './userDatabaseIntegrator'
import mo_user from '../../assets/images/no-profile.png'

const statusBadgeClasses = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Resigned: 'bg-amber-50 text-amber-700 border-amber-200',
    Inactive: 'bg-slate-100 text-slate-700 border-slate-300',
}

const EmployeeDatabaseListView = ({
    routeBase = '/front-office/teacher-management',
    title = 'Teacher Database',
    subtitle = 'Comprehensive central information system for teaching faculty and staff.',
    fixedDepartmentFilter = '',
    showDepartmentFilter = true,
}) => {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [academicYear, setAcademicYear] = useState(CURRENT_ACADEMIC_YEAR)
    const [departmentFilter, setDepartmentFilter] = useState(fixedDepartmentFilter)
    const [employmentStatus, setEmploymentStatus] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Fetch integrated teachers from aggregator
    const teachers = useMemo(() => {
        return getIntegratedTeachersList({
            search,
            academicYear,
            department: fixedDepartmentFilter || departmentFilter,
            employmentStatus,
        })
    }, [search, academicYear, departmentFilter, fixedDepartmentFilter, employmentStatus])

    // Metrics
    const totalTeachers = teachers.length
    const activeCount = useMemo(() => teachers.filter((t) => t.currentStatus === 'Active').length, [teachers])
    const teachingCount = useMemo(
        () => teachers.filter((t) => t.department && t.department.toLowerCase().includes('teaching')).length,
        [teachers]
    )
    const otherDeptCount = useMemo(() => totalTeachers - teachingCount, [totalTeachers, teachingCount])

    // Pagination
    const totalPages = Math.ceil(teachers.length / itemsPerPage) || 1
    const paginatedTeachers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return teachers.slice(start, start + itemsPerPage)
    }, [teachers, currentPage])

    const handleClearFilters = () => {
        setSearch('')
        setAcademicYear(CURRENT_ACADEMIC_YEAR)
        if (!fixedDepartmentFilter) setDepartmentFilter('')
        setEmploymentStatus('')
        setCurrentPage(1)
    }

    return (
        <section className='space-y-6'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold text-slate-900'>{title}</h1>
                    <p className='text-sm text-slate-500 mt-0.5'>{subtitle}</p>
                </div>
                <div className='flex items-center gap-2'>
                    <Button
                        variant='secondary'
                        icon={<Download size={15} />}
                        onClick={() => setExportModal(true)}
                    >
                        Export
                    </Button>
                </div>
            </div>

            {/* Quick KPI Count Strip */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                <div className='bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3'>
                    <div className='p-2 bg-indigo-50 text-indigo-600 rounded-xl'>
                        <Users size={18} />
                    </div>
                    <div>
                        <div className='text-xs text-slate-500 font-medium'>Total Listed</div>
                        <div className='text-lg font-bold text-slate-900'>{totalTeachers}</div>
                    </div>
                </div>
                <div className='bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3'>
                    <div className='p-2 bg-emerald-50 text-emerald-600 rounded-xl'>
                        <UserCheck size={18} />
                    </div>
                    <div>
                        <div className='text-xs text-slate-500 font-medium'>Active Status</div>
                        <div className='text-lg font-bold text-emerald-700'>{activeCount}</div>
                    </div>
                </div>
                <div className='bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3'>
                    <div className='p-2 bg-blue-50 text-blue-600 rounded-xl'>
                        <Briefcase size={18} />
                    </div>
                    <div>
                        <div className='text-xs text-slate-500 font-medium'>Teaching Faculty</div>
                        <div className='text-lg font-bold text-blue-700'>{teachingCount}</div>
                    </div>
                </div>
                <div className='bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3'>
                    <div className='p-2 bg-purple-50 text-purple-600 rounded-xl'>
                        <UserX size={18} />
                    </div>
                    <div>
                        <div className='text-xs text-slate-500 font-medium'>Specialized Depts</div>
                        <div className='text-lg font-bold text-purple-700'>{otherDeptCount}</div>
                    </div>
                </div>
            </div>

            {/* Filter Control Bar */}
            <div className='bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3'>
                    {/* Search */}
                    <div className='lg:col-span-2'>
                        <label className='block text-xs font-semibold text-slate-700 uppercase mb-1 tracking-wider'>Search Teacher</label>
                        <div className='relative'>
                            <input
                                type='text'
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setCurrentPage(1)
                                }}
                                placeholder='Search by Name, Employee ID, or Designation...'
                                className={`${inputClass} pl-9`}
                            />
                            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                        </div>
                    </div>

                    {/* Academic Year */}
                    <div>
                        <label className='block text-xs font-semibold text-slate-700 uppercase mb-1 tracking-wider'>Academic Year</label>
                        <select
                            value={academicYear}
                            onChange={(e) => {
                                setAcademicYear(e.target.value)
                                setCurrentPage(1)
                            }}
                            className={selectClass}
                        >
                            {DEFAULT_ACADEMIC_YEARS.map((yr) => (
                                <option key={yr} value={yr}>
                                    {yr}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Department */}
                    {showDepartmentFilter ? (
                        <div>
                            <label className='block text-xs font-semibold text-slate-700 uppercase mb-1 tracking-wider'>Department</label>
                            <select
                                value={departmentFilter}
                                onChange={(e) => {
                                    setDepartmentFilter(e.target.value)
                                    setCurrentPage(1)
                                }}
                                disabled={Boolean(fixedDepartmentFilter)}
                                className={selectClass}
                            >
                                <option value=''>All Departments</option>
                                {TEACHER_DEPARTMENTS.map((dept) => (
                                    <option key={dept} value={dept}>
                                        {dept}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className='block text-xs font-semibold text-slate-700 uppercase mb-1 tracking-wider'>Scope</label>
                            <div className='px-3 py-2 text-xs bg-slate-50/70 text-slate-700 rounded-xl border border-slate-200/80 font-medium'>
                                {fixedDepartmentFilter || 'Teaching Faculty'}
                            </div>
                        </div>
                    )}

                    {/* Employment Status & Clear */}
                    <div>
                        <label className='block text-xs font-semibold text-slate-700 uppercase mb-1 tracking-wider'>Employment Status</label>
                        <div className='flex gap-1.5'>
                            <select
                                value={employmentStatus}
                                onChange={(e) => {
                                    setEmploymentStatus(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className={selectClass}
                            >
                                <option value=''>All Statuses</option>
                                <option value='Active'>Active</option>
                                <option value='Resigned'>Resigned</option>
                                <option value='Inactive'>Inactive</option>
                            </select>
                            <Button
                                variant='secondary'
                                size='icon'
                                onClick={handleClearFilters}
                                title='Reset Filters'
                                icon={<RotateCcw size={15} />}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Teacher Directory Table */}
            <div className='bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden'>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-[11px] uppercase bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200/80 tracking-wider'>
                            <tr>
                                <th scope='col' className='px-4 py-3 text-center w-14'>Profile Photo</th>
                                <th scope='col' className='px-4 py-3'>Name</th>
                                <th scope='col' className='px-4 py-3'>Unique ID</th>
                                <th scope='col' className='px-4 py-3'>Department</th>
                                <th scope='col' className='px-4 py-3'>Designation</th>
                                <th scope='col' className='px-4 py-3 text-center'>Current Status</th>
                                <th scope='col' className='px-4 py-3 text-center'>Attendance</th>
                                <th scope='col' className='px-4 py-3 text-right'>Action</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {paginatedTeachers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='px-4 py-12 text-center text-slate-500'>
                                        <Users size={32} className='mx-auto text-slate-300 mb-2' />
                                        No teachers or employees found matching your search criteria.
                                    </td>
                                </tr>
                            ) : (
                                paginatedTeachers.map((teacher) => (
                                    <tr key={teacher.id} className='hover:bg-slate-50/80 transition-colors'>
                                        {/* Profile Photo */}
                                        <td className='px-4 py-3 text-center'>
                                            <img
                                                src={teacher.profilePhoto || mo_user}
                                                alt={teacher.name}
                                                className='w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 mx-auto'
                                            />
                                        </td>

                                        {/* Teacher Name */}
                                        <td className='px-4 py-3'>
                                            <Link
                                                to={`${routeBase}/view/${teacher.id}`}
                                                className='font-semibold text-slate-900 hover:text-indigo-600 transition-colors'
                                            >
                                                {teacher.name}
                                            </Link>
                                            <div className='text-xs text-slate-500 mt-0.5'>
                                                {teacher.email}
                                            </div>
                                        </td>

                                        {/* Unique ID */}
                                        <td className='px-4 py-3 font-mono text-xs font-medium text-slate-700'>
                                            {teacher.employeeId}
                                        </td>

                                        {/* Department */}
                                        <td className='px-4 py-3 font-medium text-slate-800'>
                                            {teacher.department}
                                        </td>

                                        {/* Designation */}
                                        <td className='px-4 py-3 text-xs text-slate-600'>
                                            {teacher.designation}
                                        </td>

                                        {/* Current Status */}
                                        <td className='px-4 py-3 text-center'>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                    statusBadgeClasses[teacher.currentStatus] || statusBadgeClasses.Active
                                                }`}
                                            >
                                                {teacher.currentStatus}
                                            </span>
                                        </td>

                                        {/* Attendance */}
                                        <td className='px-4 py-3 text-center'>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                                                    teacher.attendanceValue >= 95
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : teacher.attendanceValue >= 90
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {teacher.attendancePercentage}
                                            </span>
                                        </td>

                                        {/* Action */}
                                        <td className='px-4 py-3 text-right'>
                                            <Link
                                                to={`${routeBase}/view/${teacher.id}`}
                                                className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#3F46C7] bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer'
                                            >
                                                <Eye size={14} />
                                                View Profile
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer with Pagination */}
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200/80 bg-slate-50/70'>
                    <div className='text-xs text-slate-600'>
                        Showing <span className='font-semibold'>{teachers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                        <span className='font-semibold'>{Math.min(currentPage * itemsPerPage, teachers.length)}</span> of{' '}
                        <span className='font-semibold'>{teachers.length}</span> faculty members
                    </div>
                    {totalPages > 1 && (
                        <div className='flex items-center gap-1.5'>
                            <Button
                                variant='secondary'
                                size='icon-sm'
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                icon={<ChevronLeft size={16} />}
                            />
                            <span className='px-3 py-1 text-xs font-semibold text-slate-700'>
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant='secondary'
                                size='icon-sm'
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                icon={<ChevronRight size={16} />}
                            />
                        </div>
                    )}
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default EmployeeDatabaseListView
