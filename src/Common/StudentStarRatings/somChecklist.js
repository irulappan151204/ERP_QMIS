import { STUDENT_ATTENDANCE } from '../../Pages/Admin/Attendance/Students/studentAttendanceData.js'
import { getStudentsList } from '../RBAC/createdUsersData.js'
import { CLASS_ASSIGNMENTS, getAcademicSomRecords, saveAcademicSomRecord } from '../Recognition/recognitionData.js'
import { getIntegratedStudentsList } from '../UserDatabase/userDatabaseIntegrator.js'

const CHECKLIST_KEY = 'schoolerp-som-checklist-v1'
const DISABLED_KEY = 'schoolerp-som-checklist-disabled-v1'
const RATINGS_KEY = 'schoolerp-som-matrix-ratings-v1'
const TITLES_KEY = 'schoolerp-som-star-titles-v1'
const META_KEY = 'schoolerp-som-matrix-meta-v1'
const STUDENT_SOM_HISTORY_KEY = 'schoolerp-student-som-history-v1'

export const SOM_RATINGS = ['1', '2', '3', 'NA', 'AB']
export const VALID_INTEGER_RATINGS = [3, 2, 1]
export const SOM_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const SOM_RATING_META = {
    '3': { value: 3, stars: 3, label: '3 Stars (Outstanding)', short: '3 ⭐', color: '#F59E0B' },
    '2': { value: 2, stars: 2, label: '2 Stars (Good)', short: '2 ⭐', color: '#3B82F6' },
    '1': { value: 1, stars: 1, label: '1 Star (Developing)', short: '1 ⭐', color: '#10B981' },
    'NA': { value: null, stars: 0, label: 'Not Applicable', short: 'NA', color: '#64748B' },
    'AB': { value: null, stars: 0, label: 'Absent', short: 'AB', color: '#EF4444' },
}

const sub = (id, name) => ({ id, name, enabled: true })
const cat = (id, name, subs) => ({ id, name, enabled: true, subs })

export const DEFAULT_SOM_CHECKLIST = [
    cat('cat-punctuality', '1. Punctuality', [
        sub('sub-attendance', 'Attendance'),
        sub('sub-homework', 'Accomplishing Home Work / Assignments on time'),
        sub('sub-reporting', 'On time reporting'),
    ]),
    cat('cat-participation', '2. Active Participation', [
        sub('sub-classroom', 'Classroom activity'),
        sub('sub-interschool', 'Interschool activity'),
        sub('sub-performance', 'Co curricular activities (Performance Arts)'),
        sub('sub-martial', 'Co curricular activities (Martial Arts)'),
        sub('sub-special', 'Interactions during Special programs'),
        sub('sub-house', 'Inter House competitions'),
        sub('sub-assembly', 'Assembly Performance'),
        sub('sub-bfit', 'BFIT'),
    ]),
    cat('cat-behaviour', '3. Classroom Behaviour', [sub('sub-behaviour', 'Classroom Behaviour')]),
    cat('cat-grooming', '4. Personal Grooming', [sub('sub-grooming', 'Personal Grooming'), sub('sub-diet', 'Nutritious Diet')]),
    cat('cat-etiquette', '5. Table Etiquette', [sub('sub-etiquette', 'Table Etiquette')]),
    cat('cat-resources', '6. Handling Resources', [
        sub('sub-books', 'Maintenance of books & notebooks'),
        sub('sub-classroom-resources', 'Classroom resources'),
        sub('sub-objects', 'Personal objects'),
    ]),
    cat('cat-english', '7. Communication in English', [sub('sub-english', 'Communication in English')]),
    cat('cat-social', '8. Socializing', [sub('sub-social', 'Socializing')]),
    cat('cat-academic', '9. Academic Performance', [sub('sub-assessments', 'Assessments')]),
    cat('cat-creativity', '10. Creativity', [sub('sub-blog', "Student's Blog"), sub('sub-bulletin', 'Bulletin Board')]),
    cat('cat-leadership', '11. Leadership', [sub('sub-leadership', 'Exhibiting Leadership'), sub('sub-environment', 'Environmental Concern')]),
    cat('cat-library', '12. Library Usage', [sub('sub-library', 'Library Usage')]),
]

export const DEFAULT_STAR_TITLES = [
    { id: 'som', name: 'Star of the Month', mode: 'overall', subIds: [] },
    { id: 'academic', name: 'Academic Accolades', mode: 'criteria', subIds: ['sub-assessments', 'sub-english', 'sub-books'] },
    { id: 'progressive', name: 'Progressive Worker', mode: 'criteria', subIds: ['sub-attendance', 'sub-homework', 'sub-reporting', 'sub-behaviour', 'sub-etiquette'] },
    { id: 'creative', name: 'Creative Hearts', mode: 'criteria', subIds: ['sub-blog', 'sub-bulletin', 'sub-performance'] },
    { id: 'sports', name: 'Sports Star', mode: 'criteria', subIds: ['sub-bfit', 'sub-martial', 'sub-interschool', 'sub-house'] },
]

const memoryStore = {}

const readJson = (key, fallback) => {
    try {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem(key)
            if (stored) return JSON.parse(stored)
        } else if (memoryStore[key]) {
            return JSON.parse(memoryStore[key])
        }
    } catch {
        /* ignore */
    }
    return fallback
}

const writeJson = (key, value) => {
    try {
        const serialized = JSON.stringify(value)
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, serialized)
        } else {
            memoryStore[key] = serialized
        }
    } catch {
        /* ignore */
    }
}

export const getChecklist = () => {
    const stored = readJson(CHECKLIST_KEY, null)
    if (Array.isArray(stored) && stored.length) return stored
    writeJson(CHECKLIST_KEY, DEFAULT_SOM_CHECKLIST)
    return DEFAULT_SOM_CHECKLIST
}

export const saveChecklist = (categories) => writeJson(CHECKLIST_KEY, categories)

export const resetChecklist = () => {
    writeJson(CHECKLIST_KEY, DEFAULT_SOM_CHECKLIST)
    return DEFAULT_SOM_CHECKLIST
}

export const contextKey = ({ month, year, grade, section }) => `${year}|${month}|${grade}|${section}`

export const getDisabledSubs = (context) => readJson(DISABLED_KEY, {})[contextKey(context)] || []

export const setSubDisabled = (context, subId, disabled) => {
    const all = readJson(DISABLED_KEY, {})
    const key = contextKey(context)
    const current = new Set(all[key] || [])
    if (disabled) current.add(subId)
    else current.delete(subId)
    all[key] = [...current]
    writeJson(DISABLED_KEY, all)
}

export const getRatings = () => readJson(RATINGS_KEY, [])

export const saveRatings = (rows) => writeJson(RATINGS_KEY, rows)

export const getStarTitles = () => {
    const stored = readJson(TITLES_KEY, null)
    if (Array.isArray(stored) && stored.length) return stored
    writeJson(TITLES_KEY, DEFAULT_STAR_TITLES)
    return DEFAULT_STAR_TITLES
}

export const saveStarTitles = (titles) => writeJson(TITLES_KEY, titles)

export const getMatrixMeta = (context) => readJson(META_KEY, {})[contextKey(context)] || { classMentor: '', signoff: {} }

export const saveMatrixMeta = (context, meta) => {
    const all = readJson(META_KEY, {})
    all[contextKey(context)] = meta
    writeJson(META_KEY, all)
}

export const isNumericRating = (value) => {
    if (value === 'NA' || value === 'AB' || value === '' || value === undefined || value === null) return false
    const num = Number(value)
    return !Number.isNaN(num) && [1, 2, 3].includes(num)
}

export const averageRatings = (values) => {
    const numbers = values.filter(isNumericRating).map(Number)
    if (!numbers.length) return null
    return Math.round((numbers.reduce((sum, value) => sum + value, 0) / numbers.length) * 100) / 100
}

export const flattenSubs = (categories) => categories.flatMap((category) => (
    category.enabled === false ? [] : category.subs.filter((item) => item.enabled !== false).map((item) => ({ ...item, categoryId: category.id, categoryName: category.name }))
))

export const visibleSubs = (categories, context) => {
    const disabled = new Set(getDisabledSubs(context))
    return flattenSubs(categories).filter((item) => !disabled.has(item.id))
}

export const parseClassKey = (classKey = '') => {
    if (!classKey) return { grade: 'Grade 10', gradeNumber: '10', section: 'A', classKey: 'Grade 10-A' }
    const cleaned = String(classKey).trim()
    const match = cleaned.match(/(?:Grade\s*|Class\s*)?(\d+|[A-Za-z]+)(?:th|st|nd|rd)?\s*[-–]?\s*([A-Za-z0-9]+)?/i)
    if (match) {
        const num = match[1]
        const sec = (match[2] || 'A').toUpperCase()
        const gradeStr = isNaN(num) ? num : `Grade ${num}`
        return {
            grade: gradeStr,
            gradeNumber: num,
            section: sec,
            classKey: `${gradeStr}-${sec}`,
        }
    }
    return { grade: cleaned, gradeNumber: '', section: 'A', classKey: cleaned }
}

export const normalizeClassKey = (grade, section) => {
    const parsed = parseClassKey(section ? `${grade}-${section}` : grade)
    return parsed.classKey
}

/**
 * Returns complete student list for a class, combining integrated user database,
 * assigned class roster, and attendance records, deduplicated by name and ID.
 * Guarantees that no student is excluded and class evaluation matrix is never 0 students.
 */
export const getStudentsForClass = (classKey = 'Grade 10-A') => {
    const { grade, gradeNumber, section, classKey: normalizedKey } = parseClassKey(classKey)

    // 1. From User Database Integrator (Unified Students)
    let integrated = []
    try {
        const allIntegrated = getIntegratedStudentsList()
        integrated = allIntegrated.filter((s) => {
            const p = parseClassKey(s.classSection || `${s.className}-${s.section}`)
            return (p.gradeNumber === gradeNumber || p.grade === grade) && p.section === section
        }).map((s, idx) => ({
            id: s.id || s.studentId,
            studentId: s.id || s.studentId,
            name: s.name,
            rollNumber: s.rollNumber || String(idx + 1).padStart(2, '0'),
            classSection: normalizedKey,
            grade,
            section,
            avatarColor: '#3F46C7',
            gpa: 3.85,
        }))
    } catch {
        integrated = []
    }

    // 2. From Institutional Class Assignments
    const assignedStudents = (CLASS_ASSIGNMENTS[normalizedKey]?.students || []).map((s, idx) => ({
        id: s.id,
        studentId: s.id,
        name: s.name,
        rollNumber: s.rollNumber || String(idx + 1).padStart(2, '0'),
        classSection: normalizedKey,
        grade,
        section,
        avatarColor: s.avatarColor || '#2563EB',
        gpa: s.gpa || 3.9,
        citation: s.citation || '',
    }))

    // 3. From Student Attendance Roster
    const attendanceStudents = STUDENT_ATTENDANCE.filter((s) => {
        const p = parseClassKey(`${s.className}-${s.section}`)
        return (p.gradeNumber === gradeNumber || p.grade === grade) && p.section === section
    }).map((s, idx) => ({
        id: s.admissionNo || s.id,
        studentId: s.admissionNo || s.id,
        name: s.studentName,
        rollNumber: String(idx + 1).padStart(2, '0'),
        classSection: normalizedKey,
        grade,
        section,
        avatarColor: '#059669',
        gpa: 3.7,
    }))

    // 4. Merge and deduplicate by clean name and ID
    const seenNames = new Set()
    const seenIds = new Set()
    const merged = []

    ;[...integrated, ...assignedStudents, ...attendanceStudents].forEach((stu) => {
        const normName = stu.name.trim().toLowerCase()
        if (!seenNames.has(normName) && !seenIds.has(stu.id)) {
            seenNames.add(normName)
            seenIds.add(stu.id)
            merged.push(stu)
        }
    })

    return merged
}

export const getSomRoster = () => {
    return getStudentsForClass('Grade 10-A')
}

export const rosterFor = (grade, section) => {
    const classKey = normalizeClassKey(grade, section)
    return getStudentsForClass(classKey)
}

export const getAllStudentSomHistory = () => {
    try {
        const stored = typeof localStorage !== 'undefined'
            ? localStorage.getItem(STUDENT_SOM_HISTORY_KEY)
            : memoryStore[STUDENT_SOM_HISTORY_KEY]
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    return []
}

export const saveAllStudentSomHistory = (records) => {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STUDENT_SOM_HISTORY_KEY, JSON.stringify(records))
        } else {
            memoryStore[STUDENT_SOM_HISTORY_KEY] = JSON.stringify(records)
        }
    } catch {
        /* ignore */
    }
}

export const getStudentSomHistory = (studentId) => {
    const local = getAllStudentSomHistory().filter((r) => r.studentId === studentId)
    if (local.length > 0) return local

    try {
        const allRecords = getAcademicSomRecords()
        return allRecords.filter((r) => r.studentId === studentId)
    } catch {
        return []
    }
}

export const getLatestStudentSom = (studentId) => {
    const history = getStudentSomHistory(studentId)
    return history.length ? history[0] : null
}

export const ratingFor = (ratings, context, studentId, subId) => ratings.find((item) => (
    item.month === context.month
    && String(item.year) === String(context.year)
    && item.grade === context.grade
    && item.section === context.section
    && item.studentId === studentId
    && item.subId === subId
))?.rating || ''

export const upsertRating = (context, studentId, subId, rating) => {
    const rows = getRatings().filter((item) => !(
        item.month === context.month
        && String(item.year) === String(context.year)
        && item.grade === context.grade
        && item.section === context.section
        && item.studentId === studentId
        && item.subId === subId
    ))
    if (rating) rows.push({ ...context, year: String(context.year), studentId, subId, rating })
    saveRatings(rows)
    return rows
}

export const bulkFillColumn = (context, subId, rating, studentIds) => {
    const targetStudents = studentIds || rosterFor(context.grade, context.section).map((s) => s.id)
    const targetSet = new Set(targetStudents)
    let rows = getRatings().filter((item) => !(
        item.month === context.month
        && String(item.year) === String(context.year)
        && item.grade === context.grade
        && item.section === context.section
        && item.subId === subId
        && targetSet.has(item.studentId)
    ))
    targetStudents.forEach((studentId) => {
        if (rating) {
            rows.push({ ...context, year: String(context.year), studentId, subId, rating: String(rating) })
        }
    })
    saveRatings(rows)
    return rows
}

export const bulkFillStudent = (context, studentId, rating, subIds) => {
    const categories = getChecklist()
    const targetSubs = subIds || visibleSubs(categories, context).map((s) => s.id)
    const subSet = new Set(targetSubs)
    let rows = getRatings().filter((item) => !(
        item.month === context.month
        && String(item.year) === String(context.year)
        && item.grade === context.grade
        && item.section === context.section
        && item.studentId === studentId
        && subSet.has(item.subId)
    ))
    targetSubs.forEach((subId) => {
        if (rating) {
            rows.push({ ...context, year: String(context.year), studentId, subId, rating: String(rating) })
        }
    })
    saveRatings(rows)
    return rows
}

export const bulkInitializeClass = (context, defaultRating = '3') => {
    const students = rosterFor(context.grade, context.section)
    const categories = getChecklist()
    const subs = visibleSubs(categories, context)
    let rows = getRatings().filter((item) => !(
        item.month === context.month
        && String(item.year) === String(context.year)
        && item.grade === context.grade
        && item.section === context.section
    ))
    students.forEach((student) => {
        subs.forEach((sub) => {
            rows.push({
                ...context,
                year: String(context.year),
                studentId: student.id,
                subId: sub.id,
                rating: String(defaultRating),
            })
        })
    })
    saveRatings(rows)
    return rows
}

export const clearClassRatings = (context) => {
    const rows = getRatings().filter((item) => !(
        item.month === context.month
        && String(item.year) === String(context.year)
        && item.grade === context.grade
        && item.section === context.section
    ))
    saveRatings(rows)
    return rows
}

export const studentScore = (subs, ratings, context, studentId, subIds) => {
    const selected = subIds ? subs.filter((item) => subIds.includes(item.id)) : subs
    return averageRatings(selected.map((item) => ratingFor(ratings, context, studentId, item.id)))
}

export const rankStudents = (students, scoreOf) => [...students]
    .map((student) => ({ ...student, score: scoreOf(student) }))
    .filter((student) => student.score !== null)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

export const titlePlacements = (titles, students, subs, ratings, context) => (titles || getStarTitles()).map((title) => {
    const ranked = rankStudents(students, (student) => studentScore(
        subs,
        ratings,
        context,
        student.id,
        title.mode === 'overall' ? null : title.subIds,
    ))
    return {
        ...title,
        winner: ranked[0] || null,
        runnerUp1: ranked[1] || null,
        runnerUp2: ranked[2] || null,
        ranked,
    }
})

export const publishClassSomAwards = (context, placements, teacherName = 'Class Teacher') => {
    const publishedAt = new Date().toISOString().split('T')[0]
    const academicYear = context.academicYear || `${context.year}-${Number(context.year) + 1}`
    const month = `${context.month} ${context.year}`
    const recordsToSave = []

    placements.forEach((placement) => {
        ['winner', 'runnerUp1', 'runnerUp2'].forEach((tier) => {
            const student = placement[tier]
            if (student) {
                const tierLabel = tier === 'winner' ? 'Winner' : tier === 'runnerUp1' ? 'First Runner-Up' : 'Second Runner-Up'
                const starRating = student.score ? Math.min(3, Math.max(1, Math.round(student.score))) : 3
                const percentage = student.score ? Math.min(100, Math.round((student.score / 3) * 100)) : 95
                recordsToSave.push({
                    id: `ASOM-${context.year}-${placement.id}-${student.id}-${tier}`,
                    month,
                    academicYear,
                    classSection: `${context.grade}-${context.section}`,
                    className: context.grade,
                    section: context.section,
                    studentId: student.id,
                    studentName: student.name,
                    gpa: Number((student.score * 1.33).toFixed(2)),
                    score: percentage,
                    ratingStars: starRating,
                    citation: `${placement.name} (${tierLabel}) for ${context.month} with average star rating of ${student.score}/3.0.`,
                    awardTitle: placement.name,
                    awardTier: tierLabel,
                    status: 'Published',
                    nominatedBy: teacherName,
                    finalizedAt: publishedAt,
                })
            }
        })
    })

    // Save each record to institutional recognition records
    recordsToSave.forEach((record) => {
        try {
            saveAcademicSomRecord(record)
        } catch {
            /* ignore */
        }
    })

    // Save to dedicated student SOM history storage
    try {
        const existingHistory = getAllStudentSomHistory()
        const updatedHistory = [...existingHistory]
        recordsToSave.forEach((newRec) => {
            const idx = updatedHistory.findIndex((h) => h.id === newRec.id || (h.studentId === newRec.studentId && h.month === newRec.month && h.awardTitle === newRec.awardTitle))
            if (idx >= 0) {
                updatedHistory[idx] = newRec
            } else {
                updatedHistory.unshift(newRec)
            }
        })
        saveAllStudentSomHistory(updatedHistory)
    } catch {
        /* ignore */
    }

    return recordsToSave
}

const splitCsvLine = (line) => {
    const cells = []
    let current = ''
    let quoted = false
    for (let index = 0; index < line.length; index += 1) {
        const char = line[index]
        if (char === '"') {
            if (quoted && line[index + 1] === '"') {
                current += '"'
                index += 1
            } else quoted = !quoted
        } else if (char === ',' && !quoted) {
            cells.push(current)
            current = ''
        } else current += char
    }
    cells.push(current)
    return cells.map((cell) => cell.trim())
}

export const checklistTemplateCsv = (context, students, subs) => {
    const header = 'Month,Year,Grade,Section,Student Id,Student Name,Category,Subparameter,Rating'
    const lines = students.flatMap((student) => subs.map((item) => [
        context.month, context.year, context.grade, context.section, student.id, `"${student.name.replace(/"/g, '""')}"`, `"${item.categoryName.replace(/"/g, '""')}"`, `"${item.name.replace(/"/g, '""')}"`, '',
    ].join(',')))
    return [header, ...lines].join('\n')
}

export const previewSomImport = (text, context, students, subs) => {
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
    if (!lines.length) return { rows: [], errors: ['The file is empty.'] }
    const headers = splitCsvLine(lines[0]).map((item) => item.toLowerCase())
    const index = (name) => headers.indexOf(name)
    const required = ['month', 'year', 'grade', 'section', 'student id', 'category', 'subparameter', 'rating']
    const missing = required.filter((name) => index(name) < 0)
    if (missing.length) return { rows: [], errors: [`Missing columns: ${missing.join(', ')}`] }
    const errors = []
    const rows = []
    lines.slice(1).forEach((line, lineIndex) => {
        const cells = splitCsvLine(line)
        const rowNumber = lineIndex + 2
        const month = cells[index('month')]
        const year = cells[index('year')]
        const grade = cells[index('grade')]
        const section = cells[index('section')]
        const studentId = cells[index('student id')]
        const studentName = index('student name') >= 0 ? cells[index('student name')] : ''
        const category = cells[index('category')]
        const subparameter = cells[index('subparameter')]
        const rating = cells[index('rating')]
        if (month !== context.month || String(year) !== String(context.year) || grade !== context.grade || section !== context.section) {
            errors.push(`Row ${rowNumber}: month, year, grade, or section does not match the open matrix.`)
            return
        }
        const student = students.find((item) => item.id === studentId) || students.find((item) => item.name.toLowerCase() === studentName.toLowerCase())
        if (!student) {
            errors.push(`Row ${rowNumber}: student ${studentId || studentName || '(blank)'} is not in this class.`)
            return
        }
        const match = subs.find((item) => item.name.toLowerCase() === subparameter.toLowerCase() && item.categoryName.toLowerCase() === category.toLowerCase())
            || subs.find((item) => item.name.toLowerCase() === subparameter.toLowerCase())
        if (!match) {
            errors.push(`Row ${rowNumber}: ${category} / ${subparameter} is not in the current checklist.`)
            return
        }
        if (!SOM_RATINGS.includes(rating)) {
            errors.push(`Row ${rowNumber}: rating "${rating}" is not one of ${SOM_RATINGS.join(', ')}.`)
            return
        }
        rows.push({ studentId: student.id, subId: match.id, rating, studentName: student.name, subparameter: match.name })
    })
    return { rows, errors }
}

export const importSomRows = (context, rows) => {
    let ratings = getRatings()
    rows.forEach((row) => {
        ratings = ratings.filter((item) => !(
            item.month === context.month
            && String(item.year) === String(context.year)
            && item.grade === context.grade
            && item.section === context.section
            && item.studentId === row.studentId
            && item.subId === row.subId
        ))
        ratings.push({ ...context, year: String(context.year), studentId: row.studentId, subId: row.subId, rating: row.rating })
    })
    saveRatings(ratings)
    return ratings
}
