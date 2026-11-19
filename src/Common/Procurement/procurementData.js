/**
 * Commercial Procurement & Purchase Order Domain Engine
 * Dedicated to external supplier purchasing, RFQs, 3-vendor quotation matrices,
 * multi-tier financial approvals, Purchase Orders (POs), dispatch tracking, and GRN 3-way matching.
 */

import { captureActivityEvent } from '../EmployeeActivityMonitoring/employeeActivityMonitoringData.js'

export const PROCUREMENT_STORAGE_KEY = 'schoolerp-commercial-procurement-v2'
export const VENDORS_STORAGE_KEY = 'schoolerp-procurement-vendors-v2'

export const PROCUREMENT_STAGES = [
    'INDENT_SUBMITTED',
    'QUOTATION_PENDING',
    'QUOTATIONS_RECEIVED',
    'HOD_APPROVED',
    'FINANCE_APPROVED',
    'DIRECTOR_APPROVED',
    'PO_ISSUED',
    'DISPATCHED',
    'DELIVERED',
    'GRN_VERIFIED',
    'REJECTED'
]

export const INITIAL_PROCUREMENT_VENDORS = [
    {
        id: 'VEN-001',
        name: 'Apex Educational Supplies Pvt Ltd',
        contactPerson: 'Rajiv Malhotra',
        phone: '+91 98112 34567',
        email: 'sales@apexedu.in',
        address: '42, Industrial Area Phase II, Okhla, New Delhi 110020',
        gstin: '07AAAAA1234A1Z5',
        category: 'Stationery & Printing',
        rating: 4.8,
        paymentTerms: 'Net 30 Days'
    },
    {
        id: 'VEN-002',
        name: 'TechMatrix Digital Solutions',
        contactPerson: 'Sandeep Varma',
        phone: '+91 98450 88214',
        email: 'orders@techmatrix.co.in',
        address: '108, Koramangala 4th Block, Bengaluru, Karnataka 560034',
        gstin: '29BBBBB5678B1Z2',
        category: 'IT Hardware & Audio-Visual',
        rating: 4.9,
        paymentTerms: '50% Advance, 50% on Delivery'
    },
    {
        id: 'VEN-003',
        name: 'ChemiScientific Instruments',
        contactPerson: 'Dr. Anita Sen',
        phone: '+91 93310 99452',
        email: 'laborders@chemsci.org',
        address: '15, College Street Chemical Hub, Kolkata, West Bengal 700073',
        gstin: '19CCCCC9012C1Z8',
        category: 'Science Laboratory Consumables',
        rating: 4.7,
        paymentTerms: 'Net 15 Days'
    },
    {
        id: 'VEN-004',
        name: 'GreenClean Hygiene & Chemicals',
        contactPerson: 'Mohan Kumar',
        phone: '+91 94441 55678',
        email: 'supplies@greenclean.in',
        address: '88, Ambattur Industrial Estate, Chennai, Tamil Nadu 600058',
        gstin: '33DDDDD3456D1Z1',
        category: 'Housekeeping & Facility Consumables',
        rating: 4.6,
        paymentTerms: 'Net 30 Days'
    },
    {
        id: 'VEN-005',
        name: 'Schneider ElectroSpares',
        contactPerson: 'Arun Bhatnagar',
        phone: '+91 98200 44512',
        email: 'bhatnagar@electrospares.co.in',
        address: '12, MIDC Industrial Area, Andheri East, Mumbai 400093',
        gstin: '27EEEEE7890E1Z4',
        category: 'Electrical & Maintenance Spares',
        rating: 4.7,
        paymentTerms: 'Net 30 Days'
    }
]

export const INITIAL_PURCHASE_REQUESTS = [
    {
        id: 'PUR-2026-0101',
        poNumber: 'PO-2026-0881',
        title: 'High-Capacity Computer Lab Workstations (Batch of 25)',
        department: 'IT Support',
        requestedBy: 'Sandy Selva (IT Support Manager)',
        requestDate: '2026-10-18',
        estimatedCost: 1125000,
        currency: 'INR',
        stage: 'PO_ISSUED',
        priority: 'High',
        selectedVendor: 'TechMatrix Digital Solutions',
        vendorGstin: '29BBBBB5678B1Z2',
        paymentTerms: '50% Advance, 50% on Delivery',
        deliveryDueDate: '2026-11-25',
        trackingNumber: 'BLUEDART-8829104',
        carrierName: 'BlueDart Express',
        items: [
            { id: 'IT-WS-01', description: 'Intel Core i7 13th Gen, 16GB RAM, 512GB NVMe SSD Desktop', qty: 25, unit: 'units', unitPrice: 45000, total: 1125000 }
        ],
        quotations: [
            { vendor: 'TechMatrix Digital Solutions', quoteAmount: 1125000, deliveryDays: 14, warrantyYears: 3, isL1: true, notes: 'Lowest price and 3-year onsite OEM warranty' },
            { vendor: 'Dell Direct Commercial', quoteAmount: 1240000, deliveryDays: 20, warrantyYears: 3, isL1: false, notes: 'Direct OEM quotation' },
            { vendor: 'InfraTech Hardware Hub', quoteAmount: 1180000, deliveryDays: 18, warrantyYears: 2, isL1: false, notes: 'Local distributor bid' }
        ],
        approvals: [
            { tier: 'HOD', approver: 'Sandy Selva', status: 'Approved', timestamp: '2026-10-19 10:30', notes: 'Urgent for new semester lab setup' },
            { tier: 'Finance', approver: 'Account Head', status: 'Approved', timestamp: '2026-10-20 14:15', notes: 'Budget allocated under IT Capital Expenditure FY26-27' },
            { tier: 'Director', approver: 'Joint Director', status: 'Approved', timestamp: '2026-10-21 11:00', notes: 'Sanctioned under annual technology modernization' }
        ],
        grn: {
            grnNumber: 'GRN-2026-042',
            receivedDate: '2026-11-10',
            receivedQty: 25,
            acceptedQty: 25,
            rejectedQty: 0,
            status: 'Matched',
            inspector: 'Sandy Selva',
            storageLocation: 'Central IT Store - Room 102'
        }
    },
    {
        id: 'PUR-2026-0102',
        poNumber: 'PO-2026-0882',
        title: 'Annual Examination Answer Booklets & Printing Reams',
        department: 'Stationery Store',
        requestedBy: 'Priya Sundaram (Stationery Store Manager)',
        requestDate: '2026-10-22',
        estimatedCost: 185000,
        currency: 'INR',
        stage: 'DISPATCHED',
        priority: 'Urgent',
        selectedVendor: 'Apex Educational Supplies Pvt Ltd',
        vendorGstin: '07AAAAA1234A1Z5',
        paymentTerms: 'Net 30 Days',
        deliveryDueDate: '2026-11-20',
        trackingNumber: 'DTDC-7749102',
        carrierName: 'DTDC Courier',
        items: [
            { id: 'ST-PR-01', description: 'A4 Printing Paper 75 GSM (Boxes of 5 reams)', qty: 150, unit: 'boxes', unitPrice: 950, total: 142500 },
            { id: 'ST-PR-02', description: 'Institutional 32-Page Main Answer Sheets with Barcodes', qty: 5000, unit: 'copies', unitPrice: 8.5, total: 42500 }
        ],
        quotations: [
            { vendor: 'Apex Educational Supplies Pvt Ltd', quoteAmount: 185000, deliveryDays: 7, warrantyYears: 1, isL1: true, notes: 'Matched exact security barcode requirements' },
            { vendor: 'National Paper Mart', quoteAmount: 198000, deliveryDays: 10, warrantyYears: 1, isL1: false, notes: 'Higher shipping costs' }
        ],
        approvals: [
            { tier: 'HOD', approver: 'Priya Sundaram', status: 'Approved', timestamp: '2026-10-23 09:40', notes: 'Mandatory for upcoming pre-board examinations' },
            { tier: 'Finance', approver: 'Account Head', status: 'Approved', timestamp: '2026-10-24 16:20', notes: 'Approved under Examination Consumables' }
        ],
        grn: null
    },
    {
        id: 'PUR-2026-0103',
        poNumber: 'PO-2026-0883',
        title: 'Science Practical Reagents & Analytical Glassware Restock',
        department: 'Science Department',
        requestedBy: 'Dr. Anita Sen (Science HOD)',
        requestDate: '2026-10-28',
        estimatedCost: 74500,
        currency: 'INR',
        stage: 'QUOTATIONS_RECEIVED',
        priority: 'Medium',
        selectedVendor: 'ChemiScientific Instruments',
        vendorGstin: '19CCCCC9012C1Z8',
        paymentTerms: 'Net 15 Days',
        deliveryDueDate: '2026-12-05',
        trackingNumber: '',
        carrierName: '',
        items: [
            { id: 'SC-GL-01', description: 'Borosil 250ml Beakers Grade A (Pack of 12)', qty: 10, unit: 'packs', unitPrice: 2400, total: 24000 },
            { id: 'SC-RG-02', description: 'Analytical Hydrochloric Acid 37% (2.5L Winchester Bottle)', qty: 15, unit: 'bottles', unitPrice: 1100, total: 16500 },
            { id: 'SC-RG-03', description: 'Silver Nitrate Powder 99.9% AR Grade (25g)', qty: 4, unit: 'bottles', unitPrice: 8500, total: 34000 }
        ],
        quotations: [
            { vendor: 'ChemiScientific Instruments', quoteAmount: 74500, deliveryDays: 5, warrantyYears: 1, isL1: true, notes: 'Supplied certificate of chemical purity' },
            { vendor: 'Bengal Lab Reagents Corp', quoteAmount: 82000, deliveryDays: 9, warrantyYears: 1, isL1: false, notes: 'Missing Grade A certification on glassware' }
        ],
        approvals: [
            { tier: 'HOD', approver: 'Dr. Anita Sen', status: 'Approved', timestamp: '2026-10-29 11:15', notes: 'Required for Grade 11 & 12 Board Practicals' }
        ],
        grn: null
    },
    {
        id: 'PUR-2026-0104',
        poNumber: '',
        title: 'Campus Electrical Panel Spares & High-Bay LED Lights',
        department: 'Maintenance',
        requestedBy: 'R. Sundar (Maintenance Manager)',
        requestDate: '2026-11-02',
        estimatedCost: 96000,
        currency: 'INR',
        stage: 'INDENT_SUBMITTED',
        priority: 'High',
        selectedVendor: '',
        vendorGstin: '',
        paymentTerms: 'Net 30 Days',
        deliveryDueDate: '',
        trackingNumber: '',
        carrierName: '',
        items: [
            { id: 'MNT-LED-10', description: 'Industrial High-Bay LED Fixture 150W for Sports Complex', qty: 12, unit: 'units', unitPrice: 4200, total: 50400 },
            { id: 'MNT-MCB-12', description: 'Three-Phase 63A MCB Distribution Board Complete Unit', qty: 4, unit: 'sets', unitPrice: 11400, total: 45600 }
        ],
        quotations: [],
        approvals: [],
        grn: null
    }
]

let _memoryProcurements = null
let _memoryVendors = null

export function getProcurementRequests() {
    if (_memoryProcurements) return _memoryProcurements
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(PROCUREMENT_STORAGE_KEY)
            if (raw) {
                _memoryProcurements = JSON.parse(raw)
                return _memoryProcurements
            }
        }
    } catch (e) {
        console.warn('Failed to parse procurement storage, using seeds:', e)
    }
    _memoryProcurements = INITIAL_PURCHASE_REQUESTS
    return _memoryProcurements
}

export function saveProcurementRequests(requests) {
    _memoryProcurements = requests
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(PROCUREMENT_STORAGE_KEY, JSON.stringify(requests))
        }
    } catch (e) {
        console.error('Failed to save procurements to localStorage:', e)
    }
}

export function getProcurementVendors() {
    if (_memoryVendors) return _memoryVendors
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(VENDORS_STORAGE_KEY)
            if (raw) {
                _memoryVendors = JSON.parse(raw)
                return _memoryVendors
            }
        }
    } catch (e) {
        console.warn('Failed to parse vendor storage, using seeds:', e)
    }
    _memoryVendors = INITIAL_PROCUREMENT_VENDORS
    return _memoryVendors
}

export function saveProcurementVendors(vendors) {
    _memoryVendors = vendors
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(VENDORS_STORAGE_KEY, JSON.stringify(vendors))
        }
    } catch (e) {
        console.error('Failed to save vendors to localStorage:', e)
    }
}

export function createPurchaseIndent({ title, department, requestedBy, items, priority = 'Medium', notes = '' }) {
    const list = getProcurementRequests()
    const id = `PUR-2026-${String(list.length + 101).padStart(4, '0')}`
    const estimatedCost = items.reduce((sum, it) => sum + (Number(it.qty) * Number(it.unitPrice || 0)), 0)

    const newIndent = {
        id,
        poNumber: '',
        title,
        department,
        requestedBy,
        requestDate: new Date().toISOString().slice(0, 10),
        estimatedCost,
        currency: 'INR',
        stage: 'INDENT_SUBMITTED',
        priority,
        selectedVendor: '',
        vendorGstin: '',
        paymentTerms: 'Net 30 Days',
        deliveryDueDate: '',
        trackingNumber: '',
        carrierName: '',
        items: items.map((it, idx) => ({
            id: it.id || `ITEM-${idx + 1}`,
            description: it.description || it.name,
            qty: Number(it.qty),
            unit: it.unit || 'pcs',
            unitPrice: Number(it.unitPrice || 0),
            total: Number(it.qty) * Number(it.unitPrice || 0)
        })),
        quotations: [],
        approvals: [
            { tier: 'HOD', approver: requestedBy, status: 'Submitted', timestamp: new Date().toLocaleString(), notes }
        ],
        grn: null
    }

    const updated = [newIndent, ...list]
    saveProcurementRequests(updated)

    captureActivityEvent({
        eventType: 'CREATE',
        module: 'Procurement',
        action: 'CREATE_PURCHASE_INDENT',
        description: `Created Purchase Indent ${id}: ${title} for ${department} (₹${estimatedCost.toLocaleString('en-IN')})`,
        entityId: id,
        entityType: 'PurchaseIndent',
        metadata: { title, department, requestedBy, estimatedCost, itemCount: items.length },
        status: 'SUCCESS'
    })

    return newIndent
}

export function submitQuotationsForIndent(indentId, quotations, selectedVendorName = '') {
    const list = getProcurementRequests()
    const index = list.findIndex((p) => p.id === indentId)
    if (index === -1) return null

    const current = list[index]
    const updated = [...list]
    const selected = quotations.find((q) => q.isL1 || q.vendor === selectedVendorName) || quotations[0]

    updated[index] = {
        ...current,
        stage: 'QUOTATIONS_RECEIVED',
        quotations,
        selectedVendor: selected ? selected.vendor : current.selectedVendor,
        estimatedCost: selected ? selected.quoteAmount : current.estimatedCost
    }

    saveProcurementRequests(updated)

    captureActivityEvent({
        eventType: 'UPDATE',
        module: 'Procurement',
        action: 'SUBMIT_VENDOR_QUOTATIONS',
        description: `Submitted ${quotations.length} competitive quotations for ${indentId}. Recommended L1: ${selected?.vendor} (₹${selected?.quoteAmount?.toLocaleString('en-IN')})`,
        entityId: indentId,
        entityType: 'PurchaseIndent',
        metadata: { indentId, quotationCount: quotations.length, l1Vendor: selected?.vendor },
        status: 'SUCCESS'
    })

    return updated[index]
}

export function approvePurchaseWorkflow(indentId, { tier, approver, notes = '' }) {
    const list = getProcurementRequests()
    const index = list.findIndex((p) => p.id === indentId)
    if (index === -1) return null

    const current = list[index]
    const updated = [...list]

    let nextStage = current.stage
    if (tier === 'HOD') {
        nextStage = current.estimatedCost > 100000 ? 'FINANCE_APPROVED' : 'PO_ISSUED'
    } else if (tier === 'Finance') {
        nextStage = current.estimatedCost > 500000 ? 'DIRECTOR_APPROVED' : 'PO_ISSUED'
    } else if (tier === 'Director') {
        nextStage = 'PO_ISSUED'
    }

    let poNumber = current.poNumber
    if (nextStage === 'PO_ISSUED' && !poNumber) {
        poNumber = `PO-2026-${String(Math.floor(1000 + Math.random() * 9000))}`
    }

    const newApproval = {
        tier,
        approver,
        status: 'Approved',
        timestamp: new Date().toLocaleString(),
        notes
    }

    updated[index] = {
        ...current,
        stage: nextStage,
        poNumber,
        approvals: [...(current.approvals || []), newApproval]
    }

    saveProcurementRequests(updated)

    captureActivityEvent({
        eventType: 'APPROVE',
        module: 'Procurement',
        action: 'APPROVE_PURCHASE_WORKFLOW',
        description: `${tier} Approval granted for ${indentId} by ${approver}. Stage advanced to ${nextStage}${poNumber ? ` [PO: ${poNumber}]` : ''}`,
        entityId: indentId,
        entityType: 'PurchaseIndent',
        metadata: { indentId, tier, approver, nextStage, poNumber },
        status: 'SUCCESS'
    })

    return updated[index]
}

export function rejectPurchaseWorkflow(indentId, { tier, rejector, reason }) {
    const list = getProcurementRequests()
    const index = list.findIndex((p) => p.id === indentId)
    if (index === -1) return null

    const current = list[index]
    const updated = [...list]

    const newApproval = {
        tier,
        approver: rejector,
        status: 'Rejected',
        timestamp: new Date().toLocaleString(),
        notes: reason
    }

    updated[index] = {
        ...current,
        stage: 'REJECTED',
        approvals: [...(current.approvals || []), newApproval]
    }

    saveProcurementRequests(updated)

    captureActivityEvent({
        eventType: 'REJECT',
        module: 'Procurement',
        action: 'REJECT_PURCHASE_WORKFLOW',
        description: `${tier} Rejected purchase request ${indentId} by ${rejector}. Reason: ${reason}`,
        entityId: indentId,
        entityType: 'PurchaseIndent',
        metadata: { indentId, tier, rejector, reason },
        status: 'WARNING'
    })

    return updated[index]
}

export function dispatchPurchaseOrder(indentId, { carrierName, trackingNumber, deliveryDueDate }) {
    const list = getProcurementRequests()
    const index = list.findIndex((p) => p.id === indentId)
    if (index === -1) return null

    const current = list[index]
    const updated = [...list]

    updated[index] = {
        ...current,
        stage: 'DISPATCHED',
        carrierName,
        trackingNumber,
        deliveryDueDate: deliveryDueDate || current.deliveryDueDate
    }

    saveProcurementRequests(updated)

    captureActivityEvent({
        eventType: 'UPDATE',
        module: 'Procurement',
        action: 'DISPATCH_PURCHASE_ORDER',
        description: `Dispatched PO ${current.poNumber || indentId} via ${carrierName} (Tracking #${trackingNumber}). ETA: ${deliveryDueDate}`,
        entityId: indentId,
        entityType: 'PurchaseOrder',
        metadata: { indentId, poNumber: current.poNumber, carrierName, trackingNumber, deliveryDueDate },
        status: 'SUCCESS'
    })

    return updated[index]
}

export function reconcileGoodsReceipt(indentId, { grnNumber, receivedQty, acceptedQty, rejectedQty, rejectionReason, inspector, storageLocation }) {
    const list = getProcurementRequests()
    const index = list.findIndex((p) => p.id === indentId)
    if (index === -1) return null

    const current = list[index]
    const updated = [...list]

    const isFullMatch = Number(rejectedQty) === 0

    const grnRecord = {
        grnNumber: grnNumber || `GRN-2026-${String(Math.floor(100 + Math.random() * 900))}`,
        receivedDate: new Date().toISOString().slice(0, 10),
        receivedQty: Number(receivedQty),
        acceptedQty: Number(acceptedQty),
        rejectedQty: Number(rejectedQty || 0),
        rejectionReason: rejectionReason || '',
        status: isFullMatch ? 'Matched' : 'Discrepancy Logged',
        inspector,
        storageLocation: storageLocation || 'Central Receiving Dock'
    }

    updated[index] = {
        ...current,
        stage: 'GRN_VERIFIED',
        grn: grnRecord
    }

    saveProcurementRequests(updated)

    captureActivityEvent({
        eventType: 'UPDATE',
        module: 'Procurement',
        action: 'VERIFY_GRN_3_WAY_MATCH',
        description: `GRN Reconciliation completed for PO ${current.poNumber}: Received ${receivedQty}, Accepted ${acceptedQty}, Rejected ${rejectedQty}. Storage: ${storageLocation}`,
        entityId: indentId,
        entityType: 'GoodsReceiptNote',
        metadata: { indentId, poNumber: current.poNumber, grnNumber: grnRecord.grnNumber, acceptedQty, rejectedQty },
        status: isFullMatch ? 'SUCCESS' : 'WARNING'
    })

    return updated[index]
}
