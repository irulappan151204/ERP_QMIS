import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

/**
 * EnterpriseBarChart - Vertical rounded bar chart with soft blue bars.
 * Matches the reference layout's "Traffic by Device" / "Grade-Wise Strength" widget.
 * Supports interactive drill-down on bar click.
 */
const EnterpriseBarChart = ({
    title = 'Traffic by Device',
    categories = ['Linux', 'Mac', 'iOS', 'Windows', 'Android', 'Other'],
    data = [18, 32, 22, 33, 16, 28],
    barColor = '#BAE6FD',
    height = 240,
    unit = 'K',
    onBarClick,
    onItemClick,
    className = '',
}) => {
    const isInteractive = Boolean(onBarClick || onItemClick)

    const onEvents = useMemo(() => {
        if (!isInteractive) return {}
        return {
            click: (params) => {
                onBarClick?.(params.name, params.value, params.dataIndex)
                onItemClick?.(params.name, params.value, params.dataIndex)
            },
        }
    }, [isInteractive, onBarClick, onItemClick])

    const option = useMemo(() => ({
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1E293B',
            borderColor: '#334155',
            textStyle: { color: '#FFFFFF', fontSize: 12 },
            formatter: (params) => {
                const item = params[0]
                return `<div class="p-1 text-xs"><b>${item.name}</b>: ${item.value}${unit}${
                    isInteractive ? '<br/><span style="color:#94A3B8;font-size:10px;">Click to filter details</span>' : ''
                }</div>`
            },
        },
        grid: {
            left: 24,
            right: 16,
            top: 20,
            bottom: 24,
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: categories,
            axisLine: { show: false },
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
                formatter: (val) => (val === 0 ? '0' : `${val}${unit}`),
            },
        },
        series: [
            {
                type: 'bar',
                data,
                barWidth: 26,
                cursor: isInteractive ? 'pointer' : 'default',
                itemStyle: {
                    color: barColor,
                    borderRadius: [8, 8, 8, 8],
                },
                emphasis: {
                    itemStyle: {
                        color: '#60A5FA',
                    },
                },
            },
        ],
    }), [categories, data, barColor, unit, isInteractive])

    return (
        <div className={`rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs ${className}`}>
            <div className='flex items-center justify-between mb-2'>
                <h3 className='text-sm font-semibold tracking-tight text-slate-900'>
                    {title}
                </h3>
                {isInteractive && (
                    <span className='text-[10px] text-slate-400 font-medium'>Click bar to filter</span>
                )}
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

export default EnterpriseBarChart
