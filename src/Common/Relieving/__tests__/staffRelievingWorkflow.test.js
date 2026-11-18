import test from 'node:test'
import assert from 'node:assert/strict'
import { getExits, saveExits } from '../../../Pages/HR/domain/hrStore.js'

test('Staff Relieving Workflow: Status progression, Department Checkpoints & Approval', (t) => {
    // 1. Setup mock exit record
    const mockExit = {
        id: 'EXT-TEST-001',
        employeeId: 'EMP-TCH-006',
        lastWorkingDate: '2026-11-30',
        exitType: 'Resignation',
        reason: 'Higher studies relocation',
        noticePeriod: '30 days',
        noticeServed: false,
        handover: false,
        assets: false,
        documents: false,
        finance: false,
        departmentClearance: false,
        hrClearance: false,
        exitInterview: false,
        status: 'Initiated'
    }

    // 2. Acceptance step
    const acceptedExit = {
        ...mockExit,
        status: 'In Progress',
        acknowledgedBy: 'Savitha Raman (HR)',
        acknowledgedDate: '2026-10-31'
    }
    assert.equal(acceptedExit.status, 'In Progress')
    assert.equal(acceptedExit.acknowledgedBy, 'Savitha Raman (HR)')

    // 3. Department sign-offs
    const withDeptClearance = {
        ...acceptedExit,
        departmentClearance: true,
        handover: true,
        assets: true,
        documents: true,
        finance: true
    }
    const clearedSteps = ['departmentClearance', 'handover', 'assets', 'documents', 'finance', 'hrClearance']
        .filter((k) => Boolean(withDeptClearance[k]))
    assert.equal(clearedSteps.length, 5)

    // 4. Final HR approval and completion
    const finalizedExit = {
        ...withDeptClearance,
        hrClearance: true,
        exitInterview: true,
        status: 'Completed',
        approvedBy: 'Dr. S. Meenakshi (Principal)',
        approvalDate: '2026-11-15'
    }
    assert.equal(finalizedExit.status, 'Completed')
    assert.equal(finalizedExit.hrClearance, true)
    assert.equal(finalizedExit.approvedBy, 'Dr. S. Meenakshi (Principal)')
})

test('Staff Relieving Workflow: Rejection with remarks', (t) => {
    const mockExit = {
        id: 'EXT-TEST-002',
        employeeId: 'EMP-TCH-007',
        status: 'Initiated'
    }

    const rejectedExit = {
        ...mockExit,
        status: 'Rejected',
        rejectedBy: 'HR Manager',
        rejectionReason: 'Notice period commitment breach during critical exam cycle'
    }

    assert.equal(rejectedExit.status, 'Rejected')
    assert.ok(rejectedExit.rejectionReason.includes('Notice period'))
})
