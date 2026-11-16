import { applyWorkflowDecision, WORKFLOW_TYPES } from '../approvals/approvalEngine.js'
/**
 * Hierarchical Employee Activity Monitoring Data Engine
 * Aggregates operational activities across all departments to provide
 * managerial transparency and upward accountability.
 */

import { ENTERPRISE_EMPLOYEES } from '../AttendanceAndLeave/attendanceLeaveData.js'

export const ACTIVITY_STORAGE_KEY = 'schoolerp-employee-activities-v1'

let _memoryActivities = null

export const INITIAL_EMPLOYEE_ACTIVITIES = [
    {
        id: 'ACT-2026-001',
        timestamp: '31-10-2026 10:45 AM',
        date: '31-10-2026',
        employeeId: 'EMP-TCH-006',
        employeeName: 'Ananya Roy',
        roleKey: 'teacher',
        department: 'Academics & Teaching',
        reportingManagerId: 'EMP-CRD-001',
        activityType: 'Ticket Action',
        title: 'Raised IT Support Ticket for Science Lab 2 Smartboard',
        description: 'Reported optical touch sensor failure disrupting Grade 11-A practicals.',
        moduleRef: 'Department Ticketing',
        referenceId: 'TICK-2026-001',
        statusBefore: 'None',
        statusAfter: 'Submitted',
        delayFlag: false,
        evidence: 'smartboard_sensor_error.jpg'
    },
    {
        id: 'ACT-2026-002',
        timestamp: '31-10-2026 10:45 AM',
        date: '31-10-2026',
        employeeId: 'EMP-HK-001',
        employeeName: 'Savitri Devi',
        roleKey: 'housekeeping-manager',
        department: 'Facilities & Campus Sanitation',
        reportingManagerId: 'EMP-SUP-001',
        activityType: 'Ticket Resolution',
        title: 'Resolved Critical Plumbing Ticket for 3rd Floor Restrooms',
        description: 'Dispatched maintenance technician, reset booster pump relay and restored water lines.',
        moduleRef: 'Department Ticketing',
        referenceId: 'TICK-2026-002',
        statusBefore: 'In Progress',
        statusAfter: 'Resolved',
        delayFlag: false,
        evidence: 'pressure_gauge_test_pass.pdf'
    },
    {
        id: 'ACT-2026-003',
        timestamp: '31-10-2026 10:15 AM',
        date: '31-10-2026',
        employeeId: 'EMP-GKM-001',
        employeeName: 'Bhawani Singh',
        roleKey: 'gatekeeper-manager',
        department: 'Campus Security & Access Control',
        reportingManagerId: 'EMP-SUP-001',
        activityType: 'Gate Clearance',
        title: 'Security Clearance for Inter-School Expo Projector Returnable Pass',
        description: 'Conducted physical asset inspection on School Van #04 with Driver Jaswant Singh.',
        moduleRef: 'Gate Pass & Security',
        referenceId: 'GP-2026-001',
        statusBefore: 'Stores Verified',
        statusAfter: 'Security Cleared Out',
        delayFlag: false,
        evidence: null
    },
    {
        id: 'ACT-2026-004',
        timestamp: '31-10-2026 09:30 AM',
        date: '31-10-2026',
        employeeId: 'EMP-STR-001',
        employeeName: 'Gurpreet Singh',
        roleKey: 'stationery-store-manager',
        department: 'Stores & Procurement',
        reportingManagerId: 'EMP-SUP-001',
        activityType: 'Goods Receipt',
        title: 'Posted GRN-2026-001 & Updated Inventory for HP Toner Cartridges',
        description: 'Verified 10 OEM packs against PO-2026-002. Stock levels incremented in central store.',
        moduleRef: 'Stores & Procurement',
        referenceId: 'GRN-2026-001',
        statusBefore: 'Sent to Vendor',
        statusAfter: 'Fully Received',
        delayFlag: false,
        evidence: 'delivery_challan_scan.pdf'
    },
    {
        id: 'ACT-2026-005',
        timestamp: '31-10-2026 09:10 AM',
        date: '31-10-2026',
        employeeId: 'EMP-DRV-001',
        employeeName: 'Jaswant Singh',
        roleKey: 'driver',
        department: 'Transport & Fleet Logistics',
        reportingManagerId: 'EMP-TRN-001',
        activityType: 'Transport Trip',
        title: 'Completed Morning Route #04 Student Onboarding & Drop',
        description: 'Transported 34 students safely to campus. Zero transit incidents logged.',
        moduleRef: 'Transport Management',
        referenceId: 'TRIP-RT04-M',
        statusBefore: 'In Transit',
        statusAfter: 'Completed',
        delayFlag: false,
        evidence: null
    },
    {
        id: 'ACT-2026-006',
        timestamp: '30-10-2026 04:30 PM',
        date: '30-10-2026',
        employeeId: 'EMP-LIB-001',
        employeeName: 'Meenakshi Sundaram',
        roleKey: 'librarian',
        department: 'Academics & Teaching',
        reportingManagerId: 'EMP-PRN-001',
        activityType: 'File Room Action',
        title: 'Inwarded Grade 10 Board Tabulation Dossier into Central File Archive',
        description: 'Indexed sealed mark sheets under Rack A, Shelf 02. Barcode FILE-2026-001 assigned.',
        moduleRef: 'File Room',
        referenceId: 'INW-2026-001',
        statusBefore: 'None',
        statusAfter: 'In File Room',
        delayFlag: false,
        evidence: 'sealed_envelope_index.pdf'
    },
    {
        id: 'ACT-2026-007',
        timestamp: '30-10-2026 02:00 PM',
        date: '30-10-2026',
        employeeId: 'EMP-ADM-001',
        employeeName: 'Suresh Raina',
        roleKey: 'admin',
        department: 'Administration',
        reportingManagerId: 'EMP-SUP-001',
        activityType: 'Task Execution',
        title: 'Completed Quarterly Fire & Safety Extinguisher Audit Coordination',
        description: 'Accompanied TNDFRS inspector, conducted hydrant pressure checks and filed report.',
        moduleRef: 'Task Management',
        referenceId: 'TSK-ADM-001',
        statusBefore: 'In Progress',
        statusAfter: 'Completed',
        delayFlag: false,
        evidence: 'fire_safety_audit_signed.pdf'
    },
    {
        id: 'ACT-2026-008',
        timestamp: '31-10-2026 08:50 AM',
        date: '31-10-2026',
        employeeId: 'EMP-PRN-001',
        employeeName: 'Dr. Ramanathan K',
        roleKey: 'principal',
        department: 'Academics & Teaching',
        reportingManagerId: 'EMP-DIR-001',
        activityType: 'Login / Logout',
        title: 'Principal Administrative Sign-In Session',
        description: 'Authorized 2FA terminal session from Campus Administrative Office.',
        moduleRef: 'Identity & Access',
        referenceId: 'AUTH-2026-108',
        statusBefore: 'None',
        statusAfter: 'Completed',
        delayFlag: false,
        evidence: null
    },
    {
        id: 'ACT-2026-009',
        timestamp: '31-10-2026 11:20 AM',
        date: '31-10-2026',
        employeeId: 'EMP-CRD-001',
        employeeName: 'Kavita Menon',
        roleKey: 'coordinator',
        department: 'Academics & Teaching',
        reportingManagerId: 'EMP-PRN-001',
        activityType: 'Page Visit',
        title: 'Inspected Grade 10 Science Lesson Plans & Practical Schedules',
        description: 'Reviewed curriculum milestones and practical safety compliance for Q3 syllabus.',
        moduleRef: 'Curriculum & Plans',
        referenceId: 'VISIT-2026-009',
        statusBefore: 'None',
        statusAfter: 'Completed',
        delayFlag: false,
        evidence: null
    },
    {
        id: 'ACT-2026-010',
        timestamp: '31-10-2026 12:15 PM',
        date: '31-10-2026',
        employeeId: 'EMP-ACC-001',
        employeeName: 'Rajesh Sharma',
        roleKey: 'account-head',
        department: 'Finance & Accounts',
        reportingManagerId: 'EMP-DIR-001',
        activityType: 'Form Submit',
        title: 'Submitted Monthly Student Fee Reconciliation Ledger',
        description: 'Reconciled Term-2 tuition fee collections against bank gateway settlement statement.',
        moduleRef: 'Finance & Fee Collection',
        referenceId: 'FEE-REC-2026-10',
        statusBefore: 'Draft',
        statusAfter: 'Submitted',
        delayFlag: false,
        evidence: 'bank_statement_oct2026.pdf'
    },
    {
        id: 'ACT-2026-011',
        timestamp: '31-10-2026 01:45 PM',
        date: '31-10-2026',
        employeeId: 'EMP-HR-001',
        employeeName: 'Priya Narayanan',
        roleKey: 'hr',
        department: 'Human Resources (HR)',
        reportingManagerId: 'EMP-DIR-001',
        activityType: 'Download / Export',
        title: 'Exported Staff Biometric Attendance Ledger for Payroll Processing',
        description: 'Generated consolidated monthly punch logs and regularizations CSV for Accounts.',
        moduleRef: 'Attendance & Leave',
        referenceId: 'EXP-ATT-2026-11',
        statusBefore: 'None',
        statusAfter: 'Completed',
        delayFlag: false,
        evidence: 'attendance_oct_export.csv'
    },
    {
        id: 'ACT-2026-012',
        timestamp: '31-10-2026 02:30 PM',
        date: '31-10-2026',
        employeeId: 'EMP-MNT-001',
        employeeName: 'Vikram Joshi',
        roleKey: 'maintenance-manager',
        department: 'Facilities & Campus Sanitation',
        reportingManagerId: 'EMP-SUP-001',
        activityType: 'Upload Action',
        title: 'Uploaded 250kVA DG Generator Service & Load Test Report',
        description: 'Attached maintenance log and statutory emissions certificate from OEM engineer.',
        moduleRef: 'Campus Maintenance',
        referenceId: 'UPL-DG-2026-12',
        statusBefore: 'Draft',
        statusAfter: 'Submitted',
        delayFlag: false,
        evidence: 'dg_genset_test_certificate.pdf'
    },
    {
        id: 'ACT-2026-013',
        timestamp: '31-10-2026 03:15 PM',
        date: '31-10-2026',
        employeeId: 'EMP-IT-001',
        employeeName: 'Rahul Verma',
        roleKey: 'it-support-manager',
        department: 'IT Support & Systems',
        reportingManagerId: 'EMP-SUP-001',
        activityType: 'Print Action',
        title: 'Printed IT Asset Audit Barcode Labels for Physics Lab PCs',
        description: 'Generated and printed 40 weatherproof QR code asset identification stickers.',
        moduleRef: 'Asset Management',
        referenceId: 'PRT-ASSET-2026-13',
        statusBefore: 'None',
        statusAfter: 'Completed',
        delayFlag: false,
        evidence: null
    }
]

// Storage Accessors
export const getAllEmployeeActivities = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryActivities && Array.isArray(_memoryActivities) && _memoryActivities.length > 0) {
        return _memoryActivities
    }
    _memoryActivities = [...INITIAL_EMPLOYEE_ACTIVITIES]
    saveEmployeeActivities(_memoryActivities)
    return _memoryActivities
}

export const saveEmployeeActivities = (activities) => {
    _memoryActivities = activities
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activities))
        }
    } catch {
        /* ignore */
    }
}

export const logEmployeeActivity = ({
    employeeId,
    employeeName,
    roleKey,
    department,
    reportingManagerId = '',
    activityType,
    title,
    description = '',
    moduleRef,
    referenceId = '',
    statusBefore = '-',
    statusAfter = '-',
    evidence = null,
    delayFlag = false
}) => {
    const activities = getAllEmployeeActivities()
    const nextSeq = activities.length + 1
    const newId = `ACT-2026-${String(nextSeq).padStart(3, '0')}`

    const now = new Date()
    const nowStr = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const newActivity = {
        id: newId,
        timestamp: nowStr,
        date: now.toLocaleDateString('en-GB'),
        employeeId,
        employeeName,
        roleKey,
        department,
        reportingManagerId,
        activityType,
        title,
        description,
        moduleRef,
        referenceId,
        statusBefore,
        statusAfter,
        delayFlag,
        evidence
    }

    const updated = [newActivity, ...activities]
    saveEmployeeActivities(updated)
    return newActivity
}

export const ACTIVITY_TYPES = [
    'Login / Logout',
    'Page Visit',
    'Form Submit',
    'Print Action',
    'Download / Export',
    'Upload Action',
    'Ticket Action',
    'Ticket Resolution',
    'Gate Clearance',
    'Goods Receipt',
    'Transport Trip',
    'File Room Action',
    'Task Execution'
]

/**
 * Returns hierarchically scoped activity metrics and drill-down data
 */
export const getHierarchicalActivityMonitoring = ({
    userRole,
    viewerRole,
    userDept = '',
    userId = '',
    viewerEmployeeId,
    userName = '',
    viewerName = '',
    user = null,
    targetDept = 'ALL',
    departmentFilter,
    targetEmployeeId = 'ALL',
    employeeFilter,
    roleFilter = 'ALL',
    targetRole = 'ALL',
    dateFilter = 'ALL',
    activityTypeFilter = 'ALL',
    statusFilter = 'ALL',
    reviewStatusFilter = 'ALL'
}) => {
    const effectiveRole = userRole || viewerRole || 'director'
    const effectiveUserId = userId || viewerEmployeeId || ''
    const effectiveUserName = userName || viewerName || (user?.name || user?.employeeName) || ''
    const effectiveDept = targetDept !== 'ALL' ? targetDept : (departmentFilter || 'ALL')
    const effectiveEmpId = targetEmployeeId !== 'ALL' ? targetEmployeeId : (employeeFilter || 'ALL')
    const effectiveRoleFilter = targetRole !== 'ALL' ? targetRole : (roleFilter || 'ALL')
    const all = getAllEmployeeActivities()
    const normalizedRole = (effectiveRole || '').trim().toLowerCase()
    const cleanRole = normalizedRole.replace(/[-_\s]/g, '')

    // 1. Hierarchical Scoping
    let scoped = all
    if (['director', 'superadmin', 'md'].includes(cleanRole)) {
        // Super Admin and Managing Director (Director) see all departments, roles, and users
        scoped = all
    } else if (['principal', 'seniorprincipal'].includes(cleanRole)) {
        // Principal sees Academic and Administrative operations
        scoped = all.filter((a) => a.department.includes('Academic') || a.department === 'Administration')
    } else if (['coordinator', 'academichead'].includes(cleanRole)) {
        // Coordinator sees Academic staff (teachers)
        scoped = all.filter((a) => a.department.includes('Academic'))
    } else {
        // Department Heads / Managers: Scope to department
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
            'admin': 'Administration',
            'jointdirector': 'Campus Operations',
            'jointdirectorassistant': 'Campus Operations',
            'jointdirectoraudit': 'Internal Audit',
            'qualityauditor': 'Internal Audit',
            'processauditor': 'Internal Audit'
        }
        const assignedDept = deptHeadMap[cleanRole] || userDept
        if (assignedDept) {
            const matchesDept = (dept) => Array.isArray(assignedDept) ? assignedDept.includes(dept) : dept === assignedDept
            scoped = all.filter((a) => matchesDept(a.department) || (effectiveUserId && a.employeeId === effectiveUserId))
        } else {
            // Operational staff see strictly their own activities
            scoped = all.filter((a) =>
                effectiveUserId
                    ? (a.employeeId === effectiveUserId || (effectiveUserName && a.employeeName === effectiveUserName))
                    : (a.roleKey && a.roleKey.replace(/[-_\s]/g, '') === cleanRole)
            )
        }
    }

    // 2. Apply Dynamic UI Filters
    let filtered = scoped
    if (effectiveDept !== 'ALL') {
        filtered = filtered.filter((a) => a.department === effectiveDept)
    }
    if (effectiveEmpId !== 'ALL') {
        filtered = filtered.filter((a) => a.employeeId === effectiveEmpId)
    }
    if (effectiveRoleFilter !== 'ALL') {
        const targetClean = effectiveRoleFilter.toLowerCase().replace(/[-_\s]/g, '')
        filtered = filtered.filter((a) => {
            const r = (a.roleKey || a.role || '').toLowerCase().replace(/[-_\s]/g, '')
            return r === targetClean || (a.role && a.role.toLowerCase() === effectiveRoleFilter.toLowerCase())
        })
    }
    if (activityTypeFilter !== 'ALL') {
        filtered = filtered.filter((a) => a.activityType === activityTypeFilter)
    }
    if (statusFilter !== 'ALL') {
        filtered = filtered.filter((a) => (a.statusAfter || a.status) === statusFilter)
    }
    if (reviewStatusFilter !== 'ALL') {
        filtered = filtered.filter((a) => (a.reviewStatus || 'Pending Approval') === reviewStatusFilter)
    }
    if (dateFilter !== 'ALL') {
        const todayStr = new Date().toLocaleDateString('en-GB')
        if (dateFilter === 'TODAY') {
            filtered = filtered.filter((a) => a.date === todayStr || (a.timestamp && a.timestamp.includes(todayStr)))
        } else if (dateFilter === 'LAST_7_DAYS') {
            filtered = filtered.filter((a) => Boolean(a.timestamp || a.date))
        } else {
            filtered = filtered.filter((a) => a.date === dateFilter || (a.timestamp && a.timestamp.includes(dateFilter)))
        }
    }

    // 3. Compute Summary KPIs
    const todayStr = new Date().toLocaleDateString('en-GB')
    const totalActivities = filtered.length
    const todayActivities = filtered.filter((a) => a.date === todayStr).length
    const completedActivities = filtered.filter((a) => ['Completed', 'Resolved', 'Fully Received', 'Security Cleared Out'].includes(a.statusAfter || a.status)).length
    const inProgressActivities = filtered.filter((a) => ['In Progress', 'Assigned', 'Submitted'].includes(a.statusAfter || a.status)).length
    const delayedActivities = filtered.filter((a) => a.delayFlag || a.status === 'Delayed').length

    // Ticket activities count
    const ticketActivities = filtered.filter((a) => (a.activityType || '').toLowerCase().includes('ticket'))
    const resolvedTicketActivities = ticketActivities.filter((a) => ['Completed', 'Resolved'].includes(a.statusAfter || a.status))
    const ticketsClosed = resolvedTicketActivities.length > 0 ? resolvedTicketActivities.length : completedActivities

    // 4. Department Breakdown (Structured Dictionary with total, completed, delayed + Array compatibility)
    const departmentBreakdownDict = {}
    scoped.forEach((a) => {
        const dept = a.department || 'Unassigned'
        if (!departmentBreakdownDict[dept]) {
            departmentBreakdownDict[dept] = {
                department: dept,
                total: 0,
                count: 0,
                completed: 0,
                inProgress: 0,
                delayed: 0
            }
        }
        departmentBreakdownDict[dept].total += 1
        departmentBreakdownDict[dept].count += 1
        if (['Completed', 'Resolved', 'Fully Received', 'Security Cleared Out'].includes(a.statusAfter || a.status)) {
            departmentBreakdownDict[dept].completed += 1
        } else if (['In Progress', 'Assigned', 'Submitted'].includes(a.statusAfter || a.status)) {
            departmentBreakdownDict[dept].inProgress += 1
        }
        if (a.delayFlag || a.status === 'Delayed') {
            departmentBreakdownDict[dept].delayed += 1
        }
    })

    const deptArray = Object.entries(departmentBreakdownDict).map(([department, stats]) => ({
        department,
        count: stats.total,
        total: stats.total,
        completed: stats.completed,
        delayed: stats.delayed,
        inProgress: stats.inProgress
    }))
    const departmentBreakdown = Object.assign(deptArray, departmentBreakdownDict)

    // 5. Subordinate Performers Summary
    const employeeMap = {}
    scoped.forEach((a) => {
        if (!employeeMap[a.employeeId]) {
            employeeMap[a.employeeId] = {
                employeeId: a.employeeId,
                employeeName: a.employeeName,
                department: a.department,
                total: 0,
                completed: 0,
                inProgress: 0,
                lastActivity: a.timestamp
            }
        }
        employeeMap[a.employeeId].total += 1
        if (['Completed', 'Resolved', 'Fully Received', 'Security Cleared Out'].includes(a.statusAfter || a.status)) {
            employeeMap[a.employeeId].completed += 1
        } else {
            employeeMap[a.employeeId].inProgress += 1
        }
    })

    const normalizedStream = filtered.map((a) => ({
        ...a,
        id: a.id,
        timestamp: a.timestamp,
        date: a.date,
        employeeId: a.employeeId,
        employeeName: a.employeeName,
        role: a.roleKey || a.role || 'Staff',
        roleKey: a.roleKey || a.role || 'staff',
        department: a.department,
        category: a.moduleRef || a.activityType || 'General Task',
        activityType: a.activityType,
        activityTitle: a.title || a.activityTitle,
        title: a.title || a.activityTitle,
        details: a.description || a.details || '',
        description: a.description || a.details || '',
        status: a.statusAfter || a.status || 'Completed',
        statusBefore: a.statusBefore || 'None',
        statusAfter: a.statusAfter || 'Completed',
        reviewStatus: a.reviewStatus || 'Pending Approval',
        reviewedBy: a.reviewedBy || null,
        reviewedByRole: a.reviewedByRole || null,
        reviewedAt: a.reviewedAt || null,
        reviewRemarks: a.reviewRemarks || '',
        approvalHistory: a.approvalHistory || [],
        delayFlag: Boolean(a.delayFlag),
        evidence: a.evidence || null
    }))

    const pendingReviewCount = normalizedStream.filter((a) => a.reviewStatus === 'Pending Approval').length
    const approvedReviewCount = normalizedStream.filter((a) => a.reviewStatus === 'Approved').length
    const needsRevisionCount = normalizedStream.filter((a) => a.reviewStatus === 'Needs Revision').length

    return {
        summary: {
            totalActivities,
            todayActivities,
            completedActivities,
            completedTasks: completedActivities,
            inProgressActivities,
            pendingTasks: inProgressActivities,
            delayedActivities,
            ticketsClosed,
            pendingReviewCount,
            approvedReviewCount,
            needsRevisionCount,
            departmentBreakdown: departmentBreakdownDict
        },
        departmentBreakdown,
        subordinatePerformers: Object.values(employeeMap),
        activities: normalizedStream,
        activityStream: normalizedStream
    }
}



export const reviewEmployeeActivity = ({
    activityId,
    decision, // 'Approved' | 'Needs Revision'
    reviewerName,
    reviewerRole,
    remarks
}) => {
    const list = getAllEmployeeActivities()
    const index = list.findIndex((a) => a.id === activityId)
    if (index === -1) throw new Error(`Activity record not found: ${activityId}`)

    const current = list[index]
    const updated = applyWorkflowDecision({
        workflowType: WORKFLOW_TYPES.EMPLOYEE_DAILY_ACTIVITY,
        entity: {
            ...current,
            status: current.reviewStatus || 'Submitted'
        },
        decision: decision === 'Approved' ? 'Approved' : 'Needs Revision',
        actor: reviewerName,
        actorRole: reviewerRole,
        remarks
    })

    updated.reviewStatus = updated.status
    updated.reviewedBy = reviewerName
    updated.reviewedByRole = reviewerRole
    updated.reviewedAt = new Date().toISOString()
    updated.reviewRemarks = remarks || ''

    list[index] = updated
    saveEmployeeActivities(list)
    return updated
}
