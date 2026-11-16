import React, { useState, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

/**
 * EnterpriseTrendChart - Dual-spline smooth area chart directly inspired by the reference design.
 * Features:
 * - Interactive tab switcher (e.g. Total Users / Operating Status / Projects)
 * - Coordinated legend: "• This year" (solid dark line) vs "• Last year" (dashed blue line)
 * - Clean SVG/ECharts bezier curve interpolation
 * - Interactive point click drill-down
 */
const EnterpriseTrendChart = ({
    tabs = ['Total Users', 'Total Projects', 'Operating Status'],
    dataByTab,
    categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    height = 280,
    onPointClick,
    onItemClick,
    className = '',
}) => {
    const [activeTab, setActiveTab] = useState(tabs[0] || 'Total Users')
    const isInteractive = Boolean(onPointClick || onItemClick)

    const onEvents = useMemo(() => {
        if (!isInteractive) return {}
        return {
            click: (params) => {
                onPointClick?.(params.name, params.value, params.seriesName)
                onItemClick?.(params.name, params.value, params.seriesName)
            },
        }
    }, [isInteractive, onPointClick, onItemClick])

    // Default mock data if not supplied
    const activeData = useMemo(() => {
        let raw = null
        if (dataByTab && dataByTab[activeTab]) {
            raw = dataByTab[activeTab]
        } else if (activeTab === 'Total Projects') {
            raw = {
                current: [12, 18, 15, 24, 28, 22, 30],
                previous: [8, 14, 19, 16, 21, 26, 32],
            }
        } else if (activeTab === 'Operating Status') {
            raw = {
                current: [92, 94, 91, 96, 95, 98, 97],
                previous: [88, 90, 89, 92, 93, 94, 95],
            }
        } else {
            // Default (Total Users / Students)
            raw = {
                current: [18, 14, 16, 28, 26, 23, 25],
                previous: [10, 19, 12, 17, 24, 28, 32],
            }
        }
        return {
            currentSeries: raw.currentSeries || raw.currentYear || raw.current || [],
            previousSeries: raw.previousSeries || raw.previousYear || raw.previous || [],
        }
    }, [dataByTab, activeTab])

    const option = useMemo(() => ({
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1E293B',
            borderColor: '#334155',
            textStyle: { color: '#FFFFFF', fontSize: 12 },
            formatter: (params) => {
                const title = params[0]?.name || ''
                const lines = params.map(
                    (p) => `${p.marker} ${p.seriesName}: <b>${p.value}k</b>`
                )
                return `<div class="p-1"><p class="font-semibold mb-1 text-slate-300">${title}</p>${lines.join('<br/>')}${
                    isInteractive ? '<br/><span style="color:#94A3B8;font-size:10px;">Click point to filter</span>' : ''
                }</div>`
            },
        },
        grid: {
            left: 28,
            right: 16,
            top: 24,
            bottom: 24,
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: categories,
            boundaryGap: false,
            axisLine: { lineStyle: { color: '#E2E8F0' } },
            axisTick: { show: false },
            axisLabel: { color: '#94A3B8', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            splitLine: {
                lineStyle: {
                    color: '#F1F5F9',
                    type: 'solid',
                },
            },
            axisLabel: {
                color: '#94A3B8',
                fontSize: 11,
                formatter: (val) => (val === 0 ? '0' : `${val}K`),
            },
        },
        series: [
            {
                name: 'This year',
                type: 'line',
                smooth: 0.45,
                showSymbol: isInteractive,
                symbolSize: 6,
                cursor: isInteractive ? 'pointer' : 'default',
                data: activeData.currentSeries,
                lineStyle: {
                    color: '#1E293B',
                    width: 2.2,
                },
                itemStyle: {
                    color: '#1E293B',
                },
            },
            {
                name: 'Last year',
                type: 'line',
                smooth: 0.45,
                showSymbol: isInteractive,
                symbolSize: 6,
                cursor: isInteractive ? 'pointer' : 'default',
                data: activeData.previousSeries,
                lineStyle: {
                    color: '#7DD3FC',
                    width: 2.2,
                    type: 'dashed',
                },
                itemStyle: {
                    color: '#7DD3FC',
                },
            },
        ],
    }), [categories, activeData, isInteractive])

    return (
        <div className={`rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs ${className}`}>
            {/* Header: Tabs + Legend */}
            <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-2'>
                {/* Tabs */}
                <div className='flex items-center gap-1 sm:gap-2'>
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            type='button'
                            onClick={() => setActiveTab(tab)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                                activeTab === tab
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Coordinated Legend */}
                <div className='flex items-center gap-3 text-xs font-medium text-slate-600'>
                    <span className='flex items-center gap-1.5'>
                        <span className='inline-block size-2 rounded-full bg-slate-900' />
                        This year
                    </span>
                    <span className='flex items-center gap-1.5'>
                        <span className='inline-block h-0.5 w-3 bg-[#7DD3FC] border-b border-dashed border-[#7DD3FC]' />
                        Last year
                    </span>
                </div>
            </div>

            <ReactECharts
                option={option}
                onEvents={onEvents}
                style={{ height, width: '100%', cursor: isInteractive ? 'pointer' : 'default' }}
                opts={{ renderer: 'svg' }}
            />
        </div>
    )
}

export default EnterpriseTrendChart
