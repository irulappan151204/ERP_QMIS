import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '../../../')

test('M-AUDIT-2 Interactive Elements, Buttons & Forms Remediation', async (t) => {
    await t.test('1. Front Office Dashboard filter button is wired and functional', () => {
        const dashboardPath = path.resolve(rootDir, 'src/Pages/FrontOffice/Dashboard/Dashboard.jsx')
        const content = fs.readFileSync(dashboardPath, 'utf8')

        // Must not contain noop onClick
        assert.ok(!content.includes('onClick={() => {}}'), 'Dashboard.jsx must not contain noop onClick={() => {}}')

        // Must contain handleApplyFilters and appliedFilters
        assert.ok(content.includes('handleApplyFilters'), 'Dashboard.jsx must define handleApplyFilters')
        assert.ok(content.includes('appliedFilters'), 'Dashboard.jsx must manage appliedFilters state')
        assert.ok(content.includes('toast.success'), 'Dashboard.jsx must trigger toast.success on filter apply')
        assert.ok(content.includes('onClick={handleApplyFilters}'), 'Dashboard.jsx Apply button must be wired to handleApplyFilters')
        assert.ok(content.includes('onClick={handleReset}'), 'Dashboard.jsx Reset button must be wired to handleReset')
    })

    await t.test('2. All 6 specified browser alert() calls are replaced with react-toastify notifications', () => {
        const alertFiles = [
            {
                file: 'src/Common/UserDatabase/ViewEmployeePage.jsx',
                check: 'toast.info(`Downloading credential: ${doc.name}`)',
            },
            {
                file: 'src/Common/UserDatabase/ViewStudentPage.jsx',
                check: 'toast.info(`Viewing document: ${doc.name}`)',
            },
            {
                file: 'src/Pages/CCTV/CctvFootageRequests.jsx',
                check: 'toast.info(`Downloading attachment: ${selectedRequest.attachmentFileName}`)',
            },
            {
                file: 'src/Pages/FileRoom/FileRoomRepository.jsx',
                check: 'toast.info(`Simulated preview of ${selectedFile.attachment.fileName}`)',
            },
            {
                file: 'src/Pages/PRO/ProErpDataHandover.jsx',
                check: 'toast.info(`Simulated download of ${selectedHandover.attachment.fileName}`)',
            },
            {
                file: 'src/Pages/Student/Hostel/HostelDetails.jsx',
                check: 'toast.info(',
            },
        ]

        for (const { file, check } of alertFiles) {
            const filePath = path.resolve(rootDir, file)
            const content = fs.readFileSync(filePath, 'utf8')
            assert.ok(content.includes('from \'react-toastify\''), `${file} must import from react-toastify`)
            assert.ok(content.includes(check), `${file} must trigger expected toast notification: ${check}`)
            assert.ok(!content.includes('onClick={() => alert('), `${file} must not contain onClick={() => alert(`)
        }
    })

    await t.test('3. Transport Manager dead action buttons are wired with toast and navigation', () => {
        const transportFiles = [
            {
                file: 'src/Pages/TransportManager/VehicleManagement/AddVehicle.jsx',
                successMsg: 'Vehicle registered successfully',
                backPath: '/transport-manager/vehicle-management',
            },
            {
                file: 'src/Pages/TransportManager/VehicleManagement/EditVehicle.jsx',
                successMsg: 'updated successfully',
                backPath: '/transport-manager/vehicle-management',
            },
            {
                file: 'src/Pages/TransportManager/VehicleMaintenance/AddVehicleMaintenance.jsx',
                successMsg: 'Vehicle maintenance record saved successfully',
                backPath: '/transport-manager/vehicle-maintenance',
            },
            {
                file: 'src/Pages/TransportManager/TransportExpenses/AddTransportExpense.jsx',
                successMsg: 'Transport expense saved successfully',
                backPath: '/transport-manager/transport-expenses',
            },
            {
                file: 'src/Pages/TransportManager/RouteManagement/AddRoute.jsx',
                successMsg: 'Route added successfully',
                backPath: '/transport-manager/route-management',
            },
            {
                file: 'src/Pages/TransportManager/RouteManagement/EditRoute.jsx',
                successMsg: 'updated successfully',
                backPath: '/transport-manager/route-management',
            },
            {
                file: 'src/Pages/TransportManager/StudentTransport/AddStudentTransport.jsx',
                successMsg: 'Student transport allocation saved successfully',
                backPath: '/transport-manager/student-transport',
            },
            {
                file: 'src/Pages/TransportManager/AssignDuty/AddAssignDuty.jsx',
                successMsg: 'Duty assignment saved successfully',
                backPath: '/transport-manager/assign-duty',
            },
        ]

        for (const item of transportFiles) {
            const filePath = path.resolve(rootDir, item.file)
            const content = fs.readFileSync(filePath, 'utf8')
            assert.ok(content.includes('handleSave'), `${item.file} must implement handleSave`)
            assert.ok(content.includes(item.successMsg), `${item.file} must show success toast: "${item.successMsg}"`)
            assert.ok(content.includes(item.backPath), `${item.file} must navigate back to "${item.backPath}"`)
            assert.ok(content.includes('onClick={handleSave}'), `${item.file} Save Changes button must be wired to handleSave`)
        }
    })

    await t.test('4. Admin Expenses action buttons are wired with toast and navigation', () => {
        const expensesFiles = [
            'src/Pages/Admin/Expenses/Hostel/AddHostelExpenses.jsx',
            'src/Pages/Admin/Expenses/Library/AddLibraryExpenses.jsx',
            'src/Pages/Admin/Expenses/Others/AddOtherExpensesList.jsx',
            'src/Pages/Admin/Expenses/Salaries/AddSalariesList.jsx',
            'src/Pages/Admin/Expenses/Transport/AddTransportExpenses.jsx',
        ]

        for (const relPath of expensesFiles) {
            const filePath = path.resolve(rootDir, relPath)
            const content = fs.readFileSync(filePath, 'utf8')
            assert.ok(content.includes('handleSave'), `${relPath} must implement handleSave`)
            assert.ok(content.includes('handleDiscard'), `${relPath} must implement handleDiscard`)
            assert.ok(content.includes('onClick={handleSave}'), `${relPath} Save Changes button must be wired to handleSave`)
            assert.ok(content.includes('onClick={handleDiscard}'), `${relPath} Discard Changes button must be wired to handleDiscard`)
            assert.ok(content.includes('toast.success'), `${relPath} must show toast.success`)
            assert.ok(content.includes('navigate(-1)'), `${relPath} must navigate(-1) on action`)
        }
    })

    await t.test('5. Admin Front Office action buttons are wired with toast and navigation', () => {
        const frontOfficeFiles = [
            'src/Pages/Admin/FrontOffice/DriverList/AddDriverList.jsx',
            'src/Pages/Admin/FrontOffice/LibrarianList/AddLibrarian.jsx',
            'src/Pages/Admin/FrontOffice/TeachersList/AddTeacher.jsx',
        ]

        for (const relPath of frontOfficeFiles) {
            const filePath = path.resolve(rootDir, relPath)
            const content = fs.readFileSync(filePath, 'utf8')
            assert.ok(content.includes('handleSave'), `${relPath} must implement handleSave`)
            assert.ok(content.includes('handleDiscard'), `${relPath} must implement handleDiscard`)
            assert.ok(content.includes('onClick={handleSave}'), `${relPath} Save Changes button must be wired to handleSave`)
            assert.ok(content.includes('onClick={handleDiscard}'), `${relPath} Discard Changes button must be wired to handleDiscard`)
            assert.ok(content.includes('toast.success'), `${relPath} must show toast.success`)
            assert.ok(content.includes('navigate(-1)'), `${relPath} must navigate(-1) on action`)
        }
    })

    await t.test('6. Teacher Extra Class and Online Class action buttons are wired', () => {
        const teacherFiles = [
            {
                file: 'src/Pages/Teacher/ExtraClass/AddExtraClass.jsx',
                msg: 'Extended class scheduled successfully',
            },
            {
                file: 'src/Pages/Teacher/OnlineClass/AddOnlineClass.jsx',
                msg: 'Online class scheduled successfully',
            },
        ]

        for (const { file, msg } of teacherFiles) {
            const filePath = path.resolve(rootDir, file)
            const content = fs.readFileSync(filePath, 'utf8')
            assert.ok(content.includes('handleSave'), `${file} must implement handleSave`)
            assert.ok(content.includes(msg), `${file} must show success toast: "${msg}"`)
            assert.ok(content.includes('onClick={handleSave}'), `${file} Save Changes button must be wired to handleSave`)
        }
    })

    await t.test('7. Principal Documents and Task Management action buttons are wired', () => {
        const principalFiles = [
            {
                file: 'src/Pages/Principal/Documents/AddDocuments.jsx',
                msg: 'Document uploaded successfully',
            },
            {
                file: 'src/Pages/Principal/TaskManagement/AddTask.jsx',
                msg: 'Task created successfully',
            },
        ]

        for (const { file, msg } of principalFiles) {
            const filePath = path.resolve(rootDir, file)
            const content = fs.readFileSync(filePath, 'utf8')
            assert.ok(content.includes('handleSave'), `${file} must implement handleSave`)
            assert.ok(content.includes('handleDiscard'), `${file} must implement handleDiscard`)
            assert.ok(content.includes('onClick={handleSave}'), `${file} Save Changes button must be wired to handleSave`)
            assert.ok(content.includes('onClick={handleDiscard}'), `${file} Discard Changes button must be wired to handleDiscard`)
            assert.ok(content.includes(msg), `${file} must show success toast: "${msg}"`)
        }
    })

    await t.test('8. Joint Director Audit Request Approvals buttons are wired and functional', () => {
        const listPath = path.resolve(rootDir, 'src/Pages/JointDirectorAudit/RequestApprovals/RequestApprovals.jsx')
        const viewPath = path.resolve(rootDir, 'src/Pages/JointDirectorAudit/RequestApprovals/ViewRequestApproval.jsx')

        const listContent = fs.readFileSync(listPath, 'utf8')
        assert.ok(listContent.includes('handleApprove'), 'RequestApprovals.jsx must implement handleApprove')
        assert.ok(listContent.includes('handleReject'), 'RequestApprovals.jsx must implement handleReject')
        assert.ok(listContent.includes('handleClearFilters'), 'RequestApprovals.jsx must implement handleClearFilters')
        assert.ok(listContent.includes('onClick={() => handleApprove(request.requestId)}'), 'Approve button must be wired')
        assert.ok(listContent.includes('onClick={() => handleReject(request.requestId)}'), 'Reject button must be wired')
        assert.ok(listContent.includes('onClick={handleClearFilters}'), 'Clear Filters button must be wired')

        const viewContent = fs.readFileSync(viewPath, 'utf8')
        assert.ok(viewContent.includes('handleApprove'), 'ViewRequestApproval.jsx must implement handleApprove')
        assert.ok(viewContent.includes('handleReject'), 'ViewRequestApproval.jsx must implement handleReject')
        assert.ok(viewContent.includes('onClick={handleApprove}'), 'ViewRequestApproval Approve button must be wired')
        assert.ok(viewContent.includes('onClick={handleReject}'), 'ViewRequestApproval Reject button must be wired')
        assert.ok(viewContent.includes('currentStatus'), 'ViewRequestApproval must manage currentStatus state')
    })

    await t.test('9. Account Head Receipt Management and Approval Rules buttons are wired', () => {
        const receiptPath = path.resolve(rootDir, 'src/Pages/AccountHead/FeesManagement/Components/ReceiptManagementTab.jsx')
        const rulesPath = path.resolve(rootDir, 'src/Pages/AccountHead/Approvals/Components/ApprovalRulesTab.jsx')

        const receiptContent = fs.readFileSync(receiptPath, 'utf8')
        assert.ok(receiptContent.includes('handleApproveReprint'), 'ReceiptManagementTab.jsx must implement handleApproveReprint')
        assert.ok(receiptContent.includes('onClick={() => handleApproveReprint(row.id)}'), 'Reprint Approve button must be wired')
        assert.ok(receiptContent.includes('toast.success'), 'Reprint Approve must show toast.success')

        const rulesContent = fs.readFileSync(rulesPath, 'utf8')
        assert.ok(rulesContent.includes('handleAddRule'), 'ApprovalRulesTab.jsx must implement handleAddRule')
        assert.ok(rulesContent.includes('setIsModalOpen(true)'), 'Add Rule button must open modal')
        assert.ok(rulesContent.includes('toast.success'), 'Adding rule must show toast.success')
    })

    await t.test('10. Student Portal Attendance, Transport Payment, and Assignment buttons are wired', () => {
        const attendancePath = path.resolve(rootDir, 'src/Pages/Student/Class/AttendanceDetails.jsx')
        const transportPath = path.resolve(rootDir, 'src/Pages/Student/PaymentDetails/TransportPayment.jsx')
        const assignPath = path.resolve(rootDir, 'src/Pages/Student/AssessmentList/Components/SubmitAssignModal.jsx')

        const attendanceContent = fs.readFileSync(attendancePath, 'utf8')
        assert.ok(attendanceContent.includes('handleDownloadReport'), 'AttendanceDetails.jsx must implement handleDownloadReport')
        assert.ok(attendanceContent.includes('handleClearFilters'), 'AttendanceDetails.jsx must implement handleClearFilters')
        assert.ok(attendanceContent.includes('onClick={handleDownloadReport}'), 'Download Report button must be wired')
        assert.ok(attendanceContent.includes('onClick={handleClearFilters}'), 'Clear Filters button must be wired')

        const transportContent = fs.readFileSync(transportPath, 'utf8')
        assert.ok(transportContent.includes('handleClearFilters'), 'TransportPayment.jsx must implement handleClearFilters')
        assert.ok(transportContent.includes('onClick={handleClearFilters}'), 'TransportPayment Clear Filters button must be wired')

        const assignContent = fs.readFileSync(assignPath, 'utf8')
        assert.ok(assignContent.includes('handleSubmit'), 'SubmitAssignModal.jsx must implement handleSubmit')
        assert.ok(assignContent.includes('onClick={handleSubmit}'), 'Submit button must be wired to handleSubmit')
        assert.ok(assignContent.includes('Assignment submitted successfully for review'), 'Submit must show success toast')
    })

    await t.test('11. Security Advisory SEC-AUDIT1-01 print document title and nominee sanitization', () => {
        const printDocPath = path.resolve(rootDir, 'src/Common/printDocument.js')
        const recognitionPath = path.resolve(rootDir, 'src/Common/Recognition/EnterpriseRecognitionPage.jsx')

        const printDocContent = fs.readFileSync(printDocPath, 'utf8')
        assert.ok(printDocContent.includes('safeTitle = escapeHtml(title)'), 'printDocument.js must escape title')
        assert.ok(printDocContent.includes('<title>${safeTitle}</title>'), 'printDocument.js must write escaped title tag')

        const recognitionContent = fs.readFileSync(recognitionPath, 'utf8')
        assert.ok(
            recognitionContent.includes('openPrintDocument({ title: `Star of the Year Citation - ${escapeHtml(soyWinner.nomineeName)}`, body })'),
            'EnterpriseRecognitionPage.jsx must sanitize nomineeName with escapeHtml before passing to title'
        )

        // Pure unit test of universal escaping logic
        const escapeHtml = (str) =>
            String(str ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]))

        const xssPayload = '<script>alert("XSS")</script>'
        const escaped = escapeHtml(xssPayload)
        assert.equal(escaped, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')
        assert.ok(!escaped.includes('<script>'), 'Sanitizer must strip unescaped angle brackets')
    })
})
