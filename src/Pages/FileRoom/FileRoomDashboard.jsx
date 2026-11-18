import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Archive,
    FolderOpen,
    FolderCheck,
    AlertTriangle,
    ShieldAlert,
    Clock,
    Lock,
    MapPin,
    ArrowUpRight,
    RefreshCw,
    UserCheck,
    ArrowRightLeft,
    ClipboardCheck,
    History,
    Activity
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { fileRoomService } from '../../services/modules/fileRoomService'

const activeIssueColumns = [
    { key: 'fileRefNo', label: 'File Ref / Barcode', required: true },
    { key: 'fileName', label: 'File Title', required: true },
    { key: 'requestedByName', label: 'Borrower', required: true },
    { key: 'department', label: 'Department', required: true },
    { key: 'issueDateTime', label: 'Issue Date', required: true },
    { key: 'expectedReturnDate', label: 'Return Due', required: true },
    { key: 'status', label: 'Loan Status', required: true, render: (row) => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${row.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
            {row.status}
        </span>
    )},
]

const recentFilesColumns = [
    { key: 'fileRefNo', label: 'File Ref', required: true },
    { key: 'fileName', label: 'Title', required: true },
    { key: 'category', label: 'Classification', required: true },
    { key: 'ownerDepartment', label: 'Owner Dept', required: true },
    { key: 'storageLocation', label: '4-Tier Location', required: true, render: (row) => {
        const loc = row.storageLocation || {}
        return (
            <span className='font-mono text-xs text-slate-700'>
                {loc.cupboardRack || 'Rack'} · {loc.shelfLevel || 'Shelf'} · {loc.boxFolder || 'Box'}
            </span>
        )
    }},
    { key: 'confidentiality', label: 'Security Tier', required: true, render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
            row.confidentiality === 'Strictly Confidential / MD Approval Only'
                ? 'bg-rose-100 text-rose-800 font-bold'
                : row.confidentiality === 'Executive Confidential (HOD / JD Sign-off)'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-700'
        }`}>
            {row.confidentiality?.includes('MD') ? 'Strictly Confidential (MD)' : row.confidentiality}
        </span>
    )},
    { key: 'currentLocationStatus', label: 'Custody Status', required: true, render: (row) => <StatusBadge status={row.currentLocationStatus} /> },
]

const FileRoomDashboard = () => {
    const [stats, setStats] = useState({
        totalFiles: 0,
        availableFiles: 0,
        checkedOutFiles: 0,
        strictlyConfidentialCount: 0,
        overdueCount: 0,
    })
    const [recentFiles, setRecentFiles] = useState([])
    const [activeIssues, setActiveIssues] = useState([])
    const [loading, setLoading] = useState(true)

    const loadDashboardData = async () => {
        setLoading(true)
        try {
            const [statsRes, filesRes, outwardRes] = await Promise.all([
                fileRoomService.getFileRoomStats(),
                fileRoomService.getFiles(),
                fileRoomService.getOutwardRegister(),
            ])

            if (statsRes.success) setStats(statsRes.data)
            if (filesRes.success && Array.isArray(filesRes.data)) setRecentFiles(filesRes.data.slice(0, 6))
            if (outwardRes.success && Array.isArray(outwardRes.data)) {
                const active = outwardRes.data.filter((item) => item.status !== 'Returned')
                setActiveIssues(active.slice(0, 6))
            }
        } catch (err) {
            console.error('Failed to load File Room dashboard data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadDashboardData()
    }, [])

    return (
        <section className='space-y-6 p-1'>
            {/* Header Banner */}
            <div className='rounded-2xl bg-white p-5 border border-slate-200 shadow-xs'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600'>
                            <Archive className='w-4 h-4 text-slate-700' />
                            Central Records &amp; Physical Archival Custody
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            File Room Custody &amp; Document Tracking Dashboard
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Physical repository management with 4-tier coordinates (Building, Room, Rack, Shelf), strict confidentiality tiers, checkout authorization chains, and permanent custody audit trails.
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={loadDashboardData}
                            className='inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors w-fit'
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh Archive Index
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Action Navigation Grid */}
            <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3'>
                <Link to="/file-room/documents" className='p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col items-center text-center'>
                    <FolderOpen className='w-5 h-5 text-teal-600 mb-1.5' />
                    <span className='text-xs font-bold text-slate-800'>Master Register</span>
                    <span className='text-[10px] text-slate-400 mt-0.5'>All physical files</span>
                </Link>

                <Link to="/file-room/storage-mapping" className='p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col items-center text-center'>
                    <MapPin className='w-5 h-5 text-teal-600 mb-1.5' />
                    <span className='text-xs font-bold text-slate-800'>Storage Mapping</span>
                    <span className='text-[10px] text-slate-400 mt-0.5'>Racks &amp; shelves</span>
                </Link>

                <Link to="/file-room/checkout-register" className='p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col items-center text-center'>
                    <ArrowRightLeft className='w-5 h-5 text-blue-600 mb-1.5' />
                    <span className='text-xs font-bold text-slate-800'>Issue &amp; Return</span>
                    <span className='text-[10px] text-slate-400 mt-0.5'>Checkout register</span>
                </Link>

                <Link to="/file-room/access-approvals" className='p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col items-center text-center'>
                    <ClipboardCheck className='w-5 h-5 text-purple-600 mb-1.5' />
                    <span className='text-xs font-bold text-slate-800'>Access Approvals</span>
                    <span className='text-[10px] text-slate-400 mt-0.5'>MD sign-off queue</span>
                </Link>

                <Link to="/file-room/movement-logs" className='p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col items-center text-center'>
                    <History className='w-5 h-5 text-slate-600 mb-1.5' />
                    <span className='text-xs font-bold text-slate-800'>Movement Logs</span>
                    <span className='text-[10px] text-slate-400 mt-0.5'>Audit trail</span>
                </Link>

                <Link to="/file-room/retention-audit" className='p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col items-center text-center'>
                    <ShieldAlert className='w-5 h-5 text-rose-600 mb-1.5' />
                    <span className='text-xs font-bold text-slate-800'>Retention Audit</span>
                    <span className='text-[10px] text-slate-400 mt-0.5'>Disposal workflow</span>
                </Link>

                <Link to="/file-room/reports-activity" className='p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col items-center text-center'>
                    <Activity className='w-5 h-5 text-emerald-600 mb-1.5' />
                    <span className='text-xs font-bold text-slate-800'>Reports &amp; Activity</span>
                    <span className='text-[10px] text-slate-400 mt-0.5'>CSV &amp; Print audit</span>
                </Link>
            </div>

            {/* KPI Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
                <Link
                    to="/file-room/documents"
                    className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md hover:border-teal-300 transition-all flex items-center justify-between group'
                >
                    <div>
                        <div className='text-xs font-medium text-slate-500 uppercase tracking-wider group-hover:text-teal-600 transition-colors'>Cataloged Files</div>
                        <div className='text-2xl font-black text-slate-900 mt-1'>{stats.totalFiles}</div>
                        <div className='text-[11px] text-slate-400 mt-0.5'>Master Dossiers →</div>
                    </div>
                    <span className='p-3 rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-teal-600 group-hover:text-white transition-colors'>
                        <FolderOpen className='w-5 h-5' />
                    </span>
                </Link>

                <Link
                    to="/file-room/documents"
                    className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex items-center justify-between group'
                >
                    <div>
                        <div className='text-xs font-medium text-slate-500 uppercase tracking-wider group-hover:text-emerald-600 transition-colors'>In Archive Custody</div>
                        <div className='text-2xl font-black text-emerald-600 mt-1'>{stats.availableFiles}</div>
                        <div className='text-[11px] text-emerald-600 font-semibold mt-0.5'>Available on Shelves →</div>
                    </div>
                    <span className='p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors'>
                        <FolderCheck className='w-5 h-5' />
                    </span>
                </Link>

                <Link
                    to="/file-room/checkout-register"
                    className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex items-center justify-between group'
                >
                    <div>
                        <div className='text-xs font-medium text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors'>Checked Out / Issued</div>
                        <div className='text-2xl font-black text-blue-600 mt-1'>{stats.checkedOutFiles}</div>
                        <div className='text-[11px] text-blue-500 font-semibold mt-0.5'>Active Staff Loans →</div>
                    </div>
                    <span className='p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors'>
                        <Clock className='w-5 h-5' />
                    </span>
                </Link>

                <Link
                    to="/file-room/access-approvals"
                    className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex items-center justify-between group'
                >
                    <div>
                        <div className='text-xs font-medium text-slate-500 uppercase tracking-wider group-hover:text-amber-600 transition-colors'>MD Sign-off Required</div>
                        <div className='text-2xl font-black text-amber-600 mt-1'>{stats.strictlyConfidentialCount}</div>
                        <div className='text-[11px] text-amber-600 font-semibold mt-0.5'>Strictly Confidential →</div>
                    </div>
                    <span className='p-3 rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors'>
                        <Lock className='w-5 h-5' />
                    </span>
                </Link>

                <Link
                    to="/file-room/checkout-register"
                    className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md hover:border-rose-300 transition-all flex items-center justify-between group'
                >
                    <div>
                        <div className='text-xs font-medium text-slate-500 uppercase tracking-wider group-hover:text-rose-600 transition-colors'>Overdue Returns</div>
                        <div className='text-2xl font-black text-rose-600 mt-1'>{stats.overdueCount}</div>
                        <div className='text-[11px] text-rose-600 font-semibold mt-0.5'>Alert Dispatched to HOD →</div>
                    </div>
                    <span className='p-3 rounded-2xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors'>
                        <AlertTriangle className='w-5 h-5' />
                    </span>
                </Link>
            </div>

            {/* Active Loans & Checked Out Dossiers */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <div>
                        <h2 className='text-sm font-bold text-slate-900'>Active Document Issues &amp; Return SLA Tracking</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>Physical file checkouts awaiting return reconciliation</p>
                    </div>
                    <Link to="/file-room/checkout-register" className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors'>
                        <UserCheck className='w-3.5 h-3.5' />
                        {activeIssues.length} Active Loans &rarr;
                    </Link>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={activeIssueColumns}
                        data={activeIssues}
                        emptyMessage='No physical files currently checked out from custody.'
                    />
                </div>
            </div>

            {/* Master File Index Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <div>
                        <h2 className='text-sm font-bold text-slate-900'>Recent Physical File Repository Master</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>Archival register with 4-tier storage coordinates &amp; security classifications</p>
                    </div>
                    <Link to="/file-room/documents" className='text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1'>
                        View All Files <ArrowUpRight className='w-3.5 h-3.5' />
                    </Link>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={recentFilesColumns}
                        data={recentFiles}
                        emptyMessage='No master files registered in archival repository.'
                    />
                </div>
            </div>
        </section>
    )
}

export default FileRoomDashboard
