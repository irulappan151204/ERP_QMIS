import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, House } from 'lucide-react'
import { getBreadcrumbItems } from './breadcrumbMappings'

const CommonBreadcrumb = () => {
    const { pathname } = useLocation()
    const { homePath, crumbs } = getBreadcrumbItems(pathname)

    if (!crumbs.length) return null

    return (
        <nav
            aria-label="Breadcrumb"
            className="mb-3.5 w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-2xs sm:px-5"
        >
            <ol className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs font-medium font-inter">
                <li className="flex items-center">
                    <Link
                        to={homePath}
                        className="inline-flex items-center text-[var(--erp-indigo)] transition-colors hover:text-[var(--erp-indigo-strong)]"
                        aria-label="Home"
                    >
                        <House size={16} strokeWidth={2.25} />
                    </Link>
                </li>

                {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1 || crumb.isCurrent

                    return (
                        <li key={`${crumb.label}-${index}`} className="flex items-center gap-x-2">
                            <ChevronRight size={14} className="shrink-0 text-slate-400" strokeWidth={2} />
                            {crumb.to && !isLast ? (
                                <Link
                                    to={crumb.to}
                                    className="text-slate-500 transition-colors hover:text-[var(--erp-indigo)]"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span
                                    className={
                                        isLast
                                            ? 'font-semibold text-slate-900'
                                            : 'text-slate-500'
                                    }
                                    aria-current={isLast ? 'page' : undefined}
                                >
                                    {crumb.label}
                                </span>
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}

export default CommonBreadcrumb
