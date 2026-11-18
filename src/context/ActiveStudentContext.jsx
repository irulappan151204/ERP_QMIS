import React, { createContext, useContext, useMemo } from 'react'
import { DEFAULT_STUDENT_PROFILE } from '../Pages/Student/studentPortalConfig'

const ActiveStudentContext = createContext(null)

export const ActiveStudentProvider = ({
    children,
    student = DEFAULT_STUDENT_PROFILE,
    portalMode = 'student',
    routePrefix = '/student',
}) => {
    const resolvedStudent = student || DEFAULT_STUDENT_PROFILE
    const value = useMemo(
        () => ({
            activeStudent: resolvedStudent,
            activeStudentId: resolvedStudent?.id || DEFAULT_STUDENT_PROFILE.id,
            portalMode,
            routePrefix,
            isParentPortal: portalMode === 'parent',
        }),
        [resolvedStudent, portalMode, routePrefix],
    )

    return (
        <ActiveStudentContext.Provider value={value}>
            {children}
        </ActiveStudentContext.Provider>
    )
}

export const useActiveStudent = () => {
    const context = useContext(ActiveStudentContext)
    if (!context) {
        return {
            activeStudent: DEFAULT_STUDENT_PROFILE,
            activeStudentId: DEFAULT_STUDENT_PROFILE.id,
            portalMode: 'student',
            routePrefix: '/student',
            isParentPortal: false,
        }
    }
    return context
}
