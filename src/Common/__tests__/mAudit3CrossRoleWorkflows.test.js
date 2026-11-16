import test from 'node:test'
import assert from 'node:assert/strict'

import { ROLES } from '../../constants/roles.js'
import {
    submitLeaveRequest,
    updateLeaveRequestDecision,
    canRoleDecideLeave,
    getAuthorizedReceivedLeaveRequests,
    getMyLeaveRequests,
    getStudentAttendanceSummary,
    updateStudentAttendanceStatus,
    markAllStudentAttendance,
    getAllStudentAttendanceRecords,
} from '../AttendanceAndLeave/attendanceLeaveData.js'
import {
    LEAVE_APPROVER_CONFIG,
    DEFAULT_SUBMITTER_PROFILES,
    LEAVE_ROUTE_CONFIG,
} from '../LeaveRequest/leaveRequestConfigs.js'
import { studentSidebarLinks } from '../CommonSidebar/Components/studentSidebarLinks.js'
import { parentSidebarLinks } from '../CommonSidebar/Components/parentSidebarLinks.js'
import {
    saveStudentSubmission,
    getStudentSubmission,
    getStudentSubmissionStatus,
    getStoredSubmissions,
    gradeStudentSubmission,
    getGradedSubmissions,
} from '../../Pages/Student/StudentDeliverables/studentHomeFunSubmissions.js'
import { getHomeFunSubmissionRecord } from '../../Pages/Teacher/StudentDeliverables/HomeFun/homeFunData.js'
import { feeService } from '../../services/modules/feeService.js'
import { transportService } from '../../services/modules/transportService.js'

test('Milestone M-AUDIT-3: Cross-Role Workflow Completion & Sync Test Suite', async (t) => {
    // =========================================================================
    // FEATURE 13: STUDENT LEAVE REQUEST WORKFLOW
    // =========================================================================
    await t.test('F13-01: Student submits leave request with teacher approver target', () => {
        const studentLeave = submitLeaveRequest({
            employeeId: 'STU-2025-1001',
            employeeName: 'Aarav Sharma',
            department: 'Grade 10-A',
            designation: 'Student',
            leaveType: 'Sick Leave',
            leaveCategory: 'Sick Leave',
            leaveTypeCode: 'SL',
            startDate: '2026-11-20',
            endDate: '2026-11-21',
            totalDays: 2,
            reason: 'High fever and viral illness',
            approver: 'Class Teacher (Mr. Ravi)',
            approverRole: 'teacher',
            submitterRole: 'student',
            requestedTo: 'Teacher',
        })

        assert.ok(studentLeave.id.startsWith('LR-'), 'Must generate a valid leave request ID')
        assert.equal(studentLeave.employeeId, 'STU-2025-1001')
        assert.equal(studentLeave.submitterRole, 'student')
        assert.equal(studentLeave.approverRole, 'teacher')
        assert.equal(studentLeave.requestedTo, 'Teacher')
        assert.equal(studentLeave.status, 'Pending')
        assert.equal(studentLeave.totalDays, 2)
    })

    await t.test('F13-02: Student can query their own submitted leave requests', () => {
        const myRequests = getMyLeaveRequests('STU-2025-1001')
        assert.ok(Array.isArray(myRequests))
        assert.ok(myRequests.length > 0, 'Student should have at least 1 submitted leave request')
        assert.equal(myRequests[0].employeeId, 'STU-2025-1001')
    })

    await t.test('F13-03: Teacher and Admin review queues receive student submitted leave requests', () => {
        // Teacher review queue must include student leave requests
        const teacherQueue = getAuthorizedReceivedLeaveRequests('teacher', 'teacher@schoolerp.edu')
        assert.ok(Array.isArray(teacherQueue))
        const studentReqInTeacherQueue = teacherQueue.find(
            (r) => r.submitterRole === 'student' || r.approverRole === 'teacher' || r.requestedTo === 'Teacher',
        )
        assert.ok(studentReqInTeacherQueue, 'Teacher must receive student submitted leave request')

        // Full access leadership (Admin, Super Admin, Principal) also receive student requests
        const adminQueue = getAuthorizedReceivedLeaveRequests('admin')
        assert.ok(adminQueue.some((r) => r.submitterRole === 'student'), 'Admin receives all leave requests including students')

        const superAdminQueue = getAuthorizedReceivedLeaveRequests('super-admin')
        assert.ok(superAdminQueue.some((r) => r.submitterRole === 'student'), 'Super admin receives all leave requests including students')
    })

    await t.test('F13-04: Leave request configs specify Student and Parent profiles, approvers and routes', () => {
        // Approver config
        assert.ok(LEAVE_APPROVER_CONFIG[ROLES.STUDENT], 'Student approver config must exist')
        assert.equal(LEAVE_APPROVER_CONFIG[ROLES.STUDENT].approverRole, ROLES.TEACHER)
        assert.equal(LEAVE_APPROVER_CONFIG[ROLES.STUDENT].requestedToLabel, 'Teacher')

        assert.ok(LEAVE_APPROVER_CONFIG[ROLES.PARENT], 'Parent approver config must exist')
        assert.equal(LEAVE_APPROVER_CONFIG[ROLES.PARENT].approverRole, ROLES.TEACHER)

        // Submitter profiles
        assert.ok(DEFAULT_SUBMITTER_PROFILES[ROLES.STUDENT], 'Student submitter profile must exist')
        assert.equal(DEFAULT_SUBMITTER_PROFILES[ROLES.STUDENT].role, 'Student')

        assert.ok(DEFAULT_SUBMITTER_PROFILES[ROLES.PARENT], 'Parent submitter profile must exist')
        assert.equal(DEFAULT_SUBMITTER_PROFILES[ROLES.PARENT].role, 'Parent')

        // Route configs
        assert.equal(LEAVE_ROUTE_CONFIG.student.myList, '/student/apply-leave')
        assert.equal(LEAVE_ROUTE_CONFIG.parent.myList, '/parent/apply-leave')
    })

    await t.test('F13-05: Sidebar navigation links contain functional Apply Leave endpoints', () => {
        // Check Student sidebar
        const studentClass = studentSidebarLinks.find((item) => item.title === 'Class')
        assert.ok(studentClass, 'Class group should exist in Student sidebar')
        const studentApplyLeave = studentClass.subLinks?.find(
            (sub) => sub.title === 'Apply Leave' && sub.to === '/student/apply-leave',
        )
        assert.ok(studentApplyLeave, 'Student sidebar must have link to /student/apply-leave')

        // Check Parent sidebar
        const parentClass = parentSidebarLinks.find((item) => item.title === 'Class')
        assert.ok(parentClass, 'Class group should exist in Parent sidebar')
        const parentApplyLeave = parentClass.subLinks?.find(
            (sub) => sub.title === 'Apply Leave' && sub.to === '/parent/apply-leave',
        )
        assert.ok(parentApplyLeave, 'Parent sidebar must have link to /parent/apply-leave')
    })

    await t.test('F13-06: Date inversion and empty/whitespace reason validation in submitLeaveRequest', () => {
        // Date inversion: endDate earlier than startDate
        assert.throws(
            () => submitLeaveRequest({
                employeeId: 'STU-2025-1001',
                employeeName: 'Aarav Sharma',
                department: 'Grade 10-A',
                designation: 'Student',
                leaveType: 'Medical Leave',
                startDate: '2026-12-10',
                endDate: '2026-12-01',
                totalDays: 2,
                reason: 'Orthopedic consultation and rest',
                approverRole: 'teacher',
                submitterRole: 'student',
            }),
            /End date cannot be earlier than start date/
        )

        // Empty reason
        assert.throws(
            () => submitLeaveRequest({
                employeeId: 'STU-2025-1001',
                employeeName: 'Aarav Sharma',
                department: 'Grade 10-A',
                designation: 'Student',
                leaveType: 'Casual Leave',
                startDate: '2026-12-01',
                endDate: '2026-12-02',
                reason: '',
                approverRole: 'teacher',
                submitterRole: 'student',
            }),
            /Reason for leave is mandatory and cannot be empty/
        )

        // Whitespace-only reason
        assert.throws(
            () => submitLeaveRequest({
                employeeId: 'STU-2025-1001',
                employeeName: 'Aarav Sharma',
                department: 'Grade 10-A',
                designation: 'Student',
                leaveType: 'Casual Leave',
                startDate: '2026-12-01',
                endDate: '2026-12-02',
                reason: '     ',
                approverRole: 'teacher',
                submitterRole: 'student',
            }),
            /Reason for leave is mandatory and cannot be empty/
        )
    })

    await t.test('F13-07: Teacher can approve and reject student leave requests', () => {
        // 1. Submit a student leave request targeted to teacher
        const req1 = submitLeaveRequest({
            employeeId: 'STU-2025-1002',
            employeeName: 'Diya Sen',
            department: 'Grade 10-A',
            designation: 'Student',
            leaveType: 'Medical Leave',
            startDate: '2026-12-05',
            endDate: '2026-12-06',
            totalDays: 2,
            reason: 'Dental surgery and post-op rest',
            approver: 'Class Teacher (Mr. Ravi)',
            approverRole: 'teacher',
            submitterRole: 'student',
            requestedTo: 'Teacher',
        })

        assert.equal(canRoleDecideLeave('teacher', req1), true, 'Teacher must be authorized to decide student leave')

        // Teacher approves student leave
        const approveResult = updateLeaveRequestDecision(req1.id, 'Approved', 'Mr. Ravi', 'Approved for surgery rest', 'teacher')
        assert.equal(approveResult.success, true)
        assert.equal(approveResult.request.status, 'Approved')
        assert.equal(approveResult.request.reviewedBy, 'Mr. Ravi')
        assert.equal(approveResult.request.reviewRemarks, 'Approved for surgery rest')

        // 2. Submit another student leave request and reject it with mandatory rationale
        const req2 = submitLeaveRequest({
            employeeId: 'STU-2025-1003',
            employeeName: 'Rohan Gupta',
            department: 'Grade 10-A',
            designation: 'Student',
            leaveType: 'Casual Leave',
            startDate: '2026-12-10',
            endDate: '2026-12-11',
            totalDays: 2,
            reason: 'Personal outing with family',
            approver: 'Class Teacher (Mr. Ravi)',
            approverRole: 'teacher',
            submitterRole: 'student',
            requestedTo: 'Teacher',
        })

        const rejectResult = updateLeaveRequestDecision(req2.id, 'Rejected', 'Mr. Ravi', 'Cannot grant leave during pre-board revision week', 'teacher')
        assert.equal(rejectResult.success, true)
        assert.equal(rejectResult.request.status, 'Rejected')
        assert.equal(rejectResult.request.reviewRemarks, 'Cannot grant leave during pre-board revision week')

        // 3. Teacher boundary check: Teacher cannot decide staff/employee leaves
        const staffReq = submitLeaveRequest({
            employeeId: 'EMP-TCH-001',
            employeeName: 'Mr. Ravi',
            department: 'Academics & Teaching',
            designation: 'Faculty',
            leaveType: 'Casual Leave',
            startDate: '2026-12-15',
            endDate: '2026-12-16',
            totalDays: 2,
            reason: 'Family visit to native place',
            approver: 'Human Resources Department (Sunita Deshmukh)',
            approverRole: 'hr',
            submitterRole: 'employee',
        })

        assert.equal(canRoleDecideLeave('teacher', staffReq), false, 'Teacher cannot decide enterprise staff leave')
        assert.throws(
            () => updateLeaveRequestDecision(staffReq.id, 'Approved', 'Mr. Ravi', 'Self approval test', 'teacher'),
            /Unauthorized: Only Human Resources/
        )
    })

    await t.test('F13-08: Student leave approval synchronizes student attendance roster status to On Leave', () => {
        const studentId = 'STU-2025-1001'
        const leaveReq = submitLeaveRequest({
            employeeId: studentId,
            employeeName: 'Aarav Sharma',
            department: 'Grade 10-A',
            designation: 'Student',
            leaveType: 'Sick Leave',
            startDate: '2026-12-02',
            endDate: '2026-12-04',
            totalDays: 3,
            reason: 'Viral fever quarantine',
            approver: 'Class Teacher (Mr. Ravi)',
            approverRole: 'teacher',
            submitterRole: 'student',
            requestedTo: 'Teacher',
        })

        // Approve the leave request as teacher
        const decisionRes = updateLeaveRequestDecision(leaveReq.id, 'Approved', 'Mr. Ravi', 'Approved for medical recovery', 'teacher')
        assert.equal(decisionRes.success, true)

        // Verify roster status synchronization
        const summary = getStudentAttendanceSummary(studentId)
        assert.equal(summary.currentStatus, 'On Leave', 'Student attendance summary must synchronize to On Leave on approval')
        assert.ok(summary.remarks.includes('Approved student leave'), 'Roster remarks must state approved student leave')
    })

    // =========================================================================
    // FEATURE 14: TEACHER-TO-STUDENT ATTENDANCE SYNC
    // =========================================================================
    await t.test('F14-01: Student attendance summary returns graceful fallback for unknown/null student', () => {
        const fallback = getStudentAttendanceSummary('UNKNOWN-STUDENT-999')
        assert.ok(fallback, 'Summary must return a valid object')
        assert.equal(fallback.totalWorkingDays, 22)
        assert.equal(fallback.presentDays, 18)
        assert.equal(fallback.absentDays, 4)
        assert.equal(fallback.percentage, 81.82)
        assert.equal(fallback.stats.percentage, 75)
        assert.equal(fallback.stats.minimumRequired, 75)
        assert.ok(Array.isArray(fallback.subjectWiseAttendance))
        assert.ok(Array.isArray(fallback.recentAttendance))
    })

    await t.test('F14-02: Teacher marks student Present -> live attendance summary reflects increased attendance', () => {
        const studentId = 'STU-2025-1001'
        updateStudentAttendanceStatus(studentId, 'Present', 'On-time classroom arrival')

        const summary = getStudentAttendanceSummary(studentId)
        assert.equal(summary.currentStatus, 'Present')
        assert.equal(summary.remarks, 'On-time classroom arrival')
        assert.equal(summary.presentDays, 19)
        assert.equal(summary.absentDays, 3)
        assert.equal(summary.percentage, 86.36)
        assert.equal(summary.stats.classesAttended, 7)
        assert.equal(summary.stats.percentage, 87.5)
        assert.equal(summary.recentAttendance[0].status, 'P')
    })

    await t.test('F14-03: Teacher marks student Absent -> live attendance summary dynamically reflects absence', () => {
        const studentId = 'STU-2025-1001'
        updateStudentAttendanceStatus(studentId, 'Absent', 'Absent for medical tests')

        const summary = getStudentAttendanceSummary(studentId)
        assert.equal(summary.currentStatus, 'Absent')
        assert.equal(summary.remarks, 'Absent for medical tests')
        assert.equal(summary.presentDays, 16)
        assert.equal(summary.absentDays, 6)
        assert.equal(summary.percentage, 72.73)
        assert.equal(summary.stats.classesAttended, 5)
        assert.equal(summary.stats.percentage, 62.5)
        assert.equal(summary.recentAttendance[0].status, 'A')
    })

    await t.test('F14-04: Teacher bulk marks class attendance and persists to roster', () => {
        const updatedRoster = markAllStudentAttendance('10', 'A', 'Present', 'Mr. Ravi')
        assert.ok(Array.isArray(updatedRoster))
        const sectionStudents = updatedRoster.filter(
            (s) => String(s.className) === '10' && s.section === 'A',
        )
        assert.ok(sectionStudents.length >= 10, 'Grade 10-A roster should have all students marked')
        assert.ok(sectionStudents.every((s) => s.status === 'Present'))

        // Verify summary for Aarav Sharma is now Present
        const summary = getStudentAttendanceSummary('STU-2025-1001')
        assert.equal(summary.currentStatus, 'Present')
        assert.equal(summary.presentDays, 19)
    })

    await t.test('F14-05: On Leave student attendance status maps to badge L in recentAttendance', () => {
        const studentId = 'STU-2025-1001'
        updateStudentAttendanceStatus(studentId, 'On Leave', 'Approved medical leave for chickenpox')

        const summary = getStudentAttendanceSummary(studentId)
        assert.equal(summary.currentStatus, 'On Leave')
        assert.equal(summary.recentAttendance[0].status, 'L', 'Recent attendance badge for On Leave must be L, not P')
    })

    // =========================================================================
    // FEATURE 15: ASSIGNMENT SUBMISSION & REVIEW WORKFLOW
    // =========================================================================
    await t.test('F15-01: Student submits homework assignment and stores in persistent submission store', () => {
        const submission = saveStudentSubmission({
            assignmentId: 'HF-1001',
            assignmentTitle: 'Quadratic Equations Homework',
            fileName: 'Aarav-Quadratic-HW.pdf',
            fileSize: '750 KB',
            additionalNote: 'Completed all 10 problem sets with graph sketches.',
            dueDate: '2026-11-25',
        }, 'STU-2025-1001')

        assert.equal(submission.assignmentId, 'HF-1001')
        assert.equal(submission.studentId, 'STU-2025-1001')
        assert.equal(submission.isLate, false)
        assert.equal(submission.fileName, 'Aarav-Quadratic-HW.pdf')

        const stored = getStudentSubmission('HF-1001', 'Quadratic Equations Homework', 'STU-2025-1001')
        assert.ok(stored)
        assert.equal(stored.studentId, 'STU-2025-1001')

        const status = getStudentSubmissionStatus({ assignmentId: 'HF-1001', assignmentTitle: 'Quadratic Equations Homework' }, 'STU-2025-1001')
        assert.equal(status, 'Submitted')
    })

    await t.test('F15-02: Overdue assignment submission is flagged as Late', () => {
        const lateSubmission = saveStudentSubmission({
            assignmentId: 'HF-1002',
            assignmentTitle: 'Organic Chemistry Lab Report',
            fileName: 'Aarav-Chemistry-Report.pdf',
            fileSize: '820 KB',
            additionalNote: 'Submitted late due to sick leave.',
            dueDate: '2025-01-01', // Past date
        }, 'STU-2025-1001')

        assert.equal(lateSubmission.isLate, true)
        const status = getStudentSubmissionStatus({ assignmentId: 'HF-1002', assignmentTitle: 'Organic Chemistry Lab Report' }, 'STU-2025-1001')
        assert.equal(status, 'Late')
    })

    await t.test('F15-03: Teacher workflow receives live student submissions in getHomeFunSubmissionRecord', () => {
        const teacherViewRecord = getHomeFunSubmissionRecord({
            id: 'HF-1001',
            assignmentId: 'HF-1001',
            assignmentTitle: 'Quadratic Equations Homework',
            className: '10',
            section: 'A',
            totalStudents: 30,
        })

        assert.ok(teacherViewRecord)
        assert.ok(teacherViewRecord.submittedStudents >= 1, 'Teacher view should reflect the submitted student')
        const foundStudent = teacherViewRecord.studentDetails.submitted.find((s) => s.id === 'STU-2025-1001')
        assert.ok(foundStudent, 'Student submission details must appear in teacher submitted list')
        assert.equal(foundStudent.submission.fileName, 'Aarav-Quadratic-HW.pdf')
        assert.equal(foundStudent.submission.additionalNote, 'Completed all 10 problem sets with graph sketches.')
    })

    await t.test('F15-04: Teacher grades student submission with grade, marks, and feedback', () => {
        const graded = gradeStudentSubmission({
            assignmentId: 'HF-1001',
            studentId: 'STU-2025-1001',
            grade: 'A+',
            marks: '98/100',
            feedback: 'Flawless derivations and neat graphs.',
            teacherName: 'Mr. Ravi (Mathematics)',
        })

        assert.equal(graded.status, 'Graded')
        assert.equal(graded.grade, 'A+')
        assert.equal(graded.marks, '98/100')
        assert.equal(graded.feedback, 'Flawless derivations and neat graphs.')
        assert.equal(graded.gradedBy, 'Mr. Ravi (Mathematics)')

        const allGraded = getGradedSubmissions()
        assert.ok(allGraded.some((g) => g.assignmentId === 'HF-1001' && g.grade === 'A+'))
    })

    // =========================================================================
    // FEATURE 16: TRANSPORT FEE COLLECTION & WORKFLOW SYNC
    // =========================================================================
    await t.test('F16-01: Transport service retrieves routes and passenger manifests', async () => {
        const [routesRes, manifestRes] = await Promise.all([
            transportService.getRoutes(),
            transportService.getPassengerManifest(),
        ])

        assert.equal(routesRes.success, true)
        assert.ok(Array.isArray(routesRes.data))
        assert.ok(routesRes.data.length > 0)
        assert.ok(routesRes.data[0].busNumber)

        assert.equal(manifestRes.success, true)
        assert.ok(Array.isArray(manifestRes.data))
        assert.ok(manifestRes.data.length > 0)
        assert.ok(manifestRes.data[0].studentId)
    })

    await t.test('F16-02: Fee service manages invoices, student ledgers, and payments', async () => {
        const invoicesRes = await feeService.getInvoices()
        assert.equal(invoicesRes.success, true)
        assert.ok(Array.isArray(invoicesRes.data))
        assert.ok(invoicesRes.data.length > 0)

        // Find or create an invoice with balance
        const sampleInvoice = invoicesRes.data[0]
        assert.ok(sampleInvoice.id)
        assert.ok(typeof sampleInvoice.totalAmount === 'number')

        // Record a payment against an invoice
        const paymentRes = await feeService.recordPayment({
            invoiceId: sampleInvoice.id,
            studentId: sampleInvoice.studentId,
            amount: 1000,
            paymentMethod: 'UPI',
        })

        assert.equal(paymentRes.success, true)
        assert.ok(paymentRes.data.receipt)
        assert.ok(paymentRes.data.receipt.receiptNumber.startsWith('REC/'))
        assert.equal(paymentRes.data.receipt.amount, 1000)
        assert.equal(paymentRes.data.receipt.status, 'Cleared')
    })
})
