export const REQUEST_STATUSES = ['In-Process', 'Pending', 'Approved', 'Rejected', 'Completed']

export const ISSUE_TYPES = [
    'Engine Issue',
    'Brake Failure',
    'AC Not Working',
    'Tyre Puncture',
    'Electrical Fault',
    'Oil Leak',
    'Battery Issue',
    'Periodic Service / Overhaul',
    'Clutch Plate Replacement',
]

export const PRIORITIES = ['High', 'Medium', 'Low']

export const statusBadgeColor = {
    'In-Process': 'bg-[#2196F333] text-[#2196F3]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
}

export const INITIAL_MAINTENANCE_REQUESTS = [
    {
        id: 'MR-1001',
        requestId: 'MR-1001',
        type: 'Maintenance',
        vehicleNumber: 'TN-09-AB-4521',
        reportedBy: 'Sandy Selva',
        driverName: 'Sandy Selva',
        requestDate: '08-06-2026',
        issueType: 'AC Not Working',
        description: 'AC cooling weak during morning route; needs inspection before summer peak.',
        priority: 'High',
        status: 'In-Process',
        estimatedCost: 12500,
        workshop: 'Apex Auto Cool Services',
        approverRemarks: 'Work order sanctioned. Inspection scheduled.',
        approvedBy: 'Transport Manager',
        approvedAt: '08-06-2026 11:30 AM',
    },
    {
        id: 'MR-1002',
        requestId: 'MR-1002',
        type: 'Maintenance',
        vehicleNumber: 'TN-09-CD-8834',
        reportedBy: 'Rajesh K. Kumar',
        driverName: 'Rajesh K. Kumar',
        requestDate: '07-06-2026',
        issueType: 'Brake Failure',
        description: 'Rear brake pads worn out; squeaking noise reported on downhill stops.',
        priority: 'High',
        status: 'Pending',
        estimatedCost: 8400,
        workshop: 'City Brake & Clutch Hub',
    },
    {
        id: 'MR-1003',
        requestId: 'MR-1003',
        type: 'Maintenance',
        vehicleNumber: 'TN-09-EF-2210',
        reportedBy: 'Priya M. Venkatesh',
        driverName: 'Priya M. Venkatesh',
        requestDate: '05-06-2026',
        issueType: 'Tyre Puncture',
        description: 'Front-left tyre puncture near school gate; temporary fix applied.',
        priority: 'Medium',
        status: 'Completed',
        estimatedCost: 1500,
        workshop: 'Universal Tyres & Alignment',
        approverRemarks: 'New tube replaced and aligned.',
        approvedBy: 'Transport Manager',
        approvedAt: '05-06-2026 02:15 PM',
    },
    {
        id: 'MR-1004',
        requestId: 'MR-1004',
        type: 'Maintenance',
        vehicleNumber: 'TN-09-GH-5567',
        reportedBy: 'Mohan R. Das',
        driverName: 'Mohan R. Das',
        requestDate: '09-06-2026',
        issueType: 'Engine Issue',
        description: 'Engine overheating warning light during afternoon return trip.',
        priority: 'High',
        status: 'Rejected',
        estimatedCost: 35000,
        workshop: 'Authorized Tata Motors Workshop',
        rejectionReason: 'Quotation exceeds threshold without 3 comparative vendor bids. Please collect 2 additional estimates.',
        rejectedBy: 'Joint Director Operations',
        rejectedAt: '10-06-2026 04:00 PM',
    },
    {
        id: 'MR-1005',
        requestId: 'MR-1005',
        type: 'Maintenance',
        vehicleNumber: 'TN-09-IJ-3344',
        reportedBy: 'Transport Supervisor',
        driverName: 'M. Anand',
        requestDate: '06-06-2026',
        issueType: 'Oil Leak',
        description: 'Minor oil leak detected during weekly inspection at depot.',
        priority: 'Low',
        status: 'Completed',
        estimatedCost: 2800,
        workshop: 'Depot In-house Workshop',
        approverRemarks: 'Gasket seal replaced in-house.',
        approvedBy: 'Transport Manager',
        approvedAt: '06-06-2026 09:30 AM',
    },
]

export const INITIAL_FUEL_REQUESTS = [
    {
        id: 'FR-1001',
        requestId: 'FR-1001',
        type: 'Fuel',
        driverName: 'Sandy Selva',
        driverId: 'VAN-1001',
        vehicleNumber: 'TN-09-AB-4521',
        routeName: 'Route 5 — North Campus',
        currentOdometerReading: '48,320 km',
        requestedQuantity: '120 L',
        estimatedCost: 11400,
        fuelStation: 'Indian Oil Depot - Bypass Road',
        requestedDate: '09-06-2026',
        status: 'In-Process',
        approverRemarks: 'Fuel card PIN authorized for 120 Liters diesel.',
        approvedBy: 'Transport Manager',
        approvedAt: '09-06-2026 08:15 AM',
    },
    {
        id: 'FR-1002',
        requestId: 'FR-1002',
        type: 'Fuel',
        driverName: 'Rajesh K. Kumar',
        driverId: 'VAN-1002',
        vehicleNumber: 'TN-09-CD-8834',
        routeName: 'Route 2 — East Campus',
        currentOdometerReading: '62,150 km',
        requestedQuantity: '150 L',
        estimatedCost: 14250,
        fuelStation: 'Bharat Petroleum - Main Gate',
        requestedDate: '08-06-2026',
        status: 'Pending',
    },
    {
        id: 'FR-1003',
        requestId: 'FR-1003',
        type: 'Fuel',
        driverName: 'Priya M. Venkatesh',
        driverId: 'VAN-1003',
        vehicleNumber: 'TN-09-EF-2210',
        routeName: 'Route 8 — West Campus',
        currentOdometerReading: '35,780 km',
        requestedQuantity: '100 L',
        estimatedCost: 9500,
        fuelStation: 'Indian Oil Depot - Bypass Road',
        requestedDate: '07-06-2026',
        status: 'Completed',
        approverRemarks: 'Full tank dispensed. Bill #IOC-9982 reconciled.',
        approvedBy: 'Transport Manager',
        approvedAt: '07-06-2026 09:00 AM',
    },
    {
        id: 'FR-1004',
        requestId: 'FR-1004',
        type: 'Fuel',
        driverName: 'Mohan R. Das',
        driverId: 'VAN-1004',
        vehicleNumber: 'TN-09-GH-5567',
        routeName: 'Route 3 — South Campus',
        currentOdometerReading: '71,420 km',
        requestedQuantity: '140 L',
        estimatedCost: 13300,
        fuelStation: 'HPCL Station - Ring Road',
        requestedDate: '10-06-2026',
        status: 'Rejected',
        rejectionReason: 'Previous fuel indent of 130L was issued only 4 days ago. Odometer difference does not match average mileage.',
        rejectedBy: 'Transport Manager',
        rejectedAt: '10-06-2026 10:15 AM',
    },
    {
        id: 'FR-1005',
        requestId: 'FR-1005',
        type: 'Fuel',
        driverName: 'Sandy Selva',
        driverId: 'VAN-1001',
        vehicleNumber: 'TN-09-AB-4521',
        routeName: 'Route 5 — North Campus',
        currentOdometerReading: '48,650 km',
        requestedQuantity: '110 L',
        estimatedCost: 10450,
        fuelStation: 'Indian Oil Depot - Bypass Road',
        requestedDate: '04-06-2026',
        status: 'Completed',
        approvedBy: 'Transport Manager',
        approvedAt: '04-06-2026 08:30 AM',
    },
]

export const MAINTENANCE_REQUESTS = INITIAL_MAINTENANCE_REQUESTS
export const FUEL_REQUESTS = INITIAL_FUEL_REQUESTS

const STORAGE_KEY_MAINTENANCE = 'schoolerp_transport_maintenance_requests_v1'
const STORAGE_KEY_FUEL = 'schoolerp_transport_fuel_requests_v1'
export const TRANSPORT_REQUESTS_UPDATED_EVENT = 'schoolerp_transport_requests_updated'

const notifySubscribers = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(TRANSPORT_REQUESTS_UPDATED_EVENT))
    }
}

export const getMaintenanceRequests = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_MAINTENANCE)
        if (stored) return JSON.parse(stored)
    } catch {
        /* fallback to initial */
    }
    return INITIAL_MAINTENANCE_REQUESTS
}

export const getFuelRequests = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_FUEL)
        if (stored) return JSON.parse(stored)
    } catch {
        /* fallback to initial */
    }
    return INITIAL_FUEL_REQUESTS
}

export const getAllRequests = () => {
    return [...getMaintenanceRequests(), ...getFuelRequests()]
}

export const getRequestById = (id) => {
    const all = getAllRequests()
    return all.find((r) => r.id === id || r.requestId === id) || null
}

export const addMaintenanceRequest = (requestData) => {
    const list = getMaintenanceRequests()
    const nextNum = list.length + 1001
    const newReq = {
        id: `MR-${nextNum}`,
        requestId: `MR-${nextNum}`,
        type: 'Maintenance',
        requestDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        status: 'Pending',
        reportedBy: requestData.reportedBy || 'Transport Manager',
        ...requestData,
    }
    const updated = [newReq, ...list]
    try {
        localStorage.setItem(STORAGE_KEY_MAINTENANCE, JSON.stringify(updated))
        notifySubscribers()
    } catch {
        /* ignore */
    }
    return newReq
}

export const addFuelRequest = (requestData) => {
    const list = getFuelRequests()
    const nextNum = list.length + 1001
    const newReq = {
        id: `FR-${nextNum}`,
        requestId: `FR-${nextNum}`,
        type: 'Fuel',
        requestedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        status: 'Pending',
        driverName: requestData.driverName || 'Sandy Selva',
        driverId: requestData.driverId || 'VAN-1001',
        ...requestData,
    }
    const updated = [newReq, ...list]
    try {
        localStorage.setItem(STORAGE_KEY_FUEL, JSON.stringify(updated))
        notifySubscribers()
    } catch {
        /* ignore */
    }
    return newReq
}

export const updateRequestStatus = (id, newStatus, remarks = '', actorRole = 'Transport Manager') => {
    let found = false
    const nowStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

    // Check maintenance
    const mList = getMaintenanceRequests().map((item) => {
        if (item.id === id || item.requestId === id) {
            found = true
            const updated = {
                ...item,
                status: newStatus,
            }
            if (newStatus === 'Rejected') {
                updated.rejectionReason = remarks || 'Declined during review'
                updated.rejectedBy = actorRole
                updated.rejectedAt = nowStr
            } else if (newStatus === 'Approved' || newStatus === 'Completed') {
                updated.approverRemarks = remarks || 'Approved'
                updated.approvedBy = actorRole
                updated.approvedAt = nowStr
            } else {
                updated.approverRemarks = remarks || 'In-Process'
            }
            return updated
        }
        return item
    })

    if (found) {
        localStorage.setItem(STORAGE_KEY_MAINTENANCE, JSON.stringify(mList))
        notifySubscribers()
        return mList.find((r) => r.id === id || r.requestId === id)
    }

    // Check fuel
    const fList = getFuelRequests().map((item) => {
        if (item.id === id || item.requestId === id) {
            found = true
            const updated = {
                ...item,
                status: newStatus,
            }
            if (newStatus === 'Rejected') {
                updated.rejectionReason = remarks || 'Declined during review'
                updated.rejectedBy = actorRole
                updated.rejectedAt = nowStr
            } else if (newStatus === 'Approved' || newStatus === 'Completed') {
                updated.approverRemarks = remarks || 'Approved'
                updated.approvedBy = actorRole
                updated.approvedAt = nowStr
            } else {
                updated.approverRemarks = remarks || 'In-Process'
            }
            return updated
        }
        return item
    })

    if (found) {
        localStorage.setItem(STORAGE_KEY_FUEL, JSON.stringify(fList))
        notifySubscribers()
        return fList.find((r) => r.id === id || r.requestId === id)
    }

    return null
}
