/**
 * Physical File Room & Document Custody Data Engine
 * Single Source of Truth for:
 * - Physical File Master Repository with Rack, Shelf & Box Coordinates
 * - Physical Inward Register (Document Intake & Barcode Logging)
 * - Physical Outward / Issue Register (Borrower Custody & Acknowledgement)
 * - Confidentiality Access Gating (Department Restricted vs MD Approval Only)
 * - Chain of Custody History, Movement Audit & Overdue File Alerts
 */

import { recordAuditLog, dispatchNotification } from '../AuditAndNotifications/centralAuditEngine.js'

export const FILE_MASTER_STORAGE_KEY = 'schoolerp-file-master-v1'
export const FILE_INWARD_STORAGE_KEY = 'schoolerp-file-inward-v1'
export const FILE_OUTWARD_STORAGE_KEY = 'schoolerp-file-outward-v1'

let _memoryFiles = null
let _memoryInward = null
let _memoryOutward = null

// Initial Physical File Master
export const INITIAL_FILES = [
    {
        id: 'FILE-2026-001',
        fileRefNo: 'EXAM/CBSE/X/2025-26/TAB-01',
        fileName: 'Grade 10 CBSE Board Tabulation & Roll Register 2025-26',
        category: 'Examination Tabulation',
        department: 'Academics & Teaching',
        documentType: 'Board Tabulation Register',
        academicYear: '2025-2026',
        storageLocation: {
            building: 'Administrative Block',
            room: 'Central File Archive (Room 102)',
            rackNo: 'Rack A',
            shelfNo: 'Shelf 02',
            boxNo: 'Box 08'
        },
        confidentiality: 'Department Restricted',
        retentionPeriod: 'Permanent Archival',
        custodian: 'Meenakshi Sundaram (Librarian / Archive Head)',
        currentLocationStatus: 'In File Room',
        heldByUserId: null,
        heldByUserName: null,
        heldByUserDept: null,
        lastMovementDate: '28-10-2026'
    },
    {
        id: 'FILE-2026-002',
        fileRefNo: 'STU/TC/2024-25/STUB-14',
        fileName: 'Student Transfer Certificates (TC) Duplicate Stubs & NOCs (Batch 2024-25)',
        category: 'Student Academic Records',
        department: 'Administration',
        documentType: 'TC Stubs & Clearance Slips',
        academicYear: '2024-2025',
        storageLocation: {
            building: 'Administrative Block',
            room: 'Central File Archive (Room 102)',
            rackNo: 'Rack B',
            shelfNo: 'Shelf 01',
            boxNo: 'Box 14'
        },
        confidentiality: 'Standard / Public',
        retentionPeriod: '10 Years',
        custodian: 'Meenakshi Sundaram',
        currentLocationStatus: 'Checked Out / Issued',
        heldByUserId: 'EMP-FO-001',
        heldByUserName: 'Anita Desai',
        heldByUserDept: 'Administration (Front Office)',
        lastMovementDate: '25-10-2026'
    },
    {
        id: 'FILE-2026-003',
        fileRefNo: 'LEG/PROP/LAND/DEED-001',
        fileName: 'Institutional Land Title Deeds, DTCP Approvals & Blueprints',
        category: 'Legal Deeds & Blueprints',
        department: 'Executive Governance',
        documentType: 'Original Title Deeds & Sanction Orders',
        academicYear: 'Permanent',
        storageLocation: {
            building: 'Main Administrative Wing',
            room: 'Executive Fireproof Vault (Room 101)',
            rackNo: 'Fireproof Locker',
            shelfNo: 'Shelf S-1',
            boxNo: 'Locker 02'
        },
        confidentiality: 'Strictly Confidential / MD Approval Only',
        retentionPeriod: 'Permanent Archival',
        custodian: 'Dr. Kavita Sharma (Director)',
        currentLocationStatus: 'In File Room',
        heldByUserId: null,
        heldByUserName: null,
        heldByUserDept: null,
        lastMovementDate: '15-09-2026'
    },
    {
        id: 'FILE-2026-004',
        fileRefNo: 'HR/SRV/2023-26/FAC-006',
        fileName: 'Ananya Roy (Senior Chemistry Faculty) Service Book & Verification Dossier',
        category: 'Staff Dossiers & Service Books',
        department: 'Human Resources (HR)',
        documentType: 'Faculty Service Register',
        academicYear: '2023-2026',
        storageLocation: {
            building: 'Administrative Block',
            room: 'Central File Archive (Room 102)',
            rackNo: 'Rack C',
            shelfNo: 'Shelf 03',
            boxNo: 'Box HR-04'
        },
        confidentiality: 'Department Restricted',
        retentionPeriod: 'Retirement + 10 Years',
        custodian: 'Sunita Deshmukh (HR Head)',
        currentLocationStatus: 'In File Room',
        heldByUserId: null,
        heldByUserName: null,
        heldByUserDept: null,
        lastMovementDate: '10-10-2026'
    }
]

// Initial Inward Register
export const INITIAL_INWARD_RECORDS = [
    {
        id: 'INW-2026-001',
        inwardDate: '28-10-2026 11:30 AM',
        fileId: 'FILE-2026-001',
        fileName: 'Grade 10 CBSE Board Tabulation & Roll Register 2025-26',
        receivedFrom: 'Kavita Menon (Senior Secondary Coordinator)',
        department: 'Academics & Teaching',
        receivedByCustodian: 'Meenakshi Sundaram',
        documentCount: 142,
        physicalCondition: 'Good',
        storageRackAssigned: 'Rack A, Shelf 02, Box 08',
        remarks: 'Official board verification complete with sealed mark tabulation sheets.'
    },
    {
        id: 'INW-2026-002',
        inwardDate: '20-10-2026 02:15 PM',
        fileId: 'FILE-2026-004',
        fileName: 'Ananya Roy Service Book & Verification Dossier',
        receivedFrom: 'Sunita Deshmukh (HR Head)',
        department: 'Human Resources (HR)',
        receivedByCustodian: 'Meenakshi Sundaram',
        documentCount: 48,
        physicalCondition: 'Mint',
        storageRackAssigned: 'Rack C, Shelf 03, Box HR-04',
        remarks: 'Annual appraisal certificates and police verification records added.'
    }
]

// Initial Outward / Issue Register
export const INITIAL_OUTWARD_RECORDS = [
    {
        id: 'ISS-FILE-001',
        fileId: 'FILE-2026-002',
        fileName: 'Student Transfer Certificates (TC) Duplicate Stubs & NOCs (Batch 2024-25)',
        requestedById: 'EMP-FO-001',
        requestedByName: 'Anita Desai',
        department: 'Administration',
        approvedBy: 'Arunachalam S (Super Admin)',
        issuedByCustodian: 'Meenakshi Sundaram',
        issueDateTime: '25-10-2026 10:00 AM',
        purpose: 'Audit verification of transferred student clearance vouchers.',
        expectedReturnDate: '28-10-2026', // Past date -> Overdue!
        actualReturnDate: null,
        receivingAcknowledgmentSigned: true,
        returnCondition: '',
        status: 'Overdue'
    }
]

// Storage Accessors
export const getPhysicalFiles = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(FILE_MASTER_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(Boolean)
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryFiles && Array.isArray(_memoryFiles) && _memoryFiles.length > 0) {
        return _memoryFiles.filter(Boolean)
    }
    _memoryFiles = [...INITIAL_FILES]
    savePhysicalFiles(_memoryFiles)
    return _memoryFiles.filter(Boolean)
}

export const savePhysicalFiles = (files) => {
    _memoryFiles = (files || []).filter(Boolean)
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(FILE_MASTER_STORAGE_KEY, JSON.stringify(_memoryFiles))
        }
    } catch {
        /* ignore */
    }
}

export const getFileInwardRecords = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(FILE_INWARD_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(Boolean)
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryInward && Array.isArray(_memoryInward) && _memoryInward.length > 0) {
        return _memoryInward.filter(Boolean)
    }
    _memoryInward = [...INITIAL_INWARD_RECORDS]
    saveFileInwardRecords(_memoryInward)
    return _memoryInward.filter(Boolean)
}

export const saveFileInwardRecords = (records) => {
    _memoryInward = (records || []).filter(Boolean)
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(FILE_INWARD_STORAGE_KEY, JSON.stringify(_memoryInward))
        }
    } catch {
        /* ignore */
    }
}

export const getFileOutwardRecords = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(FILE_OUTWARD_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return evaluateOverdueFiles(parsed.filter(Boolean))
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryOutward && Array.isArray(_memoryOutward) && _memoryOutward.length > 0) {
        return evaluateOverdueFiles(_memoryOutward.filter(Boolean))
    }
    _memoryOutward = [...INITIAL_OUTWARD_RECORDS]
    saveFileOutwardRecords(_memoryOutward)
    return evaluateOverdueFiles(_memoryOutward.filter(Boolean))
}

const evaluateOverdueFiles = (records) => {
    if (!Array.isArray(records)) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return records.filter(Boolean).map((r) => {
        if (r && r.status === 'Issued' && r.expectedReturnDate) {
            try {
                let expDate = null
                if (typeof r.expectedReturnDate === 'string') {
                    const str = r.expectedReturnDate.trim()
                    if (str.includes('-')) {
                        const parts = str.split('-')
                        if (parts.length === 3) {
                            if (parts[0].length === 4) {
                                expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
                            } else {
                                expDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10))
                            }
                        }
                    } else {
                        expDate = new Date(str)
                    }
                } else if (r.expectedReturnDate instanceof Date) {
                    expDate = r.expectedReturnDate
                }
                if (expDate && !isNaN(expDate.getTime()) && today > expDate) {
                    return { ...r, status: 'Overdue' }
                }
            } catch {
                /* safe date parse fallback */
            }
        }
        return r
    })
}

export const saveFileOutwardRecords = (records) => {
    _memoryOutward = (records || []).filter(Boolean)
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(FILE_OUTWARD_STORAGE_KEY, JSON.stringify(_memoryOutward))
        }
    } catch {
        /* ignore */
    }
}

// Transactional Workflows

/**
 * 1. Register Incoming Physical File in Inward Ledger
 */
export const logFileInward = ({
    fileRefNo,
    fileName,
    category,
    department,
    receivedFrom,
    receivedByCustodian = 'Meenakshi Sundaram',
    documentCount = 1,
    physicalCondition = 'Good',
    building = 'Administrative Block',
    room = 'Central File Archive (Room 102)',
    rackNo,
    shelfNo,
    boxNo,
    confidentiality = 'Standard / Public',
    retentionPeriod = '10 Years',
    remarks = ''
}) => {
    const files = getPhysicalFiles()
    const nextSeq = files.length + 1
    const fileId = `FILE-2026-${String(nextSeq).padStart(3, '0')}`

    const newFile = {
        id: fileId,
        fileRefNo: fileRefNo || `DOC/GEN/${nextSeq}`,
        fileName,
        category,
        department,
        documentType: category,
        academicYear: '2025-2026',
        storageLocation: {
            building,
            room,
            rackNo: rackNo || 'Rack A',
            shelfNo: shelfNo || 'Shelf 01',
            boxNo: boxNo || 'Box 01'
        },
        confidentiality,
        retentionPeriod,
        custodian: receivedByCustodian,
        currentLocationStatus: 'In File Room',
        heldByUserId: null,
        heldByUserName: null,
        heldByUserDept: null,
        lastMovementDate: new Date().toLocaleDateString('en-GB')
    }

    const updatedFiles = [newFile, ...files]
    savePhysicalFiles(updatedFiles)

    // Inward Ledger
    const inwards = getFileInwardRecords()
    const inwSeq = inwards.length + 1
    const newInward = {
        id: `INW-2026-${String(inwSeq).padStart(3, '0')}`,
        inwardDate: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        fileId,
        fileName,
        receivedFrom,
        department,
        receivedByCustodian,
        documentCount: Number(documentCount),
        physicalCondition,
        storageRackAssigned: `${rackNo || 'Rack A'}, ${shelfNo || 'Shelf 01'}, ${boxNo || 'Box 01'}`,
        remarks
    }

    const updatedInwards = [newInward, ...inwards]
    saveFileInwardRecords(updatedInwards)

    recordAuditLog({
        actorName: receivedByCustodian,
        actorRole: 'librarian',
        module: 'File Room',
        action: 'INWARD_FILE',
        entityId: fileId,
        previousState: 'None',
        newState: 'In File Room',
        remarks: `Physical file '${fileName}' received from ${receivedFrom}. Stored in ${newInward.storageRackAssigned}`
    })

    return { newFile, newInward }
}

/**
 * 2. Issue Physical File to Requester (Outward Register)
 */
export const issuePhysicalFile = ({
    fileId,
    fileNumber,
    requestedById,
    requestedByName,
    issuedToEmployeeId,
    issuedToEmployeeName,
    issuedToDepartment,
    department,
    approvedBy = 'HOD / Department Head',
    issuedByCustodian = 'Meenakshi Sundaram',
    purpose,
    expectedReturnDate,
    directorApprovalObtained
}) => {
    const files = getPhysicalFiles()
    const targetLookup = fileId || fileNumber
    const targetFile = files.find((f) => f && (f.id === targetLookup || f.fileNumber === targetLookup || f.barcode === targetLookup || f.fileRefNo === targetLookup))
    if (!targetFile) throw new Error('File not found in archive repository.')

    if (targetFile.currentStatus === 'Checked Out' || targetFile.currentLocationStatus === 'Checked Out / Issued' || targetFile.currentLocationStatus === 'Checked Out') {
        throw new Error(`File is currently unavailable (Status: Checked Out). Currently held by ${targetFile.heldByUserName || 'another borrower'}.`)
    }

    // Confidentiality Check
    const isStrictlyConfidential = (targetFile.confidentialityLevel === 'Strictly Confidential') || (targetFile.confidentiality && targetFile.confidentiality.includes('Strictly Confidential'))
    if (isStrictlyConfidential && !directorApprovalObtained && !approvedBy.toLowerCase().includes('director') && !approvedBy.toLowerCase().includes('md')) {
        throw new Error('Strictly Confidential files require explicit Managing Director (MD) sign-off before release.')
    }

    const outwards = getFileOutwardRecords()
    const nextSeq = outwards.length + 1
    const issueId = `ISS-FILE-${String(nextSeq).padStart(3, '0')}`

    const nowStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const finalBorrowerId = requestedById || issuedToEmployeeId || 'EMP-STAFF-001'
    const finalBorrowerName = requestedByName || issuedToEmployeeName || 'Faculty / Staff Member'
    const finalDept = department || issuedToDepartment || targetFile.department || 'Administration'

    const newOutward = {
        id: issueId,
        fileId: targetFile.id || targetFile.fileNumber,
        fileNumber: targetFile.fileNumber || targetFile.id,
        fileName: targetFile.title || targetFile.fileName,
        fileTitle: targetFile.title || targetFile.fileName,
        requestedById: finalBorrowerId,
        requestedByName: finalBorrowerName,
        issuedToEmployeeName: finalBorrowerName,
        issuedToDepartment: finalDept,
        department: finalDept,
        approvedBy,
        issuedByCustodian,
        issueDate: nowStr,
        issueDateTime: nowStr,
        purpose: purpose || 'Official Verification',
        expectedReturnDate: expectedReturnDate || new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-GB'),
        actualReturnDate: null,
        receivingAcknowledgmentSigned: true,
        returnCondition: '',
        status: 'Issued'
    }

    const updatedOutwards = [newOutward, ...outwards]
    saveFileOutwardRecords(updatedOutwards)

    // Update File Master
    targetFile.currentLocationStatus = 'Checked Out / Issued'
    targetFile.currentStatus = 'Checked Out'
    targetFile.heldByUserId = finalBorrowerId
    targetFile.heldByUserName = finalBorrowerName
    targetFile.heldByUserDept = finalDept
    targetFile.lastMovementDate = new Date().toLocaleDateString('en-GB')

    savePhysicalFiles(files)

    recordAuditLog({
        actorId: finalBorrowerId,
        actorName: finalBorrowerName,
        module: 'File Room',
        action: 'ISSUE_PHYSICAL_FILE',
        entityId: targetFile.id || targetFile.fileNumber,
        previousState: 'In File Room',
        newState: 'Checked Out / Issued',
        remarks: `Issued to ${finalBorrowerName} (${finalDept}) by ${issuedByCustodian}. Expected return: ${newOutward.expectedReturnDate}`
    })

    dispatchNotification({
        recipientId: finalBorrowerId,
        title: 'Physical File Issued from Archive',
        message: `File '${targetFile.title || targetFile.fileName}' issued to your custody. Due for return on ${newOutward.expectedReturnDate}.`,
        link: '/file-room?tab=outward',
        priority: 'Normal',
        type: 'FILE_ROOM'
    })

    return { targetFile, newOutward, outwardRecord: newOutward, file: targetFile }
}

/**
 * 3. Return Physical File to Archive
 */
export const returnPhysicalFile = ({
    issueId,
    outwardRecordId,
    custodianName = 'Meenakshi Sundaram',
    returnCondition = 'Good',
    conditionOnReturn = 'Intact',
    remarks = 'Physical documents verified against page index. Restocked in designated rack.'
}) => {
    const outwards = getFileOutwardRecords()
    const targetLookup = issueId || outwardRecordId
    const targetOutward = outwards.find((o) => o && (o.id === targetLookup || o.fileNumber === targetLookup))
    if (!targetOutward) throw new Error('Outward issue record not found.')

    const files = getPhysicalFiles()
    const targetFile = files.find((f) => f && (f.id === targetOutward.fileId || f.fileNumber === targetOutward.fileNumber || f.fileNumber === targetOutward.fileId))
    if (!targetFile) throw new Error('Referenced file record not found in repository.')

    const nowStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    targetOutward.actualReturnDate = nowStr
    targetOutward.returnCondition = conditionOnReturn || returnCondition
    targetOutward.status = 'Returned'
    saveFileOutwardRecords(outwards)

    // Update File Master
    targetFile.currentLocationStatus = 'In File Room'
    targetFile.currentStatus = 'Available in File Room'
    targetFile.heldByUserId = null
    targetFile.heldByUserName = null
    targetFile.heldByUserDept = null
    targetFile.lastMovementDate = new Date().toLocaleDateString('en-GB')
    savePhysicalFiles(files)

    recordAuditLog({
        actorName: custodianName,
        actorRole: 'librarian',
        module: 'File Room',
        action: 'RETURN_PHYSICAL_FILE',
        entityId: targetFile.id || targetFile.fileNumber,
        previousState: 'Checked Out / Issued',
        newState: 'In File Room',
        remarks: `File '${targetFile.title || targetFile.fileName}' returned by ${targetOutward.requestedByName || targetOutward.issuedToEmployeeName}. Inspected by ${custodianName}. Condition: ${conditionOnReturn || returnCondition}.`
    })

    dispatchNotification({
        recipientId: targetOutward.requestedById || targetOutward.issuedToEmployeeId,
        title: 'Physical File Return Confirmed',
        message: `Your return of file '${targetFile.title || targetFile.fileName}' has been verified and restocked in File Room archive.`,
        link: '/file-room?tab=master',
        type: 'FILE_ROOM'
    })

    return { targetFile, targetOutward, outwardRecord: targetOutward, file: targetFile }
}

