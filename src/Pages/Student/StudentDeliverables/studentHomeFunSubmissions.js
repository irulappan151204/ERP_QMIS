import { SUBMISSIONS_LIST } from '../../Teacher/StudentDeliverables/HomeFun/homeFunSubmissionsData.js'
import { DEFAULT_STUDENT_PROFILE } from '../studentPortalConfig.js'

export const CURRENT_STUDENT_ID = DEFAULT_STUDENT_PROFILE.id

export const STORAGE_KEY = 'student-home-fun-submissions'
export const SUBMISSIONS_UPDATED_EVENT = 'schoolerp-student-submissions-updated'

let _inMemorySubmissions = []

const parseDueDate = (value) => {
    if (!value) return null
    const parts = String(value).split('-').map(Number)
    if (parts.length !== 3 || parts.some(isNaN)) {
        const d = new Date(value)
        return isNaN(d.getTime()) ? null : d
    }
    let day, month, year
    if (parts[0] > 1000) {
        [year, month, day] = parts
    } else {
        [day, month, year] = parts
    }
    return new Date(year, month - 1, day, 23, 59, 59, 999)
}

const formatSubmittedAt = () => {
    const now = new Date()
    return now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

export const getStoredSubmissions = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) return JSON.parse(stored)
        }
    } catch {
        /* ignore */
    }
    return _inMemorySubmissions
}

const saveStoredSubmissions = (items) => {
    _inMemorySubmissions = items
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        }
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent(SUBMISSIONS_UPDATED_EVENT, { detail: items }))
        }
    } catch {
        /* ignore */
    }
}

const findInMockData = (assignmentId, assignmentTitle, studentId) => {
    const matched = SUBMISSIONS_LIST.find(
        (item) => item.assignmentId === assignmentId || item.assignmentTitle === assignmentTitle,
    )
    if (!matched) return null

    const submitted = matched.studentDetails.submitted.find((entry) => entry.id === studentId)
    if (!submitted) return null

    return {
        studentId,
        assignmentId: matched.assignmentId,
        assignmentTitle: matched.assignmentTitle,
        submittedAt: submitted.submittedAt,
        isLate: submitted.isLate ?? false,
        fileName: submitted.submission?.fileName ?? '',
        fileSize: submitted.submission?.fileSize ?? '',
        additionalNote: submitted.submission?.additionalNote ?? '',
    }
}

export const getStudentSubmission = (
    assignmentId,
    assignmentTitle,
    studentId = CURRENT_STUDENT_ID,
) => {
    const stored = getStoredSubmissions().find(
        (entry) => entry.assignmentId === assignmentId && entry.studentId === studentId,
    )
    if (stored) return stored
    return findInMockData(assignmentId, assignmentTitle, studentId)
}

export const getStudentSubmissionStatus = (record, studentId = CURRENT_STUDENT_ID) => {
    const submission = getStudentSubmission(record.assignmentId, record.assignmentTitle, studentId)
    if (submission) return submission.isLate ? 'Late' : 'Submitted'
    return 'Pending'
}

export const saveStudentSubmission = (
    { assignmentId, assignmentTitle, fileName, fileSize, additionalNote, dueDate },
    studentId = CURRENT_STUDENT_ID,
) => {
    const due = parseDueDate(dueDate)
    const isLate = due ? new Date() > due : false

    const submission = {
        studentId,
        assignmentId,
        assignmentTitle,
        submittedAt: formatSubmittedAt(),
        isLate,
        fileName,
        fileSize,
        additionalNote,
    }

    const list = getStoredSubmissions().filter(
        (entry) => !(entry.assignmentId === assignmentId && entry.studentId === studentId),
    )
    list.push(submission)
    saveStoredSubmissions(list)
    return submission
}

export const gradeStudentSubmission = ({
    assignmentId,
    studentId = CURRENT_STUDENT_ID,
    grade = 'A',
    marks = '95/100',
    feedback = 'Excellent work.',
    teacherName = 'Class Teacher',
}) => {
    const list = getStoredSubmissions()
    const index = list.findIndex(
        (entry) => entry.assignmentId === assignmentId && entry.studentId === studentId,
    )
    if (index !== -1) {
        list[index] = {
            ...list[index],
            status: 'Graded',
            grade,
            marks,
            feedback,
            gradedBy: teacherName,
            gradedAt: formatSubmittedAt(),
        }
        saveStoredSubmissions(list)
        return list[index]
    }
    const newEntry = {
        studentId,
        assignmentId,
        assignmentTitle: assignmentId,
        submittedAt: formatSubmittedAt(),
        isLate: false,
        status: 'Graded',
        grade,
        marks,
        feedback,
        gradedBy: teacherName,
        gradedAt: formatSubmittedAt(),
    }
    list.push(newEntry)
    saveStoredSubmissions(list)
    return newEntry
}

export const getGradedSubmissions = () => {
    return getStoredSubmissions().filter((entry) => entry.status === 'Graded')
}
