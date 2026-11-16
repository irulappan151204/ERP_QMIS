import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import {
    LayoutDashboard,
    ClipboardList,
    Loader,
    CircleCheck,
    FileWarning,
    ShieldCheck,
    AlertTriangle,
    Percent,
    Clock,
    ArrowUpRight,
} from 'lucide-react'
import {
    KPI_CARDS,
    UPCOMING_AUDITS,
    CRITICAL_FINDINGS,
    COMPLIANCE_SUMMARY,
    severityBadgeColor,
    AUDIT_TRENDS,
    CHART_COLORS,
} from './dashboardData'

const KPI_ICONS = {
    'Total Audits Scheduled': ClipboardList,
    'Audits In Progress': Loader,
    'Completed Audits': CircleCheck,
    'Pending Findings': FileWarning,
    'Open Compliance Actions': ShieldCheck,
    'Critical Observations': AlertTriangle,
    'Compliance Score (%)': Percent,
    'Overdue Actions': Clock,
}

const KPI_ROUTES = {
    'Total Audits Scheduled': '/joint-director-audit/audit-planning',
    'Audits In Progress': '/joint-director-audit/audit-monitoring',
    'Completed Audits': '/joint-director-audit/audit-monitoring',
    'Pending Findings': '/joint-director-audit/findings-compliance',
    'Open Compliance Actions': '/joint-director-audit/findings-compliance',
    'Critical Observations': '/joint-director-audit/findings-compliance',
    'Compliance Score (%)': '/joint-director-audit/reports-analytics',
    'Overdue Actions': '/joint-director-audit/findings-compliance',
}

const Panel = ({ title, children, className = '' }) => (
    <div className={`bg-white rounded-2xl shadow-md p-4 h-full ${className}`}>
        <h3 className='text-lg font-semibold text-black mb-4'>{title}</h3>
        {children}
    </div>
)

const Widget = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4 h-full'>
        <h3 className='text-lg font-semibold text-black mb-4'>{title}</h3>
        <div className='relative overflow-x-auto'>{children}</div>
    </div>
)

const thClass = 'px-2 py-3 text-[#0C1E5B] font-medium uppercase text-xs'
const tdClass = 'px-2 py-3 text-[#667085] text-sm'

const Dashboard = () => {
    const navigate = useNavigate()

    const onAuditTrendsClick = (params) => {
        if (params?.seriesName === 'Monthly Audits Conducted') {
            navigate('/joint-director-audit/audit-monitoring')
        } else {
            navigate('/joint-director-audit/findings-compliance')
        }
    }

    const onComplianceBarClick = (params) => {
        if (params?.name) {
            navigate(`/joint-director-audit/reports-analytics?dept=${encodeURIComponent(params.name)}`)
        } else {
            navigate('/joint-director-audit/reports-analytics')
        }
    }
    const auditTrendsOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        legend: {
            data: ['Monthly Audits Conducted', 'Findings Raised', 'Findings Closed'],
            bottom: 0,
            textStyle: { color: '#667085', fontSize: 12 },
        },
        grid: { left: 48, right: 24, top: 24, bottom: 48 },
        xAxis: {
            type: 'category',
            data: AUDIT_TRENDS.labels,
            axisLine: { lineStyle: { color: '#E0E0E0' } },
            axisLabel: { color: '#667085', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#667085', fontSize: 11 },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [
            {
                name: 'Monthly Audits Conducted',
                type: 'line',
                smooth: true,
                data: AUDIT_TRENDS.auditsConducted,
                areaStyle: { color: 'rgba(81, 93, 239, 0.1)' },
                lineStyle: { color: CHART_COLORS.primary, width: 2 },
                itemStyle: { color: CHART_COLORS.primary },
                symbol: 'circle',
                symbolSize: 6,
            },
            {
                name: 'Findings Raised',
                type: 'line',
                smooth: true,
                data: AUDIT_TRENDS.findingsRaised,
                lineStyle: { color: CHART_COLORS.warning, width: 2 },
                itemStyle: { color: CHART_COLORS.warning },
                symbol: 'circle',
                symbolSize: 6,
            },
            {
                name: 'Findings Closed',
                type: 'line',
                smooth: true,
                data: AUDIT_TRENDS.findingsClosed,
                lineStyle: { color: CHART_COLORS.success, width: 2 },
                itemStyle: { color: CHART_COLORS.success },
                symbol: 'circle',
                symbolSize: 6,
            },
        ],
    }), [])

    const complianceBarOption = useMemo(() => ({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => `${params[0]?.name}<br/>${params[0]?.value}%`,
        },
        grid: { left: 48, right: 24, top: 16, bottom: 32 },
        xAxis: {
            type: 'category',
            data: COMPLIANCE_SUMMARY.map((item) => item.department),
            axisLabel: { color: '#667085', fontSize: 11 },
            axisLine: { lineStyle: { color: '#E0E0E0' } },
        },
        yAxis: {
            type: 'value',
            max: 100,
            axisLabel: { color: '#667085', fontSize: 11, formatter: '{value}%' },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [{
            type: 'bar',
            data: COMPLIANCE_SUMMARY.map((item) => item.compliance),
            barWidth: 36,
            itemStyle: {
                color: CHART_COLORS.primary,
                borderRadius: [4, 4, 0, 0],
            },
            label: {
                show: true,
                position: 'top',
                formatter: '{c}%',
                color: '#667085',
                fontSize: 11,
            },
        }],
    }), [])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                        <LayoutDashboard size={22} />
                    </div>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Joint Director — Audit Dashboard</h2>
                        <p className='text-sm text-[#667085] mt-0.5'>Audit planning overview, compliance tracking, and critical findings at a glance.</p>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                {KPI_CARDS.map((card) => {
                    const Icon = KPI_ICONS[card.label] ?? ClipboardList
                    const route = KPI_ROUTES[card.label] || '/joint-director-audit/audit-planning'
                    return (
                        <Link
                            key={card.label}
                            to={route}
                            className='bg-white rounded-2xl shadow-md p-4 hover:shadow-lg hover:border-indigo-200 border border-transparent transition-all group'
                        >
                            <div className='flex items-start justify-between gap-2'>
                                <div className='min-w-0'>
                                    <p className='text-xs text-[#808080] group-hover:text-indigo-600 transition-colors'>{card.label}</p>
                                    <p className='text-xl font-semibold text-[#1E1E1E] mt-1'>{card.value}</p>
                                    <p className='text-xs text-[#667085] mt-1'>{card.sub}</p>
                                </div>
                                <div className='flex flex-col items-end gap-2'>
                                    <div className='p-2 rounded-xl bg-[#515DEF]/10 text-[#515DEF] shrink-0 group-hover:bg-[#515DEF] group-hover:text-white transition-colors'>
                                        <Icon size={18} />
                                    </div>
                                    <ArrowUpRight size={14} className='text-slate-300 group-hover:text-indigo-500 transition-colors' />
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <Panel title='Audit Trends' className='lg:col-span-2'>
                    <ReactECharts
                        option={auditTrendsOption}
                        style={{ height: 320, cursor: 'pointer' }}
                        opts={{ renderer: 'svg' }}
                        onEvents={{ click: onAuditTrendsClick }}
                    />
                </Panel>
                <Panel title='Compliance Summary'>
                    <ReactECharts
                        option={complianceBarOption}
                        style={{ height: 320, cursor: 'pointer' }}
                        opts={{ renderer: 'svg' }}
                        onEvents={{ click: onComplianceBarClick }}
                    />
                </Panel>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Widget title='Upcoming Audits'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Audit ID</th>
                                <th className={thClass}>Audit Type</th>
                                <th className={thClass}>Department</th>
                                <th className={`${thClass} rounded-e-lg`}>Scheduled Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {UPCOMING_AUDITS.map((row) => (
                                <tr key={row.auditId} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.auditId}</td>
                                    <td className={tdClass}>{row.auditType}</td>
                                    <td className={tdClass}>{row.department}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>{row.scheduledDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Widget>

                <Widget title='Critical Findings'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Finding ID</th>
                                <th className={thClass}>Department</th>
                                <th className={`${thClass} rounded-e-lg`}>Severity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CRITICAL_FINDINGS.map((row) => (
                                <tr key={row.findingId} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.findingId}</td>
                                    <td className={tdClass}>{row.department}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${severityBadgeColor[row.severity]}`}>
                                            {row.severity}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Widget>
            </div>

            <Widget title='Compliance Summary'>
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Department</th>
                            <th className={`${thClass} rounded-e-lg`}>Compliance %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {COMPLIANCE_SUMMARY.map((row) => (
                            <tr key={row.department} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.department}</td>
                                <td className={`${tdClass} rounded-e-lg`}>
                                    <div className='flex items-center gap-3'>
                                        <div className='flex-1 h-2 bg-[#EDEEF5] rounded-full overflow-hidden max-w-[200px]'>
                                            <div
                                                className='h-full bg-[#515DEF] rounded-full'
                                                style={{ width: `${row.compliance}%` }}
                                            />
                                        </div>
                                        <span className='font-semibold text-[#1E1E1E]'>{row.compliance}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Widget>
        </section>
    )
}

export default Dashboard
