/**
 * Maintenance Inventory & Spare Parts Domain Engine
 * Dedicated to:
 * - Trade-specific consumables (Electrical, Plumbing, HVAC, Hardware, IT Spares)
 * - Minimum buffer thresholds and low-stock critical warnings
 * - Inward replenishment transactions
 * - Outward stock consumption directly deducted against Work Orders (WO-2026-XXXX)
 * - Movement ledger and automated reorder triggers
 */

import { captureActivityEvent } from '../EmployeeActivityMonitoring/employeeActivityMonitoringData.js'

export const MAINTENANCE_ITEMS_KEY = 'schoolerp-maintenance-inventory-v2'
export const MAINTENANCE_MOVEMENTS_KEY = 'schoolerp-maintenance-movements-v2'

export const MAINTENANCE_CATEGORIES = [
    'All Categories',
    'Electrical & Lighting',
    'Plumbing & Sanitary',
    'HVAC & Cooling',
    'IT Spares & Cables',
    'Tools & Hardware',
    'Safety & Fire Equipment'
]

export const INITIAL_MAINTENANCE_ITEMS = [
    { id: 'MNT-ELC-001', name: 'LED Tube Light 20W (Cool White)', category: 'Electrical & Lighting', unit: 'pcs', available: 45, minimum: 20, unitCost: 180, location: 'Rack E-01', supplier: 'Philips India Ltd', lastRestocked: '2026-10-25' },
    { id: 'MNT-ELC-002', name: 'Copper Electrical Wire 2.5 sq mm (90m Roll)', category: 'Electrical & Lighting', unit: 'rolls', available: 8, minimum: 12, unitCost: 1850, location: 'Rack E-04', supplier: 'Havells India', lastRestocked: '2026-10-18' },
    { id: 'MNT-ELC-003', name: 'MCB Single Pole 16A C-Curve', category: 'Electrical & Lighting', unit: 'pcs', available: 24, minimum: 10, unitCost: 220, location: 'Rack E-02', supplier: 'Schneider Electric', lastRestocked: '2026-10-20' },
    { id: 'MNT-PLM-001', name: 'Brass Tap Spindle & Cartridge 1/2"', category: 'Plumbing & Sanitary', unit: 'pcs', available: 6, minimum: 15, unitCost: 140, location: 'Bin P-03', supplier: 'Jaquar Spares Depot', lastRestocked: '2026-10-12' },
    { id: 'MNT-PLM-002', name: 'PVC Pipe 1-Inch Heavy Duty (3m length)', category: 'Plumbing & Sanitary', unit: 'lengths', available: 18, minimum: 10, unitCost: 320, location: 'Rack P-08', supplier: 'Supreme Pipes', lastRestocked: '2026-10-22' },
    { id: 'MNT-PLM-003', name: 'Teflon Thread Seal Tape 12mm', category: 'Plumbing & Sanitary', unit: 'rolls', available: 35, minimum: 15, unitCost: 25, location: 'Bin P-01', supplier: 'Local Hardware Depot', lastRestocked: '2026-10-28' },
    { id: 'MNT-HVC-001', name: 'Split AC Air Filter Replacement Net', category: 'HVAC & Cooling', unit: 'pcs', available: 14, minimum: 8, unitCost: 280, location: 'Rack H-02', supplier: 'Daikin Authorized Service', lastRestocked: '2026-10-15' },
    { id: 'MNT-HVC-002', name: 'Capacitor 50 MFD 440V for Outdoor Unit', category: 'HVAC & Cooling', unit: 'pcs', available: 0, minimum: 5, unitCost: 450, location: 'Bin H-05', supplier: 'Epcos Electronics', lastRestocked: '2026-09-30' },
    { id: 'MNT-ITS-001', name: 'Cat6 UTP Ethernet Patch Cable (3m Molded)', category: 'IT Spares & Cables', unit: 'pcs', available: 52, minimum: 25, unitCost: 120, location: 'Rack IT-01', supplier: 'D-Link India', lastRestocked: '2026-10-27' },
    { id: 'MNT-ITS-002', name: 'HDMI 2.0 Cable 4K High Speed (5m)', category: 'IT Spares & Cables', unit: 'pcs', available: 16, minimum: 10, unitCost: 350, location: 'Rack IT-03', supplier: 'Belkin Spares', lastRestocked: '2026-10-24' },
    { id: 'MNT-ITS-003', name: 'Desktop Power Supply SMPS 450W', category: 'IT Spares & Cables', unit: 'pcs', available: 4, minimum: 6, unitCost: 1450, location: 'Rack IT-05', supplier: 'Zebronics Spares', lastRestocked: '2026-10-10' },
    { id: 'MNT-TLS-001', name: 'Digital Multimeter with Continuity Buzzer', category: 'Tools & Hardware', unit: 'sets', available: 5, minimum: 3, unitCost: 850, location: 'Tool Cabinet 1', supplier: 'Fluke Distributors', lastRestocked: '2026-09-15' },
    { id: 'MNT-TLS-002', name: 'Heavy Duty Cordless Drill Machine 18V', category: 'Tools & Hardware', unit: 'sets', available: 3, minimum: 2, unitCost: 4800, location: 'Tool Cabinet 2', supplier: 'Bosch Professional', lastRestocked: '2026-08-20' },
    { id: 'MNT-SFT-001', name: 'ABC Dry Powder Fire Extinguisher Refill 4kg', category: 'Safety & Fire Equipment', unit: 'canisters', available: 12, minimum: 8, unitCost: 1250, location: 'Safety Bay S-01', supplier: 'Ceasefire Industries', lastRestocked: '2026-10-05' }
]

export const INITIAL_MAINTENANCE_MOVEMENTS = [
    { id: 'MOV-1001', itemId: 'MNT-ELC-001', itemName: 'LED Tube Light 20W', type: 'Outward', qty: 4, refNo: 'WO-2026-089', destination: 'Block A - Floor 2 Classrooms', technician: 'R. Sundar (Electrician)', date: '2026-10-30', remarks: 'Replaced flickering tubes in Rooms 201-204' },
    { id: 'MOV-1002', itemId: 'MNT-PLM-001', itemName: 'Brass Tap Spindle 1/2"', type: 'Outward', qty: 2, refNo: 'WO-2026-077', destination: 'Kindergarten Restroom', technician: 'P. Murugan (Plumber)', date: '2026-10-29', remarks: 'Fixed leaky washbasin tap' },
    { id: 'MOV-1003', itemId: 'MNT-ITS-001', itemName: 'Cat6 UTP Patch Cable 3m', type: 'Inward', qty: 30, refNo: 'PO-2026-114', destination: 'IT Spares Rack IT-01', technician: 'Sandy Selva (IT Support)', date: '2026-10-27', remarks: 'Received fresh vendor batch from D-Link' },
    { id: 'MOV-1004', itemId: 'MNT-HVC-002', itemName: 'Capacitor 50 MFD', type: 'Outward', qty: 2, refNo: 'WO-2026-061', destination: 'Staff Room AC Outdoor Unit', technician: 'S. Rajan (HVAC Tech)', date: '2026-10-26', remarks: 'Stock depleted, reorder required' }
]

let _memoryMaintenanceItems = null
let _memoryMovements = null

export function getMaintenanceItems() {
    if (_memoryMaintenanceItems) return _memoryMaintenanceItems
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(MAINTENANCE_ITEMS_KEY)
            if (raw) {
                _memoryMaintenanceItems = JSON.parse(raw)
                return _memoryMaintenanceItems
            }
        }
    } catch (e) {
        console.warn('Failed to parse maintenance items, using seeds:', e)
    }
    _memoryMaintenanceItems = INITIAL_MAINTENANCE_ITEMS
    return _memoryMaintenanceItems
}

export function saveMaintenanceItems(items) {
    _memoryMaintenanceItems = items
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(MAINTENANCE_ITEMS_KEY, JSON.stringify(items))
        }
    } catch (e) {
        console.error('Failed to save maintenance items to localStorage:', e)
    }
}

export function getMaintenanceMovements() {
    if (_memoryMovements) return _memoryMovements
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(MAINTENANCE_MOVEMENTS_KEY)
            if (raw) {
                _memoryMovements = JSON.parse(raw)
                return _memoryMovements
            }
        }
    } catch (e) {
        console.warn('Failed to parse maintenance movements, using seeds:', e)
    }
    _memoryMovements = INITIAL_MAINTENANCE_MOVEMENTS
    return _memoryMovements
}

export function saveMaintenanceMovements(movements) {
    _memoryMovements = movements
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(MAINTENANCE_MOVEMENTS_KEY, JSON.stringify(movements))
        }
    } catch (e) {
        console.error('Failed to save maintenance movements to localStorage:', e)
    }
}

export function logStockIn({ itemId, qty, supplier, unitCost, refNo, technician, destination, remarks }) {
    const items = getMaintenanceItems()
    const itemIndex = items.findIndex((i) => i.id === itemId)
    if (itemIndex === -1) return null

    const currentItem = items[itemIndex]
    const addedQty = Number(qty)
    const newAvailable = currentItem.available + addedQty

    const updatedItems = [...items]
    updatedItems[itemIndex] = {
        ...currentItem,
        available: newAvailable,
        supplier: supplier || currentItem.supplier,
        unitCost: unitCost ? Number(unitCost) : currentItem.unitCost,
        lastRestocked: new Date().toISOString().slice(0, 10)
    }

    saveMaintenanceItems(updatedItems)

    const movements = getMaintenanceMovements()
    const movementId = `MOV-${String(movements.length + 1001)}`
    const newMovement = {
        id: movementId,
        itemId: currentItem.id,
        itemName: currentItem.name,
        type: 'Inward',
        qty: addedQty,
        refNo: refNo || `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
        destination: destination || currentItem.location,
        technician: technician || 'Store Receiving Officer',
        date: new Date().toISOString().slice(0, 10),
        remarks: remarks || `Restocked ${addedQty} ${currentItem.unit}`
    }

    saveMaintenanceMovements([newMovement, ...movements])

    captureActivityEvent({
        eventType: 'CREATE',
        module: 'MaintenanceInventory',
        action: 'LOG_STOCK_IN',
        description: `Restocked ${addedQty} ${currentItem.unit} of ${currentItem.name} (Ref: ${newMovement.refNo}). New Balance: ${newAvailable}`,
        entityId: itemId,
        entityType: 'MaintenanceSpare',
        metadata: { itemId, addedQty, newAvailable, refNo: newMovement.refNo, supplier },
        status: 'SUCCESS'
    })

    return { item: updatedItems[itemIndex], movement: newMovement }
}

export function consumeStockForWorkOrder({ itemId, qty, refNo, destination, technician, remarks }) {
    const items = getMaintenanceItems()
    const itemIndex = items.findIndex((i) => i.id === itemId)
    if (itemIndex === -1) return null

    const currentItem = items[itemIndex]
    const deductQty = Number(qty)
    const newAvailable = Math.max(0, currentItem.available - deductQty)

    const updatedItems = [...items]
    updatedItems[itemIndex] = {
        ...currentItem,
        available: newAvailable
    }

    saveMaintenanceItems(updatedItems)

    const movements = getMaintenanceMovements()
    const movementId = `MOV-${String(movements.length + 1001)}`
    const newMovement = {
        id: movementId,
        itemId: currentItem.id,
        itemName: currentItem.name,
        type: 'Outward',
        qty: deductQty,
        refNo: refNo || `WO-2026-${Math.floor(100 + Math.random() * 900)}`,
        destination: destination || 'Campus Facility',
        technician: technician || 'Maintenance Tech',
        date: new Date().toISOString().slice(0, 10),
        remarks: remarks || `Parts issued for maintenance work order`
    }

    saveMaintenanceMovements([newMovement, ...movements])

    const isLowStock = newAvailable <= currentItem.minimum
    captureActivityEvent({
        eventType: 'UPDATE',
        module: 'MaintenanceInventory',
        action: 'CONSUME_WORK_ORDER_SPARES',
        description: `Consumed ${deductQty} ${currentItem.unit} of ${currentItem.name} against ${newMovement.refNo} at ${destination}. Remaining: ${newAvailable}`,
        entityId: itemId,
        entityType: 'MaintenanceSpare',
        metadata: { itemId, deductQty, remaining: newAvailable, workOrder: newMovement.refNo, destination },
        status: isLowStock ? 'WARNING' : 'SUCCESS'
    })

    return { item: updatedItems[itemIndex], movement: newMovement }
}

export function updateStockThreshold(itemId, { newMinimum, newUnitCost, location }) {
    const items = getMaintenanceItems()
    const itemIndex = items.findIndex((i) => i.id === itemId)
    if (itemIndex === -1) return null

    const current = items[itemIndex]
    const updated = [...items]
    updated[itemIndex] = {
        ...current,
        minimum: newMinimum !== undefined ? Number(newMinimum) : current.minimum,
        unitCost: newUnitCost !== undefined ? Number(newUnitCost) : current.unitCost,
        location: location || current.location
    }

    saveMaintenanceItems(updated)

    captureActivityEvent({
        eventType: 'UPDATE',
        module: 'MaintenanceInventory',
        action: 'UPDATE_MIN_STOCK_THRESHOLD',
        description: `Updated threshold for ${current.name}: Min buffer changed from ${current.minimum} to ${updated[itemIndex].minimum}`,
        entityId: itemId,
        entityType: 'MaintenanceSpare',
        metadata: { itemId, oldMin: current.minimum, newMin: updated[itemIndex].minimum, location },
        status: 'SUCCESS'
    })

    return updated[itemIndex]
}

export function getLowStockAlertItems() {
    const items = getMaintenanceItems()
    return items.filter((item) => item.available <= item.minimum)
}
