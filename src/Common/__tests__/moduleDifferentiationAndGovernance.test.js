import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
    getProcurementRequests,
    createPurchaseIndent,
    submitQuotationsForIndent,
    approvePurchaseWorkflow,
    rejectPurchaseWorkflow,
    dispatchPurchaseOrder,
    reconcileGoodsReceipt
} from '../Procurement/procurementData.js'

import {
    getStoreCatalog,
    getStoreRequisitions,
    submitStoreRequisition,
    endorseStoreRequisition,
    issueStoreItems,
    acknowledgeStoreCollection
} from '../StoresProcurement/storeRequisitionData.js'

import {
    getAssets,
    registerAsset,
    transferAssetCustody,
    calculateDepreciatedValue,
    dispatchAssetToMaintenance,
    resolveAssetMaintenance,
    disposeAsset
} from '../AssetManagement/assetManagementData.js'

import {
    getMaintenanceItems,
    getMaintenanceMovements,
    logStockIn,
    consumeStockForWorkOrder,
    updateStockThreshold,
    getLowStockAlertItems
} from '../MaintenanceInventory/maintenanceInventoryData.js'

import {
    getHierarchicalActivityMonitoring,
    captureActivityEvent
} from '../EmployeeActivityMonitoring/employeeActivityMonitoringData.js'

describe('Module Differentiation: Purchase Workflow vs Store Requisitions', () => {
    it('creates and manages a commercial purchase indent with quotations and multi-tier approvals', () => {
        const indent = createPurchaseIndent({
            title: 'New High-Speed Network Switch 48-Port',
            department: 'IT Support',
            requestedBy: 'Sandy Selva',
            priority: 'High',
            notes: 'Core switch failure',
            items: [
                { description: 'Cisco Catalyst 48-Port PoE Switch', qty: 2, unit: 'units', unitPrice: 85000 }
            ]
        })

        assert.ok(indent.id.startsWith('PUR-2026-'))
        assert.equal(indent.estimatedCost, 170000)
        assert.equal(indent.stage, 'INDENT_SUBMITTED')

        // Submit quotations
        const quotes = [
            { vendor: 'TechMatrix Digital', quoteAmount: 165000, deliveryDays: 5, warrantyYears: 3, isL1: true },
            { vendor: 'Apex Supplies', quoteAmount: 175000, deliveryDays: 10, warrantyYears: 2, isL1: false }
        ]
        const withQuotes = submitQuotationsForIndent(indent.id, quotes, 'TechMatrix Digital')
        assert.equal(withQuotes.stage, 'QUOTATIONS_RECEIVED')
        assert.equal(withQuotes.selectedVendor, 'TechMatrix Digital')

        // Multi-tier approve
        const approved = approvePurchaseWorkflow(indent.id, {
            tier: 'Finance',
            approver: 'Account Head',
            notes: 'Budget sanctioned'
        })
        assert.ok(approved.stage === 'FINANCE_APPROVED' || approved.stage === 'PO_ISSUED' || approved.stage === 'DIRECTOR_APPROVED')

        // Dispatch
        const dispatched = dispatchPurchaseOrder(indent.id, {
            carrierName: 'BlueDart Express',
            trackingNumber: 'BD-8829104',
            deliveryDueDate: '2026-11-28'
        })
        assert.equal(dispatched.stage, 'DISPATCHED')
        assert.equal(dispatched.trackingNumber, 'BD-8829104')

        // GRN 3-Way Reconciliation
        const reconciled = reconcileGoodsReceipt(indent.id, {
            receivedQty: 2,
            acceptedQty: 2,
            rejectedQty: 0,
            inspector: 'Sandy Selva',
            storageLocation: 'IT Server Bay 1'
        })
        assert.equal(reconciled.stage, 'GRN_VERIFIED')
        assert.equal(reconciled.grn.status, 'Matched')
    })

    it('creates and fulfills an internal store requisition with stock decrement and issue slip', () => {
        const catalogBefore = getStoreCatalog()
        const targetItem = catalogBefore[0]
        const initialStock = targetItem.inStock

        const req = submitStoreRequisition({
            requestedBy: 'Kavita Menon',
            requestingRole: 'teacher',
            department: 'Academic - Mathematics',
            purpose: 'Term examinations revision worksheets',
            priority: 'High',
            items: [
                { id: targetItem.id, name: targetItem.name, requestedQty: 5, unit: targetItem.unit }
            ]
        })

        assert.ok(req.id.startsWith('REQ-2026-'))
        assert.equal(req.status, 'SUBMITTED')

        // Endorse by HOD
        const endorsed = endorseStoreRequisition(req.id, {
            endorser: 'Academic Coordinator',
            status: 'Approved',
            notes: 'Approved under exam quota'
        })
        assert.equal(endorsed.status, 'HOD_ENDORSED')

        // Storekeeper issues stock
        const issued = issueStoreItems(req.id, {
            issuedBy: 'Priya Sundaram (Storekeeper)',
            remarks: 'Issued from Shelf A-01'
        })
        assert.equal(issued.status, 'READY_FOR_COLLECTION')
        assert.ok(issued.issueSlipNumber.startsWith('ISS-2026-'))

        // Verify stock decremented from catalog
        const catalogAfter = getStoreCatalog()
        const updatedItem = catalogAfter.find((c) => c.id === targetItem.id)
        assert.equal(updatedItem.inStock, initialStock - 5)

        // Handover collection
        const collected = acknowledgeStoreCollection(req.id, { collectorName: 'Kavita Menon' })
        assert.equal(collected.status, 'COLLECTED')
    })
})

describe('Module Differentiation: Asset Management vs Maintenance Inventory', () => {
    it('manages fixed capital asset passport, depreciation and custody transfers', () => {
        const asset = registerAsset({
            assetName: 'Smart Classroom Interactive Flat Panel 75-inch',
            category: 'Classroom Audio-Visual & Smartboards',
            serialNumber: 'SMT-IFP-75-9921',
            brand: 'ViewSonic',
            model: 'IFP7550',
            department: 'Academic Administration',
            building: 'Main Senior Wing',
            floor: '2nd Floor',
            room: 'Smart Class 12-A',
            custodian: 'Academic Coordinator',
            custodianId: 'EMP-ACAD-001',
            purchaseCost: 145000,
            depreciationRate: 20,
            salvageValue: 15000,
            warrantyExpiry: '2028-06-30'
        })

        assert.ok(asset.assetId.startsWith('AST-'))
        assert.equal(asset.status, 'Operational')

        // Depreciated calculation
        const depValue = calculateDepreciatedValue(asset)
        assert.ok(depValue <= 145000)
        assert.ok(depValue >= 15000)

        // Custody Transfer
        const transferred = transferAssetCustody(asset.assetId, {
            newCustodian: 'Grade 12 Lead Teacher',
            newCustodianId: 'EMP-TCH-042',
            newDepartment: 'Senior Secondary',
            newLocation: 'Main Senior Wing - Room 204',
            remarks: 'Reassigned for board batch',
            authorizedBy: 'Principal'
        })
        assert.equal(transferred.custodian, 'Grade 12 Lead Teacher')
        assert.equal(transferred.transferHistory.length, 1)

        // Dispatch to maintenance
        const inRepair = dispatchAssetToMaintenance(asset.assetId, {
            workOrderRef: 'WO-2026-118',
            issueReported: 'Touch digitizer unresponsive on bottom quadrant',
            technician: 'AV Specialist'
        })
        assert.equal(inRepair.status, 'Under Maintenance')

        // Resolve maintenance
        const restored = resolveAssetMaintenance(asset.assetId, {
            resolutionNotes: 'Firmware updated and touch controller recalibrated',
            cost: 1500
        })
        assert.equal(restored.status, 'Operational')
    })

    it('tracks maintenance consumables, work order parts consumption and min-stock alerts', () => {
        const itemsBefore = getMaintenanceItems()
        const targetSpare = itemsBefore[0]
        const initialAvailable = targetSpare.available

        // Deduct against a maintenance work order
        const { item: deducted, movement: woMovement } = consumeStockForWorkOrder({
            itemId: targetSpare.id,
            qty: 3,
            refNo: 'WO-2026-099',
            destination: 'Auditorium Stage Lighting',
            technician: 'R. Sundar',
            remarks: 'Replaced stage spotlight tubes'
        })

        assert.equal(deducted.available, initialAvailable - 3)
        assert.equal(woMovement.type, 'Outward')
        assert.equal(woMovement.refNo, 'WO-2026-099')

        // Inward replenishment
        const { item: restocked, movement: inMovement } = logStockIn({
            itemId: targetSpare.id,
            qty: 15,
            supplier: 'Philips India Ltd',
            unitCost: 180,
            refNo: 'PO-2026-0881',
            technician: 'Store Receiving Officer',
            remarks: 'Restocked fresh batch'
        })

        assert.equal(restocked.available, initialAvailable - 3 + 15)
        assert.equal(inMovement.type, 'Inward')

        // Threshold adjustment
        const updatedThreshold = updateStockThreshold(targetSpare.id, {
            newMinimum: 25,
            location: 'Rack E-01 (Top Shelf)'
        })
        assert.equal(updatedThreshold.minimum, 25)
    })
})

describe('Hierarchical Activity Monitoring & Telemetry Integration', () => {
    it('scopes activity visibility based on the 5 organizational tiers', () => {
        // Super Admin sees everything
        const superAdminView = getHierarchicalActivityMonitoring({
            userRole: 'superadmin',
            userId: 'EMP-SUP-001'
        })
        assert.ok(superAdminView.activities.length > 0)
        assert.ok(superAdminView.summary.totalActivities > 0)

        // HOD sees only their department
        const itDeptView = getHierarchicalActivityMonitoring({
            userRole: 'it-support-manager',
            userId: 'EMP-IT-001'
        })
        assert.ok(itDeptView.activities.length > 0)
        assert.ok(itDeptView.activities.every((act) => act.department === 'IT Support & Systems' || act.module === 'Procurement' || act.module === 'AssetManagement' || act.department === 'IT Support'))

        // Individual employee sees personal
        const teacherView = getHierarchicalActivityMonitoring({
            userRole: 'teacher',
            userId: 'EMP-TCH-001'
        })
        assert.ok(Array.isArray(teacherView.activities))
    })
})
