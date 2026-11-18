import React, { useState, useMemo } from 'react'
import {
    FileCheck2,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Upload,
    User,
    Building2,
    Download,
    FileText,
    ArrowRight,
    Send,
    HelpCircle,
    ShieldAlert,
    Check,
    X,
    Laptop,
    BookOpen,
    DollarSign,
    Briefcase,
    GraduationCap,
    Plus,
    Search,
    Truck,
    Package,
    School
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'
import { ENTERPRISE_EMPLOYEES } from '../AttendanceAndLeave/attendanceLeaveData'
import { getExits, saveExits, nextId } from '../../Pages/HR/domain/hrStore'
import {
    getAllTcRequests,
    createTcRequest,
    approveTcRequest,
    forwardTcRequestToSuperAdmin,
    rejectTcRequest,
    updateNocClearance,
    statusBadgeColor,
    DEFAULT_NOC_CLEARANCES
} from '../TcRequest/tcRequestData'

const NOC_CLEARANCE_STEPS = [
    { key: 'departmentClearance', label: 'Department HOD Sign-off', icon: Building2, desc: 'Syllabus, grade register, and project task handover completed' },
    { key: 'handover', label: 'Successor Colleague Handover', icon: User, desc: 'Operational responsibilities handed over to designated successor' },
    { key: 'assets', label: 'IT Assets & Device Return', icon: Laptop, desc: 'Laptop, ID card, smart tag, and access keys surrendered to IT & Stores' },
    { key: 'documents', label: 'Library & Documents Clearance', icon: BookOpen, desc: 'All borrowed library books returned and catalog fines cleared' },
    { key: 'finance', label: 'Finance & Accounts Settlement', icon: DollarSign, desc: 'Final salary, PF, gratuity, and pending travel/reimbursement audited' },
    { key: 'hrClearance', label: 'Central HR NOC & Exit Formalities', icon: FileCheck2, desc: 'Exit interview recorded, notice period verified, and relieving authorized' }
]

const STUDENT_NOC_DEPARTMENTS = [
    { key: 'finance', label: 'Finance & Accounts', icon: DollarSign, desc: 'Tuition fees, lab fees & bus fees reconciliation' },
    { key: 'library', label: 'Library Information Center', icon: BookOpen, desc: 'Return of all borrowed books and no-due certificate' },
    { key: 'transport', label: 'Transport Logistics', icon: Truck, desc: 'Bus route pass return and route fare clearance' },
    { key: 'stores', label: 'Stores & Uniforms', icon: Package, desc: 'Lab kit, sports gear, and equipment returns' },
    { key: 'academics', label: 'Academics & Examination', icon: School, desc: 'Grade book sign-off, marksheets & cumulative record' }
]

export default function StaffRelievingWorkspace({ roleOverride = null }) {
    const { role: authRole, email: authEmail, name: authName } = useAuth()
    const activeRole = (roleOverride || authRole || 'teacher').toLowerCase().replace(/[-_\s]/g, '')
    const roleLabel = getProfileLabel(roleOverride || authRole || 'teacher')

    // Top view tab: staff relieving vs student TC clearance
    const [viewMode, setViewMode] = useState('staff')

    // Find current employee profile
    const currentEmployee = useMemo(() => {
        return (
            ENTERPRISE_EMPLOYEES.find(
                (e) => (authEmail && e.email.toLowerCase() === authEmail.toLowerCase()) ||
                       e.roleKey.toLowerCase().replace(/[-_\s]/g, '') === activeRole
            ) || ENTERPRISE_EMPLOYEES[0]
        )
    }, [authEmail, activeRole])

    const employeeId = currentEmployee?.id || 'EMP-TCH-006'
    const employeeName = authName || currentEmployee?.name || roleLabel

    // Live Exits from HR Store
    const [refreshKey, setRefreshKey] = useState(0)
    const exits = useMemo(() => {
        void refreshKey
        return getExits()
    }, [refreshKey])

    const existingExit = useMemo(() => {
        return exits.find((x) => x.employeeId === employeeId) || null
    }, [exits, employeeId])

    // Relieving application form state
    const [exitType, setExitType] = useState('Resignation')
    const [noticeStart, setNoticeStart] = useState(() => new Date().toISOString().split('T')[0])
    const [lastWorkingDate, setLastWorkingDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() + 30)
        return d.toISOString().split('T')[0]
    })
    const [reason, setReason] = useState('')
    const [handoverColleague, setHandoverColleague] = useState(
        ENTERPRISE_EMPLOYEES.find((e) => e.id !== employeeId)?.name || 'Sandy Selva'
    )
    const [attachedFile, setAttachedFile] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Check if user is an authorized approver/manager
    const isAuthorizedApprover = useMemo(() => {
        return [
            'hr',
            'superadmin',
            'admin',
            'director',
            'principal',
            'jointdirector',
            'coordinator',
            'itsupportmanager',
            'accounthead',
            'account-head',
            'finance',
            'librarian',
            'stationerystoremanager',
            'transportmanager'
        ].includes(activeRole)
    }, [activeRole])

    // Staff Sub-tab: my_request vs approvals_queue
    const [staffSubTab, setStaffSubTab] = useState(() => {
        return isAuthorizedApprover ? 'approvals_queue' : 'my_request'
    })

    // Queue filter state
    const [queueSearch, setQueueSearch] = useState('')
    const [queueStatusFilter, setQueueStatusFilter] = useState('All')

    // Modals for staff queue actions
    const [selectedExitForNoc, setSelectedExitForNoc] = useState(null)
    const [selectedExitForReject, setSelectedExitForReject] = useState(null)
    const [rejectReason, setRejectReason] = useState('')
    const [selectedExitForCert, setSelectedExitForCert] = useState(null)

    const resolveStaff = (empId) => {
        const found = ENTERPRISE_EMPLOYEES.find((e) => e.id === empId)
        if (found) return found
        return {
            id: empId,
            name: empId,
            department: 'Institutional Staff',
            designation: 'Staff Member',
            category: 'Academic'
        }
    }

    // Accept / Acknowledge an initiated exit request
    const handleAcceptExit = (exitItem) => {
        const updated = {
            ...exitItem,
            status: 'In Progress',
            acknowledgedBy: authName || roleLabel,
            acknowledgedDate: new Date().toISOString().split('T')[0]
        }
        const updatedExits = exits.map((x) => (x.id === exitItem.id ? updated : x))
        saveExits(updatedExits)
        setRefreshKey((k) => k + 1)
        toast.success(`Accepted relieving request for ${resolveStaff(exitItem.employeeId).name}. Department NOC sign-offs are now open!`)
    }

    // Toggle checkpoint in modal
    const handleToggleModalNocStep = (stepKey) => {
        if (!selectedExitForNoc) return
        const updated = {
            ...selectedExitForNoc,
            [stepKey]: !selectedExitForNoc[stepKey]
        }
        const isAllCleared = NOC_CLEARANCE_STEPS.every((step) => Boolean(updated[step.key]))
        if (isAllCleared && updated.status !== 'Completed') {
            updated.status = 'Approved'
        }
        const updatedExits = exits.map((x) => (x.id === selectedExitForNoc.id ? updated : x))
        saveExits(updatedExits)
        setSelectedExitForNoc(updated)
        setRefreshKey((k) => k + 1)
        toast.success(`Updated sign-off for ${stepKey}!`)
    }

    // Final Approve Exit
    const handleFinalApproveExit = (exitItem) => {
        const updated = {
            ...exitItem,
            status: 'Completed',
            approvedBy: authName || roleLabel,
            approvalDate: new Date().toISOString().split('T')[0],
            departmentClearance: true,
            handover: true,
            assets: true,
            documents: true,
            finance: true,
            hrClearance: true,
            noticeServed: true,
            exitInterview: true
        }
        const updatedExits = exits.map((x) => (x.id === exitItem.id ? updated : x))
        saveExits(updatedExits)
        setRefreshKey((k) => k + 1)
        toast.success(`Relieving request for ${resolveStaff(exitItem.employeeId).name} approved and finalized!`)
    }

    // Reject Exit
    const handleConfirmRejectExit = () => {
        if (!selectedExitForReject) return
        if (!rejectReason.trim()) {
            toast.error('Please enter a rejection reason.')
            return
        }
        const updated = {
            ...selectedExitForReject,
            status: 'Rejected',
            rejectedBy: authName || roleLabel,
            rejectedDate: new Date().toISOString().split('T')[0],
            rejectionReason: rejectReason.trim()
        }
        const updatedExits = exits.map((x) => (x.id === selectedExitForReject.id ? updated : x))
        saveExits(updatedExits)
        setRefreshKey((k) => k + 1)
        toast.info(`Relieving request for ${resolveStaff(selectedExitForReject.employeeId).name} was rejected.`)
        setSelectedExitForReject(null)
        setRejectReason('')
    }

    const filteredQueueExits = useMemo(() => {
        return exits.filter((x) => {
            const staff = resolveStaff(x.employeeId)
            const query = queueSearch.trim().toLowerCase()
            const matchesSearch = !query ||
                staff.name.toLowerCase().includes(query) ||
                staff.id.toLowerCase().includes(query) ||
                staff.department.toLowerCase().includes(query) ||
                (x.reason && x.reason.toLowerCase().includes(query)) ||
                (x.id && x.id.toLowerCase().includes(query))

            let matchesStatus = true
            if (queueStatusFilter !== 'All') {
                if (queueStatusFilter === 'In Progress') {
                    matchesStatus = ['In Progress', 'Pending Clearance', 'Pending Clearances'].includes(x.status)
                } else if (queueStatusFilter === 'Completed') {
                    matchesStatus = ['Completed', 'Approved'].includes(x.status)
                } else {
                    matchesStatus = x.status === queueStatusFilter
                }
            }
            return matchesSearch && matchesStatus
        })
    }, [exits, queueSearch, queueStatusFilter])

    // Student TC State
    const [tcRequests, setTcRequests] = useState(() => getAllTcRequests())
    const [tcSearch, setTcSearch] = useState('')
    const [tcStatusFilter, setTcStatusFilter] = useState('All')
    const [selectedTcForClearance, setSelectedTcForClearance] = useState(null)
    const [showNewTcModal, setShowNewTcModal] = useState(false)
    const [newTcForm, setNewTcForm] = useState({
        studentName: '',
        admissionNumber: '',
        classSection: '10-A',
        reason: 'Family relocation to another city',
        transferTo: 'Delhi Public School',
        lastDateOfAttendance: new Date().toISOString().split('T')[0],
        requestedBy: 'Parent'
    })

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
        if (!allowedTypes.includes(file.type)) {
            toast.error('Only PDF, PNG, and JPEG files are allowed.')
            return
        }
        setAttachedFile({
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: file.type
        })
        toast.success(`Attached resignation document: ${file.name}`)
    }

    const handleSubmitApplication = (e) => {
        e.preventDefault()
        if (!lastWorkingDate) {
            toast.error('Proposed Last Working Date is required.')
            return
        }
        if (!reason.trim()) {
            toast.error('Please provide a specific reason for relieving.')
            return
        }

        setIsSubmitting(true)
        try {
            const currentExits = getExits()
            const newExitId = nextId('EXT-2026', currentExits)
            const newRecord = {
                id: newExitId,
                employeeId,
                lastWorkingDate,
                exitType,
                reason: reason.trim(),
                noticePeriod: '30 days',
                noticeServed: false,
                handover: false,
                assets: false,
                documents: false,
                finance: false,
                departmentClearance: false,
                hrClearance: false,
                exitInterview: false,
                handoverColleague,
                attachmentName: attachedFile?.name || 'Resignation_Letter.pdf',
                appliedDate: new Date().toISOString().split('T')[0],
                status: 'Initiated'
            }

            saveExits([newRecord, ...currentExits])
            toast.success('Relieving Application submitted successfully! HR & Department Head notified.')
            setRefreshKey((k) => k + 1)
        } catch (err) {
            toast.error(err.message || 'Failed to submit application.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Toggle staff NOC clearance step (for authorized roles/managers/HR)
    const handleToggleStaffClearance = (stepKey) => {
        if (!existingExit) return
        const updated = {
            ...existingExit,
            [stepKey]: !existingExit[stepKey]
        }
        const updatedExits = exits.map((x) => (x.id === existingExit.id ? updated : x))
        saveExits(updatedExits)
        setRefreshKey((k) => k + 1)
        toast.success(`Updated clearance status for ${stepKey}!`)
    }

    // Clearance completion count
    const completedNocCount = useMemo(() => {
        if (!existingExit) return 0
        return NOC_CLEARANCE_STEPS.filter((step) => Boolean(existingExit[step.key])).length
    }, [existingExit])

    const isFullyCleared = completedNocCount === NOC_CLEARANCE_STEPS.length

    // Student TC filtered list
    const filteredTcRequests = useMemo(() => {
        return tcRequests.filter((r) => {
            const matchesSearch =
                !tcSearch ||
                r.studentName?.toLowerCase().includes(tcSearch.toLowerCase()) ||
                r.admissionNumber?.toLowerCase().includes(tcSearch.toLowerCase()) ||
                r.requestId?.toLowerCase().includes(tcSearch.toLowerCase()) ||
                r.classSection?.toLowerCase().includes(tcSearch.toLowerCase())
            const matchesStatus =
                tcStatusFilter === 'All' ||
                (tcStatusFilter === 'Pending Review' && (r.status === 'Pending PRM Review' || r.status === 'Pending Super Admin Approval')) ||
                r.status === tcStatusFilter
            return matchesSearch && matchesStatus
        })
    }, [tcRequests, tcSearch, tcStatusFilter])

    // Student TC Create
    const handleCreateTcSubmit = (e) => {
        e.preventDefault()
        if (!newTcForm.studentName.trim()) {
            toast.error('Student Name is required.')
            return
        }
        try {
            const created = createTcRequest({
                studentName: newTcForm.studentName.trim(),
                admissionNumber: newTcForm.admissionNumber.trim() || `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                classSection: newTcForm.classSection,
                reason: newTcForm.reason.trim(),
                transferTo: newTcForm.transferTo.trim(),
                lastDateOfAttendance: newTcForm.lastDateOfAttendance,
                requestedBy: newTcForm.requestedBy
            })
            setTcRequests(getAllTcRequests())
            setShowNewTcModal(false)
            setNewTcForm({
                studentName: '',
                admissionNumber: '',
                classSection: '10-A',
                reason: 'Family relocation to another city',
                transferTo: 'Delhi Public School',
                lastDateOfAttendance: new Date().toISOString().split('T')[0],
                requestedBy: 'Parent'
            })
            toast.success(`Transfer Certificate request ${created.requestId} submitted with 5-department clearance initiated!`)
        } catch (err) {
            toast.error(err.message || 'Failed to create TC request.')
        }
    }

    // Toggle single department clearance on a student TC
    const handleToggleStudentClearance = (requestId, deptKey, currentStatus) => {
        const nextStatus = currentStatus === 'Cleared' ? 'Pending' : 'Cleared'
        const updated = updateNocClearance(
            requestId,
            deptKey,
            nextStatus,
            nextStatus === 'Cleared' ? 'Verified by Department Manager. All records and dues clear.' : 'Pending physical return or fee audit.'
        )
        if (updated) {
            setTcRequests(getAllTcRequests())
            if (selectedTcForClearance?.id === requestId) {
                setSelectedTcForClearance(updated)
            }
            toast.success(`Department [${deptKey.toUpperCase()}] marked as ${nextStatus}`)
        }
    }

    // Super Admin / Principal approval
    const handleApproveTc = (requestId) => {
        const updated = approveTcRequest(requestId, 'Transfer Certificate approved and issued by Principal / Super Admin.')
        if (updated) {
            setTcRequests(getAllTcRequests())
            if (selectedTcForClearance?.id === requestId) {
                setSelectedTcForClearance(updated)
            }
            toast.success(`TC ${requestId} Approved & Transfer Certificate Issued!`)
        }
    }

    // PRM Forward to Super Admin
    const handleForwardTc = (requestId) => {
        const updated = forwardTcRequestToSuperAdmin(requestId, 'PRM verification complete. Forwarded for final approval.')
        if (updated) {
            setTcRequests(getAllTcRequests())
            if (selectedTcForClearance?.id === requestId) {
                setSelectedTcForClearance(updated)
            }
            toast.success(`TC ${requestId} forwarded for Super Admin Approval.`)
        }
    }

    return (
        <div className='min-h-screen bg-slate-50/60 p-4 md:p-6 lg:p-8 space-y-6 font-inter'>
            {/* Header with Dual View Tabs */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs'>
                        {viewMode === 'staff' ? <FileCheck2 size={24} /> : <GraduationCap size={24} />}
                    </div>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-xl md:text-2xl font-bold tracking-tight text-slate-900'>
                                {viewMode === 'staff' ? 'Staff Relieving & HR NOC Clearance' : 'Student TC Request & Department Clearances'}
                            </h1>
                            <span className='rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200'>
                                {employeeId}
                            </span>
                        </div>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            {viewMode === 'staff'
                                ? 'Formal employee resignation submission, handover logging, and departmental NOC sign-off tracking.'
                                : 'Student Transfer Certificate (TC) processing, 5-department manager clearances, and certificate generation.'}
                        </p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className='flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80'>
                    <button
                        type='button'
                        onClick={() => setViewMode('staff')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            viewMode === 'staff'
                                ? 'bg-white text-indigo-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Briefcase size={14} />
                        <span>Staff Relieving</span>
                    </button>
                    <button
                        type='button'
                        onClick={() => setViewMode('student_tc')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            viewMode === 'student_tc'
                                ? 'bg-white text-indigo-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <GraduationCap size={14} />
                        <span>Student TC Clearance</span>
                        <span className='ml-1 px-1.5 py-0.2 rounded-md bg-indigo-50 text-[10px] text-indigo-700 font-bold'>
                            {tcRequests.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* VIEW MODE 1: STAFF RELIEVING & NOC */}
            {viewMode === 'staff' && (
                <>
                    {/* Sub-navigation bar between personal request and approvals queue */}
                    {isAuthorizedApprover && (
                        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs mb-4'>
                            <div className='flex items-center gap-2'>
                                <button
                                    type='button'
                                    onClick={() => setStaffSubTab('my_request')}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        staffSubTab === 'my_request'
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    My Relieving Application
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setStaffSubTab('approvals_queue')}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        staffSubTab === 'approvals_queue'
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <FileCheck2 size={14} />
                                    <span>Staff Relieving Approvals &amp; NOC Queue</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        staffSubTab === 'approvals_queue' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                                    }`}>
                                        {exits.length}
                                    </span>
                                </button>
                            </div>
                            <div className='text-xs text-slate-500 font-medium'>
                                {staffSubTab === 'approvals_queue'
                                    ? 'Review, approve, or clear departmental NOCs for employee resignations'
                                    : 'Manage your personal exit request'}
                            </div>
                        </div>
                    )}

                    {staffSubTab === 'my_request' ? (
                        <>
                    {/* Employee Profile & Notice Terms Banner */}
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Employee Name</span>
                            <p className='text-base font-bold text-slate-900 mt-0.5'>{employeeName}</p>
                            <p className='text-xs text-slate-500'>{currentEmployee?.designation || roleLabel}</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Department</span>
                            <p className='text-base font-bold text-slate-900 mt-0.5'>{currentEmployee?.department || 'Academics'}</p>
                            <p className='text-xs text-slate-500'>Category: {currentEmployee?.category || 'Academic'}</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Policy Notice Period</span>
                            <p className='text-base font-bold text-indigo-600 mt-0.5'>30 Calendar Days</p>
                            <p className='text-xs text-slate-500'>Standard School HR Service Agreement</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Current Exit State</span>
                            <p className='text-base font-bold text-slate-900 mt-0.5'>
                                {existingExit ? existingExit.status : 'Active Employment'}
                            </p>
                            <p className='text-xs text-slate-500'>
                                {existingExit ? `Initiated on ${existingExit.appliedDate || existingExit.lastWorkingDate}` : 'No active relieving request'}
                            </p>
                        </div>
                    </div>

                    {/* TWO-COLUMN LAYOUT: APPLICATION FORM vs NOC CLEARANCE TRACKER */}
                    <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
                        {/* Left Column: Relieving Application Interface */}
                        <div className='lg:col-span-6 space-y-6'>
                            <div className='bg-white p-6 rounded-2xl border border-slate-200 shadow-xs'>
                                <div className='border-b border-slate-100 pb-3 mb-4'>
                                    <h2 className='text-base font-bold text-slate-900 flex items-center gap-2'>
                                        <FileText size={18} className='text-indigo-600' />
                                        {existingExit ? 'Submitted Relieving Application' : 'Apply for Relieving / Resignation'}
                                    </h2>
                                    <p className='text-xs text-slate-500 mt-0.5'>
                                        Please review your last working date and mandatory handover responsibilities.
                                    </p>
                                </div>

                                {existingExit ? (
                                    <div className='space-y-4 text-xs'>
                                        <div className='rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 space-y-2 text-slate-700'>
                                            <div className='flex items-center justify-between'>
                                                <span className='font-semibold text-slate-500'>Application Reference:</span>
                                                <span className='font-mono font-bold text-indigo-700'>{existingExit.id}</span>
                                            </div>
                                            <div className='flex items-center justify-between'>
                                                <span className='font-semibold text-slate-500'>Exit Type:</span>
                                                <span className='font-semibold text-slate-900'>{existingExit.exitType}</span>
                                            </div>
                                            <div className='flex items-center justify-between'>
                                                <span className='font-semibold text-slate-500'>Proposed Last Working Date:</span>
                                                <span className='font-bold text-slate-900'>{existingExit.lastWorkingDate}</span>
                                            </div>
                                            <div className='flex items-center justify-between'>
                                                <span className='font-semibold text-slate-500'>Handover Colleague:</span>
                                                <span className='font-semibold text-slate-900'>{existingExit.handoverColleague || 'Designated Teacher'}</span>
                                            </div>
                                            <div className='pt-2 border-t border-indigo-100'>
                                                <span className='font-semibold text-slate-500 block mb-1'>Reason for Departure:</span>
                                                <p className='text-slate-800 italic'>{existingExit.reason}</p>
                                            </div>
                                        </div>

                                        {isFullyCleared ? (
                                            <div className='rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-3'>
                                                <CheckCircle2 size={32} className='text-emerald-600 mx-auto' />
                                                <div>
                                                    <p className='text-sm font-bold text-emerald-900'>All Departmental Clearances Approved!</p>
                                                    <p className='text-xs text-emerald-700 mt-0.5'>Your official relieving and experience certificates are authorized for generation.</p>
                                                </div>
                                                <button
                                                    type='button'
                                                    onClick={() => toast.success('Downloaded Official Relieving & Experience Certificate (PDF)')}
                                                    className='inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer'
                                                >
                                                    <Download size={14} /> Download Relieving Certificate (PDF)
                                                </button>
                                            </div>
                                        ) : (
                                            <div className='rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 text-xs text-amber-800'>
                                                <Clock size={16} className='text-amber-600 shrink-0 mt-0.5' />
                                                <div>
                                                    <p className='font-bold'>Clearance in Progress with Respective Departments</p>
                                                    <p className='mt-0.5'>Each department manager is actively reviewing your handover, returned materials, and financial settlements.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmitApplication} className='space-y-4 text-xs'>
                                        <div>
                                            <label className='block font-semibold text-slate-700 mb-1'>Exit Type</label>
                                            <select
                                                value={exitType}
                                                onChange={(e) => setExitType(e.target.value)}
                                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none'
                                            >
                                                <option value='Resignation'>Formal Resignation</option>
                                                <option value='Relocation'>Relocation / Personal Move</option>
                                                <option value='Career Advancement'>Higher Studies / Career Advancement</option>
                                                <option value='Health / Family'>Family / Health Care</option>
                                            </select>
                                        </div>

                                        <div className='grid grid-cols-2 gap-3'>
                                            <div>
                                                <label className='block font-semibold text-slate-700 mb-1'>Notice Start Date</label>
                                                <input
                                                    type='date'
                                                    value={noticeStart}
                                                    onChange={(e) => setNoticeStart(e.target.value)}
                                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none'
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className='block font-semibold text-slate-700 mb-1'>Proposed Last Working Date</label>
                                                <input
                                                    type='date'
                                                    value={lastWorkingDate}
                                                    onChange={(e) => setLastWorkingDate(e.target.value)}
                                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none'
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className='block font-semibold text-slate-700 mb-1'>Handover Colleague / Successor</label>
                                            <select
                                                value={handoverColleague}
                                                onChange={(e) => setHandoverColleague(e.target.value)}
                                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none'
                                            >
                                                {ENTERPRISE_EMPLOYEES.filter((e) => e.id !== employeeId).map((emp) => (
                                                    <option key={emp.id} value={emp.name}>
                                                        {emp.name} ({emp.designation} - {emp.department})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className='block font-semibold text-slate-700 mb-1'>Reason for Relieving</label>
                                            <textarea
                                                rows={3}
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                placeholder='Please describe the specific reasons for your departure and any transition notes...'
                                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none'
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className='block font-semibold text-slate-700 mb-1'>
                                                Formal Resignation Document (.pdf, .png, .jpg)
                                            </label>
                                            <div className='border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer relative'>
                                                <input
                                                    type='file'
                                                    accept='.pdf,image/png,image/jpeg,image/jpg'
                                                    onChange={handleFileChange}
                                                    className='absolute inset-0 opacity-0 cursor-pointer w-full h-full'
                                                />
                                                <Upload size={20} className='text-slate-400 mx-auto mb-1' />
                                                <p className='text-xs font-semibold text-indigo-600'>Click or drop resignation letter here</p>
                                                <p className='text-[10px] text-slate-400 mt-0.5'>Supports PDF, PNG, JPG (Max 5MB)</p>
                                                {attachedFile && (
                                                    <div className='mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold'>
                                                        <FileText size={12} />
                                                        <span>{attachedFile.name} ({attachedFile.size})</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type='submit'
                                            disabled={isSubmitting}
                                            className='w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer'
                                        >
                                            {isSubmitting ? 'Submitting Application...' : 'Submit Relieving Application & Begin NOC'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Multi-Department Manager-Level HR NOC Tracker */}
                        <div className='lg:col-span-6 space-y-6'>
                            <div className='bg-white p-6 rounded-2xl border border-slate-200 shadow-xs'>
                                <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-4'>
                                    <div>
                                        <h2 className='text-base font-bold text-slate-900 flex items-center gap-2'>
                                            <ShieldAlert size={18} className='text-indigo-600' />
                                            Departmental NOC Clearance Tracker
                                        </h2>
                                        <p className='text-xs text-slate-500 mt-0.5'>
                                            Mandatory sign-offs required before official relieving and full & final settlement.
                                        </p>
                                    </div>
                                    <span className='font-bold text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700'>
                                        {completedNocCount} of {NOC_CLEARANCE_STEPS.length} Cleared
                                    </span>
                                </div>

                                <div className='space-y-3 text-xs'>
                                    {NOC_CLEARANCE_STEPS.map((step, idx) => {
                                        const Icon = step.icon
                                        const isCleared = existingExit ? Boolean(existingExit[step.key]) : false
                                        return (
                                            <div
                                                key={step.key}
                                                className={`rounded-xl border p-4 transition-all flex items-start justify-between gap-3 ${
                                                    isCleared
                                                        ? 'bg-emerald-50/40 border-emerald-200'
                                                        : 'bg-white border-slate-200/90'
                                                }`}
                                            >
                                                <div className='flex items-start gap-3'>
                                                    <div className={`p-2 rounded-xl mt-0.5 ${
                                                        isCleared ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        <Icon size={16} />
                                                    </div>
                                                    <div>
                                                        <div className='flex items-center gap-2'>
                                                            <span className='text-slate-400 font-bold'>Step {idx + 1}.</span>
                                                            <h3 className={`font-bold ${isCleared ? 'text-emerald-900' : 'text-slate-900'}`}>
                                                                {step.label}
                                                            </h3>
                                                        </div>
                                                        <p className='text-slate-500 text-[11px] mt-0.5 leading-relaxed'>
                                                            {step.desc}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className='flex items-center gap-2 shrink-0'>
                                                    {existingExit && (
                                                        <button
                                                            type='button'
                                                            onClick={() => handleToggleStaffClearance(step.key)}
                                                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                                                                isCleared
                                                                    ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                                                            }`}
                                                        >
                                                            {isCleared ? 'Reopen' : 'Sign Off'}
                                                        </button>
                                                    )}
                                                    {isCleared ? (
                                                        <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800'>
                                                            <CheckCircle2 size={12} /> Cleared
                                                        </span>
                                                    ) : (
                                                        <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 border border-amber-200'>
                                                            <Clock size={12} /> Pending
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* STAFF RELIEVING APPROVALS & NOC QUEUE */
                <div className='space-y-6'>
                    {/* Top Stats Banner */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Total Relieving Requests</span>
                            <p className='text-2xl font-bold text-slate-900 mt-1'>{exits.length}</p>
                            <p className='text-xs text-slate-500'>Submitted staff resignation records</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Awaiting Acceptance</span>
                            <p className='text-2xl font-bold text-amber-600 mt-1'>
                                {exits.filter((x) => x.status === 'Initiated').length}
                            </p>
                            <p className='text-xs text-slate-500'>New requests requiring review</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>In Department Clearances</span>
                            <p className='text-2xl font-bold text-blue-600 mt-1'>
                                {exits.filter((x) => ['In Progress', 'Pending Clearance', 'Pending Clearances'].includes(x.status)).length}
                            </p>
                            <p className='text-xs text-slate-500'>Active multi-department sign-offs</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Relieved &amp; Completed</span>
                            <p className='text-2xl font-bold text-emerald-600 mt-1'>
                                {exits.filter((x) => ['Completed', 'Approved'].includes(x.status)).length}
                            </p>
                            <p className='text-xs text-slate-500'>Certificates authorized &amp; issued</p>
                        </div>
                    </div>

                    {/* Filter & Action Toolbar */}
                    <div className='bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4'>
                        <div className='flex flex-wrap items-center gap-3 flex-1'>
                            <div className='relative flex-1 min-w-[220px] max-w-md'>
                                <Search size={16} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400' />
                                <input
                                    type='text'
                                    placeholder='Search by employee name, ID, department, or reason...'
                                    value={queueSearch}
                                    onChange={(e) => setQueueSearch(e.target.value)}
                                    className='w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500'
                                />
                            </div>

                            <select
                                value={queueStatusFilter}
                                onChange={(e) => setQueueStatusFilter(e.target.value)}
                                className='rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-indigo-500'
                            >
                                <option value='All'>All Statuses</option>
                                <option value='Initiated'>Initiated (Pending Acceptance)</option>
                                <option value='In Progress'>In Progress (Department Clearances)</option>
                                <option value='Completed'>Completed / Approved</option>
                                <option value='Rejected'>Rejected</option>
                            </select>
                        </div>

                        <div className='text-xs text-slate-500'>
                            Showing <strong>{filteredQueueExits.length}</strong> of <strong>{exits.length}</strong> staff requests
                        </div>
                    </div>

                    {/* Requests Data Table */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead className='bg-slate-50 text-slate-700 font-bold border-b border-slate-200'>
                                    <tr>
                                        <th className='py-3.5 px-4'>Ref #</th>
                                        <th className='py-3.5 px-4'>Staff Member</th>
                                        <th className='py-3.5 px-4'>Proposed LWD</th>
                                        <th className='py-3.5 px-4'>Reason &amp; Handover</th>
                                        <th className='py-3.5 px-4 text-center'>NOC Progress</th>
                                        <th className='py-3.5 px-4 text-center'>Status</th>
                                        <th className='py-3.5 px-4 text-right'>Workflow Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-600'>
                                    {filteredQueueExits.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className='py-12 text-center text-slate-400'>
                                                No staff relieving requests match the selected search or status filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredQueueExits.map((item) => {
                                            const staff = resolveStaff(item.employeeId)
                                            const clearedCount = NOC_CLEARANCE_STEPS.filter((s) => Boolean(item[s.key])).length
                                            const isDone = clearedCount === NOC_CLEARANCE_STEPS.length
                                            const isInitiated = item.status === 'Initiated'
                                            const isApprovedOrCompleted = ['Completed', 'Approved'].includes(item.status)
                                            const isRejected = item.status === 'Rejected'

                                            return (
                                                <tr key={item.id} className='hover:bg-slate-50/80 transition'>
                                                    <td className='py-3.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap'>
                                                        {item.id}
                                                    </td>
                                                    <td className='py-3.5 px-4'>
                                                        <div className='font-bold text-slate-900'>{staff.name}</div>
                                                        <div className='text-[11px] text-slate-500'>
                                                            {staff.id} · {staff.designation || 'Staff'} ({staff.department})
                                                        </div>
                                                    </td>
                                                    <td className='py-3.5 px-4 whitespace-nowrap'>
                                                        <div className='font-semibold text-slate-900'>{item.lastWorkingDate}</div>
                                                        <div className='text-[10px] text-slate-400'>Applied: {item.appliedDate || item.lastWorkingDate}</div>
                                                    </td>
                                                    <td className='py-3.5 px-4 max-w-xs'>
                                                        <div className='font-medium text-slate-800 truncate' title={item.reason}>{item.reason}</div>
                                                        <div className='text-[10px] text-slate-400'>
                                                            Handover: {item.handoverColleague || 'Colleague'}
                                                        </div>
                                                    </td>
                                                    <td className='py-3.5 px-4 text-center'>
                                                        <div className='inline-flex flex-col items-center gap-1'>
                                                            <span className={`font-bold text-xs px-2 py-0.5 rounded-md ${
                                                                isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                                            }`}>
                                                                {clearedCount} / {NOC_CLEARANCE_STEPS.length} Cleared
                                                            </span>
                                                            <div className='w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden'>
                                                                <div
                                                                    className={`h-full ${isDone ? 'bg-emerald-600' : 'bg-indigo-600'}`}
                                                                    style={{ width: `${(clearedCount / NOC_CLEARANCE_STEPS.length) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className='py-3.5 px-4 text-center'>
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                            isApprovedOrCompleted
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : isRejected
                                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                : isInitiated
                                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        }`}>
                                                            {isApprovedOrCompleted && <CheckCircle2 size={11} />}
                                                            {isRejected && <X size={11} />}
                                                            {isInitiated && <Clock size={11} />}
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className='py-3.5 px-4 text-right'>
                                                        <div className='flex items-center justify-end gap-1.5 flex-wrap'>
                                                            {isInitiated && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() => handleAcceptExit(item)}
                                                                    className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition cursor-pointer shadow-2xs'
                                                                    title='Accept and open departmental clearance checklist'
                                                                >
                                                                    <Check size={12} />
                                                                    <span>Accept</span>
                                                                </button>
                                                            )}
                                                            <button
                                                                type='button'
                                                                onClick={() => setSelectedExitForNoc(item)}
                                                                className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer'
                                                                title='Inspect and toggle departmental sign-offs'
                                                            >
                                                                <FileCheck2 size={12} className='text-indigo-600' />
                                                                <span>NOC Checkpoints</span>
                                                            </button>
                                                            {!isApprovedOrCompleted && !isRejected && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() => handleFinalApproveExit(item)}
                                                                    className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition cursor-pointer shadow-2xs'
                                                                    title='Final approval & mark completed'
                                                                >
                                                                    <CheckCircle2 size={12} />
                                                                    <span>Approve</span>
                                                                </button>
                                                            )}
                                                            {!isRejected && !isApprovedOrCompleted && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() => {
                                                                        setSelectedExitForReject(item)
                                                                        setRejectReason('')
                                                                    }}
                                                                    className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs transition cursor-pointer'
                                                                    title='Reject resignation'
                                                                >
                                                                    <X size={12} />
                                                                    <span>Reject</span>
                                                                </button>
                                                            )}
                                                            <button
                                                                type='button'
                                                                onClick={() => setSelectedExitForCert(item)}
                                                                className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition cursor-pointer'
                                                                title='View official relieving & experience certificate'
                                                            >
                                                                <FileText size={12} />
                                                                <span>Certificate</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </>
    )}

{/* ========================================================================= */}
            {/* MODAL: STAFF DEPARTMENT NOC CHECKPOINTS                                    */}
            {/* ========================================================================= */}
            {selectedExitForNoc && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <div className='flex items-center gap-3'>
                                <div className='p-2.5 rounded-xl bg-indigo-50 text-indigo-600'>
                                    <FileCheck2 size={20} />
                                </div>
                                <div>
                                    <h3 className='text-base font-bold text-slate-900'>Departmental NOC Clearance Checkpoints</h3>
                                    <p className='text-xs text-slate-500'>
                                        Staff: {resolveStaff(selectedExitForNoc.employeeId).name} ({selectedExitForNoc.employeeId}) · Proposed LWD: {selectedExitForNoc.lastWorkingDate}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedExitForNoc(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer'
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className='space-y-3 text-xs'>
                            {NOC_CLEARANCE_STEPS.map((step, idx) => {
                                const Icon = step.icon
                                const isCleared = Boolean(selectedExitForNoc[step.key])
                                return (
                                    <div
                                        key={step.key}
                                        className={`rounded-xl border p-3.5 transition-all flex items-start justify-between gap-3 ${
                                            isCleared ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200'
                                        }`}
                                    >
                                        <div className='flex items-start gap-3'>
                                            <div className={`p-2 rounded-xl mt-0.5 ${
                                                isCleared ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                <Icon size={16} />
                                            </div>
                                            <div>
                                                <div className='flex items-center gap-2'>
                                                    <span className='text-slate-400 font-bold'>Step {idx + 1}.</span>
                                                    <h4 className={`font-bold ${isCleared ? 'text-emerald-900' : 'text-slate-900'}`}>
                                                        {step.label}
                                                    </h4>
                                                </div>
                                                <p className='text-slate-500 text-[11px] mt-0.5'>{step.desc}</p>
                                            </div>
                                        </div>

                                        <div className='flex items-center gap-2 shrink-0'>
                                            <button
                                                type='button'
                                                onClick={() => handleToggleModalNocStep(step.key)}
                                                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                                                    isCleared
                                                        ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                                                }`}
                                            >
                                                {isCleared ? 'Reopen Check' : 'Mark Cleared'}
                                            </button>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                isCleared ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {isCleared ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                {isCleared ? 'Cleared' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className='flex items-center justify-between pt-3 border-t border-slate-100'>
                            <div className='text-xs text-slate-500'>
                                Completed: <strong>{NOC_CLEARANCE_STEPS.filter((s) => Boolean(selectedExitForNoc[s.key])).length}</strong> of <strong>{NOC_CLEARANCE_STEPS.length}</strong> checkpoints
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedExitForNoc(null)}
                                className='px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 cursor-pointer shadow-xs'
                            >
                                Done &amp; Save Clearances
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: REJECT EXIT REQUEST                                                */}
            {/* ========================================================================= */}
            {selectedExitForReject && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <div className='flex items-center gap-2 text-rose-600'>
                                <X size={20} />
                                <h3 className='text-base font-bold text-slate-900'>Reject Relieving Request</h3>
                            </div>
                            <button onClick={() => setSelectedExitForReject(null)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <div className='text-xs text-slate-600 space-y-2'>
                            <p>
                                Are you sure you want to reject the resignation request for <strong>{resolveStaff(selectedExitForReject.employeeId).name}</strong> ({selectedExitForReject.id})?
                            </p>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Rejection Remarks / Reason *</label>
                                <textarea
                                    rows='3'
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder='Specify reason (e.g. Critical handover incomplete, notice period agreement breach)...'
                                    className='w-full rounded-xl border border-slate-200 p-2.5 focus:outline-hidden focus:border-rose-500 text-xs'
                                    required
                                />
                            </div>
                        </div>

                        <div className='flex items-center justify-end gap-2 pt-2 border-t border-slate-100'>
                            <button
                                type='button'
                                onClick={() => setSelectedExitForReject(null)}
                                className='px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs cursor-pointer'
                            >
                                Cancel
                            </button>
                            <button
                                type='button'
                                onClick={handleConfirmRejectExit}
                                className='px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 cursor-pointer shadow-xs'
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: OFFICIAL RELIEVING & EXPERIENCE CERTIFICATE                         */}
            {/* ========================================================================= */}
            {selectedExitForCert && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto'>
                    <div className='w-full max-w-3xl rounded-2xl bg-white p-6 md:p-8 shadow-2xl space-y-6 my-8'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3 print:hidden'>
                            <div className='flex items-center gap-2'>
                                <FileText size={20} className='text-indigo-600' />
                                <h3 className='text-base font-bold text-slate-900'>Official Relieving &amp; Service Experience Certificate</h3>
                            </div>
                            <div className='flex items-center gap-2'>
                                <button
                                    type='button'
                                    onClick={() => window.print()}
                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs cursor-pointer'
                                >
                                    <Printer size={14} className='text-indigo-600' />
                                    <span>Print</span>
                                </button>
                                <button
                                    type='button'
                                    onClick={() => toast.success('Downloaded Official Relieving Certificate (PDF)')}
                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs cursor-pointer shadow-xs'
                                >
                                    <Download size={14} />
                                    <span>Download PDF</span>
                                </button>
                                <button
                                    onClick={() => setSelectedExitForCert(null)}
                                    className='p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer'
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Official Letterhead Certificate Document */}
                        <div className='border-4 border-double border-slate-200 p-8 rounded-xl bg-white font-serif text-slate-900 space-y-6'>
                            {/* Letterhead */}
                            <div className='text-center border-b-2 border-indigo-900 pb-4'>
                                <h1 className='text-2xl md:text-3xl font-extrabold tracking-tight text-indigo-950 font-sans'>
                                    QUEEN MIRA INTERNATIONAL SCHOOL
                                </h1>
                                <p className='text-xs font-sans tracking-wide text-indigo-800 uppercase font-semibold mt-0.5'>
                                    Affiliated to CBSE, New Delhi — Affiliation No. 1930432
                                </p>
                                <p className='text-[11px] font-sans text-slate-500 mt-1'>
                                    Melakkal Main Road, Kochadai, Madurai, Tamil Nadu 625016 · Phone: +91 452 238 2200 · Email: hr@queenmira.com
                                </p>
                            </div>

                            {/* Reference and Date */}
                            <div className='flex items-center justify-between font-sans text-xs text-slate-600 pt-2'>
                                <div>
                                    <strong>Ref. No:</strong> QMIS/HR/REL/{selectedExitForCert.id}
                                </div>
                                <div>
                                    <strong>Date:</strong> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                            </div>

                            {/* Certificate Title */}
                            <div className='text-center py-2'>
                                <span className='inline-block border-b-2 border-slate-900 pb-1 text-sm md:text-base font-bold tracking-widest font-sans uppercase'>
                                    Relieving &amp; Service Experience Certificate
                                </span>
                            </div>

                            {/* Certificate Body */}
                            <div className='space-y-4 text-xs md:text-sm leading-relaxed text-slate-800 font-sans'>
                                <p className='font-bold uppercase tracking-wider text-xs text-slate-600'>
                                    TO WHOMSOEVER IT MAY CONCERN
                                </p>

                                <p>
                                    This is to certify that <strong>{resolveStaff(selectedExitForCert.employeeId).name}</strong> (Employee ID: <strong>{selectedExitForCert.employeeId}</strong>) was employed with <strong>Queen Mira International School, Madurai</strong> as <strong>{resolveStaff(selectedExitForCert.employeeId).designation || 'Staff Member'}</strong> in the <strong>{resolveStaff(selectedExitForCert.employeeId).department}</strong> department from <strong>01-June-2022</strong> to <strong>{selectedExitForCert.lastWorkingDate}</strong>.
                                </p>

                                <p>
                                    During their tenure of service with our institution, their conduct and character were found to be <strong>Exemplary</strong>. They discharged their assigned academic, administrative, and institutional duties with dedication, sincerity, and high professional standards.
                                </p>

                                <p>
                                    They have been formally relieved from the services of the school at the close of institutional working hours on <strong>{selectedExitForCert.lastWorkingDate}</strong>, upon satisfactory completion of operational work handovers and full clearance from all concerned departments including Department HOD, IT &amp; Assets, Library, and Finance &amp; Accounts.
                                </p>

                                <p>
                                    We place on record our sincere appreciation for their contributions to Queen Mira International School and wish them all success in their future endeavors.
                                </p>
                            </div>

                            {/* Signatories */}
                            <div className='pt-12 flex items-end justify-between font-sans text-xs'>
                                <div className='text-center space-y-1'>
                                    <div className='h-10 border-b border-slate-400 w-36 mx-auto' />
                                    <p className='font-bold text-slate-900'>Dr. S. Meenakshi</p>
                                    <p className='text-slate-500 text-[11px]'>Principal</p>
                                </div>

                                <div className='text-center space-y-1'>
                                    <div className='w-20 h-20 rounded-full border-2 border-dashed border-indigo-300 flex items-center justify-center text-[10px] text-indigo-700 font-bold mx-auto uppercase'>
                                        Official Seal
                                    </div>
                                    <p className='text-[10px] text-slate-400'>Queen Mira International</p>
                                </div>

                                <div className='text-center space-y-1'>
                                    <div className='h-10 border-b border-slate-400 w-36 mx-auto' />
                                    <p className='font-bold text-slate-900'>Savitha Raman</p>
                                    <p className='text-slate-500 text-[11px]'>Head of Human Resources</p>
                                </div>
                            </div>
                        </div>

                        <div className='flex justify-end pt-2 border-t border-slate-100 print:hidden'>
                            <button
                                type='button'
                                onClick={() => setSelectedExitForCert(null)}
                                className='px-5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs cursor-pointer'
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            ${target3}
            {viewMode === 'student_tc' && (
                <div className='space-y-6'>
                    {/* Top Stats Banner */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Total TC Applications</span>
                            <p className='text-2xl font-bold text-slate-900 mt-1'>{tcRequests.length}</p>
                            <p className='text-xs text-slate-500'>Active and completed cases</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Pending PRM Review</span>
                            <p className='text-2xl font-bold text-amber-600 mt-1'>
                                {tcRequests.filter((r) => r.status === 'Pending PRM Review').length}
                            </p>
                            <p className='text-xs text-slate-500'>Initial verification needed</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Super Admin Review</span>
                            <p className='text-2xl font-bold text-blue-600 mt-1'>
                                {tcRequests.filter((r) => r.status === 'Pending Super Admin Approval').length}
                            </p>
                            <p className='text-xs text-slate-500'>Final clearance approval</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Approved & Issued</span>
                            <p className='text-2xl font-bold text-emerald-600 mt-1'>
                                {tcRequests.filter((r) => r.status === 'Approved').length}
                            </p>
                            <p className='text-xs text-slate-500'>Official certificates generated</p>
                        </div>
                    </div>

                    {/* Filter and Action Header */}
                    <div className='bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4'>
                        <div className='flex flex-wrap items-center gap-3 flex-1'>
                            <div className='relative flex-1 min-w-[220px] max-w-md'>
                                <Search size={16} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400' />
                                <input
                                    type='text'
                                    placeholder='Search by student, admission #, or TC ID...'
                                    value={tcSearch}
                                    onChange={(e) => setTcSearch(e.target.value)}
                                    className='w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500'
                                />
                            </div>

                            <select
                                value={tcStatusFilter}
                                onChange={(e) => setTcStatusFilter(e.target.value)}
                                className='rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500'
                            >
                                <option value='All'>All Statuses</option>
                                <option value='Pending Review'>Pending Review</option>
                                <option value='Pending PRM Review'>Pending PRM Review</option>
                                <option value='Pending Super Admin Approval'>Pending Super Admin Approval</option>
                                <option value='Approved'>Approved</option>
                                <option value='Rejected'>Rejected</option>
                            </select>
                        </div>

                        <button
                            type='button'
                            onClick={() => setShowNewTcModal(true)}
                            className='inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer'
                        >
                            <Plus size={15} />
                            <span>Raise Student TC Request</span>
                        </button>
                    </div>

                    {/* TC Requests Table */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-200/80 bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]'>
                                        <th className='py-3.5 px-4'>TC ID & Date</th>
                                        <th className='py-3.5 px-4'>Student & Admission #</th>
                                        <th className='py-3.5 px-4'>Class</th>
                                        <th className='py-3.5 px-4'>Reason & Transfer To</th>
                                        <th className='py-3.5 px-4'>Department Clearances</th>
                                        <th className='py-3.5 px-4'>Status</th>
                                        <th className='py-3.5 px-4 text-right'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {filteredTcRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className='py-8 text-center text-slate-400'>
                                                No Student TC requests found matching filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTcRequests.map((req) => {
                                            const clearances = req.nocClearances || DEFAULT_NOC_CLEARANCES
                                            const clearedCount = clearances.filter((c) => c.status === 'Cleared').length
                                            return (
                                                <tr key={req.id} className='hover:bg-slate-50/70 transition-colors'>
                                                    <td className='py-3.5 px-4'>
                                                        <span className='font-mono font-bold text-indigo-700 block'>{req.requestId}</span>
                                                        <span className='text-[10px] text-slate-400'>{req.requestedOn}</span>
                                                    </td>
                                                    <td className='py-3.5 px-4'>
                                                        <span className='font-bold text-slate-900 block'>{req.studentName}</span>
                                                        <span className='text-[10px] text-slate-400 font-mono'>{req.admissionNumber}</span>
                                                    </td>
                                                    <td className='py-3.5 px-4 font-semibold text-slate-700'>{req.classSection}</td>
                                                    <td className='py-3.5 px-4 max-w-xs'>
                                                        <p className='truncate text-slate-800 font-medium'>{req.reason}</p>
                                                        <p className='truncate text-[10px] text-slate-400'>To: {req.transferTo}</p>
                                                    </td>
                                                    <td className='py-3.5 px-4'>
                                                        <div className='flex items-center gap-1.5'>
                                                            {clearances.map((c) => (
                                                                <span
                                                                    key={c.departmentKey}
                                                                    title={`${c.department}: ${c.status}`}
                                                                    className={`size-2.5 rounded-full ${
                                                                        c.status === 'Cleared' ? 'bg-emerald-500' : 'bg-amber-400'
                                                                    }`}
                                                                />
                                                            ))}
                                                            <span className='text-[11px] font-semibold text-slate-600 ml-1'>
                                                                {clearedCount}/5 Cleared
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className='py-3.5 px-4'>
                                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                            statusBadgeColor[req.status] || 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                    <td className='py-3.5 px-4 text-right'>
                                                        <div className='inline-flex items-center gap-1.5 justify-end'>
                                                            <button
                                                                type='button'
                                                                onClick={() => setSelectedTcForClearance(req)}
                                                                className='rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer'
                                                            >
                                                                Clearance NOC
                                                            </button>

                                                            {req.status === 'Pending PRM Review' && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() => handleForwardTc(req.id)}
                                                                    className='rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition cursor-pointer'
                                                                >
                                                                    Forward
                                                                </button>
                                                            )}

                                                            {req.status === 'Pending Super Admin Approval' && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() => handleApproveTc(req.id)}
                                                                    className='rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer'
                                                                >
                                                                    Approve
                                                                </button>
                                                            )}

                                                            {req.status === 'Approved' && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() => toast.success(`Downloaded Transfer Certificate: ${req.tcDocumentName || 'TC.pdf'}`)}
                                                                    className='rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-200 transition cursor-pointer'
                                                                >
                                                                    <Download size={12} className='inline mr-1' /> TC PDF
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 1: RAISE STUDENT TC REQUEST */}
            {showNewTcModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 text-xs'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-4'>
                            <div className='flex items-center gap-2'>
                                <GraduationCap size={18} className='text-indigo-600' />
                                <h3 className='text-base font-bold text-slate-900'>Raise Student Transfer Certificate (TC)</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setShowNewTcModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer'
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTcSubmit} className='space-y-3.5'>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Student Full Name</label>
                                <input
                                    type='text'
                                    value={newTcForm.studentName}
                                    onChange={(e) => setNewTcForm({ ...newTcForm, studentName: e.target.value })}
                                    placeholder='e.g. Rohan V. Verma'
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                    required
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Admission Number</label>
                                    <input
                                        type='text'
                                        value={newTcForm.admissionNumber}
                                        onChange={(e) => setNewTcForm({ ...newTcForm, admissionNumber: e.target.value })}
                                        placeholder='ADM-2026-1048'
                                        className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Class & Section</label>
                                    <select
                                        value={newTcForm.classSection}
                                        onChange={(e) => setNewTcForm({ ...newTcForm, classSection: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                    >
                                        <option value='9-A'>Class 9 - Section A</option>
                                        <option value='9-B'>Class 9 - Section B</option>
                                        <option value='10-A'>Class 10 - Section A</option>
                                        <option value='10-B'>Class 10 - Section B</option>
                                        <option value='11-Science'>Class 11 - Science</option>
                                        <option value='12-Science'>Class 12 - Science</option>
                                    </select>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Transfer To (New School)</label>
                                    <input
                                        type='text'
                                        value={newTcForm.transferTo}
                                        onChange={(e) => setNewTcForm({ ...newTcForm, transferTo: e.target.value })}
                                        placeholder='e.g. Delhi Public School'
                                        className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Last Date of Attendance</label>
                                    <input
                                        type='date'
                                        value={newTcForm.lastDateOfAttendance}
                                        onChange={(e) => setNewTcForm({ ...newTcForm, lastDateOfAttendance: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Reason for Leaving</label>
                                <textarea
                                    rows={2}
                                    value={newTcForm.reason}
                                    onChange={(e) => setNewTcForm({ ...newTcForm, reason: e.target.value })}
                                    placeholder='Relocation, guardian job transfer, admission to another board...'
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                    required
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowNewTcModal(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 transition cursor-pointer'
                                >
                                    Submit TC & Initiate Clearances
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: 5-DEPARTMENT MANAGER CLEARANCES DIALOG */}
            {selectedTcForClearance && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-slate-200 text-xs space-y-4 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <div>
                                <div className='flex items-center gap-2'>
                                    <h3 className='text-base font-bold text-slate-900'>Departmental NOC Clearances</h3>
                                    <span className='font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded'>
                                        {selectedTcForClearance.requestId}
                                    </span>
                                </div>
                                <p className='text-xs text-slate-500 mt-0.5'>
                                    Student: <strong className='text-slate-800'>{selectedTcForClearance.studentName}</strong> ({selectedTcForClearance.classSection} · {selectedTcForClearance.admissionNumber})
                                </p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedTcForClearance(null)}
                                className='p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer'
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* List of 5 Departments */}
                        <div className='space-y-3'>
                            {(selectedTcForClearance.nocClearances || DEFAULT_NOC_CLEARANCES).map((noc) => {
                                const deptMeta = STUDENT_NOC_DEPARTMENTS.find((d) => d.key === noc.departmentKey) || {
                                    icon: Building2,
                                    desc: 'Department verification'
                                }
                                const Icon = deptMeta.icon
                                const isCleared = noc.status === 'Cleared'

                                return (
                                    <div
                                        key={noc.departmentKey}
                                        className={`rounded-xl border p-3.5 transition-all flex items-start justify-between gap-3 ${
                                            isCleared ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50/60 border-slate-200'
                                        }`}
                                    >
                                        <div className='flex items-start gap-3'>
                                            <div className={`p-2 rounded-xl mt-0.5 ${
                                                isCleared ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                            }`}>
                                                <Icon size={16} />
                                            </div>
                                            <div>
                                                <div className='flex items-center gap-2'>
                                                    <h4 className='font-bold text-slate-900'>{noc.department}</h4>
                                                    <span className='text-[10px] text-slate-500'>Manager: {noc.manager}</span>
                                                </div>
                                                <p className='text-[11px] text-slate-600 mt-0.5'>{noc.remarks || deptMeta.desc}</p>
                                                {noc.date && <p className='text-[10px] text-slate-400 mt-0.5'>Date: {noc.date}</p>}
                                            </div>
                                        </div>

                                        <div className='flex items-center gap-2 shrink-0'>
                                            <button
                                                type='button'
                                                onClick={() => handleToggleStudentClearance(selectedTcForClearance.id, noc.departmentKey, noc.status)}
                                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                                                    isCleared
                                                        ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                                                }`}
                                            >
                                                {isCleared ? 'Reopen Dues' : 'Mark Cleared'}
                                            </button>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                isCleared
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {isCleared ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                {noc.status}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Modal Footer */}
                        <div className='flex items-center justify-between pt-3 border-t border-slate-100'>
                            <div className='text-xs text-slate-500'>
                                All 5 departmental clearances must be cleared before the Principal can issue the final TC.
                            </div>
                            <div className='flex items-center gap-2'>
                                {selectedTcForClearance.status === 'Pending PRM Review' && (
                                    <button
                                        type='button'
                                        onClick={() => handleForwardTc(selectedTcForClearance.id)}
                                        className='rounded-xl bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition cursor-pointer'
                                    >
                                        Forward to Super Admin
                                    </button>
                                )}
                                {selectedTcForClearance.status === 'Pending Super Admin Approval' && (
                                    <button
                                        type='button'
                                        onClick={() => handleApproveTc(selectedTcForClearance.id)}
                                        className='rounded-xl bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700 transition cursor-pointer'
                                    >
                                        Approve & Issue Certificate
                                    </button>
                                )}
                                <button
                                    type='button'
                                    onClick={() => setSelectedTcForClearance(null)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer'
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
