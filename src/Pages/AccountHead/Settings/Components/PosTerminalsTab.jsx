import { NavLink } from 'react-router-dom'
import { Plus, ArrowRight } from 'lucide-react'
import { DataTable, StatusBadge } from '../../../../Common/ui'
import { getPosTerminals } from '../../PosEdcSync/posEdcData'
import { SettingsPanel } from './SettingsShared'

const columns = [
    { key: 'name', label: 'Terminal Name', required: true },
    { key: 'terminalId', label: 'Terminal ID', render: (row) => <span className='font-mono text-xs font-semibold text-slate-800'>{row.terminalId}</span> },
    { key: 'provider', label: 'Provider / Model', render: (row) => <span>{row.provider} · <span className='text-xs text-slate-500'>{row.model}</span></span> },
    { key: 'counterLocation', label: 'Counter Location' },
    { key: 'assignedOperator', label: 'Operator' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status === 'Active' ? 'Active' : 'Inactive'} /> },
]

const PosTerminalsTab = () => {
    const terminals = getPosTerminals()

    return (
        <div className='space-y-5'>
            <div className='rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                <div>
                    <h3 className='text-sm font-bold text-blue-900'>Live EDC Payment Gateway Synchronization</h3>
                    <p className='text-xs text-blue-800 mt-0.5'>
                        Connected payment terminals automatically synchronize swipe batches and UPI dynamic QR transactions into the central finance ledger.
                    </p>
                </div>
                <NavLink
                    to='/account-head/pos-sync'
                    className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition shadow-sm whitespace-nowrap'
                >
                    Open POS / EDC Workspace <ArrowRight size={14} />
                </NavLink>
            </div>

            <SettingsPanel
                title='Campus POS & Swipe Terminals Register'
                sub='Registered hardware EDC terminals, Paytm soundbox units, and counter assignments.'
            >
                <DataTable
                    caption='POS terminal register'
                    rows={terminals}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No terminals configured'
                    emptyDescription='Register a new payment machine in the POS / EDC workspace.'
                />
            </SettingsPanel>
        </div>
    )
}

export default PosTerminalsTab
