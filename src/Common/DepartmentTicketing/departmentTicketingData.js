/**
 * Centralized Department-Wise Ticketing & SLA Data Engine
 * Single Source of Truth for:
 * - Dynamic Department Master & Target Queue Routing
 * - Department-Tailored Issue Categories & Priority Matrix
 * - SLA Hour Calculation & Auto-Escalation Triggers
 * - Ticket Assignment, In-Progress Updates & Public/Internal Timeline
 * - Resolution Verification, Requester Confirmation & Reopening Workflow
 */

import { recordAuditLog, dispatchNotification } from '../AuditAndNotifications/centralAuditEngine.js'

export const TICKETS_STORAGE_KEY = 'schoolerp-department-tickets-v1'

let _memoryTickets = null

// Dynamic Department Master & Manager Mapping
export const DEPARTMENT_CONFIGS = [
    {
        name: 'IT Support & Systems',
        code: 'IT',
        managerId: 'EMP-IT-001',
        managerName: 'Rakesh Nair',
        managerRole: 'it-support-manager',
        slaTargetHours: { Critical: 4, High: 12, Medium: 24, Low: 48 },
        categories: [
            'Classroom Interactive Smartboard / Projector',
            'Campus WiFi & LAN Network Connectivity',
            'Computer Lab Hardware & Peripherals',
            'ERP Portal Access & Authentication',
            'Printer / Copier Network Fault',
            'Software Installation & OS Licensing'
        ]
    },
    {
        name: 'Facilities & Campus Sanitation',
        code: 'HK',
        managerId: 'EMP-HK-001',
        managerName: 'Savitri Devi',
        managerRole: 'housekeeping-manager',
        slaTargetHours: { Critical: 2, High: 6, Medium: 12, Low: 24 },
        categories: [
            'Classroom / Laboratory Deep Cleaning',
            'Restroom Sanitation & Consumable Refill',
            'Campus Waste Management & Garbage Clearance',
            'Water Cooler & Dispenser Sanitization',
            'Pest Control & Fumigation Service'
        ]
    },
    {
        name: 'Maintenance & Electrical',
        code: 'MNT',
        managerId: 'EMP-MNT-001',
        managerName: 'Gopalakrishnan R',
        managerRole: 'maintenancemanager',
        slaTargetHours: { Critical: 2, High: 8, Medium: 24, Low: 48 },
        categories: [
            'Electrical Power Outage / MCB Tripping',
            'Air Conditioning (HVAC) Cooling Malfunction',
            'Plumbing Leakage & Restroom Fitting Repair',
            'Desk, Bench & Classroom Carpentry',
            'Masonry, Painting & Door/Window Repairs'
        ]
    },
    {
        name: 'Transport & Fleet Logistics',
        code: 'TRN',
        managerId: 'EMP-TRN-001',
        managerName: 'Dharmesh Patel',
        managerRole: 'transport-manager',
        slaTargetHours: { Critical: 2, High: 6, Medium: 24, Low: 48 },
        categories: [
            'School Bus Route & Timing Adjustment',
            'Student Pickup / Drop Point Reallocation',
            'Bus GPS Live Tracking Issue',
            'Driver / Conductor Service Feedback',
            'Emergency Vehicle Breakdown Support'
        ]
    },
    {
        name: 'Stores & Procurement',
        code: 'STR',
        managerId: 'EMP-STR-001',
        managerName: 'Gurpreet Singh',
        managerRole: 'stationery-store-manager',
        slaTargetHours: { Critical: 4, High: 12, Medium: 24, Low: 72 },
        categories: [
            'Urgent Examination Stationery Shortage',
            'Science Laboratory Reagent Dispensing',
            'Defective Batch Item Replacement',
            'Asset Tagging & Furniture Allocation'
        ]
    },
    {
        name: 'Human Resources (HR)',
        code: 'HR',
        managerId: 'EMP-HR-001',
        managerName: 'Sunita Deshmukh',
        managerRole: 'hr',
        slaTargetHours: { Critical: 12, High: 24, Medium: 48, Low: 72 },
        categories: [
            'Salary Slip & Direct Deposit Query',
            'Provident Fund (PF) & Gratuity Assistance',
            'Medical Insurance & Cashless Card Claims',
            'Faculty Experience Certificate & NOC',
            'Staff Child Tuition Fee Concession'
        ]
    },
    {
        name: 'Finance & Accounts',
        code: 'FIN',
        managerId: 'EMP-ACC-001',
        managerName: 'K. Venkataraman',
        managerRole: 'account-head',
        slaTargetHours: { Critical: 8, High: 24, Medium: 48, Low: 72 },
        categories: [
            'Department Requisition Budget Allocation',
            'Vendor Invoice 3-Way Matching & Payment',
            'Staff Travel & Reimbursement Settlement',
            'Student Fee Challan Reconciliation'
        ]
    },
    {
        name: 'Campus Security & Access Control',
        code: 'SEC',
        managerId: 'EMP-GKM-001',
        managerName: 'Bhawani Singh',
        managerRole: 'gatekeeper-manager',
        slaTargetHours: { Critical: 2, High: 6, Medium: 24, Low: 48 },
        categories: [
            'Emergency Campus Gate Lockdown Support',
            'Lost Student ID Card Gate Transit Pass',
            'Unauthorized Parking & Gate Traffic Control',
            'CCTV Surveillance Footage Review Request'
        ]
    },
    {
        name: 'Academics & Teaching',
        code: 'ACAD',
        managerId: 'EMP-CRD-001',
        managerName: 'Kavita Menon',
        managerRole: 'coordinator',
        slaTargetHours: { Critical: 4, High: 12, Medium: 24, Low: 48 },
        categories: [
            'Substitute Teacher Emergency Assignment',
            'Timetable Classroom Clash Rectification',
            'Examination Schedule Overlap Grievance',
            'Class Section Student Transfer Review'
        ]
    }
]

// Initial Seed Tickets
export const INITIAL_TICKETS = [
    {
        id: 'TICK-2026-001',
        ticketTitle: 'Primary Science Lab 2 Smartboard Optical Sensor Failure',
        targetDepartment: 'IT Support & Systems',
        issueCategory: 'Classroom Interactive Smartboard / Projector',
        priority: 'High',
        requestedById: 'EMP-TCH-006',
        requestedByName: 'Ananya Roy',
        requestingDepartment: 'Academics & Teaching',
        location: 'Junior Wing, Science Lab 2',
        description: 'Interactive stylus touch is unresponsive on the right quadrant of the screen. Classes disrupted.',
        attachments: [],
        assignedToId: 'EMP-IT-001',
        assignedToName: 'Rakesh Nair (IT Head)',
        slaHours: 12,
        createdDateTime: '31-10-2026 08:30 AM',
        targetResolutionDateTime: '31-10-2026 08:30 PM',
        actualResolutionDateTime: null,
        status: 'In Progress',
        timeline: [
            { timestamp: '31-10-2026 08:30 AM', actorName: 'Ananya Roy', action: 'Created', notes: 'Ticket raised with photo evidence.' },
            { timestamp: '31-10-2026 09:00 AM', actorName: 'Rakesh Nair', action: 'Assigned', notes: 'Assigned to IT hardware team. Sensor recalibration scheduled.' }
        ],
        resolutionSummary: '',
        requesterFeedback: null
    },
    {
        id: 'TICK-2026-002',
        ticketTitle: 'Water Pressure Loss in Senior Secondary Restrooms (3rd Floor)',
        targetDepartment: 'Maintenance & Electrical',
        issueCategory: 'Plumbing Leakage & Restroom Fitting Repair',
        priority: 'Critical',
        requestedById: 'EMP-TCH-014',
        requestedByName: 'Priya Menon',
        requestingDepartment: 'Academics & Teaching',
        location: 'Senior Secondary Block, 3rd Floor East Wing',
        description: 'Overhead overhead tank booster pump tripped. No running water in washrooms during interval.',
        attachments: [],
        assignedToId: 'EMP-HK-001',
        assignedToName: 'Savitri Devi',
        slaHours: 2,
        createdDateTime: '31-10-2026 09:15 AM',
        targetResolutionDateTime: '31-10-2026 11:15 AM',
        actualResolutionDateTime: '31-10-2026 10:45 AM',
        status: 'Resolved',
        timeline: [
            { timestamp: '31-10-2026 09:15 AM', actorName: 'Priya Menon', action: 'Created', notes: 'Urgent ticket raised.' },
            { timestamp: '31-10-2026 09:30 AM', actorName: 'Savitri Devi', action: 'Assigned', notes: 'Plumbing technician dispatched.' },
            { timestamp: '31-10-2026 10:45 AM', actorName: 'Savitri Devi', action: 'Resolved', notes: 'Booster pump reset and airlock cleared. Full pressure restored.' }
        ],
        resolutionSummary: 'Overhead tank pump secondary relay switch reset. Water lines flushed.',
        requesterFeedback: null
    },
    {
        id: 'TICK-2026-003',
        ticketTitle: 'PF UAN Linking Discrepancy for New Faculty Member',
        targetDepartment: 'Human Resources (HR)',
        issueCategory: 'Provident Fund (PF) & Gratuity Assistance',
        priority: 'Medium',
        requestedById: 'EMP-TCH-007',
        requestedByName: 'Dr. Subramanian',
        requestingDepartment: 'Academics & Teaching',
        location: 'Physics Department Faculty Room',
        description: 'Previous employer PF member ID not reflecting in epfindia portal under unified UAN.',
        attachments: [],
        assignedToId: 'EMP-HR-001',
        assignedToName: 'Sunita Deshmukh',
        slaHours: 48,
        createdDateTime: '29-10-2026 11:00 AM',
        targetResolutionDateTime: '31-10-2026 11:00 AM',
        actualResolutionDateTime: null,
        status: 'Assigned',
        timeline: [
            { timestamp: '29-10-2026 11:00 AM', actorName: 'Dr. Subramanian', action: 'Created', notes: 'Form 13 details submitted.' },
            { timestamp: '29-10-2026 02:00 PM', actorName: 'Sunita Deshmukh', action: 'Assigned', notes: 'Coordinating with EPFO zonal desk.' }
        ],
        resolutionSummary: '',
        requesterFeedback: null
    }
]

// Ticket Schema Normalizer to support both legacy and modern property names
export const normalizeTicket = (t) => {
    if (!t) return t
    const ticketId = t.id || t.ticketNumber || 'TICK-2026-000'
    const title = t.ticketTitle || t.title || t.subject || 'Service Request'
    const reqName = t.requestedByName || t.raisedByName || 'Staff Member'
    const reqDept = t.requestingDepartment || t.raisedByDepartment || 'Academics & Teaching'
    const reqId = t.requestedById || t.raisedByEmployeeId || 'EMP-STF-001'
    const assignedName = t.assignedToName || t.assignedStaffName || 'Unassigned'
    const assignedId = t.assignedToId || t.assignedStaffId || ''
    const category = t.issueCategory || t.category || 'General Service'
    const resolutionNotes = t.resolutionSummary || t.resolutionRemarks || ''
    const feedbackObj = typeof t.requesterFeedback === 'object' && t.requesterFeedback !== null
        ? t.requesterFeedback
        : (t.requesterFeedback || t.requesterRating ? { rating: t.requesterRating || 5, comments: String(t.requesterFeedback || ''), feedback: String(t.requesterFeedback || '') } : null)

    return {
        ...t,
        id: ticketId,
        ticketNumber: ticketId,
        ticketTitle: title,
        title: title,
        subject: title,
        requestedByName: reqName,
        raisedByName: reqName,
        requestingDepartment: reqDept,
        raisedByDepartment: reqDept,
        requestedById: reqId,
        raisedByEmployeeId: reqId,
        assignedToName: assignedName,
        assignedStaffName: assignedName,
        assignedToId: assignedId,
        assignedStaffId: assignedId,
        issueCategory: category,
        category: category,
        resolutionSummary: resolutionNotes,
        resolutionRemarks: resolutionNotes,
        requesterRating: feedbackObj?.rating || t.requesterRating || 0,
        requesterFeedback: feedbackObj
    }
}

// Storage Accessors
export const getDepartmentTickets = () => {
    let tickets = []
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(TICKETS_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) tickets = parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (!tickets.length && _memoryTickets && Array.isArray(_memoryTickets) && _memoryTickets.length > 0) {
        tickets = _memoryTickets
    }
    if (!tickets.length) {
        tickets = [...INITIAL_TICKETS]
        saveDepartmentTickets(tickets)
    }
    return tickets.map(normalizeTicket)
}

export const saveDepartmentTickets = (tickets) => {
    _memoryTickets = tickets
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets))
        }
    } catch {
        /* ignore */
    }
}

// Workflows

/**
 * 1. Raise New Ticket for Any Target Department
 */
export const raiseDepartmentTicket = ({
    ticketTitle,
    title,
    subject,
    targetDepartment,
    issueCategory,
    category,
    priority = 'Medium',
    requestedById,
    raisedByEmployeeId,
    requestedByName,
    raisedByName,
    requestingDepartment,
    raisedByDepartment,
    location,
    description,
    attachments = [],
    teamMembers = []
}) => {
    const finalTitle = ticketTitle || title || subject || 'Service Request'
    const finalReqName = requestedByName || raisedByName || 'Staff Member'
    const finalReqId = requestedById || raisedByEmployeeId || 'EMP-STF-001'
    const finalReqDept = requestingDepartment || raisedByDepartment || 'Academics & Teaching'
    const finalCategory = issueCategory || category || 'General Support'

    const deptConfig = DEPARTMENT_CONFIGS.find((d) => d.name === targetDepartment) || DEPARTMENT_CONFIGS[0]
    const slaHours = deptConfig.slaTargetHours[priority] || 24

    const tickets = getDepartmentTickets()
    const nextSeq = tickets.length + 1
    const newId = `TICK-2026-${String(nextSeq).padStart(3, '0')}`

    const now = new Date()
    const nowStr = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const targetResolution = new Date(now.getTime() + slaHours * 3600000)
    const targetStr = targetResolution.toLocaleDateString('en-GB') + ' ' + targetResolution.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const rawTicket = {
        id: newId,
        ticketNumber: newId,
        ticketTitle: finalTitle,
        title: finalTitle,
        subject: finalTitle,
        targetDepartment,
        issueCategory: finalCategory,
        category: finalCategory,
        priority,
        requestedById: finalReqId,
        raisedByEmployeeId: finalReqId,
        requestedByName: finalReqName,
        raisedByName: finalReqName,
        requestingDepartment: finalReqDept,
        raisedByDepartment: finalReqDept,
        location: location || 'Campus Main Block',
        description: description || '',
        attachments,
        teamMembers,
        assignedToId: deptConfig.managerId,
        assignedStaffId: deptConfig.managerId,
        assignedToName: deptConfig.managerName,
        assignedStaffName: deptConfig.managerName,
        slaHours,
        createdDateTime: nowStr,
        targetResolutionDateTime: targetStr,
        actualResolutionDateTime: null,
        status: 'Submitted',
        timeline: [
            {
                timestamp: nowStr,
                actorName: finalReqName,
                action: 'Submitted',
                notes: `Ticket raised for ${targetDepartment}. Priority: ${priority}.`
            }
        ],
        resolutionSummary: '',
        resolutionRemarks: '',
        requesterFeedback: null,
        requesterRating: 0
    }

    const newTicket = normalizeTicket(rawTicket)
    const updated = [newTicket, ...tickets]
    saveDepartmentTickets(updated)

    recordAuditLog({
        actorId: finalReqId,
        actorName: finalReqName,
        module: 'Department Ticketing',
        action: 'RAISE_TICKET',
        entityId: newId,
        previousState: 'None',
        newState: 'Submitted',
        remarks: `${priority} ticket '${finalTitle}' routed to ${targetDepartment}`
    })

    dispatchNotification({
        recipientId: deptConfig.managerId,
        recipientRole: deptConfig.managerRole,
        title: `New Ticket in ${targetDepartment} Queue`,
        message: `${newId} (${priority}): ${finalTitle} reported by ${finalReqName}. SLA: ${slaHours}h.`,
        link: '/department-tickets?tab=queue',
        priority: priority === 'Critical' ? 'Critical' : 'Normal',
        type: 'DEPARTMENT_TICKET'
    })

    return newTicket
}

/**
 * 2. Assign Ticket to Specialist / Staff (Department Head / Manager)
 */
export const assignTicketToStaff = ({
    ticketId,
    ticketNumber,
    assignedToId,
    assignedStaffId,
    assignedToName,
    assignedStaffName,
    managerName = 'Department Manager',
    assignedByStaffName,
    instructions = '',
    notes = ''
}) => {
    const id = ticketId || ticketNumber
    const tickets = getDepartmentTickets()
    const target = tickets.find((t) => t.id === id || t.ticketNumber === id)
    if (!target) throw new Error('Ticket not found.')

    const staffId = assignedToId || assignedStaffId || 'EMP-STF-001'
    const staffName = assignedToName || assignedStaffName || 'Assigned Technician'
    const actor = managerName || assignedByStaffName || 'Department Manager'
    const remarks = instructions || notes || ''

    const oldStatus = target.status
    target.assignedToId = staffId
    target.assignedStaffId = staffId
    target.assignedToName = staffName
    target.assignedStaffName = staffName
    target.status = 'Assigned'

    const nowStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    if (!target.timeline) target.timeline = []
    target.timeline.push({
        timestamp: nowStr,
        actorName: actor,
        action: 'Assigned',
        notes: `Assigned to ${staffName}. ${remarks}`.trim()
    })

    saveDepartmentTickets(tickets)

    recordAuditLog({
        actorName: actor,
        module: 'Department Ticketing',
        action: 'ASSIGN_TICKET',
        entityId: target.id,
        previousState: oldStatus,
        newState: 'Assigned',
        remarks: `Assigned to ${staffName}`
    })

    dispatchNotification({
        recipientId: staffId,
        title: `Ticket ${target.id} Assigned to You`,
        message: `You have been assigned ${target.id}: '${target.ticketTitle}'. Target SLA: ${target.targetResolutionDateTime}.`,
        link: '/department-tickets?tab=assigned',
        type: 'DEPARTMENT_TICKET'
    })

    return normalizeTicket(target)
}

/**
 * 3. Update Ticket Progress / Status (Assigned Staff)
 */
export const updateTicketProgress = ({
    ticketId,
    ticketNumber,
    newStatus,
    status,
    actorName,
    updatedByName,
    workNotes,
    notes,
    resolutionRemarks,
    resolutionSummary = ''
}) => {
    const id = ticketId || ticketNumber
    const finalStatus = newStatus || status || 'In Progress'
    const actor = actorName || updatedByName || 'Technician'
    const workText = workNotes || resolutionRemarks || notes || `Status updated to ${finalStatus}`
    const finalSummary = resolutionSummary || resolutionRemarks || workNotes || ''

    const tickets = getDepartmentTickets()
    const target = tickets.find((t) => t.id === id || t.ticketNumber === id)
    if (!target) throw new Error('Ticket not found.')

    const oldStatus = target.status
    target.status = finalStatus

    const nowStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    if (finalStatus.toLowerCase().includes('resolve')) {
        target.actualResolutionDateTime = nowStr
        target.resolutionSummary = finalSummary
        target.resolutionRemarks = finalSummary
    }

    if (!target.timeline) target.timeline = []
    target.timeline.push({
        timestamp: nowStr,
        actorName: actor,
        action: finalStatus,
        notes: workText
    })

    saveDepartmentTickets(tickets)

    recordAuditLog({
        actorName: actor,
        module: 'Department Ticketing',
        action: `TICKET_${finalStatus.toUpperCase().replace(/\s+/g, '_')}`,
        entityId: target.id,
        previousState: oldStatus,
        newState: finalStatus,
        remarks: workText
    })

    if (finalStatus.toLowerCase().includes('resolve')) {
        dispatchNotification({
            recipientId: target.requestedById,
            title: `Ticket ${target.id} Resolved`,
            message: `Work on '${target.ticketTitle}' has been completed by ${actor}. Please confirm closure.`,
            link: '/department-tickets?tab=my-tickets',
            priority: 'High',
            type: 'DEPARTMENT_TICKET'
        })
    }

    return normalizeTicket(target)
}

/**
 * 4. Confirm Closure or Reopen Ticket (Requester)
 */
export const confirmTicketClosure = ({
    ticketId,
    ticketNumber,
    action = 'Confirmed & Closed',
    requesterName,
    feedbackRating = 5,
    requesterRating,
    feedbackComments = '',
    requesterFeedback = ''
}) => {
    const id = ticketId || ticketNumber
    const rating = Number(feedbackRating || requesterRating || 5)
    const feedback = feedbackComments || (typeof requesterFeedback === 'string' ? requesterFeedback : '') || 'Satisfactorily resolved.'

    const tickets = getDepartmentTickets()
    const target = tickets.find((t) => t.id === id || t.ticketNumber === id)
    if (!target) throw new Error('Ticket not found.')

    const oldStatus = target.status
    const nowStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    if (action === 'Confirmed & Closed') {
        target.status = 'Confirmed & Closed'
        target.requesterRating = rating
        target.requesterFeedback = {
            rating,
            comments: feedback,
            feedback,
            timestamp: nowStr
        }
    } else {
        target.status = 'Reopened'
    }

    if (!target.timeline) target.timeline = []
    target.timeline.push({
        timestamp: nowStr,
        actorName: requesterName || 'Requester',
        action,
        notes: feedback || (action === 'Confirmed & Closed' ? 'Closure confirmed by requester.' : 'Ticket reopened.')
    })

    saveDepartmentTickets(tickets)

    recordAuditLog({
        actorName: requesterName || 'Requester',
        module: 'Department Ticketing',
        action: action === 'Confirmed & Closed' ? 'CLOSE_TICKET' : 'REOPEN_TICKET',
        entityId: target.id,
        previousState: oldStatus,
        newState: target.status,
        remarks: feedback
    })

    return normalizeTicket(target)
}

