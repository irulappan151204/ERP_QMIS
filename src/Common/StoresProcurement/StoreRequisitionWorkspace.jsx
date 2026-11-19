import React, { useState, useMemo } from 'react'
import {
    ClipboardList,
    Package,
    ShoppingCart,
    CheckCircle2,
    XCircle,
    Clock,
    Printer,
    Search,
    Filter,
    Plus,
    Minus,
    Trash2,
    Eye,
    Tag,
    AlertTriangle,
    Layers,
    Send,
    Check,
    Store
} from 'lucide-react'
import { toast } from 'react-toastify'
import { EnterpriseKpiCard, RecordDetailDrawer, exportDataset } from '../ui'
import { useAuth } from '../../context/AuthContext'
import {
    STORE_CATEGORIES,
    getStoreCatalog,
    getStoreRequisitions,
    submitStoreRequisition,
    endorseStoreRequisition,
    issueStoreItems,
    acknowledgeStoreCollection
} from './storeRequisitionData'

export default function StoreRequisitionWorkspace({ roleOverride = null }) {
    const { role: authRole, name: authName } = useAuth()
    const activeRole = roleOverride || authRole || 'teacher'
    const currentUserName = authName || 'Faculty Member'

    const [catalog, setCatalog] = useState(() => getStoreCatalog())
    const [requisitions, setRequisitions] = useState(() => getStoreRequisitions())
    const [activeTab, setActiveTab] = useState('catalog')
    const [selectedCategory, setSelectedCategory] = useState('All Categories')
    const [searchQuery, setSearchQuery] = useState('')

    // Basket state
    const [basket, setBasket] = useState([])
    const [requisitionPurpose, setRequisitionPurpose] = useState('')
    const [requisitionPriority, setRequisitionPriority] = useState('Routine')
    const [targetDepartment, setTargetDepartment] = useState('Academic - Mathematics')

    // Modals & Drawers state
    const [selectedRequisition, setSelectedRequisition] = useState(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [showIssueModal, setShowIssueModal] = useState(false)
    const [showVoucherModal, setShowVoucherModal] = useState(false)

    // Storekeeper allocation inputs
    const [allocationForm, setAllocationForm] = useState({})
    const [allocationRemarks, setAllocationRemarks] = useState('')

    const refreshData = () => {
        setCatalog(getStoreCatalog())
        setRequisitions(getStoreRequisitions())
    }

    const filteredCatalog = useMemo(() => {
        return catalog.filter((item) => {
            const matchesCat = selectedCategory === 'All Categories' || item.category === selectedCategory
            const matchesQuery = !searchQuery ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.bin.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesCat && matchesQuery
        })
    }, [catalog, selectedCategory, searchQuery])

    // KPIs
    const totalItemsCount = useMemo(() => catalog.length, [catalog])
    const lowStockCount = useMemo(() => catalog.filter((c) => c.inStock <= c.lowStockThreshold).length, [catalog])
    const myActiveReqs = useMemo(() => requisitions.filter((r) => r.status !== 'COLLECTED' && r.status !== 'REJECTED').length, [requisitions])
    const pendingHodCount = useMemo(() => requisitions.filter((r) => r.status === 'SUBMITTED').length, [requisitions])
    const readyForPickupCount = useMemo(() => requisitions.filter((r) => r.status === 'READY_FOR_COLLECTION').length, [requisitions])

    // Basket handlers
    const addToBasket = (item) => {
        if (item.inStock <= 0) {
            toast.error('Item is currently Out of Stock')
            return
        }

        const existing = basket.find((b) => b.id === item.id)
        if (existing) {
            if (existing.quantity >= item.inStock) {
                toast.warning(`Cannot request more than available shelf stock (${item.inStock} ${item.unit})`)
                return
            }
            setBasket(basket.map((b) => b.id === item.id ? { ...b, quantity: b.quantity + 1 } : b))
        } else {
            setBasket([...basket, { ...item, quantity: 1 }])
        }
        toast.info(`Added ${item.name} to requisition basket`)
    }

    const updateBasketQty = (itemId, newQty) => {
        const item = catalog.find((c) => c.id === itemId)
        if (newQty <= 0) {
            setBasket(basket.filter((b) => b.id === itemId))
            return
        }
        if (item && newQty > item.inStock) {
            toast.warning(`Maximum available stock is ${item.inStock} ${item.unit}`)
            return
        }
        setBasket(basket.map((b) => b.id === itemId ? { ...b, quantity: newQty } : b))
    }

    const removeFromBasket = (itemId) => {
        setBasket(basket.filter((b) => b.id !== itemId))
    }

    const handleSubmitBasket = (e) => {
        e.preventDefault()
        if (basket.length === 0) {
            toast.error('Your requisition basket is empty')
            return
        }
        if (!requisitionPurpose.trim()) {
            toast.error('Please specify the requirement purpose')
            return
        }

        submitStoreRequisition({
            requestedBy: currentUserName,
            requestingRole: activeRole,
            department: targetDepartment,
            purpose: requisitionPurpose,
            priority: requisitionPriority,
            items: basket.map((b) => ({
                id: b.id,
                name: b.name,
                requestedQty: b.quantity,
                unit: b.unit
            }))
        })

        toast.success('Store Requisition submitted for HOD Endorsement')
        setBasket([])
        setRequisitionPurpose('')
        setActiveTab('my-requests')
        refreshData()
    }

    const handleEndorse = (reqId, isApproved) => {
        endorseStoreRequisition(reqId, {
            endorser: `${currentUserName} (HOD)`,
            status: isApproved ? 'Approved' : 'Rejected',
            notes: isApproved ? 'Verified against department quota' : 'Item quota exceeded for this cycle'
        })
        toast.info(`Requisition ${reqId} ${isApproved ? 'Endorsed' : 'Rejected'}`)
        refreshData()
    }

    const handleOpenIssueModal = (req) => {
        setSelectedRequisition(req)
        const initialAllocations = {}
        req.items.forEach((it) => {
            initialAllocations[it.id] = it.requestedQty
        })
        setAllocationForm(initialAllocations)
        setShowIssueModal(true)
    }

    const handleConfirmIssue = (e) => {
        e.preventDefault()
        if (!selectedRequisition) return

        const itemAllocations = selectedRequisition.items.map((it) => ({
            id: it.id,
            issuedQty: Number(allocationForm[it.id] || it.requestedQty)
        }))

        issueStoreItems(selectedRequisition.id, {
            issuedBy: `${currentUserName} (Storekeeper)`,
            itemAllocations,
            remarks: allocationRemarks || 'Stock issued from Central Store Bay'
        })

        toast.success(`Store Issue Slip generated for ${selectedRequisition.id}`)
        setShowIssueModal(false)
        refreshData()
    }

    const handleCollect = (reqId) => {
        acknowledgeStoreCollection(reqId, { collectorName: currentUserName })
        toast.success(`Items collected successfully for ${reqId}`)
        refreshData()
    }

    const handleOpenDrawer = (req) => {
        setSelectedRequisition(req)
        setDrawerOpen(true)
    }

    const handleExport = (format) => {
        exportDataset({
            format,
            filename: `Store_Requisitions_${new Date().toISOString().slice(0, 10)}`,
            columns: [
                { key: 'id', label: 'Requisition ID' },
                { key: 'issueSlipNumber', label: 'Issue Slip #' },
                { key: 'requestedBy', label: 'Requested By' },
                { key: 'department', label: 'Department' },
                { key: 'purpose', label: 'Purpose' },
                { key: 'priority', label: 'Priority' },
                { key: 'status', label: 'Status' },
                { key: 'requestDate', label: 'Date' }
            ],
            data: requisitions,
            moduleName: 'StoreRequisition'
        })
        toast.info(`Exporting ${format.toUpperCase()} report...`)
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-100 p-6 rounded-2xl shadow-xs">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                            <Store className="w-6 h-6" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Internal Store Requisitions & Inventory Desk</h1>
                            <p className="text-xs text-slate-600 mt-0.5">
                                Campus Stock Catalog, Multi-Item Material Requisitions, HOD Endorsements & Store Issue Slips (ISS-2026-XXXX)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => setActiveTab('basket')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition relative"
                    >
                        <ShoppingCart className="w-4 h-4" /> Requisition Basket
                        {basket.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-white text-emerald-800 rounded-full">
                                {basket.reduce((sum, b) => sum + b.quantity, 0)}
                            </span>
                        )}
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
                    title="Active Catalog SKUs"
                    metric={totalItemsCount}
                    subtext="Campus Store Inventory"
                    icon={Package}
                    tone="blue"
                />
                <EnterpriseKpiCard
                    title="Low Stock Warnings"
                    metric={lowStockCount}
                    subtext="Buffer Level Reached"
                    icon={AlertTriangle}
                    tone={lowStockCount > 0 ? 'amber' : 'emerald'}
                />
                <EnterpriseKpiCard
                    title="My Active Requisitions"
                    metric={myActiveReqs}
                    subtext="In Progress / Fulfilling"
                    icon={ClipboardList}
                    tone="blue"
                />
                <EnterpriseKpiCard
                    title="Pending HOD Endorsement"
                    metric={pendingHodCount}
                    subtext="Awaiting Dept Review"
                    icon={Clock}
                    tone="amber"
                />
                <EnterpriseKpiCard
                    title="Ready for Store Pickup"
                    metric={readyForPickupCount}
                    subtext="Packaged at Store Bay"
                    icon={CheckCircle2}
                    tone="emerald"
                />
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1">
                {[
                    { id: 'catalog', label: 'Store Item Catalog', icon: Package },
                    { id: 'basket', label: `Requisition Cart (${basket.length})`, icon: ShoppingCart },
                    { id: 'my-requests', label: 'My Requisitions & History', icon: ClipboardList },
                    { id: 'hod-approvals', label: 'HOD Department Endorsements', icon: CheckCircle2 },
                    { id: 'store-desk', label: 'Storekeeper Issue Desk', icon: Store }
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
                                    ? 'bg-white border-t-2 border-l border-r border-emerald-600 text-emerald-800 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            <Icon className="w-4 h-4" /> {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* VIEW 1: Store Item Catalog Shopping View */}
            {activeTab === 'catalog' && (
                <div className="space-y-6">
                    {/* Search & Category Filter */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search stationery, lab items, chemicals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
                            {STORE_CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition ${
                                        selectedCategory === cat
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Catalog Grid Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredCatalog.map((item) => {
                            const isOutOfStock = item.inStock <= 0
                            const isLowStock = item.inStock <= item.lowStockThreshold && !isOutOfStock
                            return (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between space-y-3"
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono font-bold text-slate-400">{item.id}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                isOutOfStock
                                                    ? 'bg-rose-100 text-rose-700'
                                                    : isLowStock
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {isOutOfStock ? 'Out of Stock' : `${item.inStock} ${item.unit} Available`}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-2">{item.name}</h4>
                                        <p className="text-[11px] text-slate-500 mt-1">{item.category}</p>
                                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">Location: <strong>{item.bin}</strong></p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700">₹{item.unitCost} / {item.unit}</span>
                                        <button
                                            type="button"
                                            disabled={isOutOfStock}
                                            onClick={() => addToBasket(item)}
                                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg shadow-xs transition ${
                                                isOutOfStock
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            }`}
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Request Item
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* VIEW 2: Requisition Cart / Basket */}
            {activeTab === 'basket' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-emerald-600" />
                            <h3 className="text-lg font-bold text-slate-900">Your Requisition Basket</h3>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                            {basket.length} {basket.length === 1 ? 'item' : 'items'} selected
                        </span>
                    </div>

                    {basket.length === 0 ? (
                        <div className="py-12 text-center space-y-3">
                            <Package className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-sm font-semibold text-slate-600">Your requisition basket is empty</p>
                            <p className="text-xs text-slate-400">Browse the store catalog and select items required for your department.</p>
                            <button
                                type="button"
                                onClick={() => setActiveTab('catalog')}
                                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                            >
                                Browse Store Catalog
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitBasket} className="space-y-6">
                            {/* Basket Table */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                                        <tr>
                                            <th className="py-3 px-4">Item Name</th>
                                            <th className="py-3 px-4">Shelf Bin</th>
                                            <th className="py-3 px-4 text-center">Available</th>
                                            <th className="py-3 px-4 text-center">Requested Qty</th>
                                            <th className="py-3 px-4 text-right">Remove</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {basket.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50">
                                                <td className="py-3 px-4 font-semibold text-slate-800">{item.name}</td>
                                                <td className="py-3 px-4 font-mono text-slate-500">{item.bin}</td>
                                                <td className="py-3 px-4 text-center font-bold text-emerald-700">{item.inStock} {item.unit}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateBasketQty(item.id, item.quantity - 1)}
                                                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="w-8 text-center font-bold text-slate-900">{item.quantity}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateBasketQty(item.id, item.quantity + 1)}
                                                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFromBasket(item.id)}
                                                        className="text-rose-500 hover:text-rose-700 p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4 inline" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Requisition Meta Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Department</label>
                                    <select
                                        value={targetDepartment}
                                        onChange={(e) => setTargetDepartment(e.target.value)}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    >
                                        <option>Academic - Mathematics</option>
                                        <option>Academic - Science</option>
                                        <option>IT Support</option>
                                        <option>Maintenance</option>
                                        <option>Housekeeping</option>
                                        <option>Front Office</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Priority / Urgency</label>
                                    <select
                                        value={requisitionPriority}
                                        onChange={(e) => setRequisitionPriority(e.target.value)}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    >
                                        <option value="Routine">Routine (Standard 2-3 Day Delivery)</option>
                                        <option value="High">High (Next Day Requirement)</option>
                                        <option value="Urgent">Urgent (Immediate Exam / Lab Need)</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Official Purpose & Justification</label>
                                    <textarea
                                        rows="2"
                                        required
                                        placeholder="e.g. Annual examination answer booklets and science practical titrations"
                                        value={requisitionPurpose}
                                        onChange={(e) => setRequisitionPurpose(e.target.value)}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => setBasket([])}
                                    className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                                >
                                    Clear Cart
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                                >
                                    <Send className="w-4 h-4" /> Submit Requisition to Store
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* VIEW 3: My Requisitions & History */}
            {activeTab === 'my-requests' && (
                <div className="space-y-4">
                    {requisitions.map((req) => (
                        <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">{req.id}</span>
                                        {req.issueSlipNumber && (
                                            <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded">
                                                Slip: {req.issueSlipNumber}
                                            </span>
                                        )}
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                            req.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {req.priority}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-800">Purpose: {req.purpose}</p>
                                    <p className="text-[11px] text-slate-500">Dept: <strong>{req.department}</strong> | Requested by: <strong>{req.requestedBy}</strong> ({req.requestDate})</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenDrawer(req)}
                                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                                    >
                                        Details
                                    </button>
                                    {req.issueSlipNumber && (
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedRequisition(req); setShowVoucherModal(true) }}
                                            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition flex items-center gap-1"
                                        >
                                            <Printer className="w-3.5 h-3.5" /> Issue Slip
                                        </button>
                                    )}
                                    {req.status === 'READY_FOR_COLLECTION' && (
                                        <button
                                            type="button"
                                            onClick={() => handleCollect(req.id)}
                                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
                                        >
                                            Confirm Collection
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Stepper Progress */}
                            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                                {[
                                    { label: '1. Submitted', done: req.stageIndex >= 0 },
                                    { label: '2. HOD Endorsed', done: req.stageIndex >= 1 },
                                    { label: '3. Store Issue Slip', done: req.stageIndex >= 3 },
                                    { label: '4. Collected', done: req.stageIndex >= 4 }
                                ].map((step, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-2 rounded-lg font-bold border ${
                                            step.done
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-slate-50 text-slate-400 border-slate-200'
                                        }`}
                                    >
                                        {step.label}
                                    </div>
                                ))}
                            </div>

                            {/* Item Breakdown */}
                            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1.5">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Requested Items:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {req.items.map((it, idx) => (
                                        <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 text-xs flex justify-between">
                                            <span className="font-medium text-slate-800 truncate pr-2">{it.name}</span>
                                            <span className="font-bold text-slate-900 whitespace-nowrap">
                                                {it.issuedQty > 0 ? `${it.issuedQty} / ${it.requestedQty}` : it.requestedQty} {it.unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* VIEW 4: HOD Approvals Desk */}
            {activeTab === 'hod-approvals' && (
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                        <span>Pending Department Endorsements requiring HOD sign-off before reaching Storekeeper.</span>
                        <span className="font-bold">{pendingHodCount} Pending</span>
                    </div>

                    {requisitions.filter((r) => r.status === 'SUBMITTED').map((req) => (
                        <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div>
                                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">{req.id}</span>
                                    <h4 className="text-sm font-bold text-slate-900 mt-1">{req.purpose}</h4>
                                    <p className="text-xs text-slate-500">
                                        Faculty Member: <strong>{req.requestedBy}</strong> | Department: <strong>{req.department}</strong>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleEndorse(req.id, true)}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                                    >
                                        Endorse Request
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleEndorse(req.id, false)}
                                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[11px] font-bold text-slate-500 uppercase">Items Requested:</p>
                                <div className="space-y-1">
                                    {req.items.map((it, idx) => (
                                        <div key={idx} className="flex justify-between text-xs bg-slate-50 p-2 rounded border border-slate-200">
                                            <span className="font-medium text-slate-800">{it.name}</span>
                                            <span className="font-bold text-slate-900">{it.requestedQty} {it.unit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* VIEW 5: Storekeeper Issue Desk */}
            {activeTab === 'store-desk' && (
                <div className="space-y-4">
                    <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl text-xs text-sky-900 flex items-center justify-between">
                        <span>Incoming endorsed requisitions ready for physical stock packaging and Issue Slip voucher generation.</span>
                        <span className="font-bold">Store Fulfillment Queue</span>
                    </div>

                    {requisitions.filter((r) => r.status === 'HOD_ENDORSED' || r.status === 'READY_FOR_COLLECTION').map((req) => (
                        <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded">{req.id}</span>
                                        {req.issueSlipNumber && (
                                            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                                                {req.issueSlipNumber}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 mt-1">{req.purpose}</h4>
                                    <p className="text-xs text-slate-500">Recipient: <strong>{req.requestedBy}</strong> ({req.department})</p>
                                </div>
                                <div>
                                    {req.status === 'HOD_ENDORSED' ? (
                                        <button
                                            type="button"
                                            onClick={() => handleOpenIssueModal(req)}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                                        >
                                            Generate Store Issue Slip
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedRequisition(req); setShowVoucherModal(true) }}
                                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5"
                                        >
                                            <Printer className="w-3.5 h-3.5" /> Print Issue Slip
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                {req.items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between text-xs bg-slate-50 p-2 rounded border border-slate-200">
                                        <span className="font-medium text-slate-800">{it.name}</span>
                                        <span className="font-bold text-slate-900">
                                            Requested: {it.requestedQty} {it.unit} {it.issuedQty > 0 && `| Issued: ${it.issuedQty} ${it.unit}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Slide-Over Record Detail Drawer */}
            {selectedRequisition && (
                <RecordDetailDrawer
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    title={selectedRequisition.purpose}
                    subtitle={`Requisition ID: ${selectedRequisition.id} | Department: ${selectedRequisition.department}`}
                    recordId={selectedRequisition.issueSlipNumber || selectedRequisition.id}
                    status={selectedRequisition.status}
                    overviewFields={[
                        { label: 'Requisition ID', value: selectedRequisition.id },
                        { label: 'Store Issue Slip #', value: selectedRequisition.issueSlipNumber || 'Pending Allocation' },
                        { label: 'Requested By', value: selectedRequisition.requestedBy },
                        { label: 'Department', value: selectedRequisition.department },
                        { label: 'Priority', value: selectedRequisition.priority },
                        { label: 'Date Requested', value: selectedRequisition.requestDate },
                        { label: 'HOD Endorsement', value: selectedRequisition.hodEndorsement ? `${selectedRequisition.hodEndorsement.status} by ${selectedRequisition.hodEndorsement.endorser}` : 'Pending' },
                        { label: 'Collection Status', value: selectedRequisition.collectedBy ? `Collected by ${selectedRequisition.collectedBy} on ${selectedRequisition.collectedTimestamp}` : 'Awaiting Pickup' }
                    ]}
                    timelineSteps={[
                        { tier: 'Requisition Submitted', status: 'Submitted', approver: selectedRequisition.requestedBy, timestamp: selectedRequisition.requestDate, notes: selectedRequisition.purpose },
                        ...(selectedRequisition.hodEndorsement ? [{ tier: 'HOD Department Endorsement', status: selectedRequisition.hodEndorsement.status, approver: selectedRequisition.hodEndorsement.endorser, timestamp: selectedRequisition.hodEndorsement.timestamp, notes: selectedRequisition.hodEndorsement.notes }] : []),
                        ...(selectedRequisition.storeIssue ? [{ tier: 'Store Issue Allocation', status: 'Approved', approver: selectedRequisition.storeIssue.issuedBy, timestamp: selectedRequisition.storeIssue.timestamp, notes: selectedRequisition.storeIssue.notes }] : []),
                        ...(selectedRequisition.collectedBy ? [{ tier: 'Physical Handover', status: 'Completed', approver: selectedRequisition.collectedBy, timestamp: selectedRequisition.collectedTimestamp, notes: 'Materials collected from counter' }] : [])
                    ]}
                    activityEvents={[
                        { action: 'STORE_REQUISITION_LIFECYCLE', timestamp: selectedRequisition.requestDate, userName: selectedRequisition.requestedBy, userRole: selectedRequisition.requestingRole, status: 'SUCCESS', description: `Lifecycle step for ${selectedRequisition.id}` }
                    ]}
                    actions={
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(false)}
                            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                        >
                            Close
                        </button>
                    }
                />
            )}

            {/* MODAL 1: Store Issue Allocation Modal */}
            {showIssueModal && selectedRequisition && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Storekeeper Issue Desk: {selectedRequisition.id}</h3>
                        <p className="text-xs text-slate-500">
                            Allocate stock from shelf bins to fulfill requisition for <strong>{selectedRequisition.requestedBy}</strong>.
                        </p>
                        <form onSubmit={handleConfirmIssue} className="space-y-4">
                            <div className="space-y-3">
                                {selectedRequisition.items.map((it) => (
                                    <div key={it.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                                        <div className="text-xs">
                                            <p className="font-bold text-slate-900">{it.name}</p>
                                            <p className="text-slate-500">Requested: {it.requestedQty} {it.unit}</p>
                                        </div>
                                        <div className="w-28">
                                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Quantity to Issue</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={it.requestedQty}
                                                value={allocationForm[it.id] !== undefined ? allocationForm[it.id] : it.requestedQty}
                                                onChange={(e) => setAllocationForm({ ...allocationForm, [it.id]: e.target.value })}
                                                className="w-full text-xs p-1.5 rounded border border-slate-300 font-bold text-center"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Storekeeper Remarks</label>
                                <textarea
                                    rows="2"
                                    placeholder="Storage bin notes or packaging details"
                                    value={allocationRemarks}
                                    onChange={(e) => setAllocationRemarks(e.target.value)}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowIssueModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                                >
                                    Generate Store Issue Slip
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: Printable Store Issue Slip Voucher */}
            {showVoucherModal && selectedRequisition && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="border-b-2 border-emerald-800 pb-4 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">DELHI PUBLIC INSTITUTIONS</h2>
                                <p className="text-xs text-slate-500">Central Stores & Stationery Warehouse</p>
                                <p className="text-xs text-slate-500">Internal Material Requisition Issue Slip</p>
                            </div>
                            <div className="text-right">
                                <span className="bg-emerald-700 text-white text-xs font-black uppercase px-3 py-1 rounded">
                                    STORE ISSUE SLIP
                                </span>
                                <p className="text-sm font-mono font-bold text-slate-900 mt-2">{selectedRequisition.issueSlipNumber || 'ISS-DRAFT'}</p>
                                <p className="text-xs text-slate-500">Date: {selectedRequisition.requestDate}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div>
                                <p className="text-slate-500">Recipient Employee:</p>
                                <p className="font-bold text-slate-900">{selectedRequisition.requestedBy}</p>
                                <p className="text-slate-600">Department: {selectedRequisition.department}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Requisition Purpose:</p>
                                <p className="font-bold text-slate-900">{selectedRequisition.purpose}</p>
                                <p className="text-slate-600">Priority: {selectedRequisition.priority}</p>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                                    <tr>
                                        <th className="py-2.5 px-3">Item Description</th>
                                        <th className="py-2.5 px-3 text-right">Requested</th>
                                        <th className="py-2.5 px-3 text-right">Issued Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedRequisition.items.map((it, idx) => (
                                        <tr key={idx}>
                                            <td className="py-2.5 px-3 font-medium text-slate-800">{it.name}</td>
                                            <td className="py-2.5 px-3 text-right">{it.requestedQty} {it.unit}</td>
                                            <td className="py-2.5 px-3 text-right font-bold text-emerald-800">{it.issuedQty || it.requestedQty} {it.unit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
                            <div>
                                <p className="font-semibold text-slate-900">Issued by Storekeeper:</p>
                                <p className="mt-8 border-t border-slate-300 pt-1 text-[11px]">{selectedRequisition.storeIssue?.issuedBy || 'Priya Sundaram (Storekeeper)'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">Received by Employee:</p>
                                <p className="mt-8 border-t border-slate-300 pt-1 text-[11px]">Signature & Date</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowVoucherModal(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => { window.print(); setShowVoucherModal(false) }}
                                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5"
                            >
                                <Printer className="w-3.5 h-3.5" /> Print Store Voucher
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
