import React, { useState, useMemo } from 'react'
import {
    Wrench,
    Package,
    AlertTriangle,
    CheckCircle2,
    Plus,
    MinusCircle,
    Search,
    Filter,
    Layers,
    DollarSign,
    RotateCcw,
    Printer,
    FileText,
    Truck,
    Building2,
    ShieldAlert,
    ExternalLink
} from 'lucide-react'
import { toast } from 'react-toastify'
import { EnterpriseKpiCard, RecordDetailDrawer, exportDataset } from '../ui'
import { useAuth } from '../../context/AuthContext'
import {
    MAINTENANCE_CATEGORIES,
    getMaintenanceItems,
    getMaintenanceMovements,
    logStockIn,
    consumeStockForWorkOrder,
    updateStockThreshold,
    getLowStockAlertItems
} from './maintenanceInventoryData'

export default function MaintenanceInventoryWorkspace({ roleOverride = null }) {
    const { role: authRole, name: authName } = useAuth()
    const activeRole = roleOverride || authRole || 'maintenance-manager'
    const currentUserName = authName || 'Maintenance Supervisor'

    const [items, setItems] = useState(() => getMaintenanceItems())
    const [movements, setMovements] = useState(() => getMaintenanceMovements())
    const [activeTab, setActiveTab] = useState('inventory')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All Categories')
    const [stockFilter, setStockFilter] = useState('All')

    // Modals state
    const [showStockInModal, setShowStockInModal] = useState(false)
    const [showStockOutModal, setShowStockOutModal] = useState(false)
    const [showThresholdModal, setShowThresholdModal] = useState(false)

    const [selectedItem, setSelectedItem] = useState(null)
    const [drawerOpen, setDrawerOpen] = useState(false)

    // Form inputs
    const [stockInForm, setStockInForm] = useState({
        qty: 10,
        supplier: '',
        unitCost: '',
        refNo: '',
        destination: '',
        remarks: 'Restocked regular maintenance spare batch'
    })

    const [stockOutForm, setStockOutForm] = useState({
        qty: 1,
        refNo: 'WO-2026-095',
        destination: 'Block B - Science Labs',
        technician: currentUserName,
        remarks: 'Parts replacement for maintenance ticket'
    })

    const [thresholdForm, setThresholdForm] = useState({
        newMinimum: 10,
        newUnitCost: 200,
        location: ''
    })

    const refreshData = () => {
        setItems(getMaintenanceItems())
        setMovements(getMaintenanceMovements())
    }

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesCat = selectedCategory === 'All Categories' || item.category === selectedCategory
            const matchesStock =
                stockFilter === 'All' ||
                (stockFilter === 'Low' && item.available <= item.minimum && item.available > 0) ||
                (stockFilter === 'Critical' && item.available === 0) ||
                (stockFilter === 'Adequate' && item.available > item.minimum)

            const matchesQuery = !searchQuery ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()))

            return matchesCat && matchesStock && matchesQuery
        })
    }, [items, selectedCategory, stockFilter, searchQuery])

    // KPIs
    const totalSkus = useMemo(() => items.length, [items])

    const totalInventoryValue = useMemo(() => {
        return items.reduce((acc, it) => acc + (it.available * it.unitCost), 0)
    }, [items])

    const lowStockAlerts = useMemo(() => {
        return items.filter((it) => it.available <= it.minimum && it.available > 0).length
    }, [items])

    const criticalOutages = useMemo(() => {
        return items.filter((it) => it.available === 0).length
    }, [items])

    const partsConsumedThisMonth = useMemo(() => {
        return movements
            .filter((m) => m.type === 'Outward')
            .reduce((acc, m) => acc + m.qty, 0)
    }, [movements])

    // Handlers
    const handleStockIn = (e) => {
        e.preventDefault()
        if (!selectedItem || Number(stockInForm.qty) <= 0) {
            toast.error('Valid restock quantity is required')
            return
        }

        logStockIn({
            itemId: selectedItem.id,
            qty: stockInForm.qty,
            supplier: stockInForm.supplier || selectedItem.supplier,
            unitCost: stockInForm.unitCost || selectedItem.unitCost,
            refNo: stockInForm.refNo,
            technician: currentUserName,
            destination: stockInForm.destination || selectedItem.location,
            remarks: stockInForm.remarks
        })

        toast.success(`Successfully added ${stockInForm.qty} ${selectedItem.unit} of ${selectedItem.name}`)
        setShowStockInModal(false)
        refreshData()
    }

    const handleStockOut = (e) => {
        e.preventDefault()
        if (!selectedItem || Number(stockOutForm.qty) <= 0) {
            toast.error('Valid quantity is required')
            return
        }
        if (Number(stockOutForm.qty) > selectedItem.available) {
            toast.error(`Cannot issue more than available stock (${selectedItem.available} ${selectedItem.unit})`)
            return
        }

        consumeStockForWorkOrder({
            itemId: selectedItem.id,
            qty: stockOutForm.qty,
            refNo: stockOutForm.refNo,
            destination: stockOutForm.destination,
            technician: stockOutForm.technician,
            remarks: stockOutForm.remarks
        })

        toast.success(`Deducted ${stockOutForm.qty} ${selectedItem.unit} against ${stockOutForm.refNo}`)
        setShowStockOutModal(false)
        refreshData()
    }

    const handleUpdateThreshold = (e) => {
        e.preventDefault()
        if (!selectedItem) return

        updateStockThreshold(selectedItem.id, {
            newMinimum: thresholdForm.newMinimum,
            newUnitCost: thresholdForm.newUnitCost,
            location: thresholdForm.location
        })

        toast.success(`Threshold updated for ${selectedItem.name}`)
        setShowThresholdModal(false)
        refreshData()
    }

    const handleOpenDrawer = (item) => {
        setSelectedItem(item)
        setDrawerOpen(true)
    }

    const handleExport = (format) => {
        exportDataset({
            format,
            filename: `Maintenance_Spares_Inventory_${new Date().toISOString().slice(0, 10)}`,
            columns: [
                { key: 'id', label: 'Item ID' },
                { key: 'name', label: 'Part Description' },
                { key: 'category', label: 'Trade Category' },
                { key: 'available', label: 'Available Stock' },
                { key: 'minimum', label: 'Min Buffer' },
                { key: 'unit', label: 'Unit' },
                { key: 'unitCost', label: 'Unit Cost (INR)' },
                { key: 'location', label: 'Storage Bin' },
                { key: 'supplier', label: 'Primary Supplier' }
            ],
            data: filteredItems,
            moduleName: 'MaintenanceInventory'
        })
        toast.info(`Exporting ${format.toUpperCase()} report...`)
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-50 via-orange-50 to-sky-50 border border-amber-200 p-6 rounded-2xl shadow-xs">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-amber-600 text-white rounded-xl shadow-xs">
                            <Wrench className="w-6 h-6" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Maintenance Spares & Consumables Stock Control</h1>
                            <p className="text-xs text-slate-600 mt-0.5">
                                Trade-Specific Consumables, Minimum Buffer Thresholds, Work Order Consumption (`WO-2026-XXXX`) & Replenishment
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => setActiveTab('low-stock-assistant')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-xs transition"
                    >
                        <AlertTriangle className="w-4 h-4" /> Reorder Assistant ({lowStockAlerts + criticalOutages})
                    </button>
                    <div className="inline-flex rounded-xl shadow-xs border border-slate-200 bg-white overflow-hidden">
                        <button
                            type="button"
                            onClick={() => handleExport('excel')}
                            className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-r border-slate-200"
                        >
                            Excel
                        </button>
                        <button
                            type="button"
                            onClick={() => handleExport('csv')}
                            className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-r border-slate-200"
                        >
                            CSV
                        </button>
                        <button
                            type="button"
                            onClick={() => handleExport('pdf')}
                            className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <EnterpriseKpiCard
                    title="Maintenance Spare SKUs"
                    metric={totalSkus}
                    subtext="Active Parts Catalog"
                    icon={Package}
                    tone="blue"
                />
                <EnterpriseKpiCard
                    title="Total Inventory Value"
                    metric={`₹${totalInventoryValue.toLocaleString('en-IN')}`}
                    subtext="Stock at Cost"
                    icon={DollarSign}
                    tone="blue"
                />
                <EnterpriseKpiCard
                    title="Low Stock Buffer Alerts"
                    metric={lowStockAlerts}
                    subtext="Available &le; Min Threshold"
                    icon={AlertTriangle}
                    tone={lowStockAlerts > 0 ? 'amber' : 'emerald'}
                />
                <EnterpriseKpiCard
                    title="Critical Zero Outages"
                    metric={criticalOutages}
                    subtext="Stock Depleted Completely"
                    icon={ShieldAlert}
                    tone={criticalOutages > 0 ? 'rose' : 'emerald'}
                />
                <EnterpriseKpiCard
                    title="Parts Issued (Month)"
                    metric={partsConsumedThisMonth}
                    subtext="Deducted for Work Orders"
                    icon={Wrench}
                    tone="emerald"
                />
            </div>

            {/* Main Tabs Navigation */}
            <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1">
                {[
                    { id: 'inventory', label: 'Parts & Spares Inventory', icon: Package },
                    { id: 'movements', label: 'Stock Movement Ledger (In/Out)', icon: Layers },
                    { id: 'low-stock-assistant', label: `Low-Stock Reorder Assistant (${lowStockAlerts + criticalOutages})`, icon: AlertTriangle }
                ].map((tab) => {
                    const Icon = tab.icon
                    const isCurrent = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
                                isCurrent
                                    ? 'bg-white border-t-2 border-l border-r border-amber-600 text-amber-900 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            <Icon className="w-4 h-4" /> {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search spare parts, racks, trade, supplier..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5" /> Trade:
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 max-w-xs"
                        >
                            {MAINTENANCE_CATEGORIES.map((cat) => (
                                <option key={cat}>{cat}</option>
                            ))}
                        </select>
                    </label>
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        Stock Level:
                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
                        >
                            <option value="All">All Levels</option>
                            <option value="Adequate">Adequate Stock</option>
                            <option value="Low">Low Stock Alert</option>
                            <option value="Critical">Critical Zero Stock</option>
                        </select>
                    </label>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs font-semibold text-slate-500">
                        <strong>{filteredItems.length}</strong> items
                    </span>
                </div>
            </div>

            {/* VIEW 1: Spares Catalog Table */}
            {activeTab === 'inventory' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                                    <th className="py-3.5 px-4">Item ID</th>
                                    <th className="py-3.5 px-4">Part Name & Specs</th>
                                    <th className="py-3.5 px-4">Trade Category</th>
                                    <th className="py-3.5 px-4">Available Stock</th>
                                    <th className="py-3.5 px-4">Min Buffer</th>
                                    <th className="py-3.5 px-4">Unit Cost</th>
                                    <th className="py-3.5 px-4">Storage Location</th>
                                    <th className="py-3.5 px-4">Stock Health</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredItems.map((item) => {
                                    const isZero = item.available === 0
                                    const isLow = item.available <= item.minimum && !isZero
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                            <td className="py-3.5 px-4 font-mono font-bold text-amber-800">{item.id}</td>
                                            <td className="py-3.5 px-4">
                                                <p className="font-semibold text-slate-900">{item.name}</p>
                                                <p className="text-[11px] text-slate-400">Restocked: {item.lastRestocked || 'Recent'}</p>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600">{item.category}</td>
                                            <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                                                {item.available} {item.unit}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-500 font-mono">
                                                {item.minimum} {item.unit}
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                                                ₹{item.unitCost}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-slate-600 font-medium">
                                                {item.location}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                                    isZero
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                        : isLow
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                }`}>
                                                    {isZero ? 'Critical Outage' : isLow ? 'Low Stock Warning' : 'Adequate'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => { setSelectedItem(item); setShowStockInModal(true) }}
                                                    className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition"
                                                    title="Stock In / Restock"
                                                >
                                                    + Stock In
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={isZero}
                                                    onClick={() => { setSelectedItem(item); setShowStockOutModal(true) }}
                                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                                                        isZero
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                            : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                                                    }`}
                                                    title="Issue to Work Order"
                                                >
                                                    - Issue to WO
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedItem(item)
                                                        setThresholdForm({
                                                            newMinimum: item.minimum,
                                                            newUnitCost: item.unitCost,
                                                            location: item.location
                                                        })
                                                        setShowThresholdModal(true)
                                                    }}
                                                    className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                                                    title="Adjust Buffer Threshold"
                                                >
                                                    Threshold
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VIEW 2: Stock Movement Ledger */}
            {activeTab === 'movements' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                                    <th className="py-3.5 px-4">Movement ID</th>
                                    <th className="py-3.5 px-4">Date</th>
                                    <th className="py-3.5 px-4">Type</th>
                                    <th className="py-3.5 px-4">Part Description</th>
                                    <th className="py-3.5 px-4 text-center">Quantity</th>
                                    <th className="py-3.5 px-4">Reference Number</th>
                                    <th className="py-3.5 px-4">Technician / Issuer</th>
                                    <th className="py-3.5 px-4">Destination</th>
                                    <th className="py-3.5 px-4">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {movements.map((mov) => {
                                    const isInward = mov.type === 'Inward'
                                    return (
                                        <tr key={mov.id} className="hover:bg-slate-50/80 transition">
                                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{mov.id}</td>
                                            <td className="py-3.5 px-4 text-slate-500 font-mono">{mov.date}</td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                                    isInward ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {isInward ? '+ Inward' : '- Outward (WO)'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-slate-900">{mov.itemName}</td>
                                            <td className={`py-3.5 px-4 text-center font-bold text-sm ${
                                                isInward ? 'text-emerald-700' : 'text-amber-800'
                                            }`}>
                                                {isInward ? `+${mov.qty}` : `-${mov.qty}`}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono font-bold text-sky-800">{mov.refNo}</td>
                                            <td className="py-3.5 px-4 text-slate-700">{mov.technician}</td>
                                            <td className="py-3.5 px-4 text-slate-600">{mov.destination}</td>
                                            <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate">{mov.remarks}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VIEW 3: Low-Stock Reorder Assistant */}
            {activeTab === 'low-stock-assistant' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Low-Stock Spares Reorder Recommendations</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Automatically detected items with stock below safety buffer levels.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                toast.success('Generated Purchase Requisition batch for low-stock maintenance spares')
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                        >
                            <ExternalLink className="w-3.5 h-3.5" /> Push Batch to Purchase Workflow
                        </button>
                    </div>

                    <div className="space-y-3">
                        {getLowStockAlertItems().map((it) => {
                            const deficit = Math.max(0, it.minimum * 2 - it.available)
                            const estimatedCost = deficit * it.unitCost
                            return (
                                <div key={it.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">{it.id}</span>
                                            <h4 className="text-xs font-bold text-slate-900">{it.name}</h4>
                                        </div>
                                        <p className="text-xs text-slate-500">Trade: <strong>{it.category}</strong> | Bin: <strong>{it.location}</strong></p>
                                        <p className="text-xs text-slate-700">
                                            Current Balance: <strong className="text-rose-700">{it.available} {it.unit}</strong> (Min Buffer: {it.minimum} {it.unit})
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right text-xs">
                                            <p className="text-slate-500">Recommended Reorder:</p>
                                            <p className="font-bold text-slate-900">{deficit} {it.unit} (₹{estimatedCost.toLocaleString('en-IN')})</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedItem(it)
                                                setStockInForm({
                                                    qty: deficit,
                                                    supplier: it.supplier,
                                                    unitCost: it.unitCost,
                                                    refNo: '',
                                                    destination: it.location,
                                                    remarks: 'Buffer replenishment from low stock assistant'
                                                })
                                                setShowStockInModal(true)
                                            }}
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                                        >
                                            Restock Now
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* MODAL 1: Stock In Replenishment */}
            {showStockInModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-emerald-900">Log Stock-In: {selectedItem.name}</h3>
                        <p className="text-xs text-slate-500">Current available stock: <strong>{selectedItem.available} {selectedItem.unit}</strong></p>
                        <form onSubmit={handleStockIn} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Restock Quantity ({selectedItem.unit})</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={stockInForm.qty}
                                    onChange={(e) => setStockInForm({ ...stockInForm, qty: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Name</label>
                                    <input
                                        type="text"
                                        value={stockInForm.supplier || selectedItem.supplier}
                                        onChange={(e) => setStockInForm({ ...stockInForm, supplier: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit Cost (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={stockInForm.unitCost || selectedItem.unitCost}
                                        onChange={(e) => setStockInForm({ ...stockInForm, unitCost: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">PO / Invoice Reference</label>
                                <input
                                    type="text"
                                    placeholder="e.g. PO-2026-0881"
                                    value={stockInForm.refNo}
                                    onChange={(e) => setStockInForm({ ...stockInForm, refNo: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
                                <textarea
                                    rows="2"
                                    value={stockInForm.remarks}
                                    onChange={(e) => setStockInForm({ ...stockInForm, remarks: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowStockInModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                                >
                                    Confirm Stock-In
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: Issue to Work Order (Stock Out) */}
            {showStockOutModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-amber-900">Issue Parts to Work Order: {selectedItem.name}</h3>
                        <p className="text-xs text-slate-500">Available Stock: <strong>{selectedItem.available} {selectedItem.unit}</strong></p>
                        <form onSubmit={handleStockOut} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Deduct ({selectedItem.unit})</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max={selectedItem.available}
                                    value={stockOutForm.qty}
                                    onChange={(e) => setStockOutForm({ ...stockOutForm, qty: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Work Order Reference Number</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. WO-2026-089"
                                    value={stockOutForm.refNo}
                                    onChange={(e) => setStockOutForm({ ...stockOutForm, refNo: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Campus Destination / Room</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Block A - Classrooms 201-204"
                                    value={stockOutForm.destination}
                                    onChange={(e) => setStockOutForm({ ...stockOutForm, destination: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Technician Name</label>
                                <input
                                    type="text"
                                    value={stockOutForm.technician}
                                    onChange={(e) => setStockOutForm({ ...stockOutForm, technician: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Work Description / Remarks</label>
                                <textarea
                                    rows="2"
                                    value={stockOutForm.remarks}
                                    onChange={(e) => setStockOutForm({ ...stockOutForm, remarks: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowStockOutModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
                                >
                                    Confirm Stock Deduction
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: Update Threshold */}
            {showThresholdModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Adjust Stock Threshold: {selectedItem.name}</h3>
                        <form onSubmit={handleUpdateThreshold} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Safety Buffer ({selectedItem.unit})</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={thresholdForm.newMinimum}
                                    onChange={(e) => setThresholdForm({ ...thresholdForm, newMinimum: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Storage Rack / Bin Location</label>
                                <input
                                    type="text"
                                    value={thresholdForm.location}
                                    onChange={(e) => setThresholdForm({ ...thresholdForm, location: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowThresholdModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                                >
                                    Save Threshold
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
