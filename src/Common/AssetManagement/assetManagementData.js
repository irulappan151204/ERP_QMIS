/**
 * Capital & Fixed Asset Lifecycle Management Engine
 * Single Source of Truth for:
 * - Unique Asset Tagging, Serial Numbers & QR Code Identifiers
 * - Multi-Campus Room, Building & Custodian Assignment
 * - Straight-Line Depreciation & Warranty Tracking
 * - Custody Transfer Workflows & Maintenance Logs
 * - Formal Decommissioning & Disposal Auditing
 */

import { captureActivityEvent } from '../EmployeeActivityMonitoring/employeeActivityMonitoringData.js'

export const ASSET_STORAGE_KEY = 'schoolerp-capital-assets-v2'

export const ASSET_CATEGORIES = [
    'All Categories',
    'IT & Computing Hardware',
    'Laboratory Scientific Equipment',
    'Classroom Audio-Visual & Smartboards',
    'Institutional Furniture & Fixtures',
    'Campus Electrical & HVAC Plants',
    'Transportation Fleet Vehicles'
]

export const ASSET_STATUSES = [
    'Operational',
    'Under Maintenance',
    'Reserved',
    'Faulty',
    'Awaiting Disposal',
    'Disposed'
]

export const INITIAL_CAPITAL_ASSETS = [
    {
        assetId: 'AST-IT-2026-0042',
        assetName: 'Dell OptiPlex 7010 Tower Workstation (Core i7 / 16GB)',
        category: 'IT & Computing Hardware',
        serialNumber: 'DL-OPT-881920-X',
        brand: 'Dell Technologies',
        model: 'OptiPlex 7010 MT',
        department: 'IT Support',
        building: 'Science & Technology Block',
        floor: '2nd Floor',
        room: 'Computer Lab 3 (Station 14)',
        custodian: 'Sandy Selva',
        custodianId: 'EMP-IT-004',
        purchaseDate: '2025-06-15',
        purchaseCost: 62000,
        depreciationRate: 15, // percent per annum
        salvageValue: 5000,
        warrantyExpiry: '2028-06-14',
        status: 'Operational',
        condition: 'Excellent',
        transferHistory: [
            {
                date: '2025-06-20',
                fromCustodian: 'Central Receiving Dock',
                toCustodian: 'Sandy Selva',
                fromLocation: 'Receiving Dock',
                toLocation: 'Computer Lab 3 (Station 14)',
                remarks: 'Initial commissioning and network configuration',
                authorizedBy: 'IT Support Manager'
            }
        ],
        maintenanceLog: []
    },
    {
        assetId: 'AST-IT-2026-0043',
        assetName: 'Epson EB-2250U Full HD Conference Projector 5000 Lumens',
        category: 'Classroom Audio-Visual & Smartboards',
        serialNumber: 'EP-PRJ-551029-A',
        brand: 'Epson',
        model: 'EB-2250U',
        department: 'Academic Administration',
        building: 'Main Administrative Block',
        floor: '1st Floor',
        room: 'Executive Council Conference Hall',
        custodian: 'Priya Sundaram',
        custodianId: 'EMP-ADM-002',
        purchaseDate: '2024-08-10',
        purchaseCost: 88000,
        depreciationRate: 20,
        salvageValue: 8000,
        warrantyExpiry: '2026-08-09',
        status: 'Operational',
        condition: 'Good',
        transferHistory: [],
        maintenanceLog: [
            {
                date: '2026-04-12',
                workOrderRef: 'WO-2026-018',
                issueReported: 'Lamp brightness degraded',
                resolvedDate: '2026-04-14',
                cost: 6500,
                technician: 'AV Support Specialist'
            }
        ]
    },
    {
        assetId: 'AST-LAB-2026-0118',
        assetName: 'Olympus CX23 Binocular Biological Compound Microscope',
        category: 'Laboratory Scientific Equipment',
        serialNumber: 'OLY-BIO-991204',
        brand: 'Olympus',
        model: 'CX23 LED',
        department: 'Science Department',
        building: 'Science & Technology Block',
        floor: '3rd Floor',
        room: 'Senior Biology Laboratory - Bench 4',
        custodian: 'Dr. Anita Sen',
        custodianId: 'EMP-SCI-001',
        purchaseDate: '2024-11-20',
        purchaseCost: 44000,
        depreciationRate: 10,
        salvageValue: 10000,
        warrantyExpiry: '2027-11-19',
        status: 'Operational',
        condition: 'Good',
        transferHistory: [],
        maintenanceLog: []
    },
    {
        assetId: 'AST-HVC-2026-0205',
        assetName: 'Daikin 2.0 Ton Cassette Inverter Air Conditioner',
        category: 'Campus Electrical & HVAC Plants',
        serialNumber: 'DK-AC-449102-K',
        brand: 'Daikin',
        model: 'FCNQ24MV2/RNQ24MV2',
        department: 'Maintenance',
        building: 'Library Block',
        floor: 'Ground Floor',
        room: 'Central Digital Reading Room',
        custodian: 'R. Sundar',
        custodianId: 'EMP-MNT-001',
        purchaseDate: '2023-05-18',
        purchaseCost: 78000,
        depreciationRate: 15,
        salvageValue: 8000,
        warrantyExpiry: '2026-05-17',
        status: 'Under Maintenance',
        condition: 'Needs Repair',
        transferHistory: [],
        maintenanceLog: [
            {
                date: '2026-10-25',
                workOrderRef: 'WO-2026-061',
                issueReported: 'Cooling gas leakage and condenser coil vibration',
                resolvedDate: null,
                cost: 4200,
                technician: 'Daikin Authorized Tech (S. Rajan)'
            }
        ]
    },
    {
        assetId: 'AST-TRN-2026-0008',
        assetName: 'Tata Starbus 40-Seater School Bus (BS-VI Diesel)',
        category: 'Transportation Fleet Vehicles',
        serialNumber: 'TT-BUS-TN09-8821',
        brand: 'Tata Motors',
        model: 'Starbus Ultra 40S',
        department: 'Transport Department',
        building: 'Campus Transport Yard',
        floor: 'Ground Level',
        room: 'Bay 04 Parking',
        custodian: 'Transport Manager',
        custodianId: 'EMP-TRN-001',
        purchaseDate: '2023-01-10',
        purchaseCost: 2850000,
        depreciationRate: 15,
        salvageValue: 500000,
        warrantyExpiry: '2026-01-09',
        status: 'Operational',
        condition: 'Excellent',
        transferHistory: [],
        maintenanceLog: []
    }
]

let _memoryAssets = null

export function getAssets() {
    if (_memoryAssets) return _memoryAssets
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(ASSET_STORAGE_KEY)
            if (raw) {
                _memoryAssets = JSON.parse(raw)
                return _memoryAssets
            }
        }
    } catch (e) {
        console.warn('Failed to parse asset storage, using seeds:', e)
    }
    _memoryAssets = INITIAL_CAPITAL_ASSETS
    return _memoryAssets
}

export function saveAssets(assets) {
    _memoryAssets = assets
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(assets))
        }
    } catch (e) {
        console.error('Failed to save assets to localStorage:', e)
    }
}

export function calculateDepreciatedValue(asset) {
    const cost = Number(asset.purchaseCost || 0)
    const salvage = Number(asset.salvageValue || 0)
    const rate = Number(asset.depreciationRate || 15) / 100

    if (!asset.purchaseDate) return cost
    const pDate = new Date(asset.purchaseDate)
    const now = new Date()
    const yearsElapsed = Math.max(0, (now - pDate) / (1000 * 60 * 60 * 24 * 365.25))

    const depreciableBase = Math.max(0, cost - salvage)
    const totalDepreciation = Math.min(depreciableBase, depreciableBase * rate * yearsElapsed)

    return Math.max(salvage, Math.round(cost - totalDepreciation))
}

export function registerAsset(newAssetData) {
    const list = getAssets()
    const prefix = newAssetData.category?.includes('IT') ? 'AST-IT' : newAssetData.category?.includes('Lab') ? 'AST-LAB' : 'AST-GEN'
    const assetId = newAssetData.assetId || `${prefix}-2026-${String(list.length + 101).padStart(4, '0')}`

    const newRecord = {
        ...newAssetData,
        assetId,
        purchaseDate: newAssetData.purchaseDate || new Date().toISOString().slice(0, 10),
        status: newAssetData.status || 'Operational',
        condition: newAssetData.condition || 'Good',
        transferHistory: [],
        maintenanceLog: []
    }

    const updated = [newRecord, ...list]
    saveAssets(updated)

    captureActivityEvent({
        eventType: 'CREATE',
        module: 'AssetManagement',
        action: 'REGISTER_CAPITAL_ASSET',
        description: `Registered Capital Asset ${assetId}: ${newRecord.assetName} (${newRecord.category}) at ${newRecord.room}`,
        entityId: assetId,
        entityType: 'CapitalAsset',
        metadata: { assetId, name: newRecord.assetName, cost: newRecord.purchaseCost, custodian: newRecord.custodian },
        status: 'SUCCESS'
    })

    return newRecord
}

export function transferAssetCustody(assetId, { newCustodian, newCustodianId, newDepartment, newLocation, remarks, authorizedBy }) {
    const list = getAssets()
    const index = list.findIndex((a) => a.assetId === assetId)
    if (index === -1) return null

    const current = list[index]
    const updated = [...list]

    const transferEntry = {
        date: new Date().toISOString().slice(0, 10),
        fromCustodian: current.custodian,
        toCustodian: newCustodian,
        fromLocation: `${current.building || ''} - ${current.room || ''}`,
        toLocation: newLocation,
        remarks,
        authorizedBy
    }

    updated[index] = {
        ...current,
        custodian: newCustodian,
        custodianId: newCustodianId || current.custodianId,
        department: newDepartment || current.department,
        room: newLocation,
        transferHistory: [transferEntry, ...(current.transferHistory || [])]
    }

    saveAssets(updated)

    captureActivityEvent({
        eventType: 'UPDATE',
        module: 'AssetManagement',
        action: 'TRANSFER_ASSET_CUSTODY',
        description: `Transferred Asset ${assetId} (${current.assetName}) from ${current.custodian} to ${newCustodian} (${newLocation})`,
        entityId: assetId,
        entityType: 'CapitalAsset',
        metadata: { assetId, from: current.custodian, to: newCustodian, newLocation, authorizedBy },
        status: 'SUCCESS'
    })

    return updated[index]
}

export function dispatchAssetToMaintenance(assetId, { workOrderRef, issueReported, technician }) {
    const list = getAssets()
    const index = list.findIndex((a) => a.assetId === assetId)
    if (index === -1) return null

    const current = list[index]
    const updated = [...list]

    const entry = {
        date: new Date().toISOString().slice(0, 10),
        workOrderRef: workOrderRef || `WO-2026-${Math.floor(100 + Math.random() * 900)}`,
        issueReported,
        resolvedDate: null,
        cost: 0,
        technician: technician || 'Internal Support Team'
    }

    updated[index] = {
        ...current,
        status: 'Under Maintenance',
        condition: 'Under Repair',
        maintenanceLog: [entry, ...(current.maintenanceLog || [])]
    }

    saveAssets(updated)

    captureActivityEvent({
        eventType: 'UPDATE',
        module: 'AssetManagement',
        action: 'DISPATCH_ASSET_MAINTENANCE',
        description: `Dispatched Asset ${assetId} to maintenance under ${entry.workOrderRef}. Issue: ${issueReported}`,
        entityId: assetId,
        entityType: 'CapitalAsset',
        metadata: { assetId, workOrderRef: entry.workOrderRef, technician },
        status: 'WARNING'
    })

    return updated[index]
}

export function resolveAssetMaintenance(assetId, { resolutionNotes, cost = 0 }) {
    const list = getAssets()
    const index = list.findIndex((a) => a.assetId === assetId)
    if (index === -1) return null

    const current = list[index]
    const updated = [...list]

    const log = [...(current.maintenanceLog || [])]
    if (log.length > 0) {
        log[0] = {
            ...log[0],
            resolvedDate: new Date().toISOString().slice(0, 10),
            resolutionNotes,
            cost: Number(cost)
        }
    }

    updated[index] = {
        ...current,
        status: 'Operational',
        condition: 'Good',
        maintenanceLog: log
    }

    saveAssets(updated)

    captureActivityEvent({
        eventType: 'UPDATE',
        module: 'AssetManagement',
        action: 'RESOLVE_ASSET_MAINTENANCE',
        description: `Resolved maintenance for Asset ${assetId}. Asset marked Operational. Repair Cost: ₹${cost}`,
        entityId: assetId,
        entityType: 'CapitalAsset',
        metadata: { assetId, cost, resolutionNotes },
        status: 'SUCCESS'
    })

    return updated[index]
}

export function disposeAsset(assetId, { scrapValue, disposalMethod, approvedBy, remarks }) {
    const list = getAssets()
    const index = list.findIndex((a) => a.assetId === assetId)
    if (index === -1) return null

    const current = list[index]
    const updated = [...list]

    updated[index] = {
        ...current,
        status: 'Disposed',
        condition: 'Decommissioned',
        disposalInfo: {
            date: new Date().toISOString().slice(0, 10),
            scrapValue: Number(scrapValue || 0),
            disposalMethod: disposalMethod || 'E-Waste Certified Recycler',
            approvedBy,
            remarks
        }
    }

    saveAssets(updated)

    captureActivityEvent({
        eventType: 'DELETE',
        module: 'AssetManagement',
        action: 'DISPOSE_CAPITAL_ASSET',
        description: `Decommissioned & Disposed Asset ${assetId} (${current.assetName}). Scrap recovery: ₹${scrapValue || 0}. Approved by: ${approvedBy}`,
        entityId: assetId,
        entityType: 'CapitalAsset',
        metadata: { assetId, scrapValue, disposalMethod, approvedBy },
        status: 'WARNING'
    })

    return updated[index]
}
