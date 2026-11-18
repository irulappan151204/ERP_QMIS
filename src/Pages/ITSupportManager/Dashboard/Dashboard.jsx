import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Headset, Monitor, Ticket, ClipboardCheck, AlertTriangle, ArrowRight, ShieldCheck, Wrench, CheckCircle2 } from 'lucide-react'
import { getTickets, ticketCounts } from '../../../Common/demoDomain/itTickets'
import { EnterpriseKpiCard, EnterpriseBarChart, EnterpriseDonutChart, StatusBadge } from '../../../Common/ui'

const priorityBadgeColor = {
    High: 'bg-[#FF572233] text-[#FF5722]',
    Medium: 'bg-[#FF980033] text-[#FF9800]',
    Low: 'bg-[#2196F333] text-[#2196F3]',
    Critical: 'bg-[#FF000033] text-[#FF0000]',
}

const statusBadgeColor = {
    Open: 'bg-[#FF980033] text-[#FF9800]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    'In Progress': 'bg-[#2196F333] text-[#2196F3]',
    Resolved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Closed: 'bg-[#4CAF5033] text-[#4CAF50]',
}

const Dashboard = () => {
    const navigate = useNavigate()
    const counts = ticketCounts()
    const all = getTickets()
    const recent = all.slice(0, 6)

    // Chart data: Inflow & Resolution by Department
    const departmentNames = ['Academics', 'Administration', 'Transport', 'Accounts', 'Library', 'Hostel/Canteen']
    const departmentTicketValues = [14, 9, 6, 8, 4, 5]

    // Chart data: Distribution by Priority
    const priorityDistributionData = [
        { name: 'Low Priority', value: all.filter((t) => t.priority === 'Low').length || 6 },
        { name: 'Medium Priority', value: all.filter((t) => t.priority === 'Medium').length || 12 },
        { name: 'High Priority', value: all.filter((t) => t.priority === 'High').length || 5 },
        { name: 'Critical Priority', value: counts.critical || 2 },
    ]

    return (
        <section className='space-y-6 font-inter pb-8'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs'>
                <div className='flex items-center gap-3.5'>
                    <div className='p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs'>
                        <Headset size={26} />
                    </div>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-xl md:text-2xl font-bold tracking-tight text-slate-900'>
                                IT Support &amp; Infrastructure Operations
                            </h1>
                            <span className='rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200'>
                                Systems Healthy
                            </span>
                        </div>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            Centralized command center for campus helpdesk tickets, hardware assets, network infrastructure, and maintenance spares.
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => navigate('/it-support-manager/maintenance-inventory')}
                        className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer'
                    >
                        <Wrench size={14} className='text-indigo-600' />
                        <span>Maintenance Spares</span>
                    </button>
                    <button
                        type='button'
                        onClick={() => navigate('/it-support-manager/support-tickets')}
                        className='inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition cursor-pointer'
                    >
                        <Ticket size={14} />
                        <span>View Ticket Desk</span>
                    </button>
                </div>
            </div>

            {/* Standardized Enterprise KPI Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
                <EnterpriseKpiCard
                    title='Open Tickets'
                    value={counts.open}
                    change='Needs assignment'
                    isPositive={false}
                    context='Awaiting technician'
                    to='/it-support-manager/support-tickets'
                />
                <EnterpriseKpiCard
                    title='Pending Review'
                    value={counts.pending}
                    change='Active diagnosis'
                    isPositive={false}
                    context='Under technician investigation'
                    to='/it-support-manager/support-tickets'
                />
                <EnterpriseKpiCard
                    title='Resolved Today'
                    value={counts.resolved}
                    change='+4 closed'
                    isPositive={true}
                    context='Requester sign-off verified'
                    to='/it-support-manager/support-tickets'
                />
                <EnterpriseKpiCard
                    title='Critical Incidents'
                    value={counts.critical}
                    change={counts.critical > 0 ? 'Urgent attention' : 'Zero emergencies'}
                    isPositive={counts.critical === 0}
                    context='Emergency tickets'
                    to='/it-support-manager/support-tickets'
                />
                <EnterpriseKpiCard
                    title='Managed Assets'
                    value='48'
                    change='98.2% healthy'
                    isPositive={true}
                    context='Workstations & displays'
                    to='/it-support-manager/asset-management'
                />
                <EnterpriseKpiCard
                    title='Spares Inventory'
                    value='14 SKUs'
                    change='3 low stock alerts'
                    isPositive={false}
                    context='Hardware & cables'
                    to='/it-support-manager/maintenance-inventory'
                />
            </div>

            {/* Graphical Analytics Row */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
                <div className='lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='flex items-center justify-between mb-2'>
                        <div>
                            <h3 className='text-sm font-bold text-slate-900'>Ticket Inflow by Department</h3>
                            <p className='text-xs text-slate-500'>Support workload distribution across campus wings</p>
                        </div>
                        <span className='text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg'>
                            This Academic Month
                        </span>
                    </div>
                    <EnterpriseBarChart
                        title='Tickets by Department'
                        categories={departmentNames}
                        data={departmentTicketValues}
                        barColor='#6366F1'
                        unit=' Tickets'
                        height={240}
                        onBarClick={() => navigate('/it-support-manager/support-tickets')}
                    />
                </div>

                <div className='lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='flex items-center justify-between mb-2'>
                        <div>
                            <h3 className='text-sm font-bold text-slate-900'>Tickets by Priority</h3>
                            <p className='text-xs text-slate-500'>Severity distribution across open queues</p>
                        </div>
                        <span className='text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg'>
                            Live Queue
                        </span>
                    </div>
                    <EnterpriseDonutChart
                        title='Priority Distribution'
                        data={priorityDistributionData}
                        height={240}
                        onItemClick={() => navigate('/it-support-manager/support-tickets')}
                    />
                </div>
            </div>

            {/* Interactive Live Tickets Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 md:p-5 border-b border-slate-100 flex items-center justify-between'>
                    <div>
                        <h3 className='text-base font-bold text-slate-900'>Recent Support Tickets</h3>
                        <p className='text-xs text-slate-500'>Click any ticket row to view full diagnostics and update assignment</p>
                    </div>
                    <button
                        type='button'
                        onClick={() => navigate('/it-support-manager/support-tickets')}
                        className='text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer'
                    >
                        <span>View All Support Tickets</span>
                        <ArrowRight size={14} />
                    </button>
                </div>

                <div className='overflow-x-auto'>
                    <table className='w-full text-left text-xs'>
                        <thead className='bg-slate-50 text-slate-700 font-bold border-b border-slate-200'>
                            <tr>
                                <th className='py-3 px-4'>Ticket ID</th>
                                <th className='py-3 px-4'>Subject &amp; Issue Details</th>
                                <th className='py-3 px-4'>Requester</th>
                                <th className='py-3 px-4'>Assigned Technician</th>
                                <th className='py-3 px-4 text-center'>Priority</th>
                                <th className='py-3 px-4 text-center'>Status</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100 text-slate-600'>
                            {recent.map((ticket) => (
                                <tr
                                    key={ticket.ticketId}
                                    onClick={() => navigate(`/it-support-manager/support-tickets/view-ticket/${ticket.ticketId}`)}
                                    className='hover:bg-indigo-50/40 transition cursor-pointer'
                                >
                                    <td className='py-3.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap'>
                                        {ticket.ticketId}
                                    </td>
                                    <td className='py-3.5 px-4'>
                                        <div className='font-bold text-slate-900'>{ticket.subject}</div>
                                        <div className='text-[11px] text-slate-400'>{ticket.location || ticket.department || 'Campus Facility'}</div>
                                    </td>
                                    <td className='py-3.5 px-4 font-medium text-slate-800'>
                                        {ticket.requesterName}
                                    </td>
                                    <td className='py-3.5 px-4 font-medium text-slate-700'>
                                        {ticket.assignedTo || 'Unassigned Queue'}
                                    </td>
                                    <td className='py-3.5 px-4 text-center'>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${priorityBadgeColor[ticket.priority] || ''}`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className='py-3.5 px-4 text-center'>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadgeColor[ticket.status] || ''}`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}

export default Dashboard
