import React, { useState, useMemo } from 'react'
import {
    Package,
    Plus,
    Search,
    Filter,
    QrCode,
    Printer,
    DollarSign,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Eye,
    Wrench,
    ArrowRightLeft,
    Trash2,
    Calendar,
    Building2,
    User,
    ShieldAlert,
    ExternalLink
} from 'lucide-react'
import { toast } from 'react-toastify'
import { EnterpriseKpiCard, RecordDetailDrawer, exportDataset } from '../ui'
import { useAuth } from '../../context/AuthContext'
import {
    ASSET_CATEGORIES,
    ASSET_STATUSES,
    getAssets,
    calculateDepreciatedValue,
    registerAsset,
    transferAssetCustody,
    dispatchAssetToMaintenance,
    resolveAssetMaintenance,
    disposeAsset
} from './assetManagementData'

export default function AssetManagementWorkspace({ roleOverride = null }) {
    const { role: authRole, name: authName } = useAuth()
    const activeRole = roleOverride || authRole || 'it-support-manager'
    const currentUserName = authName || 'Asset Administrator'

    const [assets, setAssets] = useState(() => getAssets())
    const [activeTab, setActiveTab] = useState('register')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All Categories')
    const [selectedStatus, setSelectedStatus] = useState('All')

    // Modals state
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [showDispatchModal, setShowDispatchModal] = useState(false)
    const [showResolveModal, setShowResolveModal] = useState(false)
    const [showDisposeModal, setShowDisposeModal] = useState(false)
    const [showPassportModal, setShowPassportModal] = useState(false)

    const [selectedAsset, setSelectedAsset] = useState(null)
    const [drawerOpen, setDrawerOpen] = useState(false)

    // Form inputs
    const [registerForm, setRegisterForm] = useState({
        assetName: '',
        category: 'IT & Computing Hardware',
        serialNumber: '',
        brand: '',
        model: '',
        department: 'IT Support',
        building: 'Science & Technology Block',
        floor: '2nd Floor',
        room: 'Lab 3',
        custodian: currentUserName,
        custodianId: 'EMP-001',
        purchaseCost: 45000,
        depreciationRate: 15,
        salvageValue: 5000,
        warrantyExpiry: '2028-12-31'
    })

    const [transferForm, setTransferForm] = useState({
        newCustodian: '',
        newCustodianId: '',
        newDepartment: 'Academic Administration',
        newLocation: 'Main Admin Block - Room 104',
        remarks: 'Departmental reassignment for the academic session'
    })

    const [dispatchForm, setDispatchForm] = useState({
        workOrderRef: '',
        issueReported: '',
        technician: 'Internal Support Team'
    })

    const [resolveForm, setResolveForm] = useState({
        resolutionNotes: 'Components replaced and diagnostic testing completed successfully',
        cost: 2500
    })

    const [disposeForm, setDisposeForm] = useState({
        scrapValue: 2000,
        disposalMethod: 'E-Waste Certified Recycler',
        remarks: 'End of functional service lifecycle; unrepairable'
    })

    const refreshData = () => {
        setAssets(getAssets())
    }

    const filteredAssets = useMemo(() => {
        return assets.filter((asset) => {
            const matchesCat = selectedCategory === 'All Categories' || asset.category === selectedCategory
            const matchesStatus = selectedStatus === 'All' || asset.status === selectedStatus
            const matchesQuery = !searchQuery ||
                asset.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                asset.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (asset.custodian && asset.custodian.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (asset.room && asset.room.toLowerCase().includes(searchQuery.toLowerCase()))
            return matchesCat && matchesStatus && matchesQuery
        })
    }, [assets, selectedCategory, selectedStatus, searchQuery])

    // KPIs
    const totalAssetCount = useMemo(() => assets.filter((a) => a.status !== 'Disposed').length, [assets])

    const totalCapitalValue = useMemo(() => {
        return assets
            .filter((a) => a.status !== 'Disposed')
            .reduce((acc, a) => acc + (Number(a.purchaseCost) || 0), 0)
    }, [assets])

    const operationalCount = useMemo(() => {
        return assets.filter((a) => a.status === 'Operational').length
    }, [assets])

    const underMaintenanceCount = useMemo(() => {
        return assets.filter((a) => a.status === 'Under Maintenance' || a.status === 'Faulty').length
    }, [assets])

    const warrantyExpiringCount = useMemo(() => {
        const now = new Date()
        return assets.filter((a) => {
            if (!a.warrantyExpiry) return false
            const exp = new Date(a.warrantyExpiry)
            const daysLeft = (exp - now) / (1000 * 60 * 60 * 24)
            return daysLeft > 0 && daysLeft <= 90
        }).length
    }, [assets])

    // Handlers
    const handleRegister = (e) => {
        e.preventDefault()
        if (!registerForm.assetName || !registerForm.serialNumber) {
            toast.error('Asset Name and Serial Number are required')
            return
        }

        registerAsset(registerForm)
        toast.success('Capital Asset registered with unique tag')
        setShowRegisterModal(false)
        setRegisterForm({
            assetName: '',
            category: 'IT & Computing Hardware',
            serialNumber: '',
            brand: '',
            model: '',
            department: 'IT Support',
            building: 'Science & Technology Block',
            floor: '2nd Floor',
            room: 'Lab 3',
            custodian: currentUserName,
            custodianId: 'EMP-001',
            purchaseCost: 45000,
            depreciationRate: 15,
            salvageValue: 5000,
            warrantyExpiry: '2028-12-31'
        })
        refreshData()
    }

    const handleTransfer = (e) => {
        e.preventDefault()
        if (!selectedAsset || !transferForm.newCustodian) {
            toast.error('New Custodian is required')
            return
        }

        transferAssetCustody(selectedAsset.assetId, {
            newCustodian: transferForm.newCustodian,
            newCustodianId: transferForm.newCustodianId,
            newDepartment: transferForm.newDepartment,
            newLocation: transferForm.newLocation,
            remarks: transferForm.remarks,
            authorizedBy: currentUserName
        })

        toast.success(`Asset ${selectedAsset.assetId} transferred to ${transferForm.newCustodian}`)
        setShowTransferModal(false)
        refreshData()
    }

    const handleDispatch = (e) => {
        e.preventDefault()
        if (!selectedAsset || !dispatchForm.issueReported) {
            toast.error('Please describe the reported issue')
            return
        }

        dispatchAssetToMaintenance(selectedAsset.assetId, {
            workOrderRef: dispatchForm.workOrderRef,
            issueReported: dispatchForm.issueReported,
            technician: dispatchForm.technician
        })

        toast.warning(`Asset ${selectedAsset.assetId} marked Under Maintenance`)
        setShowDispatchModal(false)
        refreshData()
    }

    const handleResolve = (e) => {
        e.preventDefault()
        if (!selectedAsset) return

        resolveAssetMaintenance(selectedAsset.assetId, {
            resolutionNotes: resolveForm.resolutionNotes,
            cost: resolveForm.cost
        })

        toast.success(`Asset ${selectedAsset.assetId} restored to Operational status`)
        setShowResolveModal(false)
        refreshData()
    }

    const handleDispose = (e) => {
        e.preventDefault()
        if (!selectedAsset) return

        disposeAsset(selectedAsset.assetId, {
            scrapValue: disposeForm.scrapValue,
            disposalMethod: disposeForm.disposalMethod,
            approvedBy: currentUserName,
            remarks: disposeForm.remarks
        })

        toast.warning(`Asset ${selectedAsset.assetId} decommissioned & recorded for disposal`)
        setShowDisposeModal(false)
        refreshData()
    }

    const handleOpenDrawer = (asset) => {
        setSelectedAsset(asset)
        setDrawerOpen(true)
    }

    const handleExport = (format) => {
        exportDataset({
            format,
            filename: `Institutional_Asset_Register_${new Date().toISOString().slice(0, 10)}`,
            columns: [
                { key: 'assetId', label: 'Asset Tag' },
                { key: 'assetName', label: 'Asset Name' },
                { key: 'category', label: 'Category' },
                { key: 'serialNumber', label: 'Serial Number' },
                { key: 'custodian', label: 'Custodian' },
                { key: 'room', label: 'Room / Location' },
                { key: 'purchaseCost', label: 'Original Cost (INR)' },
                { key: 'status', label: 'Lifecycle Status' },
                { key: 'warrantyExpiry', label: 'Warranty Expiry' }
            ],
            data: filteredAssets,
            moduleName: 'AssetManagement'
        })
        toast.info(`Exporting ${format.toUpperCase()} report...`)
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-100 p-6 rounded-2xl shadow-xs">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-sky-600 text-white rounded-xl shadow-xs">
                            <Package className="w-6 h-6" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Capital & Fixed Asset Management</h1>
                            <p className="text-xs text-slate-600 mt-0.5">
                                Institutional Asset Register, QR Code Identifiers, Custodian & Room Tracking, Depreciation & Decommissioning
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => setShowRegisterModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl shadow-xs transition"
                    >
                        <Plus className="w-4 h-4" /> Register New Asset
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
                    title="Registered Capital Assets"
                    metric={totalAssetCount}
                    subtext="Active Institutional Assets"
                    icon={Package}
                    tone="blue"
                />
                <EnterpriseKpiCard
                    title="Total Book Value"
                    metric={`₹${totalCapitalValue.toLocaleString('en-IN')}`}
                    subtext="Gross Acquisition Cost"
                    icon={DollarSign}
                    tone="blue"
                />
                <EnterpriseKpiCard
                    title="Operational Assets"
                    metric={operationalCount}
                    subtext="In Active Service"
                    icon={CheckCircle2}
                    tone="emerald"
                />
                <EnterpriseKpiCard
                    title="In Maintenance / Repair"
                    metric={underMaintenanceCount}
                    subtext="Service Work Orders Active"
                    icon={Wrench}
                    tone={underMaintenanceCount > 0 ? 'amber' : 'emerald'}
                />
                <EnterpriseKpiCard
                    title="Warranty Expiring (&lt;90d)"
                    metric={warrantyExpiringCount}
                    subtext="Upcoming OEM Renewal"
                    icon={Clock}
                    tone={warrantyExpiringCount > 0 ? 'amber' : 'blue'}
                />
            </div>

            {/* Main Tabs Navigation */}
            <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1">
                {[
                    { id: 'register', label: 'Asset Register Table', icon: Package },
                    { id: 'qr-gallery', label: 'QR Code & Tag Directory', icon: QrCode },
                    { id: 'transfers', label: 'Custody Handover Ledger', icon: ArrowRightLeft },
                    { id: 'maintenance', label: 'Maintenance & Service Logs', icon: Wrench }
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
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search asset tag, name, serial, room, custodian..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5" /> Category:
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 max-w-xs"
                        >
                            {ASSET_CATEGORIES.map((cat) => (
                                <option key={cat}>{cat}</option>
                            ))}
                        </select>
                    </label>
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        Status:
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
                        >
                            <option value="All">All Statuses</option>
                            {ASSET_STATUSES.map((st) => (
                                <option key={st}>{st}</option>
                            ))}
                        </select>
                    </label>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs font-semibold text-slate-500">
                        <strong>{filteredAssets.length}</strong> records
                    </span>
                </div>
            </div>

            {/* VIEW 1: Asset Register Table */}
            {activeTab === 'register' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                                    <th className="py-3.5 px-4">Asset Tag</th>
                                    <th className="py-3.5 px-4">Asset Name & Specs</th>
                                    <th className="py-3.5 px-4">Category</th>
                                    <th className="py-3.5 px-4">Location / Room</th>
                                    <th className="py-3.5 px-4">Custodian</th>
                                    <th className="py-3.5 px-4">Original Cost</th>
                                    <th className="py-3.5 px-4">Depreciated Value</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAssets.map((asset) => {
                                    const depValue = calculateDepreciatedValue(asset)
                                    return (
                                        <tr key={asset.assetId} className="hover:bg-slate-50/80 transition">
                                            <td className="py-3.5 px-4 font-mono font-bold text-sky-800">{asset.assetId}</td>
                                            <td className="py-3.5 px-4">
                                                <p className="font-semibold text-slate-900">{asset.assetName}</p>
                                                <p className="text-[11px] text-slate-400 font-mono">SN: {asset.serialNumber}</p>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600">{asset.category}</td>
                                            <td className="py-3.5 px-4 text-slate-700 font-medium">
                                                <p>{asset.room}</p>
                                                <p className="text-[11px] text-slate-400">{asset.building}</p>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <p className="font-semibold text-slate-800">{asset.custodian}</p>
                                                <p className="text-[11px] text-slate-500">{asset.department}</p>
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                                                ₹{Number(asset.purchaseCost).toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-emerald-700">
                                                ₹{depValue.toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                                    asset.status === 'Operational'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : asset.status === 'Under Maintenance'
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : asset.status === 'Disposed'
                                                        ? 'bg-slate-100 text-slate-600'
                                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                }`}>
                                                    {asset.status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => { setSelectedAsset(asset); setShowPassportModal(true) }}
                                                    className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md transition"
                                                >
                                                    Passport
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setSelectedAsset(asset); setShowTransferModal(true) }}
                                                    className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                                                    title="Transfer Custody"
                                                >
                                                    <ArrowRightLeft className="w-3.5 h-3.5 inline" />
                                                </button>
                                                {asset.status === 'Under Maintenance' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedAsset(asset); setShowResolveModal(true) }}
                                                        className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition"
                                                        title="Restore to Operational"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5 inline" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedAsset(asset); setShowDispatchModal(true) }}
                                                        className="px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition"
                                                        title="Dispatch to Maintenance"
                                                    >
                                                        <Wrench className="w-3.5 h-3.5 inline" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VIEW 2: QR Code & Tag Directory */}
            {activeTab === 'qr-gallery' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredAssets.map((asset) => (
                        <div key={asset.assetId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col items-center text-center space-y-3">
                            {/* SVG QR Code Simulation */}
                            <div className="p-3 bg-slate-50 border-2 border-dashed border-sky-200 rounded-xl">
                                <QrCode className="w-24 h-24 text-slate-800" />
                            </div>
                            <div>
                                <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                    {asset.assetId}
                                </span>
                                <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">{asset.assetName}</h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">{asset.room}</p>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">SN: {asset.serialNumber}</p>
                            </div>
                            <div className="pt-2 border-t border-slate-100 w-full flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-slate-600">{asset.custodian}</span>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedAsset(asset); setShowPassportModal(true) }}
                                    className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                                >
                                    Label Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* VIEW 3: Custody Handover Ledger */}
            {activeTab === 'transfers' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                    <h3 className="text-base font-bold text-slate-900">Institutional Custody Handover & Movement Audit Ledger</h3>
                    <div className="space-y-4">
                        {assets.filter((a) => a.transferHistory && a.transferHistory.length > 0).map((asset) => (
                            <div key={asset.assetId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded">{asset.assetId}</span>
                                        <span className="text-xs font-bold text-slate-900">{asset.assetName}</span>
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono">Current Custodian: <strong>{asset.custodian}</strong></span>
                                </div>
                                <div className="space-y-2">
                                    {asset.transferHistory.map((tr, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
                                            <div>
                                                <span className="font-bold text-slate-700">{tr.fromCustodian}</span>
                                                <span className="text-slate-400 mx-2">➔</span>
                                                <span className="font-bold text-emerald-800">{tr.toCustodian}</span>
                                                <p className="text-[11px] text-slate-500 mt-0.5">Location: {tr.fromLocation} ➔ {tr.toLocation}</p>
                                                {tr.remarks && <p className="text-[11px] text-slate-600 italic mt-0.5">"{tr.remarks}"</p>}
                                            </div>
                                            <div className="text-right text-[11px] text-slate-400">
                                                <p className="font-mono">{tr.date}</p>
                                                <p>Auth by: {tr.authorizedBy}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VIEW 4: Maintenance & Service Logs */}
            {activeTab === 'maintenance' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                    <h3 className="text-base font-bold text-slate-900">Active & Historical Equipment Maintenance Work Orders</h3>
                    <div className="space-y-4">
                        {assets.filter((a) => a.maintenanceLog && a.maintenanceLog.length > 0).map((asset) => (
                            <div key={asset.assetId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded">{asset.assetId}</span>
                                        <span className="text-xs font-bold text-slate-900">{asset.assetName}</span>
                                    </div>
                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded ${
                                        asset.status === 'Operational' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {asset.status}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {asset.maintenanceLog.map((log, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">{log.workOrderRef}</span>
                                                    <span className="font-bold text-slate-800">{log.issueReported}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-1">Technician: <strong>{log.technician}</strong></p>
                                                {log.resolutionNotes && <p className="text-[11px] text-emerald-700 mt-0.5">Resolved: {log.resolutionNotes}</p>}
                                            </div>
                                            <div className="text-right text-[11px] text-slate-400">
                                                <p className="font-mono">Logged: {log.date}</p>
                                                {log.cost > 0 && <p className="font-bold text-slate-700">Cost: ₹{log.cost}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL 1: Register New Capital Asset */}
            {showRegisterModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold text-slate-900">Register New Capital Asset</h3>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Asset Name / Description</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Dell OptiPlex 7010 Desktop Station"
                                    value={registerForm.assetName}
                                    onChange={(e) => setRegisterForm({ ...registerForm, assetName: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Asset Category</label>
                                    <select
                                        value={registerForm.category}
                                        onChange={(e) => setRegisterForm({ ...registerForm, category: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    >
                                        {ASSET_CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                                            <option key={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Serial Number</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="OEM Serial Number"
                                        value={registerForm.serialNumber}
                                        onChange={(e) => setRegisterForm({ ...registerForm, serialNumber: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Brand / Make</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Dell, HP, Olympus"
                                        value={registerForm.brand}
                                        onChange={(e) => setRegisterForm({ ...registerForm, brand: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Model</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. OptiPlex 7010 MT"
                                        value={registerForm.model}
                                        onChange={(e) => setRegisterForm({ ...registerForm, model: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Room / Lab Location</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Computer Lab 3 (Station 14)"
                                        value={registerForm.room}
                                        onChange={(e) => setRegisterForm({ ...registerForm, room: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Custodian</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sandy Selva"
                                        value={registerForm.custodian}
                                        onChange={(e) => setRegisterForm({ ...registerForm, custodian: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Cost (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={registerForm.purchaseCost}
                                        onChange={(e) => setRegisterForm({ ...registerForm, purchaseCost: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Deprec. Rate (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={registerForm.depreciationRate}
                                        onChange={(e) => setRegisterForm({ ...registerForm, depreciationRate: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Warranty Expiry</label>
                                    <input
                                        type="date"
                                        value={registerForm.warrantyExpiry}
                                        onChange={(e) => setRegisterForm({ ...registerForm, warrantyExpiry: e.target.value })}
                                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowRegisterModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                                >
                                    Register Asset
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: Transfer Custody Modal */}
            {showTransferModal && selectedAsset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Transfer Custody: {selectedAsset.assetId}</h3>
                        <p className="text-xs text-slate-500">
                            Current Custodian: <strong>{selectedAsset.custodian}</strong> ({selectedAsset.room})
                        </p>
                        <form onSubmit={handleTransfer} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">New Custodian Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Employee Name"
                                    value={transferForm.newCustodian}
                                    onChange={(e) => setTransferForm({ ...transferForm, newCustodian: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">New Department</label>
                                <input
                                    type="text"
                                    required
                                    value={transferForm.newDepartment}
                                    onChange={(e) => setTransferForm({ ...transferForm, newDepartment: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">New Room / Lab Location</label>
                                <input
                                    type="text"
                                    required
                                    value={transferForm.newLocation}
                                    onChange={(e) => setTransferForm({ ...transferForm, newLocation: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Remarks</label>
                                <textarea
                                    rows="2"
                                    required
                                    value={transferForm.remarks}
                                    onChange={(e) => setTransferForm({ ...transferForm, remarks: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowTransferModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                                >
                                    Confirm Custody Transfer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: Dispatch Asset to Maintenance */}
            {showDispatchModal && selectedAsset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-amber-900">Dispatch to Maintenance: {selectedAsset.assetId}</h3>
                        <form onSubmit={handleDispatch} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Work Order Reference</label>
                                <input
                                    type="text"
                                    placeholder="e.g. WO-2026-092"
                                    value={dispatchForm.workOrderRef}
                                    onChange={(e) => setDispatchForm({ ...dispatchForm, workOrderRef: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Reported Fault / Problem</label>
                                <textarea
                                    rows="3"
                                    required
                                    placeholder="Describe physical defect or malfunction"
                                    value={dispatchForm.issueReported}
                                    onChange={(e) => setDispatchForm({ ...dispatchForm, issueReported: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Technician</label>
                                <input
                                    type="text"
                                    value={dispatchForm.technician}
                                    onChange={(e) => setDispatchForm({ ...dispatchForm, technician: e.target.value })}
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
                                    className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
                                >
                                    Dispatch to Service
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: Resolve Asset Maintenance */}
            {showResolveModal && selectedAsset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-emerald-900">Restore Asset to Operational: {selectedAsset.assetId}</h3>
                        <form onSubmit={handleResolve} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Repair Resolution Notes</label>
                                <textarea
                                    rows="3"
                                    required
                                    value={resolveForm.resolutionNotes}
                                    onChange={(e) => setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Incurred Repair Cost (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={resolveForm.cost}
                                    onChange={(e) => setResolveForm({ ...resolveForm, cost: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowResolveModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                                >
                                    Mark Operational
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 5: Asset Digital Passport */}
            {showPassportModal && selectedAsset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="border-b-2 border-sky-800 pb-4 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">INSTITUTIONAL ASSET PASSPORT</h2>
                                <p className="text-xs text-slate-500">Asset Verification & Lifecycle Management</p>
                            </div>
                            <div className="text-right">
                                <span className="bg-sky-700 text-white text-xs font-mono font-bold px-3 py-1 rounded">
                                    {selectedAsset.assetId}
                                </span>
                                <p className="text-xs text-slate-500 mt-1 font-mono">SN: {selectedAsset.serialNumber}</p>
                            </div>
                        </div>

                        {/* Top Summary Card with QR preview */}
                        <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                                <QrCode className="w-20 h-20 text-slate-800" />
                            </div>
                            <div className="space-y-1 text-xs">
                                <h3 className="text-sm font-bold text-slate-900">{selectedAsset.assetName}</h3>
                                <p className="text-slate-600">Category: <strong>{selectedAsset.category}</strong></p>
                                <p className="text-slate-600">Location: <strong>{selectedAsset.room}</strong> ({selectedAsset.building})</p>
                                <p className="text-slate-600">Current Custodian: <strong>{selectedAsset.custodian}</strong></p>
                            </div>
                        </div>

                        {/* Financial & Valuation Breakdown */}
                        <div className="grid grid-cols-3 gap-3 text-center text-xs">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <p className="text-slate-500 text-[10px] uppercase font-bold">Original Cost</p>
                                <p className="text-sm font-bold text-slate-900 mt-1">₹{Number(selectedAsset.purchaseCost).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                                <p className="text-emerald-700 text-[10px] uppercase font-bold">Depreciated Book Value</p>
                                <p className="text-sm font-bold text-emerald-800 mt-1">₹{calculateDepreciatedValue(selectedAsset).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="bg-sky-50 p-3 rounded-xl border border-sky-200">
                                <p className="text-sky-700 text-[10px] uppercase font-bold">Warranty Status</p>
                                <p className="text-xs font-bold text-sky-800 mt-1">{selectedAsset.warrantyExpiry || 'No OEM'}</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => setShowPassportModal(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => { window.print(); setShowPassportModal(false) }}
                                className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs flex items-center gap-1.5"
                            >
                                <Printer className="w-3.5 h-3.5" /> Print QR Label
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
