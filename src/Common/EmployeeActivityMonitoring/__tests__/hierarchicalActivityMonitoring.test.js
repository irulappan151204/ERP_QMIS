import test from 'node:test'
import assert from 'node:assert/strict'
import {
    getHierarchicalActivityMonitoring,
    captureActivityEvent,
    reviewEmployeeActivity,
    getAllEmployeeActivities,
    ACTIVITY_ACTIONS
} from '../employeeActivityMonitoringData.js'
import { exportDataset } from '../../ui/exportUtils.js'

test('1. Super Admin & Director have unrestricted organization-wide activity visibility', () => {
    const superAdminView = getHierarchicalActivityMonitoring({
        userRole: 'superadmin',
        userId: 'EMP-SUP-001'
    })

    assert.ok(superAdminView.summary.totalActivities > 0, 'Super admin should see logged activities')
    assert.ok(superAdminView.activities.length > 20, 'Super admin should see comprehensive activity records')

    const directorView = getHierarchicalActivityMonitoring({
        userRole: 'director',
        userId: 'EMP-DIR-001'
    })
    assert.equal(directorView.summary.totalActivities, superAdminView.summary.totalActivities)

    // Verify presence of diverse departments
    const depts = new Set(superAdminView.activities.map((a) => a.department))
    assert.ok(depts.has('Academics & Teaching'))
    assert.ok(depts.has('Stores & Procurement'))
    assert.ok(depts.has('Transport & Fleet Logistics'))
    assert.ok(depts.has('Campus Security & Access Control'))
})

test('2. Principal scoping is restricted to Academic, Teaching, and Administration departments', () => {
    const principalView = getHierarchicalActivityMonitoring({
        userRole: 'principal',
        userId: 'EMP-PRN-001'
    })

    assert.ok(principalView.activities.length > 0)
    assert.ok(
        principalView.activities.every(
            (a) => (a.department || '').includes('Academic') || a.department === 'Administration'
        ),
        'Principal must only see Academic and Administrative activities'
    )
})

test('3. Academic Coordinator scoping is strictly confined to Academic & Teaching activities', () => {
    const coordView = getHierarchicalActivityMonitoring({
        userRole: 'coordinator',
        userId: 'EMP-CRD-001'
    })

    assert.ok(coordView.activities.length > 0)
    assert.ok(
        coordView.activities.every((a) => (a.department || '').includes('Academic')),
        'Coordinator must only see Academic activities'
    )
})

test('4. Department Managers are strictly scoped to their respective operational departments', () => {
    // A: Transport Manager
    const transportView = getHierarchicalActivityMonitoring({
        userRole: 'transportmanager',
        userDept: 'Transport & Fleet Logistics'
    })
    assert.ok(transportView.activities.length > 0)
    assert.ok(
        transportView.activities.every((a) => a.department === 'Transport & Fleet Logistics'),
        'Transport manager must only see Transport & Fleet Logistics activities'
    )

    // B: Stationery Store Manager
    const storeView = getHierarchicalActivityMonitoring({
        userRole: 'stationerystoremanager',
        userDept: 'Stores & Procurement'
    })
    assert.ok(storeView.activities.length > 0)
    assert.ok(
        storeView.activities.every((a) => a.department === 'Stores & Procurement'),
        'Stores manager must only see Stores & Procurement activities'
    )

    // C: IT Support Manager
    const itView = getHierarchicalActivityMonitoring({
        userRole: 'itsupportmanager',
        userDept: 'IT Support & Systems'
    })
    assert.ok(itView.activities.length > 0)
    assert.ok(
        itView.activities.every((a) => a.department === 'IT Support & Systems'),
        'IT manager must only see IT Support & Systems activities'
    )
})

test('5. Operational Staff are strictly restricted to their own individual activities', () => {
    const staffId = 'EMP-TCH-006'
    const staffName = 'Ananya Roy'

    const staffView = getHierarchicalActivityMonitoring({
        userRole: 'teacher',
        userId: staffId,
        userName: staffName
    })

    assert.ok(staffView.activities.length > 0)
    assert.ok(
        staffView.activities.every((a) => a.employeeId === staffId || a.employeeName === staffName),
        'Staff member must only be able to inspect their own activities'
    )
})

test('6. Multi-facet filtering: Action, Team, Date Range, and Search Query', () => {
    // Filter by action protocol
    const createActions = getHierarchicalActivityMonitoring({
        userRole: 'superadmin',
        actionFilter: 'CREATE'
    })
    assert.ok(createActions.activities.length > 0)
    assert.ok(createActions.activities.every((a) => a.action === 'CREATE'))

    const approveActions = getHierarchicalActivityMonitoring({
        userRole: 'superadmin',
        actionFilter: 'APPROVE'
    })
    assert.ok(approveActions.activities.length > 0)
    assert.ok(approveActions.activities.every((a) => a.action === 'APPROVE'))

    // Filter by Date Range (October 2026)
    const dateRangeView = getHierarchicalActivityMonitoring({
        userRole: 'superadmin',
        dateFrom: '2026-10-30',
        dateTo: '2026-10-31'
    })
    assert.ok(dateRangeView.activities.length > 0)
    assert.ok(
        dateRangeView.activities.every((a) => {
            const d = a.date || a.timestamp
            return d.includes('30-10-2026') || d.includes('31-10-2026')
        })
    )

    // Deep text search
    const searchView = getHierarchicalActivityMonitoring({
        userRole: 'superadmin',
        searchQuery: 'Smartboard'
    })
    assert.ok(searchView.activities.length > 0)
    assert.ok(
        searchView.activities.some((a) => a.activityTitle.includes('Smartboard') || a.details.includes('Smartboard'))
    )
})

test('7. captureActivityEvent logs operational events with structured diffs and telemetry', () => {
    const event = captureActivityEvent({
        employeeId: 'EMP-ADM-TEST',
        employeeName: 'Audit Officer Test',
        roleKey: 'admin',
        department: 'Administration',
        team: 'Compliance Cell',
        action: 'UPDATE',
        activityType: 'Task Execution',
        title: 'Calibrated Campus Master Clock Relay',
        description: 'Synchronized atomic NTP time servers with school siren system.',
        moduleRef: 'Campus Operations',
        pageAccessed: '/admin/settings',
        referenceId: 'NTP-SYNC-01',
        statusBefore: 'Desynced',
        statusAfter: 'Completed',
        previousValues: { offsetMs: 420 },
        updatedValues: { offsetMs: 0, syncServer: 'time.google.com' },
        duration: '2m 15s',
        ipAddress: '192.168.1.99',
        sessionId: 'SESS-TEST-99'
    })

    assert.ok(event.id.startsWith('ACT-2026-'))
    assert.equal(event.action, 'UPDATE')
    assert.equal(event.status, 'Completed')
    assert.deepEqual(event.previousValues, { offsetMs: 420 })
    assert.deepEqual(event.updatedValues, { offsetMs: 0, syncServer: 'time.google.com' })
    assert.equal(event.ipAddress, '192.168.1.99')

    // Verify it is queryable in hierarchical monitoring
    const monitored = getHierarchicalActivityMonitoring({
        userRole: 'superadmin',
        targetEmployeeId: 'EMP-ADM-TEST'
    })
    assert.ok(monitored.activities.some((a) => a.id === event.id))
})

test('8. reviewEmployeeActivity records managerial sign-off and approval audit history', () => {
    const activity = captureActivityEvent({
        employeeId: 'EMP-TRN-999',
        employeeName: 'Test Driver',
        roleKey: 'driver',
        department: 'Transport & Fleet Logistics',
        action: 'UPDATE',
        title: 'Test Fleet Run Completion',
        description: 'Test odometer reading',
        moduleRef: 'Transport Management',
        statusAfter: 'Completed'
    })

    const reviewed = reviewEmployeeActivity({
        activityId: activity.id,
        decision: 'Approved',
        reviewerName: 'Karthik S (Transport Manager)',
        reviewerRole: 'transportmanager',
        remarks: 'Test log verified and signed off.'
    })

    assert.equal(reviewed.reviewStatus, 'Approved')
    assert.equal(reviewed.reviewedBy, 'Karthik S (Transport Manager)')
    assert.ok(reviewed.approvalHistory.length > 0)
    assert.equal(reviewed.approvalHistory[0].status, 'Approved')
})

test('9. exportDataset captures an EXPORT event in the activity monitoring stream', () => {
    const initialCount = getAllEmployeeActivities().length

    const dummyData = [
        { id: 1, name: 'Sample Item A', status: 'Active' },
        { id: 2, name: 'Sample Item B', status: 'Completed' }
    ]

    exportDataset('csv', {
        title: 'Automated Test Export Roster',
        columns: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Item Name' },
            { key: 'status', label: 'Status' }
        ],
        rows: dummyData
    })

    const afterActivities = getAllEmployeeActivities()
    assert.ok(afterActivities.length >= initialCount)
    const exportEvent = afterActivities.find((a) => a.action === 'EXPORT' && a.title.includes('Automated Test Export Roster'))
    assert.ok(exportEvent, 'exportDataset should automatically capture an EXPORT action event')
    assert.equal(exportEvent.action, 'EXPORT')
})
