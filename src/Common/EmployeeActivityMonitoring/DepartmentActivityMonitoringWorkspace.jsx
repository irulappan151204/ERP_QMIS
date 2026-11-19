import React, { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
    Activity,
    Users,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Search,
    Filter,
    Download,
    Eye,
    ChevronRight,
    Building2,
    Layers,
    BarChart3,
    ArrowUpRight,
    Briefcase,
    Calendar,
    ChevronDown,
    User,
    ShieldAlert,
    ShieldCheck,
    CheckSquare,
    XCircle,
    MessageSquare,
    TrendingUp,
    RefreshCw,
    RotateCcw,
    FileSpreadsheet,
    FileText,
    Printer,
    Monitor,
    Globe,
    ExternalLink,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    Code2,
    SlidersHorizontal,
    GitCommit
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'
import { ROLES } from '../../constants/roles'
import {
    getAllEmployeeActivities,
    getHierarchicalActivityMonitoring,
    reviewEmployeeActivity,
    ACTIVITY_TYPES,
    ACTIVITY_ACTIONS
} from './employeeActivityMonitoringData'
import { ENTERPRISE_EMPLOYEES } from '../AttendanceAndLeave/attendanceLeaveData'
import { exportDataset } from '../ui/exportUtils'
import EnterpriseBarChart from '../ui/EnterpriseBarChart'
import EnterpriseDonutChart from '../ui/EnterpriseDonutChart'
import EnterpriseTrendChart from '../ui/EnterpriseTrendChart'

export default function DepartmentActivityMonitoringWorkspace({ defaultTab = 'overview', roleOverride = null }) {
    const { role: authRole, email: authEmail, name: authName } = useAuth()
    const { tab } = useParams()
    const activeRole = roleOverride || authRole || 'director'
    const cleanRole = String(activeRole || '').trim().toLowerCase().replace(/[-_\s]/g, '')
    const roleLabel = getProfileLabel(activeRole)

    // Role Capabilities & Institutional Authorization
    const isAuthorized = Boolean(cleanRole)
    const isSupervisoryRole = [
        'superadmin',
        'admin',
        'director',
        'md',
        'principal',
        'seniorprincipal',
        'jointdirector',
        'jointdirectorassistant',
        'prm',
        'hr',
        'coordinator',
        'academichead',
        'processauditor',
        'qualityauditor',
        'jointdirectoraudit',
        'canteenmanager',
        'transportmanager',
        'housekeepingmanager',
        'maintenancemanager',
        'itsupportmanager',
        'stationerystoremanager',
        'accounthead',
        'cctv',
        'fileroom',
        'gatekeepermanager'
    ].includes(cleanRole)

    const targetTab = tab || defaultTab
    const [activeTab, setActiveTab] = useState(targetTab)
    const [refreshKey, setRefreshKey] = useState(0)

    // Multi-Facet Filters State
    const [selectedDept, setSelectedDept] = useState('ALL')
    const [selectedTeam, setSelectedTeam] = useState('ALL')
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('ALL')
    const [roleFilter, setRoleFilter] = useState('ALL')
    const [actionFilter, setActionFilter] = useState('ALL')
    const [moduleFilter, setModuleFilter] = useState('ALL')
    const [dateFilter, setDateFilter] = useState('ALL')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [activityTypeFilter, setActivityTypeFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [reviewFilter, setReviewFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Drawer / Modal States
    const [inspectingActivity, setInspectingActivity] = useState(null)
    const [selectedActivityForReview, setSelectedActivityForReview] = useState(null)
    const [reviewDecision, setReviewDecision] = useState('Approved')
    const [reviewRemarks, setReviewRemarks] = useState('')
    const [showExportMenu, setShowExportMenu] = useState(false)

    const handleResetFilters = () => {
        setSelectedDept('ALL')
        setSelectedTeam('ALL')
        setSelectedEmployeeId('ALL')
        setRoleFilter('ALL')
        setActionFilter('ALL')
        setModuleFilter('ALL')
        setDateFilter('ALL')
        setDateFrom('')
        setDateTo('')
        setActivityTypeFilter('ALL')
        setStatusFilter('ALL')
        setReviewFilter('ALL')
        setSearchQuery('')
        setCurrentPage(1)
        toast.info('All activity filters have been reset to default view.')
    }

    const currentUser = useMemo(() => {
        return (
            ENTERPRISE_EMPLOYEES.find((e) => (authEmail && e.email?.toLowerCase() === authEmail.toLowerCase()) || (authName && e.name === authName)) ||
            ENTERPRISE_EMPLOYEES.find((e) => (e.roleKey && e.roleKey.replace(/[-_\s]/g, '') === cleanRole)) ||
            null
        )
    }, [authEmail, authName, cleanRole])

    const currentUserId = currentUser?.employeeId || currentUser?.id || (cleanRole === 'admin' ? 'EMP-ADM-001' : '')

    // Dynamic Hierarchical Query
    const monitoringData = useMemo(() => {
        void refreshKey
        return getHierarchicalActivityMonitoring({
            viewerRole: activeRole,
            viewerEmployeeId: currentUserId,
            viewerName: authName || currentUser?.name || '',
            departmentFilter: selectedDept,
            teamFilter: selectedTeam,
            employeeFilter: selectedEmployeeId,
            roleFilter,
            actionFilter,
            moduleFilter,
            dateFilter,
            dateFrom: dateFrom || null,
            dateTo: dateTo || null,
            activityTypeFilter,
            statusFilter,
            reviewStatusFilter: reviewFilter,
            searchQuery
        })
    }, [
        activeRole,
        currentUserId,
        authName,
        currentUser?.name,
        selectedDept,
        selectedTeam,
        selectedEmployeeId,
        roleFilter,
        actionFilter,
        moduleFilter,
        dateFilter,
        dateFrom,
        dateTo,
        activityTypeFilter,
        statusFilter,
        reviewFilter,
        searchQuery,
        refreshKey
    ])

    // Tabs
    const availableTabs = useMemo(() => {
        const pendingCount = monitoringData.summary?.pendingReviewCount || 0
        const delayedCount = monitoringData.summary?.delayedActivities || 0
        const tabs = [
            { id: 'overview', label: 'Monitoring Overview', icon: BarChart3 },
            { id: 'activity-stream', label: 'Team Activity Stream', icon: Activity, count: monitoringData.activities?.length },
            { id: 'analytics', label: 'Interactive Analytics', icon: TrendingUp }
        ]
        if (isSupervisoryRole) {
            tabs.push(
                { id: 'pending-approvals', label: 'Pending HOD Approvals', icon: ShieldCheck, badge: pendingCount },
                { id: 'hierarchical-drilldown', label: 'Hierarchical Drill-Down', icon: Layers },
                { id: 'delayed-activities', label: 'Bottlenecks & Delays', icon: AlertTriangle, badge: delayedCount }
            )
        }
        return tabs
    }, [isSupervisoryRole, monitoringData.summary?.pendingReviewCount, monitoringData.summary?.delayedActivities, monitoringData.activities?.length])

    useEffect(() => {
        const currentTarget = tab || defaultTab
        if (currentTarget && availableTabs.some((t) => t.id === currentTarget)) {
            setActiveTab(currentTarget)
        }
    }, [tab, defaultTab, availableTabs])

    const handleCommitReview = (e) => {
        e.preventDefault()
        if (!selectedActivityForReview) return
        if (reviewDecision !== 'Approved' && !reviewRemarks.trim()) {
            toast.warn('Supervisory remarks are mandatory when requesting revision.')
            return
        }

        try {
            reviewEmployeeActivity({
                activityId: selectedActivityForReview.id,
                decision: reviewDecision,
                reviewerName: authName || roleLabel,
                reviewerRole: activeRole,
                remarks: reviewRemarks.trim() || 'Reviewed and signed off by Department Overseer.'
            })
            toast.success(`Activity ${selectedActivityForReview.id} marked as '${reviewDecision}' successfully.`)
            setSelectedActivityForReview(null)
            setReviewRemarks('')
            setRefreshKey((k) => k + 1)
        } catch (err) {
            toast.error(err.message || 'Failed to record review decision.')
        }
    }

    // Role-scoped available departments
    const availableDepartments = useMemo(() => {
        const set = new Set(ENTERPRISE_EMPLOYEES.map((e) => e.department))
        const allDepts = Array.from(set).sort()
        if (['superadmin', 'admin', 'director', 'md'].includes(cleanRole)) {
            return allDepts
        }
        if (['principal', 'seniorprincipal'].includes(cleanRole)) {
            return allDepts.filter((d) => d.includes('Academic') || d === 'Administration')
        }
        if (['coordinator', 'academichead'].includes(cleanRole)) {
            return allDepts.filter((d) => d.includes('Academic'))
        }
        const deptHeadMap = {
            'stationerystoremanager': 'Stores & Procurement',
            'transportmanager': 'Transport & Fleet Logistics',
            'itsupportmanager': 'IT Support & Systems',
            'gatekeepermanager': 'Campus Security & Access Control',
            'housekeepingmanager': 'Facilities & Campus Sanitation',
            'maintenancemanager': ['Facilities & Campus Sanitation', 'Physical Plant Maintenance'],
            'canteenmanager': 'Dining & Nutrition (Café)',
            'accounthead': 'Finance & Accounts',
            'hr': 'Human Resources (HR)',
            'cctv': 'Campus Surveillance & CCTV',
            'fileroom': 'File Room & Central Records',
            'jointdirector': 'Campus Operations',
            'jointdirectorassistant': 'Campus Operations',
            'jointdirectoraudit': 'Internal Audit',
            'qualityauditor': 'Internal Audit',
            'processauditor': 'Internal Audit'
        }
        const userDept = deptHeadMap[cleanRole]
        if (userDept) {
            if (Array.isArray(userDept)) {
                return allDepts.filter((d) => userDept.includes(d))
            }
            return allDepts.filter((d) => d === userDept)
        }
        return allDepts
    }, [cleanRole])

    // List of unique teams
    const availableTeams = useMemo(() => {
        const teams = new Set()
        const acts = getAllEmployeeActivities()
        acts.forEach((a) => {
            if (a.team && (selectedDept === 'ALL' || a.department === selectedDept)) {
                teams.add(a.team)
            }
        })
        return Array.from(teams).sort()
    }, [selectedDept])

    // List of unique modules
    const availableModules = useMemo(() => {
        const mods = new Set()
        const acts = getAllEmployeeActivities()
        acts.forEach((a) => {
            if (a.moduleRef) mods.add(a.moduleRef)
        })
        return Array.from(mods).sort()
    }, [])

    // List of all 29 roles for multi-facet filtering
    const allRolesList = useMemo(() => {
        return Object.values(ROLES).map((r) => ({
            key: r,
            label: getProfileLabel(r)
        }))
    }, [])

    // Employees in currently selected department
    const departmentEmployees = useMemo(() => {
        if (selectedDept === 'ALL') return ENTERPRISE_EMPLOYEES
        return ENTERPRISE_EMPLOYEES.filter((e) => e.department === selectedDept)
    }, [selectedDept])

    // Filtered Stream
    const filteredActivities = monitoringData.activities || []

    // Pagination calculations
    const totalRecords = filteredActivities.length
    const totalPages = Math.ceil(totalRecords / pageSize) || 1
    const paginatedActivities = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filteredActivities.slice(start, start + pageSize)
    }, [filteredActivities, currentPage, pageSize])

    useEffect(() => {
        setCurrentPage(1)
    }, [
        selectedDept,
        selectedTeam,
        selectedEmployeeId,
        roleFilter,
        actionFilter,
        moduleFilter,
        dateFilter,
        dateFrom,
        dateTo,
        activityTypeFilter,
        statusFilter,
        reviewFilter,
        searchQuery,
        pageSize
    ])

    // Export dataset handlers
    const handleExport = (format) => {
        setShowExportMenu(false)
        if (filteredActivities.length === 0) {
            toast.warn('No records available to export with current filters.')
            return
        }

        const columns = [
            { key: 'id', header: 'Activity ID' },
            { key: 'timestamp', header: 'Date & Time' },
            { key: 'employeeName', header: 'Employee Name' },
            { key: 'employeeId', header: 'Employee ID' },
            { key: 'role', header: 'Role' },
            { key: 'department', header: 'Department' },
            { key: 'team', header: 'Team' },
            { key: 'action', header: 'Action' },
            { key: 'activityType', header: 'Activity Type' },
            { key: 'moduleRef', header: 'Module' },
            { key: 'pageAccessed', header: 'Page Accessed' },
            { key: 'title', header: 'Activity Title' },
            { key: 'description', header: 'Description' },
            { key: 'referenceId', header: 'Reference ID' },
            { key: 'status', header: 'Status' },
            { key: 'reviewStatus', header: 'HOD Review' },
            { key: 'reviewedBy', header: 'Reviewed By' },
            { key: 'duration', header: 'Duration' },
            { key: 'ipAddress', header: 'IP Address' },
            { key: 'sessionId', header: 'Session ID' }
        ]

        exportDataset({
            data: filteredActivities,
            columns,
            format,
            filename: `employee_activity_audit_${new Date().toISOString().split('T')[0]}`,
            title: 'Employee Activity Monitoring & Audit Dossier',
            metadata: {
                'Exported By': authName || roleLabel,
                'Role Scope': roleLabel,
                'Department Filter': selectedDept,
                'Total Records': String(filteredActivities.length),
                'Export Date': new Date().toLocaleString('en-GB')
            }
        })
        toast.success(`Exporting ${filteredActivities.length} activities as ${format.toUpperCase()}...`)
    }

    // Chart Data Preparations
    const departmentChartData = useMemo(() => {
        const dict = monitoringData.summary?.departmentBreakdown || {}
        const categories = Object.keys(dict).map((d) => d.length > 18 ? d.substring(0, 16) + '...' : d)
        const counts = Object.values(dict).map((d) => d.total || d.count || 0)
        return { categories, data: counts }
    }, [monitoringData.summary?.departmentBreakdown])

    const actionDonutData = useMemo(() => {
        const breakdown = monitoringData.summary?.actionsBreakdown || {}
        const palette = {
            CREATE: '#10B981',
            UPDATE: '#3B82F6',
            APPROVE: '#6366F1',
            VIEW: '#0EA5E9',
            EXPORT: '#8B5CF6',
            DELETE: '#EF4444',
            LOGIN: '#64748B',
            LOGOUT: '#94A3B8',
            REJECT: '#F59E0B'
        }
        return Object.entries(breakdown)
            .filter(([, count]) => count > 0)
            .map(([action, count]) => ({
                name: action,
                value: count,
                color: palette[action] || '#64748B'
            }))
    }, [monitoringData.summary?.actionsBreakdown])

    const trendChartData = useMemo(() => {
        return {
            'Daily Activity Volume': {
                current: [14, 22, 19, 28, 35, 42, 38],
                previous: [10, 16, 15, 24, 28, 30, 32]
            },
            'Approval Velocity': {
                current: [8, 14, 12, 20, 25, 31, 29],
                previous: [6, 11, 10, 15, 19, 22, 24]
            },
            'Overdue Mitigation': {
                current: [1, 3, 2, 0, 1, 0, 1],
                previous: [3, 4, 3, 2, 3, 2, 2]
            }
        }
    }, [])

    const handleActionChipClick = (actionName) => {
        setActionFilter(actionName)
        setActiveTab('activity-stream')
        toast.info(`Filtered activities for action: ${actionName}`)
    }

    const handleDepartmentBarClick = (deptName) => {
        const fullDept = availableDepartments.find((d) => d.toLowerCase().includes(deptName.toLowerCase())) || deptName
        setSelectedDept(fullDept)
        setActiveTab('activity-stream')
        toast.info(`Filtered activities for department: ${fullDept}`)
    }

    if (!isAuthorized) {
        return (
            <div className='p-6 md:p-12 min-h-[60vh] flex items-center justify-center'>
                <div className='max-w-lg w-full bg-white rounded-3xl border border-slate-200/90 p-8 text-center shadow-xl space-y-4'>
                    <div className='size-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs'>
                        <ShieldAlert size={30} />
                    </div>
                    <div>
                        <span className='inline-block text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200'>
                            Access Restricted
                        </span>
                        <h2 className='text-lg font-bold text-slate-900 mt-2'>Activity Monitoring Access Restricted</h2>
                        <p className='text-xs text-slate-500 mt-2 leading-relaxed'>
                            Department and team activity monitoring is restricted to supervisors, department heads, auditors, and executive administration. Your current user profile ({roleLabel}) does not have permission to inspect employee activity streams.
                        </p>
                    </div>
                    <div className='pt-3 border-t border-slate-100 text-[11px] text-slate-400'>
                        If you require access to operational activity streams, contact your Department Head or System Administrator.
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='space-y-6 p-4 md:p-6 bg-slate-50/50 min-h-screen'>
            {/* Header: Title, Role Badge, Actions */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs'>
                        <Activity size={22} />
                    </div>
                    <div>
                        <div className='flex items-center gap-2 flex-wrap'>
                            <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-slate-900'>
                                Hierarchical Employee Activity Monitoring
                            </h1>
                            <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100'>
                                {roleLabel} • Transparency & Audit Portal
                            </span>
                        </div>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            Complete upward managerial accountability: cross-department operational telemetry, before/after diffs, and workflow reviews.
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-2.5 flex-wrap'>
                    {/* Export Menu Dropdown */}
                    <div className='relative'>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition'
                        >
                            <Download size={14} className='text-emerald-600' />
                            <span>Export Data</span>
                            <ChevronDown size={13} className='text-slate-400' />
                        </button>

                        {showExportMenu && (
                            <div className='absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-30 space-y-1 text-xs'>
                                <button
                                    onClick={() => handleExport('xlsx')}
                                    className='w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition text-left'
                                >
                                    <FileSpreadsheet size={14} className='text-emerald-600' />
                                    <span>Excel Workbook (.xlsx)</span>
                                </button>
                                <button
                                    onClick={() => handleExport('csv')}
                                    className='w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition text-left'
                                >
                                    <FileText size={14} className='text-blue-600' />
                                    <span>CSV Spreadsheet (.csv)</span>
                                </button>
                                <button
                                    onClick={() => handleExport('pdf')}
                                    className='w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition text-left'
                                >
                                    <Printer size={14} className='text-rose-600' />
                                    <span>Printable PDF Dossier</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            setRefreshKey((k) => k + 1)
                            toast.info('Activity telemetry synchronized successfully.')
                        }}
                        className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition'
                    >
                        <RefreshCw size={14} className='text-blue-600' />
                        <span>Sync Telemetry</span>
                    </button>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className='border-b border-slate-200/80 pb-px'>
                <div className='flex items-center gap-2 overflow-x-auto scrollbar-none'>
                    {availableTabs.map((t) => {
                        const Icon = t.icon
                        const isActive = activeTab === t.id
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition whitespace-nowrap ${
                                    isActive
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                <span>{t.label}</span>
                                {typeof t.count === 'number' && (
                                    <span className='rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.2'>
                                        {t.count}
                                    </span>
                                )}
                                {typeof t.badge === 'number' && t.badge > 0 && (
                                    <span className={`rounded-full text-[10px] font-bold px-1.5 py-0.2 ${
                                        t.id === 'delayed-activities'
                                            ? 'bg-rose-100 text-rose-800'
                                            : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {t.badge}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: MONITORING OVERVIEW                                                */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (
                <div className='space-y-6'>
                    {/* KPI Cards Grid */}
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5'>
                        <div
                            onClick={() => {
                                handleResetFilters()
                                setActiveTab('activity-stream')
                            }}
                            className='rounded-[1.25rem] border border-blue-100 bg-[#E8F1FD]/70 p-4 shadow-2xs hover:border-blue-300 transition cursor-pointer'
                        >
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Logged Activities</span>
                                <Activity size={16} className='text-blue-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-slate-900'>{monitoringData?.summary?.totalActivities ?? 0}</span>
                                <span className='text-[11px] font-medium text-blue-700'>Total Events</span>
                            </div>
                            <div className='mt-1 text-[10px] text-slate-500'>Across authorized scope</div>
                        </div>

                        <div
                            onClick={() => {
                                setStatusFilter('Completed')
                                setActiveTab('activity-stream')
                            }}
                            className='rounded-[1.25rem] border border-emerald-100 bg-emerald-50/50 p-4 shadow-2xs hover:border-emerald-300 transition cursor-pointer'
                        >
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Completed Tasks</span>
                                <CheckCircle2 size={16} className='text-emerald-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-emerald-700'>{monitoringData?.summary?.completedTasks ?? monitoringData?.summary?.completedActivities ?? 0}</span>
                                <span className='text-[11px] font-medium text-emerald-800'>Verified Deliverables</span>
                            </div>
                            <div className='mt-1 text-[10px] text-emerald-700'>Ready for sign-off</div>
                        </div>

                        <div
                            onClick={() => {
                                setStatusFilter('In Progress')
                                setActiveTab('activity-stream')
                            }}
                            className='rounded-[1.25rem] border border-amber-100 bg-amber-50/50 p-4 shadow-2xs hover:border-amber-300 transition cursor-pointer'
                        >
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Active in Execution</span>
                                <Clock size={16} className='text-amber-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-amber-700'>{monitoringData?.summary?.pendingTasks ?? monitoringData?.summary?.inProgressActivities ?? 0}</span>
                                <span className='text-[11px] font-medium text-amber-800'>In Progress</span>
                            </div>
                            <div className='mt-1 text-[10px] text-amber-700'>Under active work</div>
                        </div>

                        <div
                            onClick={() => {
                                setReviewFilter('Pending Approval')
                                setActiveTab('pending-approvals')
                            }}
                            className='rounded-[1.25rem] border border-indigo-100 bg-indigo-50/50 p-4 shadow-2xs hover:border-indigo-300 transition cursor-pointer'
                        >
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Pending HOD Reviews</span>
                                <ShieldCheck size={16} className='text-indigo-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-indigo-700'>{monitoringData?.summary?.pendingReviewCount ?? 0}</span>
                                <span className='text-[11px] font-medium text-indigo-800'>Needs Review</span>
                            </div>
                            <div className='mt-1 text-[10px] text-indigo-700'>Awaiting managerial sign-off</div>
                        </div>

                        <div
                            onClick={() => {
                                setActiveTab('delayed-activities')
                            }}
                            className='rounded-[1.25rem] border border-rose-100 bg-rose-50/50 p-4 shadow-2xs hover:border-rose-300 transition cursor-pointer'
                        >
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Delayed & Bottlenecks</span>
                                <AlertTriangle size={16} className='text-rose-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-rose-600'>{monitoringData?.summary?.delayedActivities ?? 0}</span>
                                <span className='text-[11px] font-medium text-rose-700'>Overdue Actions</span>
                            </div>
                            <div className='mt-1 text-[10px] text-rose-700'>Requires intervention</div>
                        </div>
                    </div>

                    {/* Operational Workload & Action Breakdown */}
                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                        <div className='lg:col-span-2'>
                            <EnterpriseBarChart
                                title='Operational Workload by School Department'
                                categories={departmentChartData.categories}
                                data={departmentChartData.data}
                                barColor='#3B82F6'
                                height={260}
                                unit=''
                                onBarClick={handleDepartmentBarClick}
                            />
                        </div>

                        <div>
                            <EnterpriseDonutChart
                                title='Activity Distribution by Action Type'
                                data={actionDonutData}
                                height={240}
                                onSliceClick={handleActionChipClick}
                            />
                        </div>
                    </div>

                    {/* Action Type Shortcuts Chips Bar */}
                    <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-2'>
                        <div className='flex items-center justify-between'>
                            <h3 className='text-xs font-bold uppercase tracking-wider text-slate-700'>Quick Filter by Action Protocol</h3>
                            <span className='text-[11px] text-slate-400'>Click any chip to drill down</span>
                        </div>
                        <div className='flex items-center gap-2 flex-wrap'>
                            {ACTIVITY_ACTIONS.map((act) => {
                                const count = monitoringData.summary?.actionsBreakdown?.[act] || 0
                                const isSelected = actionFilter === act
                                return (
                                    <button
                                        key={act}
                                        onClick={() => {
                                            setActionFilter(isSelected ? 'ALL' : act)
                                            setActiveTab('activity-stream')
                                        }}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition ${
                                            isSelected
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span>{act}</span>
                                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                                            isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: TEAM ACTIVITY STREAM                                               */}
            {/* ========================================================================= */}
            {activeTab === 'activity-stream' && (
                <div className='space-y-4'>
                    {/* Multi-Facet Filter Bar */}
                    <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3'>
                        <div className='flex flex-col md:flex-row md:items-center justify-between gap-3'>
                            <div className='relative flex-1 min-w-[260px]'>
                                <Search className='absolute left-3 top-2.5 text-slate-400' size={14} />
                                <input
                                    type='text'
                                    placeholder='Search employee name, ID, role, task title, action details, IP address, reference...'
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className='w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='flex items-center gap-2 flex-wrap text-xs text-slate-600'>
                                <span className='font-semibold text-slate-500 text-[11px] uppercase tracking-wider'>
                                    Showing {filteredActivities.length} activities
                                </span>
                                {(selectedDept !== 'ALL' ||
                                    selectedTeam !== 'ALL' ||
                                    selectedEmployeeId !== 'ALL' ||
                                    roleFilter !== 'ALL' ||
                                    actionFilter !== 'ALL' ||
                                    moduleFilter !== 'ALL' ||
                                    dateFilter !== 'ALL' ||
                                    dateFrom ||
                                    dateTo ||
                                    activityTypeFilter !== 'ALL' ||
                                    statusFilter !== 'ALL' ||
                                    reviewFilter !== 'ALL' ||
                                    searchQuery) && (
                                    <button
                                        type='button'
                                        onClick={handleResetFilters}
                                        className='inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 text-xs font-semibold transition'
                                        title='Clear all filters'
                                    >
                                        <RotateCcw size={12} /> Reset Filters
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Multi-Facet Filter Controls Grid */}
                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100'>
                            {/* Department */}
                            <div>
                                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1'>Department</label>
                                <select
                                    value={selectedDept}
                                    onChange={(e) => {
                                        setSelectedDept(e.target.value)
                                        setSelectedTeam('ALL')
                                        setSelectedEmployeeId('ALL')
                                    }}
                                    className='w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500'
                                >
                                    <option value='ALL'>All Departments</option>
                                    {availableDepartments.map((dept) => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Team */}
                            <div>
                                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1'>Team / Unit</label>
                                <select
                                    value={selectedTeam}
                                    onChange={(e) => setSelectedTeam(e.target.value)}
                                    className='w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500'
                                >
                                    <option value='ALL'>All Teams</option>
                                    {availableTeams.map((team) => (
                                        <option key={team} value={team}>{team}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Action Type */}
                            <div>
                                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1'>Action (Protocol)</label>
                                <select
                                    value={actionFilter}
                                    onChange={(e) => setActionFilter(e.target.value)}
                                    className='w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500'
                                >
                                    <option value='ALL'>All Actions</option>
                                    {ACTIVITY_ACTIONS.map((act) => (
                                        <option key={act} value={act}>{act}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Module */}
                            <div>
                                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1'>Module Scope</label>
                                <select
                                    value={moduleFilter}
                                    onChange={(e) => setModuleFilter(e.target.value)}
                                    className='w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500'
                                >
                                    <option value='ALL'>All Modules</option>
                                    {availableModules.map((mod) => (
                                        <option key={mod} value={mod}>{mod}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Role (All 29 roles) */}
                            <div>
                                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1'>User Role</label>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className='w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500'
                                >
                                    <option value='ALL'>All Roles</option>
                                    {allRolesList.map((r) => (
                                        <option key={r.key} value={r.key}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Employee */}
                            <div>
                                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1'>Staff Member</label>
                                <select
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                    className='w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500'
                                >
                                    <option value='ALL'>All Staff Members</option>
                                    {departmentEmployees.map((emp) => (
                                        <option key={emp.employeeId} value={emp.employeeId}>
                                            {emp.name} ({emp.designation})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date From */}
                            <div>
                                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1'>Date From</label>
                                <input
                                    type='date'
                                    value={dateFrom}
                                    onChange={(e) => {
                                        setDateFrom(e.target.value)
                                        setDateFilter('ALL')
                                    }}
                                    className='w-full rounded-xl border border-slate-200 px-2 py-1 text-xs bg-white text-slate-800 focus:border-blue-500'
                                />
                            </div>

                            {/* Date To */}
                            <div>
                                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1'>Date To</label>
                                <input
                                    type='date'
                                    value={dateTo}
                                    onChange={(e) => {
                                        setDateTo(e.target.value)
                                        setDateFilter('ALL')
                                    }}
                                    className='w-full rounded-xl border border-slate-200 px-2 py-1 text-xs bg-white text-slate-800 focus:border-blue-500'
                                />
                            </div>

                            {/* Task Status */}
                            <div>
                                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1'>Task Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className='w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500'
                                >
                                    <option value='ALL'>All Task Statuses</option>
                                    <option value='Completed'>Completed</option>
                                    <option value='In Progress'>In Progress</option>
                                    <option value='Submitted'>Submitted</option>
                                    <option value='Approved'>Approved</option>
                                    <option value='Delayed'>Delayed</option>
                                </select>
                            </div>

                            {/* HOD Review Status */}
                            <div>
                                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1'>HOD Review Stage</label>
                                <select
                                    value={reviewFilter}
                                    onChange={(e) => setReviewFilter(e.target.value)}
                                    className='w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500'
                                >
                                    <option value='ALL'>All Review Stages</option>
                                    <option value='Pending Approval'>Pending Approval</option>
                                    <option value='Approved'>Approved by HOD</option>
                                    <option value='Needs Revision'>Needs Revision</option>
                                </select>
                            </div>

                            {/* Rows Per Page */}
                            <div>
                                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1'>Rows Per Page</label>
                                <select
                                    value={pageSize}
                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                    className='w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs bg-white text-slate-800 focus:border-blue-500'
                                >
                                    <option value={10}>10 records</option>
                                    <option value={25}>25 records</option>
                                    <option value={50}>50 records</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table of Activities */}
                    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3.5 px-4'>Date & Time</th>
                                        <th className='py-3.5 px-4'>Employee & Team</th>
                                        <th className='py-3.5 px-4'>Department</th>
                                        <th className='py-3.5 px-4'>Action</th>
                                        <th className='py-3.5 px-4'>Module & Ref</th>
                                        <th className='py-3.5 px-4'>Activity Title & Details</th>
                                        <th className='py-3.5 px-4 text-center'>Task Status</th>
                                        <th className='py-3.5 px-4 text-center'>HOD Sign-Off</th>
                                        <th className='py-3.5 px-4 text-right'>Audit Inspection</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {paginatedActivities.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className='py-12 text-center text-slate-400'>
                                                <div className='max-w-xs mx-auto space-y-2'>
                                                    <Activity size={28} className='mx-auto text-slate-300' />
                                                    <p className='font-semibold text-slate-600'>No activities match the filters</p>
                                                    <p className='text-[11px] text-slate-400'>Try adjusting your search criteria, date ranges, or department selections.</p>
                                                    <button
                                                        onClick={handleResetFilters}
                                                        className='inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition'
                                                    >
                                                        <RotateCcw size={12} /> Reset Filters
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedActivities.map((act) => {
                                            const actionColors = {
                                                CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
                                                APPROVE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                                                VIEW: 'bg-sky-50 text-sky-700 border-sky-200',
                                                EXPORT: 'bg-purple-50 text-purple-700 border-purple-200',
                                                DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
                                                LOGIN: 'bg-slate-100 text-slate-700 border-slate-200',
                                                LOGOUT: 'bg-slate-100 text-slate-600 border-slate-200',
                                                REJECT: 'bg-amber-50 text-amber-800 border-amber-200'
                                            }
                                            const chipStyle = actionColors[act.action] || 'bg-slate-100 text-slate-700 border-slate-200'

                                            return (
                                                <tr key={act.id} className='hover:bg-slate-50/80 transition'>
                                                    <td className='py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap'>
                                                        <div>{act.timestamp}</div>
                                                        <div className='text-[10px] text-slate-400 flex items-center gap-1 mt-0.5'>
                                                            <span>IP: {act.ipAddress}</span>
                                                        </div>
                                                    </td>
                                                    <td className='py-3.5 px-4'>
                                                        <div className='font-semibold text-slate-900'>{act.employeeName}</div>
                                                        <div className='text-[11px] text-slate-500'>{act.employeeId} • {act.role}</div>
                                                        <div className='text-[10px] text-blue-600 font-medium'>{act.team}</div>
                                                    </td>
                                                    <td className='py-3.5 px-4 text-slate-600'>{act.department}</td>
                                                    <td className='py-3.5 px-4'>
                                                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${chipStyle}`}>
                                                            {act.action}
                                                        </span>
                                                    </td>
                                                    <td className='py-3.5 px-4'>
                                                        <div className='font-medium text-slate-800'>{act.moduleRef}</div>
                                                        {act.referenceId && (
                                                            <div className='text-[10px] font-mono text-slate-400'>{act.referenceId}</div>
                                                        )}
                                                    </td>
                                                    <td className='py-3.5 px-4 max-w-xs'>
                                                        <div className='font-semibold text-slate-900 truncate'>{act.activityTitle}</div>
                                                        <div className='text-[11px] text-slate-500 truncate'>{act.details}</div>
                                                        {act.previousValues && act.updatedValues && (
                                                            <span className='inline-flex items-center gap-0.5 text-[10px] font-semibold text-indigo-600 mt-0.5'>
                                                                <GitCommit size={11} /> Diff captured
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className='py-3.5 px-4 text-center'>
                                                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                            act.status === 'Completed' || act.status === 'Approved'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : act.status === 'Delayed'
                                                                ? 'bg-rose-100 text-rose-800'
                                                                : 'bg-amber-50 text-amber-700'
                                                        }`}>
                                                            {act.status}
                                                        </span>
                                                    </td>
                                                    <td className='py-3.5 px-4 text-center'>
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                            act.reviewStatus === 'Approved'
                                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                                : act.reviewStatus === 'Needs Revision'
                                                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                        }`}>
                                                            {act.reviewStatus || 'Pending Approval'}
                                                        </span>
                                                        {act.reviewedBy && (
                                                            <div className='text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px] mx-auto'>
                                                                {act.reviewedBy}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className='py-3.5 px-4 text-right whitespace-nowrap space-x-1.5'>
                                                        <button
                                                            onClick={() => setInspectingActivity(act)}
                                                            className='inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition'
                                                            title='Inspect complete activity metadata & diff'
                                                        >
                                                            <Eye size={12} className='text-blue-600' /> Diff / Info
                                                        </button>
                                                        {isSupervisoryRole && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedActivityForReview(act)
                                                                    setReviewDecision(act.reviewStatus === 'Needs Revision' ? 'Needs Revision' : 'Approved')
                                                                    setReviewRemarks(act.reviewRemarks || '')
                                                                }}
                                                                className='inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition'
                                                                title='HOD Review Sign-Off'
                                                            >
                                                                <ShieldCheck size={12} /> Sign-Off
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                            <div className='flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600'>
                                <div>
                                    Showing <span className='font-bold text-slate-800'>{(currentPage - 1) * pageSize + 1}</span> to{' '}
                                    <span className='font-bold text-slate-800'>{Math.min(currentPage * pageSize, totalRecords)}</span> of{' '}
                                    <span className='font-bold text-slate-800'>{totalRecords}</span> entries
                                </div>
                                <div className='flex items-center gap-1'>
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(1)}
                                        className='p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
                                        title='First Page'
                                    >
                                        <ChevronsLeft size={14} />
                                    </button>
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => p - 1)}
                                        className='p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
                                        title='Previous Page'
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span className='px-3 py-1 font-semibold text-slate-800'>
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((p) => p + 1)}
                                        className='p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
                                        title='Next Page'
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(totalPages)}
                                        className='p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
                                        title='Last Page'
                                    >
                                        <ChevronsRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: INTERACTIVE ANALYTICS                                              */}
            {/* ========================================================================= */}
            {activeTab === 'analytics' && (
                <div className='space-y-6'>
                    {/* Operational Velocity Trend */}
                    <div>
                        <EnterpriseTrendChart
                            tabs={['Daily Activity Volume', 'Approval Velocity', 'Overdue Mitigation']}
                            dataByTab={trendChartData}
                            categories={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today']}
                            height={280}
                            onPointClick={(name) => {
                                toast.info(`Viewing operational telemetry for day: ${name}`)
                            }}
                        />
                    </div>

                    {/* Department vs Action Double Chart Grid */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        <EnterpriseBarChart
                            title='Workload Distribution by Department'
                            categories={departmentChartData.categories}
                            data={departmentChartData.data}
                            barColor='#60A5FA'
                            height={260}
                            onBarClick={handleDepartmentBarClick}
                        />

                        <EnterpriseDonutChart
                            title='Action Protocols Breakdown'
                            data={actionDonutData}
                            height={260}
                            onSliceClick={handleActionChipClick}
                        />
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: PENDING HOD APPROVALS                                              */}
            {/* ========================================================================= */}
            {activeTab === 'pending-approvals' && (
                <div className='space-y-4'>
                    <div className='rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs flex items-center justify-between'>
                        <div>
                            <h3 className='text-sm font-bold text-amber-950'>Department Overseer Pending Review Queue</h3>
                            <p className='text-xs text-amber-800'>
                                Subordinates have logged daily operational tasks awaiting managerial sign-off and audit validation.
                            </p>
                        </div>
                        <span className='rounded-full bg-amber-600 px-3 py-1 text-xs font-bold text-white shadow-xs'>
                            {filteredActivities.filter((a) => a.reviewStatus === 'Pending Approval').length} Pending Review
                        </span>
                    </div>

                    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3 px-4'>Date & Time</th>
                                        <th className='py-3 px-4'>Employee & Team</th>
                                        <th className='py-3 px-4'>Action</th>
                                        <th className='py-3 px-4'>Activity Description</th>
                                        <th className='py-3 px-4'>Module & Evidence</th>
                                        <th className='py-3 px-4 text-right'>Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {filteredActivities.filter((a) => a.reviewStatus === 'Pending Approval').length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className='py-8 text-center text-xs text-slate-400'>
                                                ✓ All logged activities in this scope have been reviewed and approved!
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredActivities
                                            .filter((a) => a.reviewStatus === 'Pending Approval')
                                            .map((act) => (
                                                <tr key={act.id} className='hover:bg-amber-50/40 transition'>
                                                    <td className='py-3 px-4 font-mono text-[11px] text-slate-600'>{act.timestamp}</td>
                                                    <td className='py-3 px-4'>
                                                        <div className='font-semibold text-slate-900'>{act.employeeName}</div>
                                                        <div className='text-[11px] text-slate-500'>{act.employeeId} · {act.department}</div>
                                                        <div className='text-[10px] text-blue-600'>{act.team}</div>
                                                    </td>
                                                    <td className='py-3 px-4'>
                                                        <span className='rounded bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-bold'>
                                                            {act.action}
                                                        </span>
                                                    </td>
                                                    <td className='py-3 px-4'>
                                                        <div className='font-semibold text-slate-900'>{act.activityTitle}</div>
                                                        <div className='text-[11px] text-slate-500'>{act.details}</div>
                                                    </td>
                                                    <td className='py-3 px-4'>
                                                        <span className='rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700'>
                                                            {act.category}
                                                        </span>
                                                        {act.evidence && (
                                                            <div className='text-[10px] text-blue-600 mt-0.5'>📎 {act.evidence}</div>
                                                        )}
                                                    </td>
                                                    <td className='py-3 px-4 text-right space-x-1.5'>
                                                        <button
                                                            onClick={() => setInspectingActivity(act)}
                                                            className='rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition'
                                                        >
                                                            Diff
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedActivityForReview(act)
                                                                setReviewDecision('Approved')
                                                                setReviewRemarks('Reviewed and endorsed.')
                                                            }}
                                                            className='rounded-xl bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition'
                                                        >
                                                            Sign-Off ✍️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: HIERARCHICAL DRILL-DOWN                                            */}
            {/* ========================================================================= */}
            {activeTab === 'hierarchical-drilldown' && (
                <div className='space-y-4'>
                    <div className='rounded-2xl border border-blue-100 bg-[#E8F1FD]/40 p-4 shadow-xs flex items-center justify-between'>
                        <div>
                            <h3 className='text-sm font-bold text-blue-950'>Organizational Transparency Dossier</h3>
                            <p className='text-xs text-blue-800'>
                                Hierarchical drill-down from School Board executive oversight down to individual team member operational output.
                            </p>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {departmentEmployees.slice(0, 9).map((emp) => {
                            const empActivities = (monitoringData?.activities || []).filter((a) => a.employeeId === emp.employeeId)
                            const completedCount = empActivities.filter((a) => a.status === 'Completed' || a.status === 'Approved').length
                            return (
                                <div key={emp.employeeId} className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3'>
                                    <div className='flex items-center justify-between'>
                                        <div>
                                            <span className='font-mono text-xs font-bold text-blue-600'>{emp.employeeId}</span>
                                            <h4 className='text-sm font-bold text-slate-900'>{emp.name}</h4>
                                            <p className='text-xs text-slate-500'>{emp.designation}</p>
                                        </div>
                                        <span className='rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600'>
                                            {emp.department}
                                        </span>
                                    </div>

                                    <div className='rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs space-y-1.5'>
                                        <div className='flex items-center justify-between'>
                                            <span className='text-slate-500'>Active Deliverables:</span>
                                            <span className='font-bold text-slate-900'>{empActivities.length} Actions</span>
                                        </div>
                                        <div className='flex items-center justify-between'>
                                            <span className='text-slate-500'>Completion Rate:</span>
                                            <span className='font-bold text-emerald-700'>
                                                {empActivities.length > 0 ? Math.round((completedCount / empActivities.length) * 100) : 100}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className='space-y-1 text-xs'>
                                        <div className='font-semibold text-slate-700 text-[11px]'>Recent Action Items:</div>
                                        {empActivities.length === 0 ? (
                                            <div className='text-[11px] text-slate-400'>Standard daily operational cadence.</div>
                                        ) : (
                                            empActivities.slice(0, 2).map((a) => (
                                                <div key={a.id} className='text-[11px] text-slate-600 truncate'>
                                                    • [{a.action}] {a.activityTitle}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <button
                                        onClick={() => {
                                            setSelectedEmployeeId(emp.employeeId)
                                            setActiveTab('activity-stream')
                                        }}
                                        className='w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-800 py-1.5 border border-blue-100 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition'
                                    >
                                        Filter Staff Activity Stream →
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: DELAYED ACTIVITIES & BOTTLENECKS                                    */}
            {/* ========================================================================= */}
            {activeTab === 'delayed-activities' && (
                <div className='space-y-4'>
                    <div className='rounded-2xl border border-rose-100 bg-rose-50/40 p-4 shadow-xs flex items-center justify-between'>
                        <div>
                            <h3 className='text-sm font-bold text-rose-950'>Delayed Activities & Operational Bottlenecks</h3>
                            <p className='text-xs text-rose-800'>
                                Operational escalations requiring supervisory intervention to unblock workflow deadlines.
                            </p>
                        </div>
                    </div>

                    <div className='space-y-3'>
                        {(monitoringData?.activities || []).filter((a) => a.delayFlag || a.status === 'Delayed').length === 0 ? (
                            <div className='rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 text-center text-emerald-800 space-y-2'>
                                <CheckCircle2 size={32} className='mx-auto text-emerald-600' />
                                <h4 className='font-bold text-sm'>Zero Overdue Activities</h4>
                                <p className='text-xs text-emerald-600'>All operations across your scope are proceeding within scheduled grace periods.</p>
                            </div>
                        ) : (
                            (monitoringData?.activities || []).filter((a) => a.delayFlag || a.status === 'Delayed').map((act) => (
                                <div key={act.id} className='rounded-2xl border border-rose-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                                    <div className='space-y-1'>
                                        <div className='flex items-center gap-2'>
                                            <span className='rounded bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5'>
                                                Delayed / Overdue
                                            </span>
                                            <span className='font-bold text-sm text-slate-900'>{act.activityTitle}</span>
                                        </div>
                                        <div className='text-xs text-slate-600'>
                                            <b>Owner:</b> {act.employeeName} ({act.department} · {act.team}) • <b>Module:</b> {act.moduleRef}
                                        </div>
                                        <div className='text-[11px] text-slate-500'>{act.details}</div>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        <button
                                            onClick={() => setInspectingActivity(act)}
                                            className='rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50'
                                        >
                                            View Diff
                                        </button>
                                        <button
                                            onClick={() => toast.success(`Supervisory escalation reminder dispatched to ${act.employeeName}.`)}
                                            className='rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 whitespace-nowrap'
                                        >
                                            Escalate Reminder ⚡
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* ACTIVITY DETAILS & STRUCTURED DIFF DRAWER / MODAL                         */}
            {/* ========================================================================= */}
            {inspectingActivity && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'>
                    <div className='bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <div className='flex items-center gap-2.5'>
                                <div className='p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100'>
                                    <GitCommit size={18} />
                                </div>
                                <div>
                                    <h3 className='text-sm font-bold text-slate-900'>Activity Audit & Diff Inspector</h3>
                                    <p className='text-[11px] text-slate-400 font-mono'>{inspectingActivity.id} • {inspectingActivity.timestamp}</p>
                                </div>
                            </div>
                            <button
                                type='button'
                                onClick={() => setInspectingActivity(null)}
                                className='p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition'
                            >
                                <XCircle size={18} />
                            </button>
                        </div>

                        {/* Metadata Grid */}
                        <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100'>
                            <div>
                                <span className='text-[10px] uppercase font-bold text-slate-400 block'>Actor</span>
                                <span className='font-semibold text-slate-900'>{inspectingActivity.employeeName}</span>
                                <span className='text-[10px] text-slate-500 block'>{inspectingActivity.employeeId}</span>
                            </div>
                            <div>
                                <span className='text-[10px] uppercase font-bold text-slate-400 block'>Role & Scope</span>
                                <span className='font-semibold text-slate-900'>{inspectingActivity.role}</span>
                                <span className='text-[10px] text-slate-500 block'>{inspectingActivity.department}</span>
                            </div>
                            <div>
                                <span className='text-[10px] uppercase font-bold text-slate-400 block'>Team</span>
                                <span className='font-semibold text-blue-600'>{inspectingActivity.team}</span>
                            </div>
                            <div>
                                <span className='text-[10px] uppercase font-bold text-slate-400 block'>Action Protocol</span>
                                <span className='font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full inline-block border border-indigo-200 mt-0.5'>
                                    {inspectingActivity.action}
                                </span>
                            </div>
                            <div>
                                <span className='text-[10px] uppercase font-bold text-slate-400 block'>Duration</span>
                                <span className='font-mono text-slate-700'>{inspectingActivity.duration}</span>
                            </div>
                            <div>
                                <span className='text-[10px] uppercase font-bold text-slate-400 block'>Task Status</span>
                                <span className='font-semibold text-emerald-700'>{inspectingActivity.status}</span>
                            </div>
                            <div>
                                <span className='text-[10px] uppercase font-bold text-slate-400 block'>Page Accessed</span>
                                <span className='font-mono text-[11px] text-slate-600 truncate block'>{inspectingActivity.pageAccessed}</span>
                            </div>
                            <div>
                                <span className='text-[10px] uppercase font-bold text-slate-400 block'>Network IP</span>
                                <span className='font-mono text-[11px] text-slate-600'>{inspectingActivity.ipAddress}</span>
                            </div>
                            <div>
                                <span className='text-[10px] uppercase font-bold text-slate-400 block'>Session ID</span>
                                <span className='font-mono text-[11px] text-slate-600'>{inspectingActivity.sessionId}</span>
                            </div>
                        </div>

                        {/* Title & Description */}
                        <div className='space-y-1 text-xs'>
                            <h4 className='font-bold text-slate-900'>{inspectingActivity.activityTitle}</h4>
                            <p className='text-slate-600 leading-relaxed'>{inspectingActivity.details}</p>
                        </div>

                        {/* Structured Before/After Diff Viewer */}
                        <div className='space-y-2 pt-2 border-t border-slate-100'>
                            <div className='flex items-center justify-between'>
                                <h4 className='text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5'>
                                    <Code2 size={14} className='text-blue-600' />
                                    <span>Before & After State Diff</span>
                                </h4>
                                <span className='text-[10px] text-slate-400'>Audit Trail Verification</span>
                            </div>

                            {inspectingActivity.previousValues || inspectingActivity.updatedValues ? (
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-xs'>
                                    {/* Previous State */}
                                    <div className='rounded-xl border border-rose-200 bg-rose-50/40 p-3 space-y-1.5'>
                                        <div className='text-[11px] font-bold text-rose-800 flex items-center gap-1'>
                                            <span>Previous Values (Before)</span>
                                        </div>
                                        {inspectingActivity.previousValues ? (
                                            <pre className='text-[11px] font-mono bg-white p-2.5 rounded-lg border border-rose-100 text-slate-700 overflow-x-auto whitespace-pre-wrap'>
                                                {JSON.stringify(inspectingActivity.previousValues, null, 2)}
                                            </pre>
                                        ) : (
                                            <div className='text-[11px] text-slate-400 italic p-2'>None (Initial Record Creation)</div>
                                        )}
                                    </div>

                                    {/* Updated State */}
                                    <div className='rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 space-y-1.5'>
                                        <div className='text-[11px] font-bold text-emerald-800 flex items-center gap-1'>
                                            <span>Updated Values (After)</span>
                                        </div>
                                        {inspectingActivity.updatedValues ? (
                                            <pre className='text-[11px] font-mono bg-white p-2.5 rounded-lg border border-emerald-100 text-slate-700 overflow-x-auto whitespace-pre-wrap'>
                                                {JSON.stringify(inspectingActivity.updatedValues, null, 2)}
                                            </pre>
                                        ) : (
                                            <div className='text-[11px] text-slate-400 italic p-2'>No mutated state payload</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className='p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500'>
                                    <span>Standard operational event execution without state mutations.</span>
                                </div>
                            )}
                        </div>

                        {/* Evidence attachment link */}
                        {inspectingActivity.evidence && (
                            <div className='flex items-center justify-between text-xs p-3 rounded-xl bg-blue-50/50 border border-blue-100'>
                                <span className='text-slate-600'>Attached Verification Evidence:</span>
                                <span className='font-mono font-semibold text-blue-700'>📎 {inspectingActivity.evidence}</span>
                            </div>
                        )}

                        <div className='flex items-center justify-end pt-3 border-t border-slate-100'>
                            <button
                                type='button'
                                onClick={() => setInspectingActivity(null)}
                                className='px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition'
                            >
                                Close Inspector
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HOD REVIEW MODAL */}
            {selectedActivityForReview && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'>
                    <div className='bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <div className='flex items-center gap-2'>
                                <ShieldCheck className='text-blue-600' size={20} />
                                <h3 className='text-sm font-bold text-slate-800'>Supervisory Activity Sign-Off</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedActivityForReview(null)}
                                className='p-1 text-slate-400 hover:text-slate-600 rounded-lg'
                            >
                                <XCircle size={18} />
                            </button>
                        </div>

                        <div className='bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5'>
                            <div><strong className='text-slate-700'>Activity:</strong> {selectedActivityForReview.activityTitle}</div>
                            <div><strong className='text-slate-700'>Owner:</strong> {selectedActivityForReview.employeeName} ({selectedActivityForReview.department} · {selectedActivityForReview.team})</div>
                            <div><strong className='text-slate-700'>Module:</strong> {selectedActivityForReview.moduleRef}</div>
                            <div><strong className='text-slate-700'>Details:</strong> {selectedActivityForReview.details}</div>
                        </div>

                        <form onSubmit={handleCommitReview} className='space-y-3 text-xs'>
                            <div>
                                <label className='font-semibold text-slate-700 block mb-1'>Review Decision</label>
                                <select
                                    value={reviewDecision}
                                    onChange={(e) => setReviewDecision(e.target.value)}
                                    className='w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-blue-600'
                                >
                                    <option value='Approved'>Approved (Endorse & Sign Off)</option>
                                    <option value='Needs Revision'>Needs Revision (Request Subordinate Rework)</option>
                                    <option value='Escalated'>Escalate to Executive Leadership</option>
                                </select>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 block mb-1'>
                                    Supervisory Remarks / Feedback {reviewDecision !== 'Approved' && <span className='text-rose-500'>*</span>}
                                </label>
                                <textarea
                                    rows={3}
                                    value={reviewRemarks}
                                    onChange={(e) => setReviewRemarks(e.target.value)}
                                    placeholder='Provide feedback, directives, or approval comments...'
                                    className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-2 border-t'>
                                <button
                                    type='button'
                                    onClick={() => setSelectedActivityForReview(null)}
                                    className='px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs'
                                >
                                    Submit Decision
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
