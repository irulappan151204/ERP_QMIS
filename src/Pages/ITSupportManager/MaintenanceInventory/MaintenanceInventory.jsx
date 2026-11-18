import React, { useState, useMemo } from 'react'
import {
    Package,
    AlertTriangle,
    CheckCircle2,
    Plus,
    MinusCircle,
    Download,
    Printer,
    Search,
    Filter,
    Layers,
    DollarSign,
    RotateCcw,
    X,
    FileText,
    Wrench,
    Clock,
    Truck,
    MapPin,
    ArrowUpRight,
    ArrowDownRight,
    TrendingDown,
    Building2,
    ShieldAlert
} from 'lucide-react'
import { toast } from 'react-toastify'
import { EnterpriseKpiCard } from '../../../Common/ui'

const STORAGE_KEY = 'school-erp-maintenance-inventory-v2'
const MOVEMENT_KEY = 'school-erp-maintenance-movements-v2'

const CATEGORIES = [
    'All Categories',
    'Electrical & Lighting',
    'Plumbing & Sanitary',
    'HVAC & Cooling',
    'IT Spares & Cables',
    'Tools & Hardware',
    'Safety & Fire Equipment'
]

const INITIAL_ITEMS = [
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

const INITIAL_MOVEMENTS = [
    { id: 'MOV-1001', itemId: 'MNT-ELC-001', itemName: 'LED Tube Light 20W', type: 'Outward', qty: 4, refNo: 'WO-2026-089', destination: 'Block A - Floor 2 Classrooms', technician: 'R. Sundar (Electrician)', date: '2026-10-30', remarks: 'Replaced flickering tubes' },
    { id: 'MOV-1002', itemId: 'MNT-PLM-001', itemName: 'Brass Tap Spindle 1/2"', type: 'Outward', qty: 2, refNo: 'WO-2026-077', destination: 'Kindergarten Restroom', technician: 'P. Murugan (Plumber)', date: '2026-10-29', remarks: 'Fixed leaky washbasin tap' },
    { id: 'MOV-1003', itemId: 'MNT-ITS-001', itemName: 'Cat6 UTP Patch Cable 3m', type: 'Inward', qty: 30, refNo: 'PO-2026-114', destination: 'IT Spares Rack IT-01', technician: 'Sandy Selva (IT Support)', date: '2026-10-27', remarks: 'Received vendor fresh batch' },
    { id: 'MOV-1004', itemId: 'MNT-HVC-002', itemName: 'Capacitor 50 MFD', type: 'Outward', qty: 2, refNo: 'WO-2026-061', destination: 'Staff Room AC Outdoor', technician: 'S. Rajan (HVAC Tech)', date: '2026-10-26', remarks: 'Stock depleted, reorder required' }
]

export default function MaintenanceInventory() {
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            return raw ? JSON.parse(raw) : INITIAL_ITEMS
        } catch {
            return INITIAL_ITEMS
        }
    })

    const [movements, setMovements] = useState(() => {
        try {
            const raw = localStorage.getItem(MOVEMENT_KEY)
            return raw ? JSON.parse(raw) : INITIAL_MOVEMENTS
        } catch {
            return INITIAL_MOVEMENTS
        }
    })

    const saveItems = (updated) => {
        setItems(updated)
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch (e) {
            console.error(e)
        }
    }

    const saveMovements = (updated) => {
        setMovements(updated)
        try {
            localStorage.setItem(MOVEMENT_KEY, JSON.stringify(updated))
        } catch (e) {
            console.error(e)
        }
    }

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState('All Categories')
    const [searchQuery, setSearchQuery] = useState('')
    const [healthFilter, setHealthFilter] = useState('All')

    // Modals
    const [showInwardModal, setShowInwardModal] = useState(false)
    const [showOutwardModal, setShowOutwardModal] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [selectedItemForAction, setSelectedItemForAction] = useState(null)

    // Form state: Inward Intake
    const [inwardForm, setInwardForm] = useState({
        itemId: '',
        name: '',
        category: 'Electrical & Lighting',
        unit: 'pcs',
        quantity: 10,
        unitCost: 150,
        supplier: '',
        poNumber: '',
        location: '',
        remarks: ''
    })

    // Form state: Outward Issue
    const [outwardForm, setOutwardForm] = useState({
        itemId: '',
        quantity: 1,
        workOrder: '',
        destination: '',
        technician: 'R. Sundar (Electrician)',
        remarks: ''
    })

    // KPIs
    const kpis = useMemo(() => {
        const totalSkus = items.length
        const healthy = items.filter((i) => i.available >= i.minimum).length
        const lowStock = items.filter((i) => i.available < i.minimum && i.available > 0).length
        const outOfStock = items.filter((i) => i.available === 0).length
        const totalValuation = items.reduce((acc, i) => acc + (i.available * (i.unitCost || 0)), 0)

        return {
            totalSkus,
            healthy,
            lowStock,
            outOfStock,
            totalValuation: `₹ ${totalValuation.toLocaleString('en-IN')}`
        }
    }, [items])

    // Filtered list
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesCat = selectedCategory === 'All Categories' || item.category === selectedCategory
            const query = searchQuery.trim().toLowerCase()
            const matchesSearch = !query ||
                item.name.toLowerCase().includes(query) ||
                item.id.toLowerCase().includes(query) ||
                item.location.toLowerCase().includes(query) ||
                item.supplier.toLowerCase().includes(query)

            let matchesHealth = true
            if (healthFilter === 'Healthy') matchesHealth = item.available >= item.minimum
            if (healthFilter === 'Low Stock') matchesHealth = item.available < item.minimum && item.available > 0
            if (healthFilter === 'Out of Stock') matchesHealth = item.available === 0

            return matchesCat && matchesSearch && matchesHealth
        })
    }, [items, selectedCategory, searchQuery, healthFilter])

    // Handle Inward Intake Submit
    const handleInwardSubmit = (e) => {
        e.preventDefault()
        const qty = Number(inwardForm.quantity)
        const cost = Number(inwardForm.unitCost)

        if (!qty || qty <= 0) {
            toast.error('Please enter a valid intake quantity.')
            return
        }

        let targetId = inwardForm.itemId
        let updatedItems = [...items]

        if (targetId) {
            // Existing item restock
            updatedItems = items.map((item) => {
                if (item.id === targetId) {
                    return {
                        ...item,
                        available: item.available + qty,
                        unitCost: cost || item.unitCost,
                        lastRestocked: new Date().toISOString().split('T')[0]
                    }
                }
                return item
            })
        } else {
            // New SKU intake
            if (!inwardForm.name.trim()) {
                toast.error('Item name is required for new spares.')
                return
            }
            targetId = `MNT-${inwardForm.category.slice(0, 3).toUpperCase()}-${String(items.length + 1).padStart(3, '0')}`
            const newItem = {
                id: targetId,
                name: inwardForm.name.trim(),
                category: inwardForm.category,
                unit: inwardForm.unit || 'pcs',
                available: qty,
                minimum: 5,
                unitCost: cost,
                location: inwardForm.location.trim() || 'General Bay',
                supplier: inwardForm.supplier.trim() || 'Authorized Vendor',
                lastRestocked: new Date().toISOString().split('T')[0]
            }
            updatedItems = [newItem, ...items]
        }

        const itemName = targetId ? (items.find((i) => i.id === targetId)?.name || inwardForm.name) : inwardForm.name
        const newMovement = {
            id: `MOV-${Date.now().toString().slice(-4)}`,
            itemId: targetId,
            itemName,
            type: 'Inward',
            qty,
            refNo: inwardForm.poNumber || 'INWARD-RECEIPT',
            destination: inwardForm.location || 'Spares Warehouse',
            technician: 'Maintenance Store Keeper',
            date: new Date().toISOString().split('T')[0],
            remarks: inwardForm.remarks || 'Stock intake logged'
        }

        saveItems(updatedItems)
        saveMovements([newMovement, ...movements])
        toast.success(`Successfully added ${qty} units of ${itemName} to maintenance inventory!`)
        setShowInwardModal(false)
        setInwardForm({
            itemId: '',
            name: '',
            category: 'Electrical & Lighting',
            unit: 'pcs',
            quantity: 10,
            unitCost: 150,
            supplier: '',
            poNumber: '',
            location: '',
            remarks: ''
        })
    }

    // Handle Outward Issue Submit
    const handleOutwardSubmit = (e) => {
        e.preventDefault()
        const qty = Number(outwardForm.quantity)
        const target = items.find((i) => i.id === outwardForm.itemId)

        if (!target) {
            toast.error('Please select an item to issue.')
            return
        }

        if (!qty || qty <= 0) {
            toast.error('Please enter a valid issue quantity.')
            return
        }

        if (qty > target.available) {
            toast.error(`Cannot issue ${qty} units. Only ${target.available} units available in stock.`)
            return
        }

        const updatedItems = items.map((item) => {
            if (item.id === target.id) {
                return {
                    ...item,
                    available: item.available - qty
                }
            }
            return item
        })

        const newMovement = {
            id: `MOV-${Date.now().toString().slice(-4)}`,
            itemId: target.id,
            itemName: target.name,
            type: 'Outward',
            qty,
            refNo: outwardForm.workOrder || 'WO-DIRECT',
            destination: outwardForm.destination || 'Campus Facility',
            technician: outwardForm.technician || 'Maintenance Staff',
            date: new Date().toISOString().split('T')[0],
            remarks: outwardForm.remarks || 'Spares issued for campus maintenance'
        }

        saveItems(updatedItems)
        saveMovements([newMovement, ...movements])
        toast.success(`Issued ${qty} ${target.unit} of ${target.name} for ${outwardForm.destination || 'facility work'}.`)
        setShowOutwardModal(false)
        setOutwardForm({
            itemId: '',
            quantity: 1,
            workOrder: '',
            destination: '',
            technician: 'R. Sundar (Electrician)',
            remarks: ''
        })
    }

    // Export CSV
    const handleExportCsv = () => {
        const headers = ['Item Code', 'Item Name', 'Category', 'Available Stock', 'Unit', 'Safety Minimum', 'Unit Cost (INR)', 'Total Value (INR)', 'Rack Location', 'Supplier', 'Status']
        const rows = filteredItems.map((item) => [
            item.id,
            `"${item.name.replace(/"/g, '""')}"`,
            item.category,
            item.available,
            item.unit,
            item.minimum,
            item.unitCost,
            item.available * item.unitCost,
            item.location,
            `"${item.supplier.replace(/"/g, '""')}"`,
            item.available === 0 ? 'Out of Stock' : item.available < item.minimum ? 'Low Stock' : 'In Stock'
        ])

        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `maintenance_spares_inventory_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Maintenance inventory exported to CSV successfully.')
    }

    return (
        <section className="space-y-6 font-inter pb-10">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
                        <Wrench size={26} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                                Campus Maintenance Spares & Equipment Inventory
                            </h1>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                                {items.length} SKUs Managed
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Real-time tracking of electrical, plumbing, HVAC, hardware, and safety spares for immediate campus repairs.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setShowHistoryModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
                    >
                        <Clock size={14} className="text-indigo-600" />
                        <span>Movement Log ({movements.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setOutwardForm({
                                itemId: items[0]?.id || '',
                                quantity: 1,
                                workOrder: `WO-2026-${Math.floor(100 + Math.random() * 900)}`,
                                destination: 'Block A Classrooms',
                                technician: 'R. Sundar (Electrician)',
                                remarks: ''
                            })
                            setShowOutwardModal(true)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 shadow-2xs transition cursor-pointer"
                    >
                        <MinusCircle size={14} />
                        <span>Issue Spares (Outward)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setInwardForm({
                                itemId: '',
                                name: '',
                                category: 'Electrical & Lighting',
                                unit: 'pcs',
                                quantity: 10,
                                unitCost: 150,
                                supplier: '',
                                poNumber: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
                                location: 'Rack E-01',
                                remarks: ''
                            })
                            setShowInwardModal(true)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition cursor-pointer"
                    >
                        <Plus size={14} />
                        <span>Log Intake (Inward)</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition cursor-pointer"
                    >
                        <Download size={14} />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* KPI Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <EnterpriseKpiCard
                    title="Total Spares SKUs"
                    value={kpis.totalSkus}
                    change="+3 this month"
                    isPositive={true}
                    context="Active catalogued items"
                />
                <EnterpriseKpiCard
                    title="Healthy Stock"
                    value={kpis.healthy}
                    change="Optimal reserves"
                    isPositive={true}
                    context="Stock above minimum"
                />
                <EnterpriseKpiCard
                    title="Low Stock Alerts"
                    value={kpis.lowStock}
                    change="Reorder required"
                    isPositive={false}
                    context="Nearing safety minimum"
                />
                <EnterpriseKpiCard
                    title="Depleted (Out of Stock)"
                    value={kpis.outOfStock}
                    change="Critical risk"
                    isPositive={false}
                    context="0 units available"
                />
                <EnterpriseKpiCard
                    title="Inventory Valuation"
                    value={kpis.totalValuation}
                    change="Audited ledger"
                    isPositive={true}
                    context="On-hand total value"
                />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs sidebar-scroll-hide">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            selectedCategory === cat
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <span>{cat}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                            selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                            {cat === 'All Categories' ? items.length : items.filter((i) => i.category === cat).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search, Status Filter & Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by item name, SKU, rack location, or vendor..."
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 transition"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-slate-400" />
                            <select
                                value={healthFilter}
                                onChange={(e) => setHealthFilter(e.target.value)}
                                className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
                            >
                                <option value="All">All Stock Levels</option>
                                <option value="Healthy">Healthy Reserves</option>
                                <option value="Low Stock">Low Stock Warnings</option>
                                <option value="Out of Stock">Out of Stock</option>
                            </select>
                        </div>
                    </div>

                    <div className="text-xs text-slate-500">
                        Showing <strong>{filteredItems.length}</strong> of <strong>{items.length}</strong> spares
                    </div>
                </div>

                {/* Spares Inventory Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                                <th className="py-3 px-4">Item Code</th>
                                <th className="py-3 px-4">Spare / Equipment Name</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4">Storage Bay</th>
                                <th className="py-3 px-4 text-center">Available Stock</th>
                                <th className="py-3 px-4 text-center">Safety Reorder</th>
                                <th className="py-3 px-4">Unit Rate</th>
                                <th className="py-3 px-4">Total Value</th>
                                <th className="py-3 px-4 text-center">Health Status</th>
                                <th className="py-3 px-4 text-right">Quick Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-12 text-center text-slate-400">
                                        No maintenance spares found matching the current filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => {
                                    const isLow = item.available < item.minimum && item.available > 0
                                    const isOut = item.available === 0
                                    const totalVal = item.available * (item.unitCost || 0)

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                            <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                                                {item.id}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-900">{item.name}</div>
                                                <div className="text-[11px] text-slate-400">Supplier: {item.supplier}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-medium text-slate-700">
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={12} className="text-slate-400" />
                                                    {item.location}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`font-bold text-sm ${
                                                    isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                                                }`}>
                                                    {item.available}
                                                </span>{' '}
                                                <span className="text-[11px] text-slate-400">{item.unit}</span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-medium text-slate-500">
                                                {item.minimum} {item.unit}
                                            </td>
                                            <td className="py-3.5 px-4 font-medium text-slate-700">
                                                ₹ {item.unitCost}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-slate-900">
                                                ₹ {totalVal.toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                {isOut ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <ShieldAlert size={10} /> Depleted
                                                    </span>
                                                ) : isLow ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <AlertTriangle size={10} /> Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 size={10} /> In Stock
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        title="Log Stock Intake (Restock)"
                                                        onClick={() => {
                                                            setInwardForm({
                                                                itemId: item.id,
                                                                name: item.name,
                                                                category: item.category,
                                                                unit: item.unit,
                                                                quantity: item.minimum * 2,
                                                                unitCost: item.unitCost,
                                                                supplier: item.supplier,
                                                                poNumber: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
                                                                location: item.location,
                                                                remarks: 'Replenishment order'
                                                            })
                                                            setShowInwardModal(true)
                                                        }}
                                                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                                                    >
                                                        <Plus size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Issue Spares to Work Order"
                                                        disabled={item.available === 0}
                                                        onClick={() => {
                                                            setOutwardForm({
                                                                itemId: item.id,
                                                                quantity: 1,
                                                                workOrder: `WO-2026-${Math.floor(100 + Math.random() * 900)}`,
                                                                destination: 'Campus Facility',
                                                                technician: 'R. Sundar (Electrician)',
                                                                remarks: ''
                                                            })
                                                            setShowOutwardModal(true)
                                                        }}
                                                        className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        <MinusCircle size={13} />
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

            {/* MODAL 1: LOG STOCK INWARD (INTAKE) */}
            {showInwardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                    <Plus size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        {inwardForm.itemId ? 'Restock Existing Maintenance Spare' : 'Intake New Spare SKU'}
                                    </h3>
                                    <p className="text-xs text-slate-500">Record incoming goods delivery & update on-hand stock</p>
                                </div>
                            </div>
                            <button onClick={() => setShowInwardModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleInwardSubmit} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Select Spare / SKU</label>
                                <select
                                    value={inwardForm.itemId}
                                    onChange={(e) => {
                                        const selected = items.find((i) => i.id === e.target.value)
                                        if (selected) {
                                            setInwardForm({
                                                ...inwardForm,
                                                itemId: selected.id,
                                                name: selected.name,
                                                category: selected.category,
                                                unit: selected.unit,
                                                unitCost: selected.unitCost,
                                                location: selected.location,
                                                supplier: selected.supplier
                                            })
                                        } else {
                                            setInwardForm({
                                                ...inwardForm,
                                                itemId: '',
                                                name: '',
                                                category: 'Electrical & Lighting',
                                                unit: 'pcs',
                                                unitCost: 150
                                            })
                                        }
                                    }}
                                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 focus:outline-hidden"
                                >
                                    <option value="">+ Register Brand New Spare SKU</option>
                                    {items.map((i) => (
                                        <option key={i.id} value={i.id}>
                                            {i.id} - {i.name} (Current: {i.available} {i.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {!inwardForm.itemId && (
                                <>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Spare Part Description *</label>
                                        <input
                                            type="text"
                                            value={inwardForm.name}
                                            onChange={(e) => setInwardForm({ ...inwardForm, name: e.target.value })}
                                            placeholder="e.g., Heavy Duty Submersible Water Pump 1HP"
                                            className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 focus:outline-hidden"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">Category</label>
                                            <select
                                                value={inwardForm.category}
                                                onChange={(e) => setInwardForm({ ...inwardForm, category: e.target.value })}
                                                className="w-full rounded-xl border border-slate-200 p-2.5"
                                            >
                                                {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">Unit of Measure</label>
                                            <input
                                                type="text"
                                                value={inwardForm.unit}
                                                onChange={(e) => setInwardForm({ ...inwardForm, unit: e.target.value })}
                                                placeholder="pcs / rolls / meters"
                                                className="w-full rounded-xl border border-slate-200 p-2.5"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Intake Quantity *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={inwardForm.quantity}
                                        onChange={(e) => setInwardForm({ ...inwardForm, quantity: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Unit Cost (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={inwardForm.unitCost}
                                        onChange={(e) => setInwardForm({ ...inwardForm, unitCost: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Purchase Order / Bill #</label>
                                    <input
                                        type="text"
                                        value={inwardForm.poNumber}
                                        onChange={(e) => setInwardForm({ ...inwardForm, poNumber: e.target.value })}
                                        placeholder="PO-2026-..."
                                        className="w-full rounded-xl border border-slate-200 p-2.5"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Storage Rack / Bin</label>
                                    <input
                                        type="text"
                                        value={inwardForm.location}
                                        onChange={(e) => setInwardForm({ ...inwardForm, location: e.target.value })}
                                        placeholder="e.g. Rack E-03"
                                        className="w-full rounded-xl border border-slate-200 p-2.5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Supplier / Vendor Name</label>
                                <input
                                    type="text"
                                    value={inwardForm.supplier}
                                    onChange={(e) => setInwardForm({ ...inwardForm, supplier: e.target.value })}
                                    placeholder="Vendor name or supplier agency"
                                    className="w-full rounded-xl border border-slate-200 p-2.5"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Remarks / Inspection Notes</label>
                                <textarea
                                    rows="2"
                                    value={inwardForm.remarks}
                                    onChange={(e) => setInwardForm({ ...inwardForm, remarks: e.target.value })}
                                    placeholder="Quality check passed, warranty card stored..."
                                    className="w-full rounded-xl border border-slate-200 p-2.5"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowInwardModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                                >
                                    Confirm Stock Inward
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: ISSUE SPARES OUTWARD */}
            {showOutwardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                                    <MinusCircle size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Issue Spares to Facility Work Order</h3>
                                    <p className="text-xs text-slate-500">Deduct stock for campus maintenance repairs</p>
                                </div>
                            </div>
                            <button onClick={() => setShowOutwardModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleOutwardSubmit} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Select Spare to Issue *</label>
                                <select
                                    value={outwardForm.itemId}
                                    onChange={(e) => setOutwardForm({ ...outwardForm, itemId: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                                    required
                                >
                                    {items.map((i) => (
                                        <option key={i.id} value={i.id} disabled={i.available === 0}>
                                            {i.name} — Available: {i.available} {i.unit} ({i.location})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Quantity to Issue *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={outwardForm.quantity}
                                        onChange={(e) => setOutwardForm({ ...outwardForm, quantity: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 p-2.5 font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Work Order #</label>
                                    <input
                                        type="text"
                                        value={outwardForm.workOrder}
                                        onChange={(e) => setOutwardForm({ ...outwardForm, workOrder: e.target.value })}
                                        placeholder="WO-2026-..."
                                        className="w-full rounded-xl border border-slate-200 p-2.5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Campus Location / Room *</label>
                                <input
                                    type="text"
                                    value={outwardForm.destination}
                                    onChange={(e) => setOutwardForm({ ...outwardForm, destination: e.target.value })}
                                    placeholder="e.g. Science Lab 02, Block A Ground Floor"
                                    className="w-full rounded-xl border border-slate-200 p-2.5"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Issued to Technician *</label>
                                <select
                                    value={outwardForm.technician}
                                    onChange={(e) => setOutwardForm({ ...outwardForm, technician: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 p-2.5"
                                >
                                    <option value="R. Sundar (Electrician)">R. Sundar (Electrician)</option>
                                    <option value="P. Murugan (Plumber)">P. Murugan (Plumber)</option>
                                    <option value="S. Rajan (HVAC Specialist)">S. Rajan (HVAC Specialist)</option>
                                    <option value="Sandy Selva (IT Support)">Sandy Selva (IT Support)</option>
                                    <option value="V. Kumar (General Maintenance)">V. Kumar (General Maintenance)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Maintenance Purpose & Remarks</label>
                                <textarea
                                    rows="2"
                                    value={outwardForm.remarks}
                                    onChange={(e) => setOutwardForm({ ...outwardForm, remarks: e.target.value })}
                                    placeholder="Replaced blown capacitor, fixed leaking valve..."
                                    className="w-full rounded-xl border border-slate-200 p-2.5"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowOutwardModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700"
                                >
                                    Authorize & Issue Spares
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: CHRONOLOGICAL MOVEMENT LOG DRAWER */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Maintenance Spares Movement & Audit Trail</h3>
                                    <p className="text-xs text-slate-500">Immutable ledger of inward intake and outward issue events</p>
                                </div>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="py-2.5 px-3">Date</th>
                                        <th className="py-2.5 px-3">Type</th>
                                        <th className="py-2.5 px-3">Spare Item</th>
                                        <th className="py-2.5 px-3 text-center">Quantity</th>
                                        <th className="py-2.5 px-3">Reference / WO</th>
                                        <th className="py-2.5 px-3">Destination / Tech</th>
                                        <th className="py-2.5 px-3">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-600">
                                    {movements.map((m) => (
                                        <tr key={m.id} className="hover:bg-slate-50/80">
                                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">{m.date}</td>
                                            <td className="py-2.5 px-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    m.type === 'Inward' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {m.type === 'Inward' ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
                                                    {m.type}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 font-semibold text-slate-900">{m.itemName}</td>
                                            <td className="py-2.5 px-3 text-center font-bold">
                                                {m.type === 'Inward' ? `+${m.qty}` : `-${m.qty}`}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-700">{m.refNo}</td>
                                            <td className="py-2.5 px-3">
                                                <div>{m.destination}</div>
                                                <div className="text-[10px] text-slate-400">{m.technician}</div>
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-500">{m.remarks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowHistoryModal(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                            >
                                Close Ledger
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
