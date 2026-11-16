import React, { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Pin, Menu } from 'lucide-react'
import { singleTitleMapping } from './Components/TitleMappings'
import { getNavigationForPath, getNavigationLabelForPath } from '../navigation/navigationRegistry'
import { isNavigationDestinationActive } from '../navigation/navigationHelpers'
import {
    getNavigationPreferences,
    togglePinModule,
    subscribeNavigationChange,
    getModuleKey,
} from '../navigation/navigationCustomizationData'
import { useAuth } from '../../context/AuthContext'
import UserDropdown from './Components/UserDropdown'
import UserNotifications from './Components/UserNotifications'

const CommonHeader = ({
    sidebarHidden,
    portalMeta,
    rightDrawerOpen,
    toggleRightDrawer,
    toggleSidebar,
    menuButtonRef,
}) => {
    const location = useLocation()
    const { role, email: authEmail } = useAuth()
    const activeRole = portalMeta?.role || role

    const sidebarLinks = useMemo(
        () => getNavigationForPath(location.pathname, activeRole),
        [activeRole, location.pathname]
    )

    const pageTitle =
        getNavigationLabelForPath(location.pathname, activeRole) ||
        singleTitleMapping[location.pathname] ||
        'Overview'

    const [navPrefs, setNavPrefs] = useState(() => getNavigationPreferences(activeRole, authEmail, sidebarLinks))

    // Find current active navigation item
    const currentModule = useMemo(() => {
        for (const item of sidebarLinks) {
            if (item.to && isNavigationDestinationActive(item.to, location.pathname)) {
                return item
            }
            if (item.subLinks?.length) {
                const subMatch = item.subLinks.find((sub) =>
                    isNavigationDestinationActive(sub.to, location.pathname)
                )
                if (subMatch) return item
            }
        }
        return sidebarLinks[0] ?? null
    }, [sidebarLinks, location.pathname])

    const currentModuleKey = currentModule ? getModuleKey(currentModule) : null
    const isPinned = Boolean(currentModuleKey && navPrefs.pinnedIds.includes(currentModuleKey))

    // Subscribe to navigation updates
    useEffect(() => {
        setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
        return subscribeNavigationChange(() => {
            setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
        })
    }, [activeRole, authEmail, sidebarLinks])

    const handleTogglePin = () => {
        if (!currentModuleKey) return
        togglePinModule(activeRole, authEmail, currentModuleKey, sidebarLinks)
        setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
    }

    return (
        <header
            className={`fixed right-0 top-0 z-200 border-b border-slate-200 bg-white/95 backdrop-blur-md transition-[left,right] duration-200 motion-reduce:transition-none ${
                sidebarHidden ? 'left-0 lg:left-[90px]' : 'left-0 lg:left-[280px]'
            } ${rightDrawerOpen ? 'lg:right-[300px]' : 'right-0'}`}
        >
            <div className='mx-auto flex h-[4.75rem] w-full max-w-[var(--erp-content-max)] items-center justify-between gap-3 px-3 sm:px-5 lg:px-6'>
                {/* Left: Mobile Toggle + Pin Button + Breadcrumb */}
                <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
                    <button
                        ref={menuButtonRef}
                        type='button'
                        onClick={toggleSidebar}
                        aria-label={sidebarHidden ? 'Open navigation' : 'Close navigation'}
                        aria-expanded={!sidebarHidden}
                        className='inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer'
                    >
                        <Menu size={20} />
                    </button>

                    <button
                        type='button'
                        onClick={handleTogglePin}
                        aria-label={isPinned ? 'Unpin module from top navigation' : 'Pin module to top navigation'}
                        title={isPinned ? `Unpin "${currentModule?.title || 'page'}" from top navigation` : `Pin "${currentModule?.title || 'page'}" to top of navigation`}
                        className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                            isPinned
                                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-200'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                    >
                        <Pin size={16} className={`transition-transform ${isPinned ? 'fill-blue-600 rotate-45' : ''}`} />
                    </button>

                    <nav aria-label='Breadcrumbs' className='min-w-0'>
                        <div className='flex items-center gap-1.5 text-xs text-slate-400'>
                            <span className='truncate hover:text-slate-600 font-medium'>
                                {portalMeta?.shortLabel || 'Dashboards'}
                            </span>
                            <span className='text-slate-300'>/</span>
                            <span className='truncate font-semibold text-slate-800'>
                                {pageTitle}
                            </span>
                        </div>
                    </nav>
                </div>

                {/* Right: Notifications Popover + User Dropdown */}
                <div className='flex items-center gap-2 sm:gap-3'>
                    <UserNotifications />
                    <div className='hidden sm:block h-5 w-px bg-slate-200' />
                    <UserDropdown />
                </div>
            </div>
        </header>
    )
}

export default CommonHeader
