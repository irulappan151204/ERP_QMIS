import { applyWorkflowDecision, WORKFLOW_TYPES } from '../approvals/approvalEngine.js'
/**
 * Hierarchical Employee Activity Monitoring Data Engine
 * Aggregates operational activities across all departments to provide
 * managerial transparency and upward accountability.
 * Enriched with RBAC scoping, audit trails, before/after diffs, and telemetry.
 */

export const ACTIVITY_STORAGE_KEY = 'schoolerp-employee-activities-v1'

let _memoryActivities = null

export const ACTIVITY_ACTIONS = [
    'CREATE',
    'VIEW',
    'UPDATE',
    'DELETE',
    'APPROVE',
    'REJECT',
    'EXPORT',
    'LOGIN',
    'LOGOUT'
]

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
    'Task Execution',
    'Approval Decision',
    'Inventory Movement',
    'Fee Reconciliation'
]

export const INITIAL_EMPLOYEE_ACTIVITIES = [
    {
        id: 'ACT-2026-001',
        isoTimestamp: '2026-10-31T10:45:00.000Z',
        timestamp: '31-10-2026 10:45 AM',
        date: '31-10-2026',
        employeeId: 'EMP-TCH-006',
        employeeName: 'Ananya Roy',
        roleKey: 'teacher',
        department: 'Academics & Teaching',
        team: 'Senior Secondary Wing',
        reportingManagerId: 'EMP-CRD-001',
        action: 'CREATE',
        activityType: 'Ticket Action',
        title: 'Raised IT Support Ticket for Science Lab 2 Smartboard',
        description: 'Reported optical touch sensor failure disrupting Grade 11-A practicals.',
        moduleRef: 'Department Ticketing',
        pageAccessed: '/teacher/tickets',
        referenceId: 'TICK-2026-001',
        statusBefore: 'None',
        statusAfter: 'Submitted',
        previousValues: null,
        updatedValues: { ticketId: 'TICK-2026-001', priority: 'High', room: 'Science Lab 2', issue: 'Sensor Touch Lag' },
        delayFlag: false,
        duration: '3m 20s',
        ipAddress: '192.168.1.104',
        sessionId: 'SESS-2026-TCH104',
        evidence: 'smartboard_sensor_error.jpg',
        reviewStatus: 'Pending Approval',
        reviewedBy: null,
        reviewedByRole: null,
        reviewedAt: null,
        reviewRemarks: '',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-002',
        isoTimestamp: '2026-10-31T10:45:00.000Z',
        timestamp: '31-10-2026 10:45 AM',
        date: '31-10-2026',
        employeeId: 'EMP-HK-001',
        employeeName: 'Savitri Devi',
        roleKey: 'housekeeping-manager',
        department: 'Facilities & Campus Sanitation',
        team: 'Campus Sanitation Alpha',
        reportingManagerId: 'EMP-SUP-001',
        action: 'UPDATE',
        activityType: 'Ticket Resolution',
        title: 'Resolved Critical Plumbing Ticket for 3rd Floor Restrooms',
        description: 'Dispatched maintenance technician, reset booster pump relay and restored water lines.',
        moduleRef: 'Department Ticketing',
        pageAccessed: '/housekeeping/tickets',
        referenceId: 'TICK-2026-002',
        statusBefore: 'In Progress',
        statusAfter: 'Resolved',
        previousValues: { status: 'In Progress', assignedTech: 'None', pumpPressure: '0 Bar' },
        updatedValues: { status: 'Resolved', assignedTech: 'P. Murugan', pumpPressure: '4.2 Bar', resolvedAt: '10:40 AM' },
        delayFlag: false,
        duration: '12m 40s',
        ipAddress: '192.168.2.14',
        sessionId: 'SESS-2026-HK014',
        evidence: 'pressure_gauge_test_pass.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Suresh Raina (Admin)',
        reviewedByRole: 'admin',
        reviewedAt: '2026-10-31T11:00:00.000Z',
        reviewRemarks: 'Prompt resolution of essential sanitation line.',
        approvalHistory: [{ actor: 'Suresh Raina', decision: 'Approved', timestamp: '31-10-2026 11:00 AM' }]
    },
    {
        id: 'ACT-2026-003',
        isoTimestamp: '2026-10-31T10:15:00.000Z',
        timestamp: '31-10-2026 10:15 AM',
        date: '31-10-2026',
        employeeId: 'EMP-GKM-001',
        employeeName: 'Bhawani Singh',
        roleKey: 'gatekeeper-manager',
        department: 'Campus Security & Access Control',
        team: 'Campus Gate 1 Security',
        reportingManagerId: 'EMP-SUP-001',
        action: 'APPROVE',
        activityType: 'Gate Clearance',
        title: 'Security Clearance for Inter-School Expo Projector Returnable Pass',
        description: 'Conducted physical asset inspection on School Van #04 with Driver Jaswant Singh.',
        moduleRef: 'Gate Pass & Security',
        pageAccessed: '/security/gate-pass',
        referenceId: 'GP-2026-001',
        statusBefore: 'Stores Verified',
        statusAfter: 'Security Cleared Out',
        previousValues: { gateStatus: 'Pending Inspection', vehicleNo: 'TN-58-B-3389' },
        updatedValues: { gateStatus: 'Cleared Out', inspectedBy: 'Bhawani Singh', verifiedBarcode: 'BC-PROJ-881' },
        delayFlag: false,
        duration: '5m 10s',
        ipAddress: '192.168.3.1',
        sessionId: 'SESS-2026-GK001',
        evidence: null,
        reviewStatus: 'Approved',
        reviewedBy: 'Dr. Ramanathan K',
        reviewedByRole: 'principal',
        reviewedAt: '2026-10-31T10:30:00.000Z',
        reviewRemarks: 'Asset movement verified against inter-school expo roster.',
        approvalHistory: [{ actor: 'Dr. Ramanathan K', decision: 'Approved', timestamp: '31-10-2026 10:30 AM' }]
    },
    {
        id: 'ACT-2026-004',
        isoTimestamp: '2026-10-31T09:30:00.000Z',
        timestamp: '31-10-2026 09:30 AM',
        date: '31-10-2026',
        employeeId: 'EMP-STR-001',
        employeeName: 'Gurpreet Singh',
        roleKey: 'stationery-store-manager',
        department: 'Stores & Procurement',
        team: 'Central Inventory & Warehousing',
        reportingManagerId: 'EMP-SUP-001',
        action: 'CREATE',
        activityType: 'Goods Receipt',
        title: 'Posted GRN-2026-001 & Updated Inventory for HP Toner Cartridges',
        description: 'Verified 10 OEM packs against PO-2026-002. Stock levels incremented in central store.',
        moduleRef: 'Stores & Procurement',
        pageAccessed: '/stores/grn',
        referenceId: 'GRN-2026-001',
        statusBefore: 'Sent to Vendor',
        statusAfter: 'Fully Received',
        previousValues: { receivedQuantity: 0, pendingQuantity: 10, stockCount: 14 },
        updatedValues: { receivedQuantity: 10, pendingQuantity: 0, stockCount: 24, grnNo: 'GRN-2026-001' },
        delayFlag: false,
        duration: '18m 05s',
        ipAddress: '192.168.1.55',
        sessionId: 'SESS-2026-STR055',
        evidence: 'delivery_challan_scan.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Rajesh Sharma (Account Head)',
        reviewedByRole: 'account-head',
        reviewedAt: '2026-10-31T10:00:00.000Z',
        reviewRemarks: 'Three-way invoice match verified for payment release.',
        approvalHistory: [{ actor: 'Rajesh Sharma', decision: 'Approved', timestamp: '31-10-2026 10:00 AM' }]
    },
    {
        id: 'ACT-2026-005',
        isoTimestamp: '2026-10-31T09:10:00.000Z',
        timestamp: '31-10-2026 09:10 AM',
        date: '31-10-2026',
        employeeId: 'EMP-DRV-001',
        employeeName: 'Jaswant Singh',
        roleKey: 'driver',
        department: 'Transport & Fleet Logistics',
        team: 'Fleet Route Ops #04',
        reportingManagerId: 'EMP-TRN-001',
        action: 'UPDATE',
        activityType: 'Transport Trip',
        title: 'Completed Morning Route #04 Student Onboarding & Drop',
        description: 'Transported 34 students safely to campus. Zero transit incidents logged.',
        moduleRef: 'Transport Management',
        pageAccessed: '/driver/trip-logs',
        referenceId: 'TRIP-RT04-M',
        statusBefore: 'In Transit',
        statusAfter: 'Completed',
        previousValues: { tripStatus: 'In Transit', studentsBoarded: 34, destinationReached: false },
        updatedValues: { tripStatus: 'Completed', destinationReached: true, arrivalTime: '08:45 AM', odometerEnd: 48920 },
        delayFlag: false,
        duration: '45m 00s',
        ipAddress: '10.0.12.8',
        sessionId: 'SESS-2026-DRV012',
        evidence: null,
        reviewStatus: 'Approved',
        reviewedBy: 'Karthik (Transport Manager)',
        reviewedByRole: 'transportmanager',
        reviewedAt: '2026-10-31T09:20:00.000Z',
        reviewRemarks: 'Route completed on schedule without delay.',
        approvalHistory: [{ actor: 'Karthik (Transport Manager)', decision: 'Approved', timestamp: '31-10-2026 09:20 AM' }]
    },
    {
        id: 'ACT-2026-006',
        isoTimestamp: '2026-10-30T16:30:00.000Z',
        timestamp: '30-10-2026 04:30 PM',
        date: '30-10-2026',
        employeeId: 'EMP-LIB-001',
        employeeName: 'Meenakshi Sundaram',
        roleKey: 'librarian',
        department: 'Academics & Teaching',
        team: 'Library & Archival Sciences',
        reportingManagerId: 'EMP-PRN-001',
        action: 'CREATE',
        activityType: 'File Room Action',
        title: 'Inwarded Grade 10 Board Tabulation Dossier into Central File Archive',
        description: 'Indexed sealed mark sheets under Rack A, Shelf 02. Barcode FILE-2026-001 assigned.',
        moduleRef: 'File Room',
        pageAccessed: '/fileroom/inward',
        referenceId: 'INW-2026-001',
        statusBefore: 'None',
        statusAfter: 'In File Room',
        previousValues: null,
        updatedValues: { archiveBarcode: 'FILE-2026-001', storageLocation: 'Rack A / Shelf 02', accessLevel: 'Principal Only' },
        delayFlag: false,
        duration: '8m 30s',
        ipAddress: '192.168.1.92',
        sessionId: 'SESS-2026-LIB092',
        evidence: 'sealed_envelope_index.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Dr. Ramanathan K (Principal)',
        reviewedByRole: 'principal',
        reviewedAt: '2026-10-30T17:00:00.000Z',
        reviewRemarks: 'Secured archive entry confirmed for statutory records.',
        approvalHistory: [{ actor: 'Dr. Ramanathan K', decision: 'Approved', timestamp: '30-10-2026 05:00 PM' }]
    },
    {
        id: 'ACT-2026-007',
        isoTimestamp: '2026-10-30T14:00:00.000Z',
        timestamp: '30-10-2026 02:00 PM',
        date: '30-10-2026',
        employeeId: 'EMP-ADM-001',
        employeeName: 'Suresh Raina',
        roleKey: 'admin',
        department: 'Administration',
        team: 'General Administration',
        reportingManagerId: 'EMP-SUP-001',
        action: 'UPDATE',
        activityType: 'Task Execution',
        title: 'Completed Quarterly Fire & Safety Extinguisher Audit Coordination',
        description: 'Accompanied TNDFRS inspector, conducted hydrant pressure checks and filed report.',
        moduleRef: 'Task Management',
        pageAccessed: '/admin/tasks',
        referenceId: 'TSK-ADM-001',
        statusBefore: 'In Progress',
        statusAfter: 'Completed',
        previousValues: { auditStatus: 'In Progress', inspectorSigned: false },
        updatedValues: { auditStatus: 'Completed', inspectorSigned: true, certificateValidity: '31-10-2027', clearanceRef: 'TNDFRS-2026-441' },
        delayFlag: false,
        duration: '1h 20m',
        ipAddress: '192.168.1.2',
        sessionId: 'SESS-2026-ADM002',
        evidence: 'fire_safety_audit_signed.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Executive Director',
        reviewedByRole: 'director',
        reviewedAt: '2026-10-30T15:30:00.000Z',
        reviewRemarks: 'Comprehensive safety compliance verified.',
        approvalHistory: [{ actor: 'Executive Director', decision: 'Approved', timestamp: '30-10-2026 03:30 PM' }]
    },
    {
        id: 'ACT-2026-008',
        isoTimestamp: '2026-10-31T08:50:00.000Z',
        timestamp: '31-10-2026 08:50 AM',
        date: '31-10-2026',
        employeeId: 'EMP-PRN-001',
        employeeName: 'Dr. Ramanathan K',
        roleKey: 'principal',
        department: 'Academics & Teaching',
        team: 'Academic Executive Leadership',
        reportingManagerId: 'EMP-DIR-001',
        action: 'LOGIN',
        activityType: 'Login / Logout',
        title: 'Principal Administrative Sign-In Session',
        description: 'Authorized 2FA terminal session from Campus Administrative Office.',
        moduleRef: 'Identity & Access',
        pageAccessed: '/principal/dashboard',
        referenceId: 'AUTH-2026-108',
        statusBefore: 'None',
        statusAfter: 'Completed',
        previousValues: null,
        updatedValues: { authMethod: '2FA-Hardware-Key', loginIp: '192.168.1.10', terminalType: 'Executive Workstation' },
        delayFlag: false,
        duration: '25s',
        ipAddress: '192.168.1.10',
        sessionId: 'SESS-2026-PRN010',
        evidence: null,
        reviewStatus: 'Approved',
        reviewedBy: 'System Auto-Audit',
        reviewedByRole: 'superadmin',
        reviewedAt: '2026-10-31T08:51:00.000Z',
        reviewRemarks: 'Standard secure session established.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-009',
        isoTimestamp: '2026-10-31T11:20:00.000Z',
        timestamp: '31-10-2026 11:20 AM',
        date: '31-10-2026',
        employeeId: 'EMP-CRD-001',
        employeeName: 'Kavita Menon',
        roleKey: 'coordinator',
        department: 'Academics & Teaching',
        team: 'Middle School Academic Wing',
        reportingManagerId: 'EMP-PRN-001',
        action: 'VIEW',
        activityType: 'Page Visit',
        title: 'Inspected Grade 10 Science Lesson Plans & Practical Schedules',
        description: 'Reviewed curriculum milestones and practical safety compliance for Q3 syllabus.',
        moduleRef: 'Curriculum & Plans',
        pageAccessed: '/coordinator/lesson-plans',
        referenceId: 'VISIT-2026-009',
        statusBefore: 'None',
        statusAfter: 'Completed',
        previousValues: null,
        updatedValues: { plansInspected: 12, complianceRate: '100%', teacherFeedbackLogged: true },
        delayFlag: false,
        duration: '22m 15s',
        ipAddress: '192.168.1.33',
        sessionId: 'SESS-2026-CRD033',
        evidence: null,
        reviewStatus: 'Approved',
        reviewedBy: 'Dr. Ramanathan K (Principal)',
        reviewedByRole: 'principal',
        reviewedAt: '2026-10-31T12:00:00.000Z',
        reviewRemarks: 'Lesson plans align with board milestones.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-010',
        isoTimestamp: '2026-10-31T12:15:00.000Z',
        timestamp: '31-10-2026 12:15 PM',
        date: '31-10-2026',
        employeeId: 'EMP-ACC-001',
        employeeName: 'Rajesh Sharma',
        roleKey: 'account-head',
        department: 'Finance & Accounts',
        team: 'Treasury & Ledger',
        reportingManagerId: 'EMP-DIR-001',
        action: 'UPDATE',
        activityType: 'Form Submit',
        title: 'Submitted Monthly Student Fee Reconciliation Ledger',
        description: 'Reconciled Term-2 tuition fee collections against bank gateway settlement statement.',
        moduleRef: 'Finance & Fee Collection',
        pageAccessed: '/accounthead/fee-reconciliation',
        referenceId: 'FEE-REC-2026-10',
        statusBefore: 'Draft',
        statusAfter: 'Submitted',
        previousValues: { ledgerStatus: 'Draft', totalCollected: '₹ 78,40,000', pendingVariance: '₹ 12,500' },
        updatedValues: { ledgerStatus: 'Submitted', totalCollected: '₹ 79,20,000', pendingVariance: '₹ 0', bankSettlementMatched: true },
        delayFlag: false,
        duration: '35m 12s',
        ipAddress: '192.168.1.20',
        sessionId: 'SESS-2026-ACC020',
        evidence: 'bank_statement_oct2026.pdf',
        reviewStatus: 'Pending Approval',
        reviewedBy: null,
        reviewedByRole: null,
        reviewedAt: null,
        reviewRemarks: '',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-011',
        isoTimestamp: '2026-10-31T13:45:00.000Z',
        timestamp: '31-10-2026 01:45 PM',
        date: '31-10-2026',
        employeeId: 'EMP-HR-001',
        employeeName: 'Priya Narayanan',
        roleKey: 'hr',
        department: 'Human Resources (HR)',
        team: 'Talent & Payroll Operations',
        reportingManagerId: 'EMP-DIR-001',
        action: 'EXPORT',
        activityType: 'Download / Export',
        title: 'Exported Staff Biometric Attendance Ledger for Payroll Processing',
        description: 'Generated consolidated monthly punch logs and regularizations CSV for Accounts.',
        moduleRef: 'Attendance & Leave',
        pageAccessed: '/hr/attendance',
        referenceId: 'EXP-ATT-2026-11',
        statusBefore: 'None',
        statusAfter: 'Completed',
        previousValues: null,
        updatedValues: { exportFormat: 'CSV / Excel', recordCount: 142, departmentScope: 'ALL' },
        delayFlag: false,
        duration: '2m 10s',
        ipAddress: '192.168.1.25',
        sessionId: 'SESS-2026-HR025',
        evidence: 'attendance_oct_export.csv',
        reviewStatus: 'Approved',
        reviewedBy: 'Rajesh Sharma (Account Head)',
        reviewedByRole: 'account-head',
        reviewedAt: '2026-10-31T14:15:00.000Z',
        reviewRemarks: 'Punch data verified for payroll disbursement.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-012',
        isoTimestamp: '2026-10-31T14:30:00.000Z',
        timestamp: '31-10-2026 02:30 PM',
        date: '31-10-2026',
        employeeId: 'EMP-MNT-001',
        employeeName: 'Vikram Joshi',
        roleKey: 'maintenance-manager',
        department: 'Facilities & Campus Sanitation',
        team: 'Plant & Engineering Services',
        reportingManagerId: 'EMP-SUP-001',
        action: 'CREATE',
        activityType: 'Upload Action',
        title: 'Uploaded 250kVA DG Generator Service & Load Test Report',
        description: 'Attached maintenance log and statutory emissions certificate from OEM engineer.',
        moduleRef: 'Campus Maintenance',
        pageAccessed: '/maintenance/equipment-logs',
        referenceId: 'UPL-DG-2026-12',
        statusBefore: 'Draft',
        statusAfter: 'Submitted',
        previousValues: { loadTestStatus: 'Pending', runHours: 1240 },
        updatedValues: { loadTestStatus: 'Passed at 95% Load', runHours: 1248, oilReplaced: true, filterKit: 'OEM-CAT-44' },
        delayFlag: false,
        duration: '14m 20s',
        ipAddress: '192.168.2.3',
        sessionId: 'SESS-2026-MNT003',
        evidence: 'dg_genset_test_certificate.pdf',
        reviewStatus: 'Pending Approval',
        reviewedBy: null,
        reviewedByRole: null,
        reviewedAt: null,
        reviewRemarks: '',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-013',
        isoTimestamp: '2026-10-31T15:15:00.000Z',
        timestamp: '31-10-2026 03:15 PM',
        date: '31-10-2026',
        employeeId: 'EMP-IT-001',
        employeeName: 'Rahul Verma',
        roleKey: 'it-support-manager',
        department: 'IT Support & Systems',
        team: 'Infrastructure & Labs',
        reportingManagerId: 'EMP-SUP-001',
        action: 'CREATE',
        activityType: 'Print Action',
        title: 'Printed IT Asset Audit Barcode Labels for Physics Lab PCs',
        description: 'Generated and printed 40 weatherproof QR code asset identification stickers.',
        moduleRef: 'Asset Management',
        pageAccessed: '/itsupport/assets',
        referenceId: 'PRT-ASSET-2026-13',
        statusBefore: 'None',
        statusAfter: 'Completed',
        previousValues: null,
        updatedValues: { barcodeBatch: 'BATCH-PHY-LAB-40', labelType: 'Weatherproof-Mylar', range: 'PC-PHY-01 to PC-PHY-40' },
        delayFlag: false,
        duration: '6m 45s',
        ipAddress: '192.168.1.80',
        sessionId: 'SESS-2026-IT080',
        evidence: null,
        reviewStatus: 'Approved',
        reviewedBy: 'Suresh Raina (Admin)',
        reviewedByRole: 'admin',
        reviewedAt: '2026-10-31T15:30:00.000Z',
        reviewRemarks: 'Asset tags verified and indexed into IT inventory.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-014',
        isoTimestamp: '2026-10-31T15:45:00.000Z',
        timestamp: '31-10-2026 03:45 PM',
        date: '31-10-2026',
        employeeId: 'EMP-CNT-001',
        employeeName: 'Murugan K',
        roleKey: 'canteen-manager',
        department: 'Dining & Nutrition (Café)',
        team: 'Kitchen & Cafeteria Ops',
        reportingManagerId: 'EMP-SUP-001',
        action: 'UPDATE',
        activityType: 'Task Execution',
        title: 'Completed Daily Cafeteria Health & Food Safety Temperature Log',
        description: 'Checked cold storage (-18°C) and hot serving bain-marie (+68°C) for lunch service.',
        moduleRef: 'Dining & Nutrition',
        pageAccessed: '/canteen/safety-logs',
        referenceId: 'LOG-FS-2026-1031',
        statusBefore: 'In Progress',
        statusAfter: 'Completed',
        previousValues: { coldStorageTemp: '-14°C', hotServingTemp: '+60°C' },
        updatedValues: { coldStorageTemp: '-18°C', hotServingTemp: '+68°C', oilFryerTpm: '14.5%', hygienePass: true },
        delayFlag: false,
        duration: '11m 30s',
        ipAddress: '192.168.4.12',
        sessionId: 'SESS-2026-CNT012',
        evidence: 'temp_log_oct31.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Suresh Raina (Admin)',
        reviewedByRole: 'admin',
        reviewedAt: '2026-10-31T16:00:00.000Z',
        reviewRemarks: 'FSSAI standards verified and compliant.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-015',
        isoTimestamp: '2026-10-31T16:10:00.000Z',
        timestamp: '31-10-2026 04:10 PM',
        date: '31-10-2026',
        employeeId: 'EMP-CCTV-001',
        employeeName: 'Mohan Das',
        roleKey: 'cctv',
        department: 'Campus Surveillance & CCTV',
        team: 'Control Room Monitoring',
        reportingManagerId: 'EMP-SUP-001',
        action: 'VIEW',
        activityType: 'Page Visit',
        title: 'Audited Main Gate & Perimeter CCTV Stream Playback for Perimeter Intrusion Check',
        description: 'Verified 24h recording loop across 48 IP cameras. All storage NVRs reporting 100% capacity health.',
        moduleRef: 'Campus Security',
        pageAccessed: '/cctv/playback',
        referenceId: 'CCTV-AUD-2026-44',
        statusBefore: 'None',
        statusAfter: 'Completed',
        previousValues: null,
        updatedValues: { camerasChecked: 48, nvrHealth: '100% Good', recordingRetentionDays: 30 },
        delayFlag: false,
        duration: '19m 20s',
        ipAddress: '192.168.3.15',
        sessionId: 'SESS-2026-CCTV015',
        evidence: null,
        reviewStatus: 'Approved',
        reviewedBy: 'Bhawani Singh (Security Head)',
        reviewedByRole: 'gatekeeper-manager',
        reviewedAt: '2026-10-31T16:30:00.000Z',
        reviewRemarks: 'Perimeter check clear; zero camera blindspots.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-016',
        isoTimestamp: '2026-10-30T11:00:00.000Z',
        timestamp: '30-10-2026 11:00 AM',
        date: '30-10-2026',
        employeeId: 'EMP-TCH-001',
        employeeName: 'Nisha Gupta',
        roleKey: 'teacher',
        department: 'Academics & Teaching',
        team: 'Primary Academic Wing',
        reportingManagerId: 'EMP-CRD-001',
        action: 'CREATE',
        activityType: 'Form Submit',
        title: 'Submitted Weekly Formative Assessment Rubrics for Grade 4 Mathematics',
        description: 'Uploaded diagnostic scores for mental math and fractions modules for 38 students.',
        moduleRef: 'Assessments & Marks',
        pageAccessed: '/teacher/marks-entry',
        referenceId: 'ASSESS-G4-MTH-01',
        statusBefore: 'Draft',
        statusAfter: 'Submitted',
        previousValues: { submittedCount: 0, pendingCount: 38 },
        updatedValues: { submittedCount: 38, pendingCount: 0, classAverage: '84.6%', rubricLevel: 'Exceeding Expectations' },
        delayFlag: false,
        duration: '28m 45s',
        ipAddress: '192.168.1.112',
        sessionId: 'SESS-2026-TCH112',
        evidence: 'g4_math_rubrics.xlsx',
        reviewStatus: 'Approved',
        reviewedBy: 'Kavita Menon (Coordinator)',
        reviewedByRole: 'coordinator',
        reviewedAt: '2026-10-30T12:00:00.000Z',
        reviewRemarks: 'Rubric distribution balanced and approved.',
        approvalHistory: [{ actor: 'Kavita Menon', decision: 'Approved', timestamp: '30-10-2026 12:00 PM' }]
    },
    {
        id: 'ACT-2026-017',
        isoTimestamp: '2026-10-30T09:40:00.000Z',
        timestamp: '30-10-2026 09:40 AM',
        date: '30-10-2026',
        employeeId: 'EMP-TRN-001',
        employeeName: 'Karthik S',
        roleKey: 'transportmanager',
        department: 'Transport & Fleet Logistics',
        team: 'Fleet Management HQ',
        reportingManagerId: 'EMP-SUP-001',
        action: 'UPDATE',
        activityType: 'Transport Trip',
        title: 'Dispatched Spare Bus TN-58-B-3390 to Support Route 07 Breakdown Relief',
        description: 'Dispatched standby driver and vehicle within 8 minutes of radiator hose leak notice on Route 07.',
        moduleRef: 'Transport Management',
        pageAccessed: '/transport/dispatch',
        referenceId: 'RELIEF-RT07-1030',
        statusBefore: 'Delayed',
        statusAfter: 'Completed',
        previousValues: { delayReason: 'Radiator Hose Failure', strandedStudents: 42, busAssigned: 'TN-58-A-9011' },
        updatedValues: { delayReason: 'Relief Dispatched', reliefBus: 'TN-58-B-3390', delayTimeMitigated: '12m', status: 'Completed' },
        delayFlag: true,
        duration: '15m 30s',
        ipAddress: '192.168.1.60',
        sessionId: 'SESS-2026-TRN060',
        evidence: 'mechanic_repair_slip.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Dr. Ramanathan K (Principal)',
        reviewedByRole: 'principal',
        reviewedAt: '2026-10-30T10:30:00.000Z',
        reviewRemarks: 'Fast crisis response; parental alerts dispatched in real-time.',
        approvalHistory: [{ actor: 'Dr. Ramanathan K', decision: 'Approved', timestamp: '30-10-2026 10:30 AM' }]
    },
    {
        id: 'ACT-2026-018',
        isoTimestamp: '2026-10-29T15:20:00.000Z',
        timestamp: '29-10-2026 03:20 PM',
        date: '29-10-2026',
        employeeId: 'EMP-DIR-001',
        employeeName: 'Executive Director',
        roleKey: 'director',
        department: 'Executive Governance',
        team: 'Managing Directorate',
        reportingManagerId: '',
        action: 'APPROVE',
        activityType: 'Approval Decision',
        title: 'Executive Approval of Annual Science Laboratory Modernization PO',
        description: 'Sanctioned PO-2026-004 totaling ₹ 12,45,000 for Olympus Digital Microscopes & Sensor Kits.',
        moduleRef: 'Stores & Procurement',
        pageAccessed: '/director/approvals',
        referenceId: 'PO-2026-004',
        statusBefore: 'Submitted for Executive Review',
        statusAfter: 'Approved',
        previousValues: { sanctionStatus: 'Under Board Review', totalAmount: '₹ 12,45,000' },
        updatedValues: { sanctionStatus: 'Sanctioned', approvedCapexCode: 'CAPEX-2026-LAB02', vendor: 'Labquip Scientific' },
        delayFlag: false,
        duration: '9m 10s',
        ipAddress: '192.168.1.1',
        sessionId: 'SESS-2026-DIR001',
        evidence: 'board_sanction_signed.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Executive Director',
        reviewedByRole: 'director',
        reviewedAt: '2026-10-29T15:20:00.000Z',
        reviewRemarks: 'Authorized under FY26 Capital Expenditure Allocation.',
        approvalHistory: [{ actor: 'Executive Director', decision: 'Approved', timestamp: '29-10-2026 03:20 PM' }]
    },
    {
        id: 'ACT-2026-019',
        isoTimestamp: '2026-10-29T11:15:00.000Z',
        timestamp: '29-10-2026 11:15 AM',
        date: '29-10-2026',
        employeeId: 'EMP-STR-001',
        employeeName: 'Gurpreet Singh',
        roleKey: 'stationery-store-manager',
        department: 'Stores & Procurement',
        team: 'Central Inventory & Warehousing',
        reportingManagerId: 'EMP-SUP-001',
        action: 'UPDATE',
        activityType: 'Inventory Movement',
        title: 'Fulfilled Department Stationery Indent for Examination Department',
        description: 'Issued 150 reams A4 answer sheet bundles against MR-2026-042 to Exam Controller.',
        moduleRef: 'Stores & Procurement',
        pageAccessed: '/stores/issue-materials',
        referenceId: 'MR-2026-042',
        statusBefore: 'HOD Approved',
        statusAfter: 'Completed',
        previousValues: { stockAvailable: 320, issuedQty: 0, indentStatus: 'Pending Issue' },
        updatedValues: { stockAvailable: 170, issuedQty: 150, indentStatus: 'Dispatched & Handed Over', receiverAck: 'Signed' },
        delayFlag: false,
        duration: '16m 40s',
        ipAddress: '192.168.1.55',
        sessionId: 'SESS-2026-STR055',
        evidence: 'material_issue_slip_signed.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Suresh Raina (Admin)',
        reviewedByRole: 'admin',
        reviewedAt: '2026-10-29T12:00:00.000Z',
        reviewRemarks: 'Stationery consumption matched with exam quota.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-020',
        isoTimestamp: '2026-10-29T09:30:00.000Z',
        timestamp: '29-10-2026 09:30 AM',
        date: '29-10-2026',
        employeeId: 'EMP-CLR-001',
        employeeName: 'Deepak Chawla',
        roleKey: 'fileroom',
        department: 'File Room & Central Records',
        team: 'Archival & Legal Dossiers',
        reportingManagerId: 'EMP-ADM-001',
        action: 'UPDATE',
        activityType: 'File Room Action',
        title: 'Checked Out Student Transfer Certificate Master File for Legal Verification',
        description: 'Issued docket #TC-2024-88 to Principal Secretariat under temporary custody checkout barcode.',
        moduleRef: 'File Room',
        pageAccessed: '/fileroom/checkout',
        referenceId: 'CHK-TC-2024-88',
        statusBefore: 'In Archive',
        statusAfter: 'Checked Out',
        previousValues: { fileLocation: 'Vault 1 / Bin 04', custodyOfficer: 'Deepak Chawla' },
        updatedValues: { fileLocation: 'Temporary Custody - Principal Office', borrowedBy: 'Dr. Ramanathan K', returnDueDate: '02-11-2026' },
        delayFlag: false,
        duration: '7m 15s',
        ipAddress: '192.168.1.95',
        sessionId: 'SESS-2026-CLR095',
        evidence: 'tc_checkout_requisition.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Suresh Raina (Admin)',
        reviewedByRole: 'admin',
        reviewedAt: '2026-10-29T10:00:00.000Z',
        reviewRemarks: 'Temporary custody tracked with barcode loan register.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-021',
        isoTimestamp: '2026-10-28T14:45:00.000Z',
        timestamp: '28-10-2026 02:45 PM',
        date: '28-10-2026',
        employeeId: 'EMP-ACC-001',
        employeeName: 'Rajesh Sharma',
        roleKey: 'account-head',
        department: 'Finance & Accounts',
        team: 'Vendor Disbursements',
        reportingManagerId: 'EMP-DIR-001',
        action: 'EXPORT',
        activityType: 'Download / Export',
        title: 'Exported Vendor Outstanding Ledger & TDS Deduction Schedule',
        description: 'Generated Form 26Q quarterly tax deduction return spreadsheet for Statutory Auditor.',
        moduleRef: 'Finance & Accounts',
        pageAccessed: '/accounthead/tax-filing',
        referenceId: 'EXP-TDS-Q3-2026',
        statusBefore: 'None',
        statusAfter: 'Completed',
        previousValues: null,
        updatedValues: { exportFormat: 'XLSX / XML', totalVouchers: 84, totalTdsDeducted: '₹ 2,48,920' },
        delayFlag: false,
        duration: '4m 50s',
        ipAddress: '192.168.1.20',
        sessionId: 'SESS-2026-ACC020',
        evidence: 'tds_schedule_q3.xlsx',
        reviewStatus: 'Approved',
        reviewedBy: 'Executive Director',
        reviewedByRole: 'director',
        reviewedAt: '2026-10-28T16:00:00.000Z',
        reviewRemarks: 'Statutory compliance schedule certified for filing.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-022',
        isoTimestamp: '2026-10-28T10:20:00.000Z',
        timestamp: '28-10-2026 10:20 AM',
        date: '28-10-2026',
        employeeId: 'EMP-HK-001',
        employeeName: 'Savitri Devi',
        roleKey: 'housekeeping-manager',
        department: 'Facilities & Campus Sanitation',
        team: 'Campus Sanitation Alpha',
        reportingManagerId: 'EMP-SUP-001',
        action: 'UPDATE',
        activityType: 'Task Execution',
        title: 'Completed Pre-Festival Deep Cleaning & Disinfection across Junior Blocks',
        description: 'Sanitized 24 classrooms, junior dining hall and playground swing apparatus.',
        moduleRef: 'Sanitation & Hygiene',
        pageAccessed: '/housekeeping/schedules',
        referenceId: 'SAN-BLK-JR-1028',
        statusBefore: 'In Progress',
        statusAfter: 'Completed',
        previousValues: { roomsSanitized: 12, supervisorSigned: false },
        updatedValues: { roomsSanitized: 24, chemicalUsed: 'Sodium Hypochlorite 1% OEM', swabTestResult: 'Pass / Zero Bacterial Load' },
        delayFlag: false,
        duration: '3h 10m',
        ipAddress: '192.168.2.14',
        sessionId: 'SESS-2026-HK014',
        evidence: 'junior_block_sanitation_signoff.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Suresh Raina (Admin)',
        reviewedByRole: 'admin',
        reviewedAt: '2026-10-28T14:00:00.000Z',
        reviewRemarks: 'Inspection completed; high sanitation grade awarded.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-023',
        isoTimestamp: '2026-10-27T16:00:00.000Z',
        timestamp: '27-10-2026 04:00 PM',
        date: '27-10-2026',
        employeeId: 'EMP-TCH-002',
        employeeName: 'Rohan Deshmukh',
        roleKey: 'teacher',
        department: 'Academics & Teaching',
        team: 'Senior Secondary Wing',
        reportingManagerId: 'EMP-CRD-001',
        action: 'UPDATE',
        activityType: 'Ticket Action',
        title: 'Resolved Student Attendance Discrepancy for Grade 12-B Sports Day Roster',
        description: 'Corrected attendance regularizations for 14 athletes participating in District Athletic Meet.',
        moduleRef: 'Attendance & Leave',
        pageAccessed: '/teacher/attendance',
        referenceId: 'REG-ATH-12B',
        statusBefore: 'Unmarked / Absent',
        statusAfter: 'Completed',
        previousValues: { attendanceStatus: 'Absent (14 Students)', onDutyProof: 'Pending' },
        updatedValues: { attendanceStatus: 'Present (On Duty - Sports)', athleticMeetCode: 'DIST-ATH-2026', verifiedByPE: 'P. E. Master' },
        delayFlag: false,
        duration: '11m 00s',
        ipAddress: '192.168.1.118',
        sessionId: 'SESS-2026-TCH118',
        evidence: 'district_sports_attendance_sanction.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Kavita Menon (Coordinator)',
        reviewedByRole: 'coordinator',
        reviewedAt: '2026-10-27T16:45:00.000Z',
        reviewRemarks: 'OD credit added per sports department recommendation.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-024',
        isoTimestamp: '2026-10-27T11:40:00.000Z',
        timestamp: '27-10-2026 11:40 AM',
        date: '27-10-2026',
        employeeId: 'EMP-GKM-001',
        employeeName: 'Bhawani Singh',
        roleKey: 'gatekeeper-manager',
        department: 'Campus Security & Access Control',
        team: 'Campus Gate 1 Security',
        reportingManagerId: 'EMP-SUP-001',
        action: 'CREATE',
        activityType: 'Gate Clearance',
        title: 'Logged Visitor Badge and Facial Registration for CBSE Inspection Committee',
        description: 'Issued VIP visitor credentials and assigned security escort to Executive Conference Hall.',
        moduleRef: 'Gate Pass & Security',
        pageAccessed: '/security/visitors',
        referenceId: 'VIS-CBSE-2026-04',
        statusBefore: 'None',
        statusAfter: 'Completed',
        previousValues: null,
        updatedValues: { visitorsCount: 3, vehicleRegistration: 'TN-01-AX-9922', escortAssigned: 'Guard Ramu', destination: 'Board Room' },
        delayFlag: false,
        duration: '4m 25s',
        ipAddress: '192.168.3.1',
        sessionId: 'SESS-2026-GK001',
        evidence: 'visitor_pass_cbse.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Dr. Ramanathan K (Principal)',
        reviewedByRole: 'principal',
        reviewedAt: '2026-10-27T12:15:00.000Z',
        reviewRemarks: 'Dignitary arrival handled seamlessly.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-025',
        isoTimestamp: '2026-10-26T15:30:00.000Z',
        timestamp: '26-10-2026 03:30 PM',
        date: '26-10-2026',
        employeeId: 'EMP-IT-001',
        employeeName: 'Rahul Verma',
        roleKey: 'it-support-manager',
        department: 'IT Support & Systems',
        team: 'Core Networking',
        reportingManagerId: 'EMP-SUP-001',
        action: 'UPDATE',
        activityType: 'Task Execution',
        title: 'Installed Fortinet Firewall Firmware Security Patch v7.4.2',
        description: 'Mitigated CVE vulnerabilities on primary gateway firewall during designated maintenance window.',
        moduleRef: 'IT Infrastructure',
        pageAccessed: '/itsupport/network',
        referenceId: 'SEC-FW-PATCH-742',
        statusBefore: 'Pending Patch',
        statusAfter: 'Completed',
        previousValues: { fwVersion: 'v7.2.1', cveVulnerabilityStatus: 'Vulnerable' },
        updatedValues: { fwVersion: 'v7.4.2', cveVulnerabilityStatus: 'Mitigated / Secure', failoverTested: 'Pass', packetLoss: '0%' },
        delayFlag: false,
        duration: '42m 10s',
        ipAddress: '192.168.1.80',
        sessionId: 'SESS-2026-IT080',
        evidence: 'firewall_patch_log.txt',
        reviewStatus: 'Approved',
        reviewedBy: 'Executive Director',
        reviewedByRole: 'director',
        reviewedAt: '2026-10-26T17:00:00.000Z',
        reviewRemarks: 'Critical perimeter cybersecurity defense hardened.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-026',
        isoTimestamp: '2026-10-26T10:15:00.000Z',
        timestamp: '26-10-2026 10:15 AM',
        date: '26-10-2026',
        employeeId: 'EMP-MNT-001',
        employeeName: 'Vikram Joshi',
        roleKey: 'maintenancemanager',
        department: 'Facilities & Campus Sanitation',
        team: 'Physical Plant Maintenance',
        reportingManagerId: 'EMP-SUP-001',
        action: 'UPDATE',
        activityType: 'Task Execution',
        title: 'Quarterly RO Drinking Water Plant Membrane Acid Wash & TDS Calibration',
        description: 'TDS lowered from 180 ppm to 42 ppm across all 12 student drinking water stations.',
        moduleRef: 'Campus Maintenance',
        pageAccessed: '/maintenance/ro-plant',
        referenceId: 'MNT-RO-2026-Q3',
        statusBefore: 'In Progress',
        statusAfter: 'Completed',
        previousValues: { tdsRaw: '450 ppm', tdsOutlet: '180 ppm', flowRate: '1500 LPH' },
        updatedValues: { tdsRaw: '450 ppm', tdsOutlet: '42 ppm', flowRate: '2200 LPH', membraneReplaced: false, washPass: true },
        delayFlag: false,
        duration: '2h 15m',
        ipAddress: '192.168.2.3',
        sessionId: 'SESS-2026-MNT003',
        evidence: 'water_tds_lab_report.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Suresh Raina (Admin)',
        reviewedByRole: 'admin',
        reviewedAt: '2026-10-26T14:00:00.000Z',
        reviewRemarks: 'Safe potable drinking water compliance certified.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-027',
        isoTimestamp: '2026-10-25T14:10:00.000Z',
        timestamp: '25-10-2026 02:10 PM',
        date: '25-10-2026',
        employeeId: 'EMP-HR-001',
        employeeName: 'Priya Narayanan',
        roleKey: 'hr',
        department: 'Human Resources (HR)',
        team: 'Recruitment & Onboarding',
        reportingManagerId: 'EMP-DIR-001',
        action: 'CREATE',
        activityType: 'Form Submit',
        title: 'Completed Onboarding Dossier & Biometric Registration for 3 New PGT Teachers',
        description: 'Enrolled employee biometric fingerprints, bank details, and statutory PF/ESI documents.',
        moduleRef: 'Staff Directory',
        pageAccessed: '/hr/onboarding',
        referenceId: 'ONB-PGT-2026-03',
        statusBefore: 'Offer Accepted',
        statusAfter: 'Completed',
        previousValues: { status: 'Offered' },
        updatedValues: { enrolledEmployees: ['EMP-TCH-014', 'EMP-TCH-015', 'EMP-TCH-016'], pfUanGenerated: true, idCardsPrinted: true },
        delayFlag: false,
        duration: '38m 20s',
        ipAddress: '192.168.1.25',
        sessionId: 'SESS-2026-HR025',
        evidence: 'joining_reports_consolidated.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Executive Director',
        reviewedByRole: 'director',
        reviewedAt: '2026-10-25T16:00:00.000Z',
        reviewRemarks: 'Faculty onboarding certified and contracts executed.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-028',
        isoTimestamp: '2026-10-25T09:15:00.000Z',
        timestamp: '25-10-2026 09:15 AM',
        date: '25-10-2026',
        employeeId: 'EMP-DRV-002',
        employeeName: 'Munusamy R',
        roleKey: 'driver',
        department: 'Transport & Fleet Logistics',
        team: 'Fleet Route Ops #01',
        reportingManagerId: 'EMP-TRN-001',
        action: 'UPDATE',
        activityType: 'Transport Trip',
        title: 'Completed Route #01 North Sector Morning Student Commute',
        description: 'Safely completed 18 pick-up stops and delivered 42 students to campus on schedule.',
        moduleRef: 'Transport Management',
        pageAccessed: '/driver/trip-logs',
        referenceId: 'TRIP-RT01-M',
        statusBefore: 'In Transit',
        statusAfter: 'Completed',
        previousValues: { tripStatus: 'In Transit', stopsCompleted: 12 },
        updatedValues: { tripStatus: 'Completed', stopsCompleted: 18, delayMinutes: 0, fuelConsumedLtr: 6.2 },
        delayFlag: false,
        duration: '48m 10s',
        ipAddress: '10.0.12.9',
        sessionId: 'SESS-2026-DRV013',
        evidence: null,
        reviewStatus: 'Approved',
        reviewedBy: 'Karthik S (Transport Manager)',
        reviewedByRole: 'transportmanager',
        reviewedAt: '2026-10-25T09:30:00.000Z',
        reviewRemarks: 'Timely arrival verified on GPS telematics.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-029',
        isoTimestamp: '2026-10-24T16:20:00.000Z',
        timestamp: '24-10-2026 04:20 PM',
        date: '24-10-2026',
        employeeId: 'EMP-TCH-004',
        employeeName: 'Sunita Sharma',
        roleKey: 'teacher',
        department: 'Academics & Teaching',
        team: 'Middle School Academic Wing',
        reportingManagerId: 'EMP-CRD-001',
        action: 'CREATE',
        activityType: 'Form Submit',
        title: 'Logged Quarterly Remedial Class Progress Log for Grade 8 Mathematics',
        description: 'Documented 12 struggling students showing 18% improvement in algebra fundamentals.',
        moduleRef: 'Academic Remedials',
        pageAccessed: '/teacher/remedials',
        referenceId: 'REM-G8-MTH-Q3',
        statusBefore: 'Draft',
        statusAfter: 'Completed',
        previousValues: null,
        updatedValues: { studentsTracked: 12, diagnosticGain: '+18.4%', parentConferencesCompleted: 12 },
        delayFlag: false,
        duration: '21m 40s',
        ipAddress: '192.168.1.125',
        sessionId: 'SESS-2026-TCH125',
        evidence: 'remedial_scorecards.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Kavita Menon (Coordinator)',
        reviewedByRole: 'coordinator',
        reviewedAt: '2026-10-24T17:00:00.000Z',
        reviewRemarks: 'Measurable diagnostic gains validated.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-030',
        isoTimestamp: '2026-10-24T11:00:00.000Z',
        timestamp: '24-10-2026 11:00 AM',
        date: '24-10-2026',
        employeeId: 'EMP-ADM-001',
        employeeName: 'Suresh Raina',
        roleKey: 'admin',
        department: 'Administration',
        team: 'Statutory Affairs',
        reportingManagerId: 'EMP-SUP-001',
        action: 'UPDATE',
        activityType: 'Task Execution',
        title: 'Submitted CBSE Affiliation Renewal Online Compliance Dossier',
        description: 'Uploaded OASIS mandatory disclosure certificates, fire safety, and land ownership deeds.',
        moduleRef: 'Regulatory Compliance',
        pageAccessed: '/admin/cbse-oasis',
        referenceId: 'CBSE-OASIS-2026-44',
        statusBefore: 'In Progress',
        statusAfter: 'Completed',
        previousValues: { oasisStatus: 'Draft - 80% Complete' },
        updatedValues: { oasisStatus: 'Submitted / Acknowledged', applicationFeeChallan: 'CHAL-CBSE-991', confirmationSlip: 'Recieved' },
        delayFlag: false,
        duration: '1h 45m',
        ipAddress: '192.168.1.2',
        sessionId: 'SESS-2026-ADM002',
        evidence: 'cbse_oasis_acknowledgement.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Dr. Ramanathan K (Principal)',
        reviewedByRole: 'principal',
        reviewedAt: '2026-10-24T12:30:00.000Z',
        reviewRemarks: 'Regulatory compliance filing confirmed.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-031',
        isoTimestamp: '2026-10-23T15:00:00.000Z',
        timestamp: '23-10-2026 03:00 PM',
        date: '23-10-2026',
        employeeId: 'EMP-ACC-001',
        employeeName: 'Rajesh Sharma',
        roleKey: 'account-head',
        department: 'Finance & Accounts',
        team: 'Accounts Payable',
        reportingManagerId: 'EMP-DIR-001',
        action: 'APPROVE',
        activityType: 'Approval Decision',
        title: 'Processed Vendor Payment Voucher for Quarterly Stationery & Uniform Supplier',
        description: 'Released NEFT payment of ₹ 3,45,000 to Apex School Supplies against verified GRN-2026-001.',
        moduleRef: 'Finance & Accounts',
        pageAccessed: '/accounthead/payments',
        referenceId: 'VOUCH-PAY-2026-189',
        statusBefore: 'Pending Payment',
        statusAfter: 'Completed',
        previousValues: { paymentStatus: 'Pending Finance Sanction', invoiceNo: 'INV-APEX-890' },
        updatedValues: { paymentStatus: 'Paid / NEFT Settled', utrNumber: 'HDFC2630091823', paymentDate: '23-10-2026' },
        delayFlag: false,
        duration: '14m 10s',
        ipAddress: '192.168.1.20',
        sessionId: 'SESS-2026-ACC020',
        evidence: 'bank_neft_counterfoil.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Executive Director',
        reviewedByRole: 'director',
        reviewedAt: '2026-10-23T16:00:00.000Z',
        reviewRemarks: 'Vendor payment settled within credit window.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-032',
        isoTimestamp: '2026-10-22T14:30:00.000Z',
        timestamp: '22-10-2026 02:30 PM',
        date: '22-10-2026',
        employeeId: 'EMP-STR-001',
        employeeName: 'Gurpreet Singh',
        roleKey: 'stationery-store-manager',
        department: 'Stores & Procurement',
        team: 'Central Inventory & Warehousing',
        reportingManagerId: 'EMP-SUP-001',
        action: 'CREATE',
        activityType: 'Task Execution',
        title: 'Logged Annual Pre-Exam Printing Paper Physical Inventory Audit',
        description: 'Reconciled 1,240 reams copier paper across 3 warehouse bays. Zero inventory shrinkage.',
        moduleRef: 'Stores & Procurement',
        pageAccessed: '/stores/physical-audit',
        referenceId: 'AUD-INV-2026-PAP',
        statusBefore: 'In Progress',
        statusAfter: 'Completed',
        previousValues: { auditStatus: 'Counting in Progress', bay1: 400, bay2: 420, bay3: 420 },
        updatedValues: { auditStatus: 'Reconciled 100%', bookStock: 1240, physicalStock: 1240, variance: 0 },
        delayFlag: false,
        duration: '55m 00s',
        ipAddress: '192.168.1.55',
        sessionId: 'SESS-2026-STR055',
        evidence: 'physical_inventory_sheet.xlsx',
        reviewStatus: 'Approved',
        reviewedBy: 'Rajesh Sharma (Account Head)',
        reviewedByRole: 'account-head',
        reviewedAt: '2026-10-22T16:00:00.000Z',
        reviewRemarks: 'Physical verification audit verified and certified.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-033',
        isoTimestamp: '2026-10-21T10:45:00.000Z',
        timestamp: '21-10-2026 10:45 AM',
        date: '21-10-2026',
        employeeId: 'EMP-PRN-001',
        employeeName: 'Dr. Ramanathan K',
        roleKey: 'principal',
        department: 'Academics & Teaching',
        team: 'Academic Executive Leadership',
        reportingManagerId: 'EMP-DIR-001',
        action: 'APPROVE',
        activityType: 'Approval Decision',
        title: 'Sanctioned Term-1 Final Report Cards & Grade Moderation for Grade 10',
        description: 'Endorsed academic score sheets and approved release to student portal.',
        moduleRef: 'Examination & Results',
        pageAccessed: '/principal/grades',
        referenceId: 'MOD-G10-T1',
        statusBefore: 'Under Principal Review',
        statusAfter: 'Approved',
        previousValues: { publishStatus: 'Held for Approval', studentCount: 180 },
        updatedValues: { publishStatus: 'Published Online', topGradeAchieved: 'A1 - 42 Students', passPercentage: '100%' },
        delayFlag: false,
        duration: '32m 00s',
        ipAddress: '192.168.1.10',
        sessionId: 'SESS-2026-PRN010',
        evidence: 'grade_moderation_minutes.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Dr. Ramanathan K',
        reviewedByRole: 'principal',
        reviewedAt: '2026-10-21T10:45:00.000Z',
        reviewRemarks: 'Approved for portal publication and parent notifications.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-034',
        isoTimestamp: '2026-10-20T16:15:00.000Z',
        timestamp: '20-10-2026 04:15 PM',
        date: '20-10-2026',
        employeeId: 'EMP-CRD-001',
        employeeName: 'Kavita Menon',
        roleKey: 'coordinator',
        department: 'Academics & Teaching',
        team: 'Middle School Academic Wing',
        reportingManagerId: 'EMP-PRN-001',
        action: 'UPDATE',
        activityType: 'Task Execution',
        title: 'Formulated Inter-School Science Olympiad Participation Roster',
        description: 'Selected 28 student delegates based on diagnostic assessment scores.',
        moduleRef: 'Student Activities',
        pageAccessed: '/coordinator/competitions',
        referenceId: 'OLYMP-SCI-2026',
        statusBefore: 'Draft',
        statusAfter: 'Completed',
        previousValues: { candidatesShortlisted: 45, rosterFinalized: false },
        updatedValues: { candidatesSelected: 28, facultyMentors: ['Ananya Roy', 'Rohan Deshmukh'], parentConsentSecured: true },
        delayFlag: false,
        duration: '26m 15s',
        ipAddress: '192.168.1.33',
        sessionId: 'SESS-2026-CRD033',
        evidence: 'olympiad_roster_final.pdf',
        reviewStatus: 'Approved',
        reviewedBy: 'Dr. Ramanathan K (Principal)',
        reviewedByRole: 'principal',
        reviewedAt: '2026-10-20T17:00:00.000Z',
        reviewRemarks: 'Delegation approved with allocated registration budget.',
        approvalHistory: []
    },
    {
        id: 'ACT-2026-035',
        isoTimestamp: '2026-10-19T09:00:00.000Z',
        timestamp: '19-10-2026 09:00 AM',
        date: '19-10-2026',
        employeeId: 'EMP-SUP-001',
        employeeName: 'Super Administrator',
        roleKey: 'superadmin',
        department: 'Information Technology',
        team: 'Enterprise Systems & Security',
        reportingManagerId: '',
        action: 'LOGIN',
        activityType: 'Login / Logout',
        title: 'Super Admin Privileged Security Console Sign-In',
        description: 'Initiated routine weekly database snapshot, system integrity hash check, and key rotation.',
        moduleRef: 'Identity & Access',
        pageAccessed: '/superadmin/system-health',
        referenceId: 'AUTH-SEC-2026-99',
        statusBefore: 'None',
        statusAfter: 'Completed',
        previousValues: null,
        updatedValues: { mfaMethod: 'FIDO2 WebAuthn', roleScope: 'UNRESTRICTED', backupSnapshotHash: 'SHA256:d8a9f02b...' },
        delayFlag: false,
        duration: '15s',
        ipAddress: '10.0.0.1',
        sessionId: 'SESS-2026-ROOT001',
        evidence: null,
        reviewStatus: 'Approved',
        reviewedBy: 'Automated Security Daemon',
        reviewedByRole: 'superadmin',
        reviewedAt: '2026-10-19T09:01:00.000Z',
        reviewRemarks: 'Privileged session authenticated via hardware biometric key.',
        approvalHistory: []
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

/**
 * Capture real-time operational activity event across the application
 */
export const captureActivityEvent = ({
    employeeId = 'EMP-SYS-001',
    employeeName = 'Operational Staff',
    roleKey = 'staff',
    department = 'General Operations',
    team = 'General',
    reportingManagerId = '',
    action = 'UPDATE',
    activityType = 'Task Execution',
    title = 'Operational Activity Logged',
    description = '',
    moduleRef = 'General',
    pageAccessed = '',
    referenceId = '',
    statusBefore = '-',
    statusAfter = 'Completed',
    previousValues = null,
    updatedValues = null,
    delayFlag = false,
    duration = '1m 15s',
    ipAddress = '192.168.1.100',
    sessionId = '',
    evidence = null
}) => {
    const activities = getAllEmployeeActivities()
    const nextSeq = activities.length + 1
    const newId = `ACT-2026-${String(nextSeq).padStart(3, '0')}`

    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    const dateStr = `${day}-${month}-${year}`

    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const nowStr = `${dateStr} ${timeStr}`

    const newActivity = {
        id: newId,
        isoTimestamp: now.toISOString(),
        timestamp: nowStr,
        date: dateStr,
        employeeId,
        employeeName,
        roleKey,
        role: roleKey,
        department,
        team,
        reportingManagerId,
        action,
        activityType,
        title,
        description,
        moduleRef,
        pageAccessed: pageAccessed || (typeof window !== 'undefined' ? window.location?.pathname : '/'),
        referenceId,
        statusBefore,
        statusAfter,
        status: statusAfter,
        previousValues,
        updatedValues,
        delayFlag,
        duration,
        ipAddress,
        sessionId: sessionId || `SESS-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        evidence,
        reviewStatus: 'Pending Approval',
        reviewedBy: null,
        reviewedByRole: null,
        reviewedAt: null,
        reviewRemarks: '',
        approvalHistory: []
    }

    const updated = [newActivity, ...activities]
    saveEmployeeActivities(updated)
    return newActivity
}

export const logEmployeeActivity = ({
    employeeId,
    employeeName,
    roleKey,
    department,
    team = 'General',
    reportingManagerId = '',
    action = 'UPDATE',
    activityType = 'Task Execution',
    title,
    description = '',
    moduleRef = 'General',
    pageAccessed = '',
    referenceId = '',
    statusBefore = '-',
    statusAfter = 'Completed',
    previousValues = null,
    updatedValues = null,
    delayFlag = false,
    duration = '1m 00s',
    ipAddress = '192.168.1.100',
    sessionId = '',
    evidence = null
}) => {
    return captureActivityEvent({
        employeeId,
        employeeName,
        roleKey,
        department,
        team,
        reportingManagerId,
        action,
        activityType,
        title,
        description,
        moduleRef,
        pageAccessed,
        referenceId,
        statusBefore,
        statusAfter,
        previousValues,
        updatedValues,
        delayFlag,
        duration,
        ipAddress,
        sessionId,
        evidence
    })
}

/**
 * Helper to parse activity date for chronological comparisons
 */
const parseActivityDate = (act) => {
    if (act.isoTimestamp) {
        const d = new Date(act.isoTimestamp)
        if (!isNaN(d.getTime())) return d
    }
    if (act.date) {
        const parts = act.date.split('-')
        if (parts.length === 3) {
            // Check if YYYY-MM-DD or DD-MM-YYYY
            if (parts[0].length === 4) {
                return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
            } else {
                return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
            }
        }
    }
    if (act.timestamp) {
        const datePart = act.timestamp.split(' ')[0]
        const parts = datePart.split('-')
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
            } else {
                return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
            }
        }
    }
    return new Date()
}

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
    teamFilter = 'ALL',
    targetTeam = 'ALL',
    actionFilter = 'ALL',
    targetAction = 'ALL',
    moduleFilter = 'ALL',
    targetModule = 'ALL',
    dateFilter = 'ALL',
    dateFrom = null,
    dateTo = null,
    activityTypeFilter = 'ALL',
    statusFilter = 'ALL',
    reviewStatusFilter = 'ALL',
    searchQuery = ''
}) => {
    const effectiveRole = userRole || viewerRole || 'director'
    const effectiveUserId = userId || viewerEmployeeId || ''
    const effectiveUserName = userName || viewerName || (user?.name || user?.employeeName) || ''
    const effectiveDept = targetDept !== 'ALL' ? targetDept : (departmentFilter || 'ALL')
    const effectiveEmpId = targetEmployeeId !== 'ALL' ? targetEmployeeId : (employeeFilter || 'ALL')
    const effectiveRoleFilter = targetRole !== 'ALL' ? targetRole : (roleFilter || 'ALL')
    const effectiveTeam = targetTeam !== 'ALL' ? targetTeam : (teamFilter || 'ALL')
    const effectiveAction = targetAction !== 'ALL' ? targetAction : (actionFilter || 'ALL')
    const effectiveModule = targetModule !== 'ALL' ? targetModule : (moduleFilter || 'ALL')

    const all = getAllEmployeeActivities()
    const normalizedRole = (effectiveRole || '').trim().toLowerCase()
    const cleanRole = normalizedRole.replace(/[-_\s]/g, '')

    // 1. Hierarchical Scoping (Strict Role-Based Access Control)
    let scoped = all
    if (['director', 'superadmin', 'md'].includes(cleanRole)) {
        // Super Admin and Managing Director (Director) see organization-wide without restriction
        scoped = all
    } else if (['admin', 'jointdirector', 'jointdirectorassistant'].includes(cleanRole)) {
        // Campus Administration & Operations Director
        scoped = all
    } else if (['principal', 'seniorprincipal'].includes(cleanRole)) {
        // Principal sees Academic, Teaching, and Administration departments
        scoped = all.filter((a) => (a.department || '').includes('Academic') || a.department === 'Administration')
    } else if (['coordinator', 'academichead'].includes(cleanRole)) {
        // Academic Coordinator sees Academic teachers & teaching activities
        scoped = all.filter((a) => (a.department || '').includes('Academic'))
    } else {
        // Department Heads / Managers: Scoped strictly to their respective departments
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
            'jointdirectoraudit': 'Internal Audit',
            'qualityauditor': 'Internal Audit',
            'processauditor': 'Internal Audit'
        }
        const assignedDept = deptHeadMap[cleanRole] || userDept
        if (assignedDept) {
            const matchesDept = (dept) => Array.isArray(assignedDept) ? assignedDept.includes(dept) : dept === assignedDept
            scoped = all.filter((a) => matchesDept(a.department) || (effectiveUserId && a.employeeId === effectiveUserId))
        } else {
            // Operational Staff (Teachers, Drivers, Clerks, Lab Assistants): Strictly scoped to self
            scoped = all.filter((a) =>
                effectiveUserId
                    ? (a.employeeId === effectiveUserId || (effectiveUserName && a.employeeName === effectiveUserName))
                    : (a.roleKey && a.roleKey.replace(/[-_\s]/g, '') === cleanRole)
            )
        }
    }

    // 2. Apply Dynamic Multi-Facet Filters
    let filtered = scoped

    // Department Filter
    if (effectiveDept !== 'ALL') {
        filtered = filtered.filter((a) => a.department === effectiveDept)
    }

    // Team Filter
    if (effectiveTeam !== 'ALL') {
        filtered = filtered.filter((a) => a.team === effectiveTeam)
    }

    // Employee ID Filter
    if (effectiveEmpId !== 'ALL') {
        filtered = filtered.filter((a) => a.employeeId === effectiveEmpId)
    }

    // Role Filter
    if (effectiveRoleFilter !== 'ALL') {
        const targetClean = effectiveRoleFilter.toLowerCase().replace(/[-_\s]/g, '')
        filtered = filtered.filter((a) => {
            const r = (a.roleKey || a.role || '').toLowerCase().replace(/[-_\s]/g, '')
            return r === targetClean || (a.role && a.role.toLowerCase() === effectiveRoleFilter.toLowerCase())
        })
    }

    // Action Filter (CREATE, VIEW, UPDATE, DELETE, APPROVE, REJECT, EXPORT, LOGIN, LOGOUT)
    if (effectiveAction !== 'ALL') {
        filtered = filtered.filter((a) => (a.action || '').toUpperCase() === effectiveAction.toUpperCase())
    }

    // Module Filter
    if (effectiveModule !== 'ALL') {
        filtered = filtered.filter((a) => a.moduleRef === effectiveModule || a.category === effectiveModule)
    }

    // Activity Type Filter
    if (activityTypeFilter !== 'ALL') {
        filtered = filtered.filter((a) => a.activityType === activityTypeFilter)
    }

    // Task Status Filter
    if (statusFilter !== 'ALL') {
        filtered = filtered.filter((a) => (a.statusAfter || a.status) === statusFilter)
    }

    // Review Status Filter
    if (reviewStatusFilter !== 'ALL') {
        filtered = filtered.filter((a) => (a.reviewStatus || 'Pending Approval') === reviewStatusFilter)
    }

    // Date Range Filters: dateFrom & dateTo support
    if (dateFrom || dateTo) {
        const fromDateObj = dateFrom ? new Date(dateFrom.includes('-') && dateFrom.split('-')[0].length === 2
            ? `${dateFrom.split('-')[2]}-${dateFrom.split('-')[1]}-${dateFrom.split('-')[0]}`
            : dateFrom) : null
        if (fromDateObj) fromDateObj.setHours(0, 0, 0, 0)

        const toDateObj = dateTo ? new Date(dateTo.includes('-') && dateTo.split('-')[0].length === 2
            ? `${dateTo.split('-')[2]}-${dateTo.split('-')[1]}-${dateTo.split('-')[0]}`
            : dateTo) : null
        if (toDateObj) toDateObj.setHours(23, 59, 59, 999)

        filtered = filtered.filter((a) => {
            const actDate = parseActivityDate(a)
            if (fromDateObj && actDate < fromDateObj) return false
            if (toDateObj && actDate > toDateObj) return false
            return true
        })
    } else if (dateFilter !== 'ALL') {
        const today = new Date()
        const day = String(today.getDate()).padStart(2, '0')
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const year = today.getFullYear()
        const todayStr = `${day}-${month}-${year}`

        if (dateFilter === 'TODAY') {
            filtered = filtered.filter((a) => a.date === todayStr || (a.timestamp && a.timestamp.includes(todayStr)))
        } else if (dateFilter === 'LAST_7_DAYS') {
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(today.getDate() - 7)
            filtered = filtered.filter((a) => parseActivityDate(a) >= sevenDaysAgo)
        } else {
            filtered = filtered.filter((a) => a.date === dateFilter || (a.timestamp && a.timestamp.includes(dateFilter)))
        }
    }

    // Search Query (Deep text match across user, title, description, IP, reference ID)
    if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        filtered = filtered.filter((a) => {
            const searchableText = `${a.employeeName} ${a.employeeId} ${a.title || a.activityTitle || ''} ${a.description || a.details || ''} ${a.roleKey || a.role || ''} ${a.department || ''} ${a.team || ''} ${a.referenceId || ''} ${a.moduleRef || ''} ${a.ipAddress || ''} ${a.action || ''}`.toLowerCase()
            return searchableText.includes(q)
        })
    }

    // 3. Compute Summary KPIs
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    const todayStr = `${day}-${month}-${year}`

    const totalActivities = filtered.length
    const todayActivities = filtered.filter((a) => a.date === todayStr || (a.timestamp && a.timestamp.includes(todayStr))).length
    const completedActivities = filtered.filter((a) => ['Completed', 'Resolved', 'Fully Received', 'Security Cleared Out', 'Approved'].includes(a.statusAfter || a.status)).length
    const inProgressActivities = filtered.filter((a) => ['In Progress', 'Assigned', 'Submitted', 'Checked Out'].includes(a.statusAfter || a.status)).length
    const delayedActivities = filtered.filter((a) => a.delayFlag || a.status === 'Delayed').length

    // Ticket activities count
    const ticketActivities = filtered.filter((a) => (a.activityType || '').toLowerCase().includes('ticket'))
    const resolvedTicketActivities = ticketActivities.filter((a) => ['Completed', 'Resolved'].includes(a.statusAfter || a.status))
    const ticketsClosed = resolvedTicketActivities.length > 0 ? resolvedTicketActivities.length : completedActivities

    // Actions Breakdown (CREATE, UPDATE, APPROVE, etc.)
    const actionsBreakdown = {}
    ACTIVITY_ACTIONS.forEach((act) => {
        actionsBreakdown[act] = 0
    })
    filtered.forEach((a) => {
        const actionType = (a.action || 'UPDATE').toUpperCase()
        actionsBreakdown[actionType] = (actionsBreakdown[actionType] || 0) + 1
    })

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
        if (['Completed', 'Resolved', 'Fully Received', 'Security Cleared Out', 'Approved'].includes(a.statusAfter || a.status)) {
            departmentBreakdownDict[dept].completed += 1
        } else if (['In Progress', 'Assigned', 'Submitted', 'Checked Out'].includes(a.statusAfter || a.status)) {
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

    // Team Breakdown
    const teamBreakdown = {}
    filtered.forEach((a) => {
        const t = a.team || 'General'
        teamBreakdown[t] = (teamBreakdown[t] || 0) + 1
    })

    // 5. Subordinate Performers Summary
    const employeeMap = {}
    scoped.forEach((a) => {
        if (!employeeMap[a.employeeId]) {
            employeeMap[a.employeeId] = {
                employeeId: a.employeeId,
                employeeName: a.employeeName,
                department: a.department,
                team: a.team || 'General',
                total: 0,
                completed: 0,
                inProgress: 0,
                lastActivity: a.timestamp
            }
        }
        employeeMap[a.employeeId].total += 1
        if (['Completed', 'Resolved', 'Fully Received', 'Security Cleared Out', 'Approved'].includes(a.statusAfter || a.status)) {
            employeeMap[a.employeeId].completed += 1
        } else {
            employeeMap[a.employeeId].inProgress += 1
        }
    })

    // 6. Normalized Activity Stream
    const normalizedStream = filtered.map((a) => ({
        ...a,
        id: a.id,
        isoTimestamp: a.isoTimestamp || new Date().toISOString(),
        timestamp: a.timestamp,
        date: a.date,
        employeeId: a.employeeId,
        employeeName: a.employeeName,
        role: a.roleKey || a.role || 'Staff',
        roleKey: a.roleKey || a.role || 'staff',
        department: a.department,
        team: a.team || 'General',
        category: a.moduleRef || a.activityType || 'General Task',
        activityType: a.activityType,
        action: (a.action || 'UPDATE').toUpperCase(),
        activityTitle: a.title || a.activityTitle,
        title: a.title || a.activityTitle,
        details: a.description || a.details || '',
        description: a.description || a.details || '',
        pageAccessed: a.pageAccessed || '/',
        referenceId: a.referenceId || '',
        status: a.statusAfter || a.status || 'Completed',
        statusBefore: a.statusBefore || 'None',
        statusAfter: a.statusAfter || 'Completed',
        previousValues: a.previousValues || null,
        updatedValues: a.updatedValues || null,
        duration: a.duration || '1m 00s',
        ipAddress: a.ipAddress || '192.168.1.100',
        sessionId: a.sessionId || 'SESS-2026-X01',
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
            actionsBreakdown,
            teamBreakdown,
            departmentBreakdown: departmentBreakdownDict
        },
        departmentBreakdown,
        actionsBreakdown,
        teamBreakdown,
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
    const workflowStatus = (current.reviewStatus === 'Approved' || current.reviewStatus === 'Needs Revision') 
        ? current.reviewStatus 
        : 'Submitted'
    const updated = applyWorkflowDecision({
        workflowType: WORKFLOW_TYPES.EMPLOYEE_DAILY_ACTIVITY,
        entity: {
            ...current,
            status: workflowStatus
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
