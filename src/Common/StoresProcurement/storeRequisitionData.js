/**
 * Internal Store Requisitions & Inventory Issue Data Engine
 * Single Source of Truth for:
 * - Internal campus stock catalog (live availability, bins, minimum thresholds)
 * - Faculty and department material requisition cart
 * - HOD endorsement workflow
 * - Storekeeper issue slips (ISS-2026-XXXX) & physical stock decrement
 * - Collection verification
 */

import { captureActivityEvent } from '../EmployeeActivityMonitoring/employeeActivityMonitoringData.js'

export const STORE_CATALOG_KEY = 'schoolerp-store-catalog-v2'
export const STORE_REQUISITIONS_KEY = 'schoolerp-internal-requisitions-v2'

export const STORE_CATEGORIES = [
    'All Categories',
    'Stationery & Office Supplies',
    'Classroom & Teaching Aids',
    'Paper & Printing Materials',
    'Science Lab Reagents & Glassware',
    'Housekeeping & Sanitation Chemicals',
    'IT Cables & Peripheral Accessories'
]

export const INITIAL_STORE_ITEMS = [
    { id: 'CAT-ST-001', name: 'Whiteboard Marker Pens (Pack of 4 Assorted)', category: 'Stationery & Office Supplies', unit: 'packs', inStock: 120, lowStockThreshold: 30, bin: 'Shelf A-01', unitCost: 140 },
    { id: 'CAT-ST-002', name: 'A4 Copier Paper 75 GSM (Ream of 500 Sheets)', category: 'Paper & Printing Materials', unit: 'reams', inStock: 340, lowStockThreshold: 50, bin: 'Rack P-02', unitCost: 280 },
    { id: 'CAT-ST-003', name: 'Pre-printed Examination Answer Sheets (32 Pages)', category: 'Paper & Printing Materials', unit: 'copies', inStock: 4800, lowStockThreshold: 1000, bin: 'Bay P-05', unitCost: 9 },
    { id: 'CAT-ST-004', name: 'Stapler Heavy Duty No. 10 with Pins', category: 'Stationery & Office Supplies', unit: 'sets', inStock: 45, lowStockThreshold: 15, bin: 'Shelf A-04', unitCost: 190 },
    { id: 'CAT-LB-001', name: 'Test Tubes Borosilicate 15x125mm (Box of 100)', category: 'Science Lab Reagents & Glassware', unit: 'boxes', inStock: 28, lowStockThreshold: 10, bin: 'Lab Cabinet L-01', unitCost: 850 },
    { id: 'CAT-LB-002', name: 'Hydrochloric Acid Dilute 1N (5 Litre Jar)', category: 'Science Lab Reagents & Glassware', unit: 'jars', inStock: 14, lowStockThreshold: 5, bin: 'Chem Storage L-04', unitCost: 650 },
    { id: 'CAT-LB-003', name: 'Litmus Paper Strips Blue & Red (Pack of 100)', category: 'Science Lab Reagents & Glassware', unit: 'packs', inStock: 65, lowStockThreshold: 20, bin: 'Shelf L-02', unitCost: 85 },
    { id: 'CAT-HK-001', name: 'Floor Disinfectant Concentrate (5L Can)', category: 'Housekeeping & Sanitation Chemicals', unit: 'cans', inStock: 38, lowStockThreshold: 12, bin: 'HK Bay H-01', unitCost: 480 },
    { id: 'CAT-HK-002', name: 'Microfiber Floor Cleaning Mop Heads', category: 'Housekeeping & Sanitation Chemicals', unit: 'pcs', inStock: 75, lowStockThreshold: 25, bin: 'HK Bay H-03', unitCost: 120 },
    { id: 'CAT-HK-003', name: 'Liquid Hand Wash Soap Refill 5L', category: 'Housekeeping & Sanitation Chemicals', unit: 'cans', inStock: 22, lowStockThreshold: 10, bin: 'HK Bay H-02', unitCost: 390 },
    { id: 'CAT-IT-001', name: 'Cat6 Ethernet Patch Cord 3-Meter Molded', category: 'IT Cables & Peripheral Accessories', unit: 'pcs', inStock: 54, lowStockThreshold: 20, bin: 'IT Rack C-01', unitCost: 130 },
    { id: 'CAT-IT-002', name: 'Wireless Optical Mouse USB', category: 'IT Cables & Peripheral Accessories', unit: 'pcs', inStock: 18, lowStockThreshold: 10, bin: 'IT Rack C-03', unitCost: 350 },
    { id: 'CAT-IT-003', name: 'HDMI to VGA Display Adapter Cable', category: 'IT Cables & Peripheral Accessories', unit: 'pcs', inStock: 8, lowStockThreshold: 10, bin: 'IT Rack C-02', unitCost: 450 }
]

export const INITIAL_STORE_REQUISITIONS = [
    {
        id: 'REQ-2026-0401',
        issueSlipNumber: 'ISS-2026-0312',
        requestDate: '2026-10-29',
        requestedBy: 'Sandy Selva',
        requestingRole: 'it-support-manager',
        department: 'IT Support',
        purpose: 'Cabling upgrades for High School Computer Lab 2',
        priority: 'High',
        status: 'COLLECTED',
        stageIndex: 4, // 0: SUBMITTED, 1: HOD_ENDORSED, 2: STORE_ALLOCATED, 3: READY_FOR_COLLECTION, 4: COLLECTED
        items: [
            { id: 'CAT-IT-001', name: 'Cat6 Ethernet Patch Cord 3-Meter', requestedQty: 12, issuedQty: 12, unit: 'pcs' },
            { id: 'CAT-IT-002', name: 'Wireless Optical Mouse USB', requestedQty: 4, issuedQty: 4, unit: 'pcs' }
        ],
        hodEndorsement: { endorser: 'Sandy Selva (HOD)', status: 'Approved', timestamp: '2026-10-29 11:00', notes: 'Verified lab requirement' },
        storeIssue: { issuedBy: 'Priya Sundaram (Storekeeper)', issueSlipNumber: 'ISS-2026-0312', timestamp: '2026-10-29 15:30', notes: 'Issued from Shelf IT Rack C-01' },
        collectedBy: 'Sandy Selva',
        collectedTimestamp: '2026-10-30 09:15'
    },
    {
        id: 'REQ-2026-0402',
        issueSlipNumber: 'ISS-2026-0318',
        requestDate: '2026-11-01',
        requestedBy: 'R. Sundar',
        requestingRole: 'maintenance-manager',
        department: 'Maintenance',
        purpose: 'Restroom sanitation replenishment and weekly deep clean',
        priority: 'Routine',
        status: 'READY_FOR_COLLECTION',
        stageIndex: 3,
        items: [
            { id: 'CAT-HK-001', name: 'Floor Disinfectant Concentrate (5L Can)', requestedQty: 4, issuedQty: 4, unit: 'cans' },
            { id: 'CAT-HK-003', name: 'Liquid Hand Wash Soap Refill 5L', requestedQty: 3, issuedQty: 3, unit: 'cans' },
            { id: 'CAT-HK-002', name: 'Microfiber Floor Cleaning Mop Heads', requestedQty: 10, issuedQty: 10, unit: 'pcs' }
        ],
        hodEndorsement: { endorser: 'R. Sundar (Maintenance Head)', status: 'Approved', timestamp: '2026-11-01 09:30', notes: 'Scheduled weekly sanitization' },
        storeIssue: { issuedBy: 'Priya Sundaram (Storekeeper)', issueSlipNumber: 'ISS-2026-0318', timestamp: '2026-11-01 14:00', notes: 'Packaged at Store Counter B' },
        collectedBy: null,
        collectedTimestamp: null
    },
    {
        id: 'REQ-2026-0403',
        issueSlipNumber: '',
        requestDate: '2026-11-03',
        requestedBy: 'Kavita Menon',
        requestingRole: 'teacher',
        department: 'Academic - Mathematics',
        purpose: 'Grade 10 Model Test answer sheets and geometry stationery',
        priority: 'High',
        status: 'HOD_ENDORSED',
        stageIndex: 1,
        items: [
            { id: 'CAT-ST-003', name: 'Pre-printed Examination Answer Sheets (32 Pages)', requestedQty: 250, issuedQty: 0, unit: 'copies' },
            { id: 'CAT-ST-001', name: 'Whiteboard Marker Pens (Pack of 4)', requestedQty: 3, issuedQty: 0, unit: 'packs' }
        ],
        hodEndorsement: { endorser: 'Academic Coordinator', status: 'Approved', timestamp: '2026-11-03 14:20', notes: 'Approved for Term 1 Model Exams' },
        storeIssue: null,
        collectedBy: null,
        collectedTimestamp: null
    },
    {
        id: 'REQ-2026-0404',
        issueSlipNumber: '',
        requestDate: '2026-11-04',
        requestedBy: 'Dr. Anita Sen',
        requestingRole: 'teacher',
        department: 'Academic - Science',
        purpose: 'Chemistry laboratory titration practical sessions',
        priority: 'Routine',
        status: 'SUBMITTED',
        stageIndex: 0,
        items: [
            { id: 'CAT-LB-001', name: 'Test Tubes Borosilicate (Box of 100)', requestedQty: 2, issuedQty: 0, unit: 'boxes' },
            { id: 'CAT-LB-002', name: 'Hydrochloric Acid Dilute 1N (5 Litre Jar)', requestedQty: 1, issuedQty: 0, unit: 'jars' },
            { id: 'CAT-LB-003', name: 'Litmus Paper Strips (Pack of 100)', requestedQty: 5, issuedQty: 0, unit: 'packs' }
        ],
        hodEndorsement: null,
        storeIssue: null,
        collectedBy: null,
        collectedTimestamp: null
    }
]

let _memoryCatalog = null
let _memoryRequisitions = null

export function getStoreCatalog() {
    if (_memoryCatalog) return _memoryCatalog
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(STORE_CATALOG_KEY)
            if (raw) {
                _memoryCatalog = JSON.parse(raw)
                return _memoryCatalog
            }
        }
    } catch (e) {
        console.warn('Failed to parse store catalog, using seeds:', e)
    }
    _memoryCatalog = INITIAL_STORE_ITEMS
    return _memoryCatalog
}

export function saveStoreCatalog(items) {
    _memoryCatalog = items
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORE_CATALOG_KEY, JSON.stringify(items))
        }
    } catch (e) {
        console.error('Failed to save store catalog to localStorage:', e)
    }
}

export function getStoreRequisitions() {
    if (_memoryRequisitions) return _memoryRequisitions
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(STORE_REQUISITIONS_KEY)
            if (raw) {
                _memoryRequisitions = JSON.parse(raw)
                return _memoryRequisitions
            }
        }
    } catch (e) {
        console.warn('Failed to parse store requisitions, using seeds:', e)
    }
    _memoryRequisitions = INITIAL_STORE_REQUISITIONS
    return _memoryRequisitions
}

export function saveStoreRequisitions(reqs) {
    _memoryRequisitions = reqs
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORE_REQUISITIONS_KEY, JSON.stringify(reqs))
        }
    } catch (e) {
        console.error('Failed to save store requisitions to localStorage:', e)
    }
}

export function submitStoreRequisition({ requestedBy, requestingRole = 'employee', department, items, purpose, priority = 'Routine' }) {
    const list = getStoreRequisitions()
    const id = `REQ-2026-${String(list.length + 401).padStart(4, '0')}`

    const newReq = {
        id,
        issueSlipNumber: '',
        requestDate: new Date().toISOString().slice(0, 10),
        requestedBy,
        requestingRole,
        department,
        purpose,
        priority,
        status: 'SUBMITTED',
        stageIndex: 0,
        items: items.map((it) => ({
            id: it.id,
            name: it.name,
            requestedQty: Number(it.requestedQty || it.quantity || 1),
            issuedQty: 0,
            unit: it.unit || 'pcs'
        })),
        hodEndorsement: null,
        storeIssue: null,
        collectedBy: null,
        collectedTimestamp: null
    }

    const updated = [newReq, ...list]
    saveStoreRequisitions(updated)

    captureActivityEvent({
        eventType: 'CREATE',
        module: 'StoreRequisition',
        action: 'SUBMIT_STORE_REQUISITION',
        description: `Submitted Store Requisition ${id} for ${department} (${items.length} items, Purpose: ${purpose})`,
        entityId: id,
        entityType: 'StoreRequisition',
        metadata: { id, requestedBy, department, priority, itemCount: items.length },
        status: 'SUCCESS'
    })

    return newReq
}

export function endorseStoreRequisition(requisitionId, { endorser, status = 'Approved', notes = '' }) {
    const list = getStoreRequisitions()
    const index = list.findIndex((r) => r.id === requisitionId)
    if (index === -1) return null

    const current = list[index]
    const updated = [...list]

    const isApproved = status === 'Approved'

    updated[index] = {
        ...current,
        status: isApproved ? 'HOD_ENDORSED' : 'REJECTED',
        stageIndex: isApproved ? 1 : 0,
        hodEndorsement: {
            endorser,
            status,
            timestamp: new Date().toLocaleString(),
            notes
        }
    }

    saveStoreRequisitions(updated)

    captureActivityEvent({
        eventType: isApproved ? 'APPROVE' : 'REJECT',
        module: 'StoreRequisition',
        action: isApproved ? 'ENDORSE_STORE_REQUISITION' : 'REJECT_STORE_REQUISITION',
        description: `HOD ${endorser} ${isApproved ? 'Endorsed' : 'Rejected'} requisition ${requisitionId}. Notes: ${notes}`,
        entityId: requisitionId,
        entityType: 'StoreRequisition',
        metadata: { requisitionId, endorser, status, notes },
        status: isApproved ? 'SUCCESS' : 'WARNING'
    })

    return updated[index]
}

export function issueStoreItems(requisitionId, { issuedBy, itemAllocations, remarks = '' }) {
    const list = getStoreRequisitions()
    const index = list.findIndex((r) => r.id === requisitionId)
    if (index === -1) return null

    const current = list[index]
    const updated = [...list]
    const catalog = getStoreCatalog()
    const updatedCatalog = [...catalog]

    const issueSlipNumber = current.issueSlipNumber || `ISS-2026-${String(Math.floor(1000 + Math.random() * 9000))}`

    // Update issued quantities and decrement stock from catalog
    const updatedItems = current.items.map((it) => {
        const alloc = itemAllocations ? itemAllocations.find((a) => a.id === it.id) : null
        const qtyToIssue = alloc !== undefined && alloc !== null ? Number(alloc.issuedQty) : it.requestedQty

        // Decrement from catalog
        const catIdx = updatedCatalog.findIndex((c) => c.id === it.id)
        if (catIdx !== -1) {
            updatedCatalog[catIdx] = {
                ...updatedCatalog[catIdx],
                inStock: Math.max(0, updatedCatalog[catIdx].inStock - qtyToIssue)
            }
        }

        return {
            ...it,
            issuedQty: qtyToIssue
        }
    })

    saveStoreCatalog(updatedCatalog)

    updated[index] = {
        ...current,
        issueSlipNumber,
        status: 'READY_FOR_COLLECTION',
        stageIndex: 3,
        items: updatedItems,
        storeIssue: {
            issuedBy,
            issueSlipNumber,
            timestamp: new Date().toLocaleString(),
            notes: remarks
        }
    }

    saveStoreRequisitions(updated)

    captureActivityEvent({
        eventType: 'UPDATE',
        module: 'StoreRequisition',
        action: 'ISSUE_STORE_ITEMS',
        description: `Generated Store Issue Slip ${issueSlipNumber} for ${requisitionId} by ${issuedBy}. Stock decremented from shelf.`,
        entityId: requisitionId,
        entityType: 'StoreIssueSlip',
        metadata: { requisitionId, issueSlipNumber, issuedBy, itemCount: updatedItems.length },
        status: 'SUCCESS'
    })

    return updated[index]
}

export function acknowledgeStoreCollection(requisitionId, { collectorName }) {
    const list = getStoreRequisitions()
    const index = list.findIndex((r) => r.id === requisitionId)
    if (index === -1) return null

    const current = list[index]
    const updated = [...list]

    updated[index] = {
        ...current,
        status: 'COLLECTED',
        stageIndex: 4,
        collectedBy: collectorName || current.requestedBy,
        collectedTimestamp: new Date().toLocaleString()
    }

    saveStoreRequisitions(updated)

    captureActivityEvent({
        eventType: 'UPDATE',
        module: 'StoreRequisition',
        action: 'COLLECT_STORE_ITEMS',
        description: `Material Requisition ${requisitionId} (Slip: ${current.issueSlipNumber}) successfully collected by ${collectorName || current.requestedBy}.`,
        entityId: requisitionId,
        entityType: 'StoreRequisition',
        metadata: { requisitionId, issueSlipNumber: current.issueSlipNumber, collectedBy: collectorName },
        status: 'SUCCESS'
    })

    return updated[index]
}
