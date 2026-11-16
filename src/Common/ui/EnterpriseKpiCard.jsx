import React from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'

/**
 * EnterpriseKpiCard - Soft Pastel Blue Metric Card directly replicating the reference design.
 * Features:
 * - Soft pastel blue surface (#E8F1FD)
 * - Large rounded-2xl radius (1.25rem)
 * - Subtle border (#D0E3FA)
 * - High-contrast bold numeric values with subtle change indicator
 * - Clickable drill-down support via `to` or `onClick`
 */
const EnterpriseKpiCard = ({
    title,
    value,
    change,
    isPositive,
    context,
    to,
    onClick,
    className = '',
}) => {
    const navigate = useNavigate()
    const isInteractive = Boolean(to || onClick)

    const handleClick = () => {
        if (onClick) {
            onClick()
        } else if (to) {
            navigate(to)
        }
    }

    const handleKeyDown = (e) => {
        if (!isInteractive) return
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
        }
    }

    const hasChange = change !== undefined && change !== null
    const positive = isPositive !== undefined
        ? isPositive
        : String(change || '').startsWith('+')

    return (
        <div
            onClick={isInteractive ? handleClick : undefined}
            onKeyDown={isInteractive ? handleKeyDown : undefined}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            aria-label={isInteractive ? `${title}: ${value}. Click to view details.` : undefined}
            className={`group relative flex flex-col justify-between rounded-[1.25rem] border border-[#D0E3FA]/90 bg-[#E8F1FD] p-5 shadow-xs transition-all duration-200 ${
                isInteractive
                    ? 'cursor-pointer hover:shadow-md hover:border-[#515DEF]/40 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#515DEF]/50'
                    : ''
            } ${className}`}
        >
            <div>
                <div className='flex items-center justify-between gap-2'>
                    <p className='text-xs font-medium text-slate-600 tracking-wide'>
                        {title}
                    </p>
                    {isInteractive && (
                        <ArrowUpRight
                            size={14}
                            className='text-slate-400 group-hover:text-[#515DEF] transition-colors shrink-0'
                            aria-hidden='true'
                        />
                    )}
                </div>
                <div className='mt-2.5 flex items-baseline justify-between gap-3'>
                    <span className='text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 group-hover:text-[#0C1E5B] transition-colors'>
                        {value}
                    </span>
                    {hasChange && (
                        <div className='flex items-center gap-1 text-xs font-semibold text-slate-700 shrink-0'>
                            <span>{change}</span>
                            {positive ? (
                                <TrendingUp size={13} className='text-emerald-700' />
                            ) : (
                                <TrendingDown size={13} className='text-rose-700' />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {context && (
                <p className='mt-2 text-[11px] text-slate-500 line-clamp-1'>
                    {context}
                </p>
            )}
        </div>
    )
}

export default EnterpriseKpiCard
