import React, { useState, useMemo } from 'react'
import {
    ShoppingCart,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Truck,
    Building2,
    Archive,
    Plus,
    Search,
    Filter,
    Download,
    Eye,
    Printer,
    DollarSign,
    Layers,
    ChevronRight,
    AlertTriangle,
    Tag,
    ShieldAlert,
    CheckSquare,
    ExternalLink
} from 'lucide-react'
import { toast } from 'react-toastify'
import { EnterpriseKpiCard, RecordDetailDrawer, exportDataset } from '../ui'
import { useAuth } from '../../context/AuthContext'
import {
    getProcurementRequests,
    getProcurementVendors,
    createPurchaseIndent,
    submitQuotationsForIndent,
    approvePurchaseWorkflow,
    rejectPurchaseWorkflow,
    dispatchPurchaseOrder,
    reconcileGoodsReceipt
} from './procurementData'

export default function PurchaseWorkflowWorkspace({ roleOverride = null }) {
    const { role: authRole, name: authName } = useAuth()
    const activeRole = roleOverride || authRole || 'it-support-manager'
    const currentUserName = authName || 'Procurement Officer'

    const [requests, setRequests] = useState(() => getProcurementRequests())
    const [vendors, setVendors] = useState(() => getProcurementVendors())
    const [activeTab, setActiveTab] = useState('pipeline')
    const [searchQuery, setSearchQuery] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('All')

    // Modals state
    const [showIndentModal, setShowIndentModal] = useState(false)
    const [showQuoteModal, setShowQuoteModal] = useState(false)
    const [showApproveModal, setShowApproveModal] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [showDispatchModal, setShowDispatchModal] = useState(false)
    const [showGrnModal, setShowGrnModal] = useState(false)
    const [showPoPrintModal, setShowPoPrintModal] = useState(false)

    const [selectedRequest, setSelectedRequest] = useState(null)
    const [drawerOpen, setDrawerOpen] = useState(false)

    // Form inputs for modals
    const [indentForm, setIndentForm] = useState({
        title: '',
        department: 'IT Support',
        priority: 'High',
        itemDesc: '',
        qty: 1,
        unit: 'pcs',
        unitPrice: 5000,
        notes: ''
    })

    const [quoteForm, setQuoteForm] = useState({
        vendor: '',
        quoteAmount: '',
        deliveryDays: 7,
        warrantyYears: 2,
        notes: ''
    })

    const [approvalForm, setApprovalForm] = useState({
        tier: 'HOD',
        notes: 'Approved after specifications review'
    })

    const [rejectionForm, setRejectionForm] = useState({
        tier: 'HOD',
        reason: ''
    })

    const [dispatchForm, setDispatchForm] = useState({
        carrierName: 'BlueDart Express',
        trackingNumber: '',
        deliveryDueDate: ''
    })

    const [grnForm, setGrnForm] = useState({
        receivedQty: 1,
        acceptedQty: 1,
        rejectedQty: 0,
        rejectionReason: '',
        storageLocation: 'Central Warehouse Rack A-1'
    })

    const refreshData = () => {
        setRequests(getProcurementRequests())
        setVendors(getProcurementVendors())
    }

    const filteredRequests = useMemo(() => {
        return requests.filter((r) => {
            const matchesQuery = !searchQuery ||
                r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.poNumber && r.poNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.selectedVendor && r.selectedVendor.toLowerCase().includes(searchQuery.toLowerCase()))

            const matchesPriority = priorityFilter === 'All' || r.priority === priorityFilter
            return matchesQuery && matchesPriority
        })
    }, [requests, searchQuery, priorityFilter])

    // KPIs
    const totalSpend = useMemo(() => {
        return requests
            .filter((r) => r.stage !== 'REJECTED')
            .reduce((acc, r) => acc + (Number(r.estimatedCost) || 0), 0)
    }, [requests])

    const activeIndents = useMemo(() => {
        return requests.filter((r) => r.stage === 'INDENT_SUBMITTED' || r.stage === 'QUOTATION_PENDING' || r.stage === 'QUOTATIONS_RECEIVED').length
    }, [requests])

    const awaitingApproval = useMemo(() => {
        return requests.filter((r) => ['QUOTATIONS_RECEIVED', 'HOD_APPROVED', 'FINANCE_APPROVED'].includes(r.stage)).length
    }, [requests])

    const inTransitCount = useMemo(() => {
        return requests.filter((r) => r.stage === 'DISPATCHED').length
    }, [requests])

    const verifiedGrnCount = useMemo(() => {
        return requests.filter((r) => r.stage === 'GRN_VERIFIED').length
    }, [requests])

    const handleOpenDrawer = (request) => {
        setSelectedRequest(request)
        setDrawerOpen(true)
    }

    const handleCreateIndent = (e) => {
        e.preventDefault()
        if (!indentForm.title || !indentForm.itemDesc) {
            toast.error('Please enter title and item details')
            return
        }

        createPurchaseIndent({
            title: indentForm.title,
            department: indentForm.department,
            requestedBy: currentUserName,
            priority: indentForm.priority,
            notes: indentForm.notes,
            items: [
                {
                    description: indentForm.itemDesc,
                    qty: Number(indentForm.qty),
                    unit: indentForm.unit,
                    unitPrice: Number(indentForm.unitPrice)
                }
            ]
        })

        toast.success('Purchase Indent created successfully')
        setShowIndentModal(false)
        setIndentForm({
            title: '',
            department: 'IT Support',
            priority: 'High',
            itemDesc: '',
            qty: 1,
            unit: 'pcs',
            unitPrice: 5000,
            notes: ''
        })
        refreshData()
    }

    const handleAddQuote = (e) => {
        e.preventDefault()
        if (!selectedRequest || !quoteForm.vendor || !quoteForm.quoteAmount) {
            toast.error('Please fill quotation details')
            return
        }

        const newQuote = {
            vendor: quoteForm.vendor,
            quoteAmount: Number(quoteForm.quoteAmount),
            deliveryDays: Number(quoteForm.deliveryDays),
            warrantyYears: Number(quoteForm.warrantyYears),
            isL1: true,
            notes: quoteForm.notes
        }

        const existingQuotes = (selectedRequest.quotations || []).map((q) => ({ ...q, isL1: false }))
        const allQuotes = [newQuote, ...existingQuotes]

        submitQuotationsForIndent(selectedRequest.id, allQuotes, quoteForm.vendor)
        toast.success(`Quotation submitted for ${selectedRequest.id}`)
        setShowQuoteModal(false)
        refreshData()
    }

    const handleApprove = (e) => {
        e.preventDefault()
        if (!selectedRequest) return

        approvePurchaseWorkflow(selectedRequest.id, {
            tier: approvalForm.tier,
            approver: currentUserName,
            notes: approvalForm.notes
        })

        toast.success(`Approved ${selectedRequest.id} by ${approvalForm.tier}`)
        setShowApproveModal(false)
        refreshData()
    }

    const handleReject = (e) => {
        e.preventDefault()
        if (!selectedRequest || !rejectionForm.reason.trim()) {
            toast.error('Rejection reason is required')
            return
        }

        rejectPurchaseWorkflow(selectedRequest.id, {
            tier: rejectionForm.tier,
            rejector: currentUserName,
            reason: rejectionForm.reason
        })

        toast.warning(`Purchase request ${selectedRequest.id} rejected`)
        setShowRejectModal(false)
        refreshData()
    }

    const handleDispatch = (e) => {
        e.preventDefault()
        if (!selectedRequest || !dispatchForm.trackingNumber) {
            toast.error('Tracking number is required')
            return
        }

        dispatchPurchaseOrder(selectedRequest.id, {
            carrierName: dispatchForm.carrierName,
            trackingNumber: dispatchForm.trackingNumber,
            deliveryDueDate: dispatchForm.deliveryDueDate || '2026-11-30'
        })

        toast.success(`PO ${selectedRequest.poNumber} marked as dispatched`)
        setShowDispatchModal(false)
        refreshData()
    }

    const handleReconcileGrn = (e) => {
        e.preventDefault()
        if (!selectedRequest) return

        reconcileGoodsReceipt(selectedRequest.id, {
            receivedQty: grnForm.receivedQty,
            acceptedQty: grnForm.acceptedQty,
            rejectedQty: grnForm.rejectedQty,
            rejectionReason: grnForm.rejectionReason,
            inspector: currentUserName,
            storageLocation: grnForm.storageLocation
        })

        toast.success(`GRN 3-Way Match verified for ${selectedRequest.poNumber}`)
        setShowGrnModal(false)
        refreshData()
    }

    const handleExport = (format) => {
        exportDataset({
            format,
            filename: `Procurement_Purchase_Orders_${new Date().toISOString().slice(0, 10)}`,
            columns: [
                { key: 'id', label: 'Indent ID' },
                { key: 'poNumber', label: 'PO Number' },
                { key: 'title', label: 'Title / Description' },
                { key: 'department', label: 'Department' },
                { key: 'stage', label: 'Stage' },
                { key: 'priority', label: 'Priority' },
                { key: 'estimatedCost', label: 'Amount (INR)' },
                { key: 'selectedVendor', label: 'Vendor' },
                { key: 'requestDate', label: 'Date' }
            ],
            data: filteredRequests,
            moduleName: 'Procurement'
        })
        toast.info(`Exporting ${format.toUpperCase()} report...`)
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-100 p-6 rounded-2xl shadow-xs">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-sky-600 text-white rounded-xl shadow-xs">
                            <ShoppingCart className="w-6 h-6" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Commercial Procurement & Purchase Orders</h1>
                            <p className="text-xs text-slate-600 mt-0.5">
                                External Supplier Purchasing, RFQs, 3-Vendor Quotation Matrices, Multi-Tier Financial Approvals & GRN Reconciliation
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => setShowIndentModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl shadow-xs transition"
                    >
                        <Plus className="w-4 h-4" /> New Purchase Indent
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
                    title="Total Procurement Spend"
                    metric={`₹${totalSpend.toLocaleString('en-IN')}`}
                    subtext="All Approved & Active POs"
                    icon={DollarSign}
                    tone="blue"
                />
                <EnterpriseKpiCard
                    title="Active Indents / RFQ"
                    metric={activeIndents}
                    subtext="Market Bidding in Progress"
                    icon={ShoppingCart}
                    tone="blue"
                />
                <EnterpriseKpiCard
                    title="Awaiting Approval"
                    metric={awaitingApproval}
                    subtext="HOD & Finance Verification"
                    icon={Clock}
                    tone="amber"
                />
                <EnterpriseKpiCard
                    title="In-Transit Deliveries"
                    metric={inTransitCount}
                    subtext="Dispatched by Suppliers"
                    icon={Truck}
                    tone="blue"
                />
                <EnterpriseKpiCard
                    title="Verified GRN Deliveries"
                    metric={verifiedGrnCount}
                    subtext="3-Way Matched & Stocked"
                    icon={Archive}
                    tone="emerald"
                />
            </div>

            {/* Main Tabs Navigation */}
            <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1">
                {[
                    { id: 'pipeline', label: 'Procurement Pipeline', icon: Layers },
                    { id: 'indents', label: 'Purchase Indents', icon: ShoppingCart },
                    { id: 'quotations', label: 'RFQ & Quotation Matrix', icon: FileText },
                    { id: 'purchase-orders', label: 'Purchase Orders (PO)', icon: CheckSquare },
                    { id: 'deliveries', label: 'Order Tracking & Deliveries', icon: Truck },
                    { id: 'grn', label: 'Goods Receipt (GRN)', icon: Archive },
                    { id: 'vendors', label: 'Approved Vendor Directory', icon: Building2 }
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
                                    ? 'bg-white border-t-2 border-l border-r border-sky-600 text-sky-800 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            <Icon className="w-4 h-4" /> {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by title, PO#, vendor, dept..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5" /> Priority:
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
                        >
                            <option value="All">All Priorities</option>
                            <option value="Urgent">Urgent</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </label>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs font-semibold text-slate-500">
                        Showing <strong>{filteredRequests.length}</strong> records
                    </span>
                </div>
            </div>

            {/* Tab Views */}

            {/* VIEW 1: Pipeline Kanban / Stepper */}
            {activeTab === 'pipeline' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stage 1: Indent / RFQ */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">1. Indent & RFQ Stage</h3>
                            <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                {requests.filter((r) => ['INDENT_SUBMITTED', 'QUOTATIONS_RECEIVED'].includes(r.stage)).length}
                            </span>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto">
                            {requests.filter((r) => ['INDENT_SUBMITTED', 'QUOTATIONS_RECEIVED'].includes(r.stage)).map((req) => (
                                <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-sky-300 transition space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">{req.id}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${req.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {req.priority}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{req.title}</h4>
                                    <p className="text-[11px] text-slate-500">Dept: <strong>{req.department}</strong></p>
                                    <p className="text-xs font-bold text-slate-800">₹{req.estimatedCost.toLocaleString('en-IN')}</p>
                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenDrawer(req)}
                                            className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> View
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedRequest(req); setShowQuoteModal(true) }}
                                            className="text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 px-2.5 py-1 rounded-md"
                                        >
                                            Add Quotes
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stage 2: Multi-Tier Approvals */}
                    <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">2. Financial Approvals</h3>
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                {requests.filter((r) => ['QUOTATIONS_RECEIVED', 'HOD_APPROVED', 'FINANCE_APPROVED'].includes(r.stage)).length}
                            </span>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto">
                            {requests.filter((r) => ['QUOTATIONS_RECEIVED', 'HOD_APPROVED', 'FINANCE_APPROVED'].includes(r.stage)).map((req) => (
                                <div key={req.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">{req.id}</span>
                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                            {req.stage.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{req.title}</h4>
                                    <p className="text-[11px] text-slate-500">L1 Vendor: <strong>{req.selectedVendor || 'Comparing'}</strong></p>
                                    <p className="text-xs font-bold text-slate-800">₹{req.estimatedCost.toLocaleString('en-IN')}</p>
                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenDrawer(req)}
                                            className="text-xs font-semibold text-slate-600 hover:text-slate-800"
                                        >
                                            Details
                                        </button>
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedRequest(req); setShowApproveModal(true) }}
                                                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedRequest(req); setShowRejectModal(true) }}
                                                className="text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 px-2 py-1 rounded"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stage 3: PO Issued & In-Transit */}
                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-200 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">3. Issued & Dispatched</h3>
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                {requests.filter((r) => ['PO_ISSUED', 'DISPATCHED'].includes(r.stage)).length}
                            </span>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto">
                            {requests.filter((r) => ['PO_ISSUED', 'DISPATCHED'].includes(r.stage)).map((req) => (
                                <div key={req.id} className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-mono font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded">{req.poNumber || req.id}</span>
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                            {req.stage === 'DISPATCHED' ? 'In Transit' : 'PO Issued'}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{req.title}</h4>
                                    <p className="text-[11px] text-slate-500">Carrier: <strong>{req.carrierName || 'Awaiting Dispatch'}</strong></p>
                                    <p className="text-xs font-bold text-slate-800">₹{req.estimatedCost.toLocaleString('en-IN')}</p>
                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedRequest(req); setShowPoPrintModal(true) }}
                                            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                                        >
                                            <Printer className="w-3.5 h-3.5" /> PO Print
                                        </button>
                                        {req.stage === 'PO_ISSUED' ? (
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedRequest(req); setShowDispatchModal(true) }}
                                                className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded"
                                            >
                                                Dispatch
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedRequest(req); setShowGrnModal(true) }}
                                                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded"
                                            >
                                                Log GRN
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stage 4: GRN Verified */}
                    <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">4. GRN Verified & Done</h3>
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                {requests.filter((r) => r.stage === 'GRN_VERIFIED').length}
                            </span>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto">
                            {requests.filter((r) => r.stage === 'GRN_VERIFIED').map((req) => (
                                <div key={req.id} className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">{req.poNumber}</span>
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Matched
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{req.title}</h4>
                                    <p className="text-[11px] text-slate-500">GRN: <strong>{req.grn?.grnNumber}</strong> ({req.grn?.receivedDate})</p>
                                    <p className="text-xs font-bold text-slate-800">₹{req.estimatedCost.toLocaleString('en-IN')}</p>
                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenDrawer(req)}
                                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                                        >
                                            View Audit Report
                                        </button>
                                        <span className="text-[11px] text-slate-400 font-mono">100% Stocked</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 2: Purchase Orders Tabular Register */}
            {activeTab === 'purchase-orders' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                                    <th className="py-3.5 px-4">PO Number</th>
                                    <th className="py-3.5 px-4">Indent ID</th>
                                    <th className="py-3.5 px-4">Title / Purpose</th>
                                    <th className="py-3.5 px-4">Department</th>
                                    <th className="py-3.5 px-4">Selected Vendor</th>
                                    <th className="py-3.5 px-4">Amount (INR)</th>
                                    <th className="py-3.5 px-4">Status / Stage</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-3.5 px-4 font-mono font-bold text-sky-800">
                                            {req.poNumber || <span className="text-slate-400 italic font-normal">Pending Issuance</span>}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-slate-500">{req.id}</td>
                                        <td className="py-3.5 px-4 font-semibold text-slate-800 max-w-xs truncate">{req.title}</td>
                                        <td className="py-3.5 px-4 text-slate-600">{req.department}</td>
                                        <td className="py-3.5 px-4 font-medium text-slate-700">{req.selectedVendor || 'TBD'}</td>
                                        <td className="py-3.5 px-4 font-bold text-slate-900">₹{req.estimatedCost.toLocaleString('en-IN')}</td>
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                                req.stage === 'GRN_VERIFIED'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : req.stage === 'DISPATCHED'
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    : req.stage === 'REJECTED'
                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {req.stage.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenDrawer(req)}
                                                className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md transition"
                                            >
                                                View
                                            </button>
                                            {req.poNumber && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setSelectedRequest(req); setShowPoPrintModal(true) }}
                                                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                                                    title="Print Purchase Order"
                                                >
                                                    <Printer className="w-3.5 h-3.5 inline" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VIEW 3: RFQ & Quotation Matrix */}
            {activeTab === 'quotations' && (
                <div className="space-y-6">
                    {filteredRequests.filter((r) => (r.quotations && r.quotations.length > 0) || r.stage === 'INDENT_SUBMITTED').map((req) => (
                        <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">{req.id}</span>
                                        <h3 className="text-sm font-bold text-slate-900">{req.title}</h3>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">Department: <strong>{req.department}</strong> | Budget: <strong>₹{req.estimatedCost.toLocaleString('en-IN')}</strong></p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedRequest(req); setShowQuoteModal(true) }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-xs"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Quotation Bid
                                </button>
                            </div>

                            {/* Side-by-Side Quotation Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(req.quotations || []).map((quote, qIdx) => (
                                    <div
                                        key={qIdx}
                                        className={`rounded-xl p-4 border relative ${
                                            quote.isL1
                                                ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20'
                                                : 'bg-slate-50 border-slate-200'
                                        }`}
                                    >
                                        {quote.isL1 && (
                                            <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                                ★ L1 Recommended
                                            </span>
                                        )}
                                        <h4 className="text-xs font-bold text-slate-900">{quote.vendor}</h4>
                                        <p className="text-lg font-black text-slate-900 mt-2">₹{quote.quoteAmount.toLocaleString('en-IN')}</p>
                                        <div className="text-xs text-slate-600 mt-2 space-y-1">
                                            <p>Delivery: <strong>{quote.deliveryDays} business days</strong></p>
                                            <p>Warranty: <strong>{quote.warrantyYears} Years Onsite</strong></p>
                                            {quote.notes && <p className="italic text-slate-500 text-[11px] mt-1">"{quote.notes}"</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* VIEW 4: Deliveries & Logistics Tracking */}
            {activeTab === 'deliveries' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                    <h3 className="text-base font-bold text-slate-900">Active Supplier Shipments & Order Fulfillment</h3>
                    <div className="space-y-4">
                        {filteredRequests.filter((r) => ['PO_ISSUED', 'DISPATCHED', 'DELIVERED', 'GRN_VERIFIED'].includes(r.stage)).map((req) => (
                            <div key={req.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-sky-800">{req.poNumber || req.id}</span>
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                            req.stage === 'GRN_VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {req.stage === 'GRN_VERIFIED' ? 'Delivered & Accepted' : 'In Transit'}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-800">{req.title}</h4>
                                    <p className="text-xs text-slate-500">
                                        Supplier: <strong>{req.selectedVendor}</strong> | Carrier: <strong>{req.carrierName || 'TBD'}</strong>
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Tracking Number:</p>
                                        <p className="text-xs font-mono font-bold text-slate-900">{req.trackingNumber || 'Pending Dispatch'}</p>
                                    </div>
                                    {req.stage === 'DISPATCHED' && (
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedRequest(req); setShowGrnModal(true) }}
                                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                                        >
                                            Inward & Verify GRN
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VIEW 5: Vendor Directory */}
            {activeTab === 'vendors' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vendors.map((v) => (
                        <div key={v.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-slate-500">{v.id}</span>
                                <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                                    ★ {v.rating} / 5.0
                                </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900">{v.name}</h4>
                            <p className="text-xs font-medium text-sky-700">{v.category}</p>
                            <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                                <p>Contact: <strong>{v.contactPerson}</strong> ({v.phone})</p>
                                <p>GSTIN: <span className="font-mono text-slate-800">{v.gstin}</span></p>
                                <p>Payment Terms: <strong>{v.paymentTerms}</strong></p>
                                <p className="text-[11px] text-slate-400 truncate">{v.address}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Slide-Over Record Detail Drawer */}
            {selectedRequest && (
                <RecordDetailDrawer
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    title={selectedRequest.title}
                    subtitle={`Department: ${selectedRequest.department} | Requested by: ${selectedRequest.requestedBy}`}
                    recordId={selectedRequest.poNumber || selectedRequest.id}
                    status={selectedRequest.stage}
                    onPrint={() => setShowPoPrintModal(true)}
                    overviewFields={[
                        { label: 'Purchase Indent ID', value: selectedRequest.id },
                        { label: 'Official PO Number', value: selectedRequest.poNumber || 'Not Issued Yet' },
                        { label: 'Department', value: selectedRequest.department },
                        { label: 'Priority', value: selectedRequest.priority },
                        { label: 'Estimated Budget', value: `₹${selectedRequest.estimatedCost.toLocaleString('en-IN')}` },
                        { label: 'Selected Vendor', value: selectedRequest.selectedVendor || 'Under Evaluation' },
                        { label: 'Vendor GSTIN', value: selectedRequest.vendorGstin || '—' },
                        { label: 'Carrier & Tracking', value: selectedRequest.trackingNumber ? `${selectedRequest.carrierName} (${selectedRequest.trackingNumber})` : 'Awaiting Shipment' },
                        { label: 'GRN Status', value: selectedRequest.grn ? `${selectedRequest.grn.grnNumber} - ${selectedRequest.grn.status}` : 'Pending Delivery' }
                    ]}
                    timelineSteps={(selectedRequest.approvals || []).map((appr) => ({
                        tier: `${appr.tier} Tier Approval`,
                        status: appr.status,
                        approver: appr.approver,
                        timestamp: appr.timestamp,
                        notes: appr.notes
                    }))}
                    activityEvents={[
                        { action: 'PO_STATUS_TRANSITION', timestamp: selectedRequest.requestDate, userName: selectedRequest.requestedBy, userRole: 'Dept HOD', status: 'SUCCESS', description: `Lifecycle step for ${selectedRequest.id}` }
                    ]}
                    actions={
                        <>
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                            >
                                Close
                            </button>
                            {selectedRequest.poNumber && (
                                <button
                                    type="button"
                                    onClick={() => { setDrawerOpen(false); setShowPoPrintModal(true) }}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition flex items-center gap-1.5"
                                >
                                    <Printer className="w-3.5 h-3.5" /> Printable PO
                                </button>
                            )}
                        </>
                    }
                />
            )}

            {/* MODAL 1: Create Purchase Indent */}
            {showIndentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Create New Purchase Indent (RFQ)</h3>
                        <form onSubmit={handleCreateIndent} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Indent Title / Purpose</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Science Lab Digital Microscopes (Batch of 5)"
                                    value={indentForm.title}
                                    onChange={(e) => setIndentForm({ ...indentForm, title: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                                    <select
                                        value={indentForm.department}
                                        onChange={(e) => setIndentForm({ ...indentForm, department: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    >
                                        <option>IT Support</option>
                                        <option>Stationery Store</option>
                                        <option>Science Department</option>
                                        <option>Maintenance</option>
                                        <option>Housekeeping</option>
                                        <option>Transport</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                                    <select
                                        value={indentForm.priority}
                                        onChange={(e) => setIndentForm({ ...indentForm, priority: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    >
                                        <option>Routine</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                        <option>Urgent</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Item Description</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Technical specifications, model, dimensions"
                                    value={indentForm.itemDesc}
                                    onChange={(e) => setIndentForm({ ...indentForm, itemDesc: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={indentForm.qty}
                                        onChange={(e) => setIndentForm({ ...indentForm, qty: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                                    <input
                                        type="text"
                                        value={indentForm.unit}
                                        onChange={(e) => setIndentForm({ ...indentForm, unit: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Est. Unit Price (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={indentForm.unitPrice}
                                        onChange={(e) => setIndentForm({ ...indentForm, unitPrice: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowIndentModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                                >
                                    Submit Indent for Quotations
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: Add Quotation */}
            {showQuoteModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Submit Vendor Quotation for {selectedRequest.id}</h3>
                        <form onSubmit={handleAddQuote} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Vendor Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Apex Educational Supplies"
                                    value={quoteForm.vendor}
                                    onChange={(e) => setQuoteForm({ ...quoteForm, vendor: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Quotation Amount (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={quoteForm.quoteAmount}
                                        onChange={(e) => setQuoteForm({ ...quoteForm, quoteAmount: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Lead Time</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quoteForm.deliveryDays}
                                        onChange={(e) => setQuoteForm({ ...quoteForm, deliveryDays: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Quotation Notes / Terms</label>
                                <textarea
                                    rows="2"
                                    placeholder="Warranty terms, payment structure, discounts"
                                    value={quoteForm.notes}
                                    onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowQuoteModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                                >
                                    Submit Quotation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: Approve Workflow */}
            {showApproveModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Authorize Purchase: {selectedRequest.id}</h3>
                        <p className="text-xs text-slate-500">
                            Approving budget expenditure of <strong>₹{selectedRequest.estimatedCost.toLocaleString('en-IN')}</strong> for <strong>{selectedRequest.title}</strong>.
                        </p>
                        <form onSubmit={handleApprove} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Approval Authority Tier</label>
                                <select
                                    value={approvalForm.tier}
                                    onChange={(e) => setApprovalForm({ ...approvalForm, tier: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                >
                                    <option value="HOD">Department HOD (&lt; ₹25,000)</option>
                                    <option value="Finance">Finance Controller (&lt; ₹1,00,000)</option>
                                    <option value="Director">Joint Director / Director (&gt; ₹1,00,000)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Approval Remarks</label>
                                <textarea
                                    rows="3"
                                    required
                                    value={approvalForm.notes}
                                    onChange={(e) => setApprovalForm({ ...approvalForm, notes: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowApproveModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                                >
                                    Confirm Approval
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: Reject Workflow */}
            {showRejectModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-rose-700">Reject Purchase: {selectedRequest.id}</h3>
                        <p className="text-xs text-slate-500">
                            Please provide a formal rejection justification. This will be permanently recorded in the audit trail.
                        </p>
                        <form onSubmit={handleReject} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason</label>
                                <textarea
                                    rows="3"
                                    required
                                    placeholder="e.g. Budget ceiling exceeded or alternate supplier required"
                                    value={rejectionForm.reason}
                                    onChange={(e) => setRejectionForm({ ...rejectionForm, reason: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-rose-300 focus:ring-rose-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowRejectModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                                >
                                    Reject Purchase
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 5: Dispatch Logistics */}
            {showDispatchModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Mark Dispatched: {selectedRequest.poNumber || selectedRequest.id}</h3>
                        <form onSubmit={handleDispatch} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Logistics Carrier Name</label>
                                <input
                                    type="text"
                                    required
                                    value={dispatchForm.carrierName}
                                    onChange={(e) => setDispatchForm({ ...dispatchForm, carrierName: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Consignment / Tracking Number</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. BLUEDART-881920"
                                    value={dispatchForm.trackingNumber}
                                    onChange={(e) => setDispatchForm({ ...dispatchForm, trackingNumber: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Delivery Date (ETA)</label>
                                <input
                                    type="date"
                                    value={dispatchForm.deliveryDueDate}
                                    onChange={(e) => setDispatchForm({ ...dispatchForm, deliveryDueDate: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowDispatchModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                                >
                                    Save Dispatch Details
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 6: GRN 3-Way Match */}
            {showGrnModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Goods Receipt Note (GRN) 3-Way Reconciliation</h3>
                        <p className="text-xs text-slate-500">
                            Reconciling PO <strong>{selectedRequest.poNumber}</strong> with Vendor Delivery Challan & Inward Gate Pass.
                        </p>
                        <form onSubmit={handleReconcileGrn} className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Received Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={grnForm.receivedQty}
                                        onChange={(e) => setGrnForm({ ...grnForm, receivedQty: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Accepted Qty</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={grnForm.acceptedQty}
                                        onChange={(e) => setGrnForm({ ...grnForm, acceptedQty: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Damaged / Rejected</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={grnForm.rejectedQty}
                                        onChange={(e) => setGrnForm({ ...grnForm, rejectedQty: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Storage Rack / Dock Location</label>
                                <input
                                    type="text"
                                    value={grnForm.storageLocation}
                                    onChange={(e) => setGrnForm({ ...grnForm, storageLocation: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowGrnModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                                >
                                    Verify & Issue GRN
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 7: Printable Official PO Voucher */}
            {showPoPrintModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">DELHI PUBLIC INSTITUTIONS</h2>
                                <p className="text-xs text-slate-500">Central Procurement & Material Management Wing</p>
                                <p className="text-xs text-slate-500">Campus Road, Institutional Area, New Delhi 110025</p>
                            </div>
                            <div className="text-right">
                                <span className="bg-slate-900 text-white text-xs font-black uppercase px-3 py-1 rounded">
                                    PURCHASE ORDER
                                </span>
                                <p className="text-sm font-mono font-bold text-slate-900 mt-2">{selectedRequest.poNumber || 'PO-DRAFT'}</p>
                                <p className="text-xs text-slate-500">Date: {selectedRequest.requestDate}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 text-xs">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">Vendor Details</h4>
                                <p className="font-bold text-slate-900">{selectedRequest.selectedVendor || 'TBD'}</p>
                                <p className="text-slate-600">GSTIN: {selectedRequest.vendorGstin || '07AAAAA1234A1Z5'}</p>
                                <p className="text-slate-600">Payment: {selectedRequest.paymentTerms || 'Net 30 Days'}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">Ship To / Billing</h4>
                                <p className="font-bold text-slate-900">Department: {selectedRequest.department}</p>
                                <p className="text-slate-600">Attn: {selectedRequest.requestedBy}</p>
                                <p className="text-slate-600">Central Receiving Dock 01</p>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                                    <tr>
                                        <th className="py-2.5 px-3">Item Description</th>
                                        <th className="py-2.5 px-3 text-right">Qty</th>
                                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                                        <th className="py-2.5 px-3 text-right">Total (INR)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(selectedRequest.items || []).map((it, idx) => (
                                        <tr key={idx}>
                                            <td className="py-2.5 px-3 font-medium text-slate-800">{it.description}</td>
                                            <td className="py-2.5 px-3 text-right">{it.qty} {it.unit}</td>
                                            <td className="py-2.5 px-3 text-right">₹{Number(it.unitPrice).toLocaleString('en-IN')}</td>
                                            <td className="py-2.5 px-3 text-right font-bold">₹{Number(it.total).toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50/50">
                                        <td colSpan="3" className="py-2 px-3 text-right font-bold text-slate-600">Subtotal:</td>
                                        <td className="py-2 px-3 text-right font-bold text-slate-900">₹{selectedRequest.estimatedCost.toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr className="bg-slate-50/50">
                                        <td colSpan="3" className="py-2 px-3 text-right font-bold text-slate-600">GST (18% Included):</td>
                                        <td className="py-2 px-3 text-right font-bold text-slate-900">₹{Math.round(selectedRequest.estimatedCost * 0.18).toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr className="bg-slate-100 font-black text-slate-900">
                                        <td colSpan="3" className="py-2.5 px-3 text-right uppercase tracking-wider text-xs">Total Payable:</td>
                                        <td className="py-2.5 px-3 text-right text-sm">₹{selectedRequest.estimatedCost.toLocaleString('en-IN')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                            <div>
                                <p className="font-semibold text-slate-800">Authorized Signatory</p>
                                <p className="italic text-[11px]">Finance Controller / Joint Director</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPoPrintModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                                >
                                    Close Preview
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { window.print(); setShowPoPrintModal(false) }}
                                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5"
                                >
                                    <Printer className="w-3.5 h-3.5" /> Print PO Document
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
