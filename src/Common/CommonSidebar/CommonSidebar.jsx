import React, { useState, useEffect, useRef, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
    ChevronLeft,
    ChevronDown,
    X,
    Pin,
    PinOff,
} from 'lucide-react'
import { PORTAL_LOGO, PORTAL_LOGO_ICON, PORTAL_LOGO_ALT } from '../../constants/portalLogo'
import { isNavigationDestinationActive } from '../navigation/navigationHelpers'
import { getNavigationForPath } from '../navigation/navigationRegistry'
import {
    getNavigationPreferences,
    togglePinModule,
    subscribeNavigationChange,
    getModuleKey,
} from '../navigation/navigationCustomizationData'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'

const CommonSidebar = ({ sidebarHidden, toggleSidebar, portalMeta }) => {
    const { role, name: authName, email: authEmail } = useAuth()
    const activeRole = portalMeta?.role || role
    const roleLabel = getProfileLabel(activeRole)
    const displayName = authName || (roleLabel ?? 'Staff User')

    const location = useLocation()
    const flyoutRef = useRef(null)

    // Base navigation links for authoritative role & path
    const sidebarLinks = useMemo(
        () => getNavigationForPath(location.pathname, activeRole),
        [activeRole, location.pathname]
    )

    // Navigation preferences (pinned items, customized groups & module order)
    const [navPrefs, setNavPrefs] = useState(() =>
        getNavigationPreferences(activeRole, authEmail, sidebarLinks)
    )

    // Menu dropdown states
    const [openMenus, setOpenMenus] = useState({})
    const [manuallyOpened, setManuallyOpened] = useState(null)

    // Subscribe to external navigation preference changes (e.g. from CommonHeader Pin button)
    useEffect(() => {
        setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
        return subscribeNavigationChange(() => {
            setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
        })
    }, [activeRole, authEmail, sidebarLinks])

    // Quick lookup map of modules by key
    const moduleMap = useMemo(() => {
        const map = new Map()
        sidebarLinks.forEach((item) => {
            map.set(getModuleKey(item), item)
        })
        return map
    }, [sidebarLinks])

    // Pinned modules
    const pinnedModules = useMemo(() => {
        return navPrefs.pinnedIds
            .map((id) => moduleMap.get(id))
            .filter(Boolean)
    }, [navPrefs.pinnedIds, moduleMap])

    const handleLinkClick = () => {
        if (window.innerWidth < 1024) {
            toggleSidebar()
        }
    }

    const toggleSubMenu = (id) => {
        setOpenMenus((prev) => ({
            ...prev,
            [id]: !prev[id],
        }))

        if (sidebarHidden) {
            setManuallyOpened((prev) => (prev === id ? null : id))
        }
    }

    // Auto open menus containing active child link
    useEffect(() => {
        const newOpenMenus = {}
        sidebarLinks.forEach((link) => {
            if (link.subLinks) {
                const isActive = link.subLinks.some(
                    (sub) =>
                        location.pathname === sub.to ||
                        location.pathname.startsWith(`${sub.to}/`)
                )
                if (isActive) {
                    newOpenMenus[link.id] = true
                }
            }
        })
        setOpenMenus(newOpenMenus)
    }, [location.pathname, sidebarLinks])

    useEffect(() => {
        if (!sidebarHidden) {
            setManuallyOpened(null)
        }
    }, [sidebarHidden])

    // Close flyout when clicking outside (collapsed sidebar mode)
    useEffect(() => {
        if (!sidebarHidden) return

        const handleClickOutside = (e) => {
            if (flyoutRef.current && !flyoutRef.current.contains(e.target)) {
                setOpenMenus({})
                setManuallyOpened(null)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [sidebarHidden])

    // ==========================================
    // PIN ACTION HANDLER
    // ==========================================
    const handleTogglePin = (e, moduleId) => {
        e.stopPropagation()
        e.preventDefault()
        togglePinModule(activeRole, authEmail, moduleId, sidebarLinks)
        setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
    }

    return (
        <aside
            id='portal-navigation'
            aria-label={`${portalMeta?.shortLabel || 'Portal'} navigation`}
            className={`bg-[#172033] flex flex-col h-full transition-all duration-200 motion-reduce:transition-none fixed top-0 left-0 z-300 font-inter overflow-visible ${
                sidebarHidden
                    ? 'w-[280px] -translate-x-full lg:translate-x-0 lg:w-[90px] shadow-none'
                    : 'w-[280px] translate-x-0 shadow-[var(--erp-shadow-overlay)] lg:shadow-none'
            }`}
        >
            {/* Toggle Button - outside scrollable area */}
            <div className='hidden lg:flex justify-end relative z-50 px-2 pt-2'>
                <button
                    type='button'
                    onClick={toggleSidebar}
                    aria-label={sidebarHidden ? 'Expand navigation' : 'Collapse navigation'}
                    aria-expanded={!sidebarHidden}
                    className={`text-[#3F46C7] cursor-pointer flex items-center justify-center size-8 bg-white rounded-full p-1 border border-slate-200 relative translate-x-1/2 shadow-xs transition-transform ${
                        sidebarHidden ? 'rotate-180' : ''
                    }`}
                >
                    <ChevronLeft size={16} aria-hidden='true' />
                </button>
            </div>

            {/* User Profile Header */}
            <div className={`px-4 pt-3 pb-3 border-b border-white/10 ${sidebarHidden ? 'flex justify-center' : 'flex items-center gap-3'}`}>
                <NavLink to='/my-profile' className='relative shrink-0' title={displayName}>
                    <img
                        src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
                        alt={displayName}
                        className='size-9 rounded-full object-cover ring-2 ring-white/20'
                    />
                    <span className='absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-[#172033]' />
                </NavLink>
                {!sidebarHidden && (
                    <>
                        <div className='min-w-0 flex-1'>
                            <NavLink to='/my-profile' className='truncate text-sm font-semibold text-white hover:text-blue-300 transition-colors block'>
                                {displayName}
                            </NavLink>
                            <p className='truncate text-[11px] text-white/50'>
                                {portalMeta?.shortLabel || roleLabel}
                            </p>
                        </div>
                        <button
                            type='button'
                            onClick={toggleSidebar}
                            aria-label='Close navigation menu'
                            className='lg:hidden inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 cursor-pointer ml-auto'
                        >
                            <X size={18} />
                        </button>
                    </>
                )}
            </div>

            {/* Scrollable Links Container */}
            <div className={`flex-1 px-3 py-3 flex flex-col gap-y-3 ${sidebarHidden ? 'overflow-visible' : 'overflow-y-auto sidebar-scroll-hide'}`}>
                {/* 1. PINNED MODULES SECTION (TOP OF NAVIGATION) */}
                {pinnedModules.length > 0 && (
                    <div className='pb-2 border-b border-white/10'>
                        {!sidebarHidden && (
                            <div className='flex items-center justify-between px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-amber-400/90'>
                                <span className='flex items-center gap-1.5'>
                                    <Pin size={12} className='fill-amber-400 rotate-45' />
                                    Pinned ({pinnedModules.length})
                                </span>
                            </div>
                        )}
                        <ul className='flex flex-col gap-y-1'>
                            {pinnedModules.map((item) => {
                                const key = getModuleKey(item)
                                const isActive = (item.to && item.to !== '#0')
                                    ? isNavigationDestinationActive(item.to, location.pathname)
                                    : item.subLinks?.some((s) => isNavigationDestinationActive(s.to, location.pathname))

                                return (
                                    <li key={`pinned-${key}`} className='relative group'>
                                        <NavLink
                                            to={(item.to && item.to !== '#0') ? item.to : (item.subLinks?.[0]?.to ?? '#')}
                                            onClick={handleLinkClick}
                                            className={`flex w-full items-center gap-x-2.5 min-h-9 px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                                                isActive
                                                    ? 'text-slate-900 bg-white shadow-xs font-semibold'
                                                    : 'text-amber-100/80 hover:bg-white/10 hover:text-white'
                                            } ${sidebarHidden ? 'justify-center px-2' : 'justify-start'}`}
                                        >
                                            <item.icon width={17} height={17} className='shrink-0 text-amber-400' />
                                            {!sidebarHidden && (
                                                <>
                                                    <span className='flex-1 truncate text-left'>{item.title}</span>
                                                    <button
                                                        type='button'
                                                        onClick={(e) => handleTogglePin(e, key)}
                                                        title='Unpin module'
                                                        aria-label='Unpin module'
                                                        className='opacity-0 group-hover:opacity-100 size-5 rounded hover:bg-white/20 flex items-center justify-center text-amber-400 transition-opacity cursor-pointer'
                                                    >
                                                        <PinOff size={12} />
                                                    </button>
                                                </>
                                            )}
                                        </NavLink>

                                        {/* Tooltip for collapsed sidebar */}
                                        {sidebarHidden && (
                                            <div className='absolute left-full top-1/2 -translate-y-1/2 pl-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50'>
                                                <div className='bg-[#172033] text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-white/10 flex items-center gap-1.5'>
                                                    <Pin size={10} className='fill-amber-400 rotate-45' />
                                                    <span>{item.title}</span>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}

                {/* 2. MODULE GROUPS AND LINKS */}
                <ul className='flex flex-col gap-y-2' ref={flyoutRef}>
                    {navPrefs.groups.map((group) => {
                        const groupItems = (group.moduleIds || [])
                            .map((id) => moduleMap.get(id))
                            .filter(Boolean)

                        if (groupItems.length === 0) {
                            return null
                        }

                        return (
                            <li key={group.id} className='rounded-xl'>
                                {/* Group Header */}
                                {!sidebarHidden && (
                                    <div className='flex items-center justify-between px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-white/40'>
                                        <span className='truncate'>{group.label}</span>
                                    </div>
                                )}

                                {/* Group Modules List */}
                                <ul className='flex flex-col gap-y-1 mt-0.5'>
                                    {groupItems.map((item) => {
                                        const key = getModuleKey(item)
                                        const hasSubLinks = item.subLinks && item.subLinks.length > 0
                                        const isOpen = Boolean(openMenus[item.id])
                                        const isChildActive =
                                            hasSubLinks &&
                                            item.subLinks.some((sub) =>
                                                isNavigationDestinationActive(sub.to, location.pathname)
                                            )
                                        const isPinned = navPrefs.pinnedIds.includes(key)

                                        const commonClasses = (active) =>
                                            `flex w-full items-center gap-x-2.5 min-h-9.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all group cursor-pointer ${
                                                active
                                                    ? 'text-slate-900 bg-white shadow-xs font-semibold'
                                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                            } ${sidebarHidden ? 'justify-center px-2' : 'justify-start'}`

                                        return (
                                            <li key={item.id} className='relative group rounded-xl'>
                                                {hasSubLinks ? (
                                                    <button
                                                        type='button'
                                                        aria-expanded={isOpen}
                                                        aria-controls={`sidebar-group-${item.id}`}
                                                        onClick={() => toggleSubMenu(item.id)}
                                                        className={commonClasses(isChildActive)}
                                                    >
                                                        <item.icon width={18} height={18} aria-hidden='true' className='shrink-0' />
                                                        {!sidebarHidden && (
                                                            <>
                                                                <span className='flex-1 truncate text-left'>{item.title}</span>
                                                                {/* Inline Pin on Hover */}
                                                                <button
                                                                    type='button'
                                                                    onClick={(e) => handleTogglePin(e, key)}
                                                                    title={isPinned ? 'Unpin module' : 'Pin module to top'}
                                                                    className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/20 transition-opacity cursor-pointer mr-1 ${
                                                                        isPinned ? 'opacity-100 text-amber-400' : 'text-white/40 hover:text-white'
                                                                    }`}
                                                                >
                                                                    <Pin size={12} className={isPinned ? 'fill-amber-400 rotate-45' : ''} />
                                                                </button>
                                                                <ChevronDown
                                                                    size={15}
                                                                    className={`transition-transform duration-200 shrink-0 ${
                                                                        isOpen ? 'rotate-180' : ''
                                                                    }`}
                                                                />
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <NavLink
                                                        to={item.to}
                                                        onClick={handleLinkClick}
                                                        className={({ isActive }) => commonClasses(isActive)}
                                                    >
                                                        <item.icon width={18} height={18} aria-hidden='true' className='shrink-0' />
                                                        {!sidebarHidden && (
                                                            <>
                                                                <span className='flex-1 truncate text-left'>{item.title}</span>
                                                                {/* Inline Pin on Hover */}
                                                                <button
                                                                    type='button'
                                                                    onClick={(e) => handleTogglePin(e, key)}
                                                                    title={isPinned ? 'Unpin module' : 'Pin module to top'}
                                                                    className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/20 transition-opacity cursor-pointer ${
                                                                        isPinned ? 'opacity-100 text-amber-400' : 'text-white/40 hover:text-white'
                                                                    }`}
                                                                >
                                                                    <Pin size={12} className={isPinned ? 'fill-amber-400 rotate-45' : ''} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </NavLink>
                                                )}

                                                {/* Hover tooltip when sidebar is collapsed */}
                                                {sidebarHidden && manuallyOpened !== item.id && (
                                                    <div className='absolute left-full top-1/2 -translate-y-1/2 pl-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50'>
                                                        <div className='bg-[#172033] text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-white/10'>
                                                            {item.title}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Expanded sidebar: inline dropdown */}
                                                {hasSubLinks && isOpen && !sidebarHidden && (
                                                    <ul id={`sidebar-group-${item.id}`} className='mt-1 flex flex-col gap-y-0.5 pl-3'>
                                                        {item.subLinks.map((sub, index) => (
                                                            <li key={sub.to || index}>
                                                                <NavLink
                                                                    to={sub.to}
                                                                    onClick={handleLinkClick}
                                                                    className={({ isActive }) =>
                                                                        `flex min-h-8.5 items-center gap-x-2.5 rounded-lg px-2.5 py-1.5 pl-6 text-xs transition-colors ${
                                                                            isActive
                                                                                ? 'bg-white/15 text-white font-semibold'
                                                                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                                                                        }`
                                                                    }
                                                                >
                                                                    <sub.icon size={16} className='shrink-0' />
                                                                    <span className='truncate'>{sub.title}</span>
                                                                </NavLink>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}

                                                {/* Collapsed sidebar: flyout popup to the right */}
                                                {hasSubLinks && sidebarHidden && manuallyOpened === item.id && (
                                                    <ul
                                                        id={`sidebar-group-${item.id}`}
                                                        className='fixed left-[98px] w-56 bg-[#172033] rounded-xl shadow-2xl py-2 px-2 flex flex-col gap-y-1 z-50 border border-white/15'
                                                    >
                                                        <li className='px-3 py-1.5 text-xs font-semibold text-white/50 border-b border-white/10 mb-1'>
                                                            {item.title}
                                                        </li>
                                                        {item.subLinks.map((sub, index) => (
                                                            <li key={sub.to || index}>
                                                                <NavLink
                                                                    to={sub.to}
                                                                    onClick={() => {
                                                                        setOpenMenus({})
                                                                        setManuallyOpened(null)
                                                                    }}
                                                                    className={({ isActive }) =>
                                                                        `flex min-h-8.5 items-center gap-x-2.5 py-1.5 px-3 text-xs rounded-lg transition-colors whitespace-nowrap ${
                                                                            isActive
                                                                                ? 'bg-white text-slate-900 font-semibold'
                                                                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                                                                        }`
                                                                    }
                                                                >
                                                                    <sub.icon size={15} />
                                                                    <span>{sub.title}</span>
                                                                </NavLink>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            </li>
                        )
                    })}
                </ul>
            </div>

            {/* School Brand Logo at Bottom */}
            <div className={`p-3 border-t border-white/10 shrink-0 ${sidebarHidden ? 'flex justify-center' : 'flex items-center gap-2'}`}>
                <img
                    src={sidebarHidden ? PORTAL_LOGO_ICON : PORTAL_LOGO}
                    alt={PORTAL_LOGO_ALT}
                    className={`h-7 object-contain ${sidebarHidden ? 'w-7' : 'max-w-[140px]'}`}
                />
            </div>
        </aside>
    )
}

export default CommonSidebar
