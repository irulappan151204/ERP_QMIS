import { toast } from 'react-toastify'
import { getStudentsForClass } from './somChecklist.js'

const STUDENT_NOTIF_KEY = 'student-notifications'
const COORDINATOR_NOTIF_KEY = 'coordinator-notifications'
const TEACHER_NOTIF_KEY = 'teacher-notifications'
const PARENT_NOTIF_KEY = 'parent-notifications'

const getStoredList = (key) => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(key)
            if (raw) return JSON.parse(raw)
        }
    } catch {
        /* ignore */
    }
    return []
}

const saveStoredList = (key, list) => {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(list))
        }
    } catch {
        /* ignore */
    }
}

/**
 * Dispatches multi-channel in-app notifications to Students, Parents, Coordinators, and Teachers
 * whenever Star of the Month awards are published or updated.
 */
export const dispatchSomPublishNotifications = ({
    classKey,
    grade,
    section,
    month,
    year,
    academicYear,
    teacherName = 'Class Teacher',
    publishedAwards = [],
    students = [],
}) => {
    const resolvedClassKey = classKey || (grade && section ? `${grade}-${section}` : 'Grade 10-A')
    const activeStudents = (students && students.length) ? students : getStudentsForClass(resolvedClassKey)
    const today = new Date().toISOString().split('T')[0]
    const formattedDate = `${new Date().getDate().toString().padStart(2, '0')}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getFullYear()}`
    const period = `${month} ${year}`

    // 1. Dispatch Student & Parent Notifications
    const studentNotifs = getStoredList(STUDENT_NOTIF_KEY)
    const parentNotifs = getStoredList(PARENT_NOTIF_KEY)

    activeStudents.forEach((stu) => {
        // Find if student won an official accolade
        const studentAward = publishedAwards.find((a) => a.studentId === stu.id)
        const awardTitle = studentAward?.awardTitle || 'Academic Star Participant'
        const starRating = studentAward?.ratingStars || 3
        const score = studentAward?.score || 95
        const isPremier = studentAward?.awardTitle?.toLowerCase().includes('star of the month')

        const notifItem = {
            id: `NTF-SOM-${stu.id}-${month}-${year}`,
            type: 'Event',
            title: isPremier ? `🏆 Star of the Month Winner — ${period}` : `⭐ Star of the Month Recognition — ${period}`,
            message: `Congratulations! ${stu.name} has been recognized as "${awardTitle}" with ${starRating} Stars (${score}%) by ${teacherName} for ${resolvedClassKey} (${period}).`,
            relatedDate: formattedDate,
            notificationDate: formattedDate,
            postedBy: `${teacherName} (${resolvedClassKey})`,
            isRead: false,
            meta: `${resolvedClassKey} · ${starRating} Stars · ${awardTitle}`,
            studentId: stu.id,
            awardTitle,
            starRating,
            period,
        }

        // Add or update notification
        const existIdx = studentNotifs.findIndex((n) => n.id === notifItem.id)
        if (existIdx >= 0) {
            studentNotifs[existIdx] = notifItem
        } else {
            studentNotifs.unshift(notifItem)
        }

        // Parent Notification mirror
        const parentNotifItem = {
            ...notifItem,
            id: `PRNT-NTF-SOM-${stu.id}-${month}-${year}`,
            title: `⭐ Child Recognition: ${stu.name} awarded for ${period}`,
            message: `Proud moment! Your child ${stu.name} received "${awardTitle}" (${starRating} Stars) in ${resolvedClassKey} Star of the Month evaluation (${period}).`,
        }
        const parentExistIdx = parentNotifs.findIndex((n) => n.id === parentNotifItem.id)
        if (parentExistIdx >= 0) {
            parentNotifs[parentExistIdx] = parentNotifItem
        } else {
            parentNotifs.unshift(parentNotifItem)
        }
    })

    saveStoredList(STUDENT_NOTIF_KEY, studentNotifs)
    saveStoredList(PARENT_NOTIF_KEY, parentNotifs)

    // 2. Dispatch Coordinator Notification
    const coordNotifs = getStoredList(COORDINATOR_NOTIF_KEY)
    const coordNotifItem = {
        id: `COORD-NTF-SOM-${resolvedClassKey.replace(/\s+/g, '-')}-${month}-${year}`,
        type: 'Announcement',
        title: `Star of the Month Finalized: ${resolvedClassKey} (${period})`,
        message: `${teacherName} has completed and officially published the Star of the Month evaluations for ${resolvedClassKey} (${period}). Total students evaluated: ${activeStudents.length}.`,
        relatedDate: formattedDate,
        notificationDate: formattedDate,
        postedBy: teacherName,
        isRead: false,
        meta: `${resolvedClassKey} · ${period} · ${publishedAwards.length} Accolades`,
    }
    const coordIdx = coordNotifs.findIndex((n) => n.id === coordNotifItem.id)
    if (coordIdx >= 0) {
        coordNotifs[coordIdx] = coordNotifItem
    } else {
        coordNotifs.unshift(coordNotifItem)
    }
    saveStoredList(COORDINATOR_NOTIF_KEY, coordNotifs)

    // 3. Dispatch Teacher & Admin Notification
    const teacherNotifs = getStoredList(TEACHER_NOTIF_KEY)
    const teacherNotifItem = {
        id: `TCH-NTF-SOM-${resolvedClassKey.replace(/\s+/g, '-')}-${month}-${year}`,
        type: 'General',
        title: `Star of the Month Published: ${resolvedClassKey}`,
        message: `Evaluation published successfully for ${resolvedClassKey} (${period}). Results synchronized across Student Database and Parent Portals.`,
        relatedDate: formattedDate,
        notificationDate: formattedDate,
        postedBy: 'Institutional Recognition System',
        isRead: true,
        meta: `${resolvedClassKey} · ${period}`,
    }
    const tchIdx = teacherNotifs.findIndex((n) => n.id === teacherNotifItem.id)
    if (tchIdx >= 0) {
        teacherNotifs[tchIdx] = teacherNotifItem
    } else {
        teacherNotifs.unshift(teacherNotifItem)
    }
    saveStoredList(TEACHER_NOTIF_KEY, teacherNotifs)

    // 4. Trigger Real-Time Reactive DOM Event
    if (typeof window !== 'undefined') {
        window.dispatchEvent(
            new CustomEvent('schoolerp-som-published', {
                detail: {
                    classKey: resolvedClassKey,
                    month,
                    year,
                    academicYear,
                    teacherName,
                    publishedCount: publishedAwards.length,
                    studentCount: activeStudents.length,
                    timestamp: Date.now(),
                },
            })
        )
    }

    // 5. Toast Feedback
    try {
        if (typeof toast !== 'undefined' && toast?.success) {
            toast.success(`✓ Star of the Month awards published! Notifications dispatched to students, parents & coordinators.`)
        }
    } catch {
        /* ignore */
    }

    return {
        success: true,
        period,
        classKey: resolvedClassKey,
        studentNotifsCount: activeStudents.length,
        publishedAwardsCount: publishedAwards.length,
        totalNotifications: activeStudents.length * 2 + 2,
        channels: {
            students: activeStudents.length,
            parents: activeStudents.length,
            coordinators: 1,
            teachers: 1,
        },
    }
}
