import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { AlertTriangle, ClipboardCheck, IndianRupee, Package, Plus, Rss, ShoppingCart, UtensilsCrossed } from 'lucide-react'
import { DataTable, IntegrationNotice, StatusBadge, EnterpriseKpiCard, EnterpriseBarChart, EnterpriseDonutChart } from '../../../Common/ui'
import {
    SUMMARY_CARDS,
    RECENT_ORDERS,
    LOW_STOCK_ALERTS,
    PENDING_REQUESTS,
    INVENTORY_SUMMARY,
    TOP_SELLING_ITEMS,
    RECENT_ANNOUNCEMENTS,
    QUICK_ACTIONS,
} from './dashboardData'

const CARD_ROUTES = {
    'Orders Today': '/canteen-manager/orders',
    "Today's Sales": '/canteen-manager/reports',
    'Inventory Items': '/canteen-manager/inventory',
    'Low Stock Alerts': '/canteen-manager/inventory',
    'Pending Approvals': '/canteen-manager/requests-approvals',
    'Active Announcements': '/canteen-manager/broadcast',
}

const orderColumns = [
    { key: 'orderId', label: 'Order', required: true },
    { key: 'customer', label: 'Customer', required: true },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount', required: true },
    { key: 'status', label: 'Fulfilment', required: true, render: (row) => <StatusBadge status={row.status} /> },
]

const stockColumns = [
    { key: 'item', label: 'Item', required: true },
    { key: 'currentStock', label: 'Current', required: true },
    { key: 'reorderLevel', label: 'Reorder at', required: true },
]

const requestColumns = [
    { key: 'requestId', label: 'Request', required: true },
    { key: 'type', label: 'Type', required: true },
    { key: 'amount', label: 'Amount', required: true },
    { key: 'status', label: 'Decision', required: true, render: (row) => <StatusBadge status={row.status} /> },
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

    const mealCategories = ['Breakfast', 'Primary Lunch', 'Senior Lunch', 'Evening Snack', 'Beverages']
    const mealTokenVolumes = [65, 340, 280, 110, 95]

    const counterRevenueData = [
        { name: 'Lunch Meal Tokens', value: 40800 },
        { name: 'Breakfast & Tiffin', value: 3900 },
        { name: 'Healthy Snacks & Juices', value: 7200 },
        { name: 'Staff Dining Counter', value: 4500 }
    ]

    return (
        <section className='space-y-6 font-inter pb-8'>
            {/* Header Banner */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs'>
                <div className='flex items-center gap-3.5'>
                    <div className='p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs'>
                        <UtensilsCrossed size={26} />
                    </div>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-xl md:text-2xl font-bold tracking-tight text-slate-900'>
                                Canteen &amp; Nutrition Services Dashboard
                            </h1>
                            <span className='rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200'>
                                Service Active
                            </span>
                        </div>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            Monitor daily meal bookings, token sales, food safety inspection scores, and pantry inventory reserves.
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-2'>
                    <NavLink
                        to='/canteen-manager/orders'
                        className='inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition'
                    >
                        <ShoppingCart size={14} />
                        <span>View Orders</span>
                    </NavLink>
                </div>
            </div>

            {/* Standardized Enterprise KPI Cards with Click-through Navigation */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
                {SUMMARY_CARDS.map((card) => {
                    const to = CARD_ROUTES[card.label] || '/canteen-manager/orders'
                    const isPositive = !card.label.toLowerCase().includes('low') && !card.label.toLowerCase().includes('pending')
                    return (
                        <EnterpriseKpiCard
                            key={card.label}
                            title={card.label}
                            value={card.value}
                            change={card.sub}
                            isPositive={isPositive}
                            context='Live counter status'
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
                            <h3 className='text-sm font-bold text-slate-900'>Daily Meal Volume by Menu Type</h3>
                            <p className='text-xs text-slate-500'>Student and staff meal fulfillment volume</p>
                        </div>
                        <span className='text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg'>
                            Today's Distribution
                        </span>
                    </div>
                    <EnterpriseBarChart
                        title='Meal Demand'
                        categories={mealCategories}
                        data={mealTokenVolumes}
                        barColor='#3B82F6'
                        unit=' Meals'
                        height={240}
                        onBarClick={() => navigate('/canteen-manager/orders')}
                    />
                </div>

                <div className='lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='flex items-center justify-between mb-2'>
                        <div>
                            <h3 className='text-sm font-bold text-slate-900'>Sales by Counter (₹)</h3>
                            <p className='text-xs text-slate-500'>Daily token collection breakdown</p>
                        </div>
                        <span className='text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg'>
                            Reconciled
                        </span>
                    </div>
                    <EnterpriseDonutChart
                        title='Counter Revenue'
                        data={counterRevenueData}
                        height={240}
                        onItemClick={() => navigate('/canteen-manager/reports')}
                    />
                </div>
            </div>

            {/* Operational Tables */}
            <div className='grid grid-cols-1 gap-5 xl:grid-cols-2'>
                <QueuePanel title='Recent order queue' description='Payment and fulfilment states remain separate.' action={<NavLink to='/canteen-manager/orders' className='text-sm font-semibold text-indigo-600 hover:text-indigo-700'>Open orders →</NavLink>}>
                    <DataTable caption='Recent order queue' rows={RECENT_ORDERS} columns={orderColumns} rowKey='orderId' />
                </QueuePanel>
                <QueuePanel title='Low-stock watchlist' description='Create a governed request before stock reaches the reorder threshold.' action={<NavLink to='/canteen-manager/requests-approvals/add-request' className='text-sm font-semibold text-indigo-600 hover:text-indigo-700'>Create request →</NavLink>}>
                    <DataTable caption='Low-stock watchlist' rows={LOW_STOCK_ALERTS} columns={stockColumns} rowKey='item' />
                </QueuePanel>
                <QueuePanel title='Pending request queue' description='Awaiting an accountable approval decision.' action={<NavLink to='/canteen-manager/requests-approvals' className='text-sm font-semibold text-indigo-600 hover:text-indigo-700'>Open requests →</NavLink>}>
                    <DataTable caption='Pending request queue' rows={PENDING_REQUESTS} columns={requestColumns} rowKey='requestId' />
                </QueuePanel>
                <QueuePanel title='Reference operating context' description='Sample inventory, demand and communications context.'>
                    <div className='grid gap-4 p-4 sm:grid-cols-3'>
                        {INVENTORY_SUMMARY.map((item) => <div key={item.label} className='rounded-xl border border-slate-200 p-3'><p className='text-xs text-slate-400'>{item.label}</p><p className='mt-1 font-semibold text-slate-900'>{item.value}</p></div>)}
                    </div>
                    <div className='grid gap-4 border-t border-slate-100 p-4 sm:grid-cols-2'>
                        <div><h4 className='text-sm font-semibold text-slate-900'>Top-selling samples</h4><ol className='mt-2 space-y-2'>{TOP_SELLING_ITEMS.slice(0, 3).map((item) => <li key={item.item} className='flex justify-between gap-3 text-sm text-slate-600'><span>{item.item}</span><span className='font-bold text-slate-900'>{item.quantity}</span></li>)}</ol></div>
                        <div><h4 className='text-sm font-semibold text-slate-900'>Recent announcements</h4><ul className='mt-2 space-y-2'>{RECENT_ANNOUNCEMENTS.map((item) => <li key={item.title} className='text-sm text-slate-600'><span className='font-medium text-slate-900'>{item.title}</span><br /><span className='text-xs text-slate-400'>{item.audience} · {item.date}</span></li>)}</ul></div>
                    </div>
                </QueuePanel>
            </div>

            <div className='rounded-2xl bg-white p-5 border border-slate-200 shadow-xs'>
                <h3 className='font-bold text-slate-900 text-sm'>Operational Quick Actions</h3>
                <div className='mt-3 flex flex-wrap gap-2.5'>
                    {QUICK_ACTIONS.map((action) => (
                        <NavLink key={action.label} to={action.to} className='inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition'>
                            <Plus aria-hidden='true' size={14} /> {action.label}
                        </NavLink>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Dashboard
