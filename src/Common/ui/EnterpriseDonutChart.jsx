import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

/**
 * EnterpriseDonutChart - Clean circular ring on left + legend with percentages on right.
 * Matches the reference layout's "Traffic by Location" widget.
 * Supports interactive drill-down on slice or legend click.
 */
const EnterpriseDonutChart = ({
    title = 'Traffic by Location',
    data = [
        { name: 'United States', value: 52.1, color: '#334155' },
        { name: 'Canada', value: 22.8, color: '#7DD3FC' },
        { name: 'Mexico', value: 13.9, color: '#10B981' },
        { name: 'Other', value: 11.2, color: '#2563EB' },
    ],
    height = 240,
    onSliceClick,
    onItemClick,
    className = '',
}) => {
    const isInteractive = Boolean(onSliceClick || onItemClick)

    const handleSelect = (name, value, index) => {
        onSliceClick?.(name, value, index)
        onItemClick?.(name, value, index)
    }

    const onEvents = useMemo(() => {
        if (!isInteractive) return {}
        return {
            click: (params) => {
                handleSelect(params.name, params.value, params.dataIndex)
            },
        }
    }, [isInteractive, onSliceClick, onItemClick])

    const option = useMemo(() => ({
        tooltip: {
            trigger: 'item',
            backgroundColor: '#1E293B',
            borderColor: '#334155',
            textStyle: { color: '#FFFFFF', fontSize: 12 },
            formatter: (params) =>
                `${params.name}: <b>${params.value}%</b>${
                    isInteractive ? '<br/><span style="color:#94A3B8;font-size:10px;">Click to filter</span>' : ''
                }`,
        },
        series: [
            {
                type: 'pie',
                radius: ['52%', '78%'],
                center: ['40%', '50%'],
                avoidLabelOverlap: false,
                cursor: isInteractive ? 'pointer' : 'default',
                itemStyle: {
                    borderRadius: 4,
                    borderColor: '#FFFFFF',
                    borderWidth: 2,
                },
                label: { show: false },
                labelLine: { show: false },
                data: data.map((d) => ({
                    name: d.name,
                    value: d.value,
                    itemStyle: { color: d.color },
                })),
            },
        ],
    }), [data, isInteractive])

    return (
        <div className={`rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs ${className}`}>
            <div className='flex items-center justify-between mb-2'>
                <h3 className='text-sm font-semibold tracking-tight text-slate-900'>
                    {title}
                </h3>
                {isInteractive && (
                    <span className='text-[10px] text-slate-400 font-medium'>Click slice to filter</span>
                )}
            </div>

            <div className='flex items-center justify-between gap-4'>
                {/* Donut Ring */}
                <div className='w-1/2'>
                    <ReactECharts
                        option={option}
                        onEvents={onEvents}
                        style={{ height, width: '100%', cursor: isInteractive ? 'pointer' : 'default' }}
                        opts={{ renderer: 'svg' }}
                    />
                </div>

                {/* Percentage Legend on Right */}
                <div className='w-1/2 space-y-2.5 pr-2 text-xs'>
                    {data.map((item, idx) => (
                        <div
                            key={item.name}
                            onClick={isInteractive ? () => handleSelect(item.name, item.value, idx) : undefined}
                            role={isInteractive ? 'button' : undefined}
                            tabIndex={isInteractive ? 0 : undefined}
                            onKeyDown={isInteractive ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    handleSelect(item.name, item.value, idx)
                                }
                            } : undefined}
                            className={`flex items-center justify-between gap-2 p-1 rounded-md transition-colors ${
                                isInteractive ? 'cursor-pointer hover:bg-slate-50' : ''
                            }`}
                        >
                            <span className='flex items-center gap-2 truncate'>
                                <span
                                    className='size-2 rounded-full shrink-0'
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className='truncate font-medium text-slate-700'>
                                    {item.name}
                                </span>
                            </span>
                            <span className='font-semibold text-slate-900 shrink-0'>
                                {item.value}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default EnterpriseDonutChart
