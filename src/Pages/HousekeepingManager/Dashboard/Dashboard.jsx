import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ClipboardCheck, ClipboardList, Clock, MapPin, Users, Sparkles } from 'lucide-react'
import { DataTable, IntegrationNotice, StatusBadge, EnterpriseKpiCard, EnterpriseBarChart, EnterpriseDonutChart } from '../../../Common/ui'
import { SUMMARY_CARDS, RECENT_TASKS, LOW_STOCK_ITEMS, PENDING_REQUESTS, RECENT_ANNOUNCEMENTS } from './dashboardData'

const CARD_ROUTES = {
    'Active Tasks Today': '/housekeeping-manager/task-management/my-tasks',
    'Tasks Completed': '/housekeeping-manager/task-management/my-tasks',
    'Pending Tasks': '/housekeeping-manager/task-management/my-tasks',
    'Low Stock Items': '/housekeeping-manager/inventory',
    'Staff On Duty': '/housekeeping-manager/duty-allotment',
    'Pending Requests': '/housekeeping-manager/requests-approvals',
    'Zones Inspected': '/housekeeping-manager/schedules',
}

const taskColumns = [
    { key: 'taskId', label: 'Task', required: true },
    { key: 'title', label: 'Work item', required: true },
    { key: 'assignedTo', label: 'Assigned to', required: true },
    { key: 'status', label: 'Workflow state', required: true, render: (row) => <StatusBadge status={row.status} /> },
]

const stockColumns = [
    { key: 'item', label: 'Supply', required: true },
    { key: 'availableQty', label: 'Available', required: true },
    { key: 'reorderLevel', label: 'Reorder at', required: true },
]

const requestColumns = [
    { key: 'requestId', label: 'Request', required: true },
    { key: 'type', label: 'Requirement', required: true },
    { key: 'status', label: 'Decision', required: true, render: (row) => <StatusBadge status={row.status} /> },
]

const announcementColumns = [
    { key: 'title', label: 'Announcement', required: true },
    { key: 'date', label: 'Published', required: true },
]

const QueuePanel = ({ title, description, action, children }) => (
    <article className='overflow-hidden rounded-2xl bg-white shadow-md'>
        <div className='flex flex-col gap-3 border-b border-[var(--erp-line)] p-4 sm:flex-row sm:items-start sm:justify-between'>
            <div><h3 className='font-semibold text-[var(--erp-ink)]'>{title}</h3><p className='mt-0.5 text-xs text-[var(--erp-muted)]'>{description}</p></div>
            {action}
        </div>
        {children}
    </article>
)

const Dashboard = () => {
    const navigate = useNavigate()

    const blockCategories = ['Block A', 'Block B', 'Kindergarten', 'Dining Hall', 'Sports Complex']
    const blockCleanlinessScores = [98, 100, 96, 99, 94]

    const shiftDistributionData = [
        { name: 'Morning Shift (6am - 2pm)', value: 16 },
        { name: 'Afternoon Shift (2pm - 8pm)', value: 8 },
        { name: 'Special Deep Clean Team', value: 4 }
    ]

    return (
        <section className='space-y-6 font-inter pb-8'>
            <IntegrationNotice state='demo' title='Housekeeping operations briefing' description='Zone schedules, daily sanitation checklists and inventory requests are recorded in browser memory.' />
            {/* Header Banner */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs'>
                <div className='flex items-center gap-3.5'>
                    <div className='p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs'>
                        <Sparkles size={26} />
                    </div>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-xl md:text-2xl font-bold tracking-tight text-slate-900'>
                                Campus Housekeeping &amp; Sanitation Operations
                            </h1>
                            <span className='rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200'>
                                97.4% Pristine
                            </span>
                        </div>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            Zone-by-zone cleanliness audits, daily shift duty rosters, cleaning supply replenishment, and delegated work orders.
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-2'>
                    <NavLink
                        to='/housekeeping-manager/task-management/my-tasks'
                        className='inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition'
                    >
                        <ClipboardList size={14} />
                        <span>Daily Tasks Roster</span>
                    </NavLink>
                </div>
            </div>

            {/* Standardized Enterprise KPI Cards */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                {SUMMARY_CARDS.map((card) => {
                    const to = CARD_ROUTES[card.label] || '/housekeeping-manager/task-management/my-tasks'
                    const isPositive = !card.label.toLowerCase().includes('low') && !card.label.toLowerCase().includes('pending')
                    return (
                        <EnterpriseKpiCard
                            key={card.label}
                            title={card.label}
                            value={card.value}
                            change={card.sub}
                            isPositive={isPositive}
                            context='Live sanitation metric'
                            to={to}
                        />
                    )
                })}
            </div>

            {/* Graphical Analytics Row */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
                <div className='lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='flex items-center justify-between mb-2'>
                        <div>
                            <h3 className='text-sm font-bold text-slate-900'>Sanitation Compliance Score (%) by Academic Block</h3>
                            <p className='text-xs text-slate-500'>Daily audit rating across campus sectors</p>
                        </div>
                        <span className='text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg'>
                            Inspected
                        </span>
                    </div>
                    <EnterpriseBarChart
                        title='Cleanliness Scores'
                        categories={blockCategories}
                        data={blockCleanlinessScores}
                        barColor='#10B981'
                        unit='%'
                        height={240}
                        onBarClick={() => navigate('/housekeeping-manager/schedules')}
                    />
                </div>

                <div className='lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='flex items-center justify-between mb-2'>
                        <div>
                            <h3 className='text-sm font-bold text-slate-900'>Duty Allotment by Work Shift</h3>
                            <p className='text-xs text-slate-500'>Deployed sanitation staff strength</p>
                        </div>
                        <span className='text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg'>
                            Active Shift
                        </span>
                    </div>
                    <EnterpriseDonutChart
                        title='Shift Deployment'
                        data={shiftDistributionData}
                        height={240}
                        onItemClick={() => navigate('/housekeeping-manager/duty-allotment')}
                    />
                </div>
            </div>

            {/* Operational Tables */}
            <div className='grid grid-cols-1 gap-5 xl:grid-cols-2'>
                <QueuePanel title='Recent task queue' description='Reference assignments; live status updates remain in My tasks.' action={<NavLink to='/housekeeping-manager/task-management/my-tasks' className='text-sm font-semibold text-indigo-600 hover:text-indigo-700'>Open my tasks →</NavLink>}><DataTable caption='Recent task queue' rows={RECENT_TASKS} columns={taskColumns} rowKey='taskId' /></QueuePanel>
                <QueuePanel title='Low-stock supply watchlist' description='Supplies below their sample reorder threshold.' action={<NavLink to='/housekeeping-manager/requests-approvals/add-request' className='text-sm font-semibold text-indigo-600 hover:text-indigo-700'>Create request →</NavLink>}><DataTable caption='Low-stock supply watchlist' rows={LOW_STOCK_ITEMS} columns={stockColumns} rowKey='item' /></QueuePanel>
                <QueuePanel title='Pending request queue' description='Requests awaiting a governed decision.' action={<NavLink to='/housekeeping-manager/requests-approvals' className='text-sm font-semibold text-indigo-600 hover:text-indigo-700'>Open requests →</NavLink>}><DataTable caption='Pending request queue' rows={PENDING_REQUESTS} columns={requestColumns} rowKey='requestId' /></QueuePanel>
                <QueuePanel title='Recent housekeeping announcements' description='Reference communications for the operating team.' action={<NavLink to='/housekeeping-manager/broadcast' className='text-sm font-semibold text-indigo-600 hover:text-indigo-700'>Open announcements →</NavLink>}><DataTable caption='Recent housekeeping announcements' rows={RECENT_ANNOUNCEMENTS} columns={announcementColumns} rowKey='title' /></QueuePanel>
            </div>

            <nav aria-label='Housekeeping quick actions' className='flex flex-wrap gap-2.5 rounded-2xl bg-white p-5 border border-slate-200 shadow-xs'>
                <NavLink to='/housekeeping-manager/task-management/my-tasks' className='inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition'>Update my tasks</NavLink>
                <NavLink to='/housekeeping-manager/inventory' className='inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition'>Review supplies</NavLink>
                <NavLink to='/housekeeping-manager/duty-allotment' className='inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition'>Open duty allotment</NavLink>
                <NavLink to='/housekeeping-manager/reports' className='inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition'>Open reports</NavLink>
            </nav>
        </section>
    )
}

export default Dashboard
