/**
 * Centralized Examination Halls & Invigilation Duties Data Store & Conflict Engine
 */

const STORAGE_KEY_HALLS = 'schoolerp_exam_halls'
const STORAGE_KEY_DUTIES = 'schoolerp_invigilation_duties'

export const DEFAULT_EXAM_HALLS = [
    {
        id: 'HALL-001',
        hallName: 'Examination Hall 1 (East Wing)',
        wingBlock: 'East Wing Academic Complex (Level 2)',
        capacity: 60,
        rows: 6,
        columns: 10,
        facilities: ['CCTV Surveillance', 'Central Air Conditioning', 'Biometric Verification Reader'],
        status: 'Active',
    },
    {
        id: 'HALL-002',
        hallName: 'Examination Hall 2 (West Wing)',
        wingBlock: 'West Wing Main Building (Level 2)',
        capacity: 60,
        rows: 6,
        columns: 10,
        facilities: ['CCTV Surveillance', 'High Resolution Camera', 'Wheelchair Ramp Access'],
        status: 'Active',
    },
    {
        id: 'HALL-003',
        hallName: 'Hall 301 (Senior Secondary Block)',
        wingBlock: 'Senior Wing (Level 3)',
        capacity: 40,
        rows: 5,
        columns: 8,
        facilities: ['CCTV Surveillance', 'Individual Desk Power Units', 'Acoustic Ceiling'],
        status: 'Active',
    },
    {
        id: 'HALL-004',
        hallName: 'Hall 302 (Senior Secondary Block)',
        wingBlock: 'Senior Wing (Level 3)',
        capacity: 40,
        rows: 5,
        columns: 8,
        facilities: ['CCTV Surveillance', 'Digital Clock Synchronizer'],
        status: 'Active',
    },
]

export const DEFAULT_INVIGILATION_DUTIES = [
    {
        id: 'DUTY-101',
        hallId: 'HALL-001',
        hallName: 'Examination Hall 1 (East Wing)',
        capacity: 60,
        examName: 'Mid-Term Board Examination 2025',
        subject: 'Mathematics',
        sessionDate: '2026-03-24',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        primaryInvigilator: 'Dr. Subramanian (Physics Lead)',
        primaryInvigilatorId: 'EMP-TCH-004',
        reserveInvigilator: 'Priya Menon',
        reserveInvigilatorId: 'EMP-TCH-009',
        candidateClasses: 'Grade 10-A, 10-B',
        status: 'Scheduled',
    },
    {
        id: 'DUTY-102',
        hallId: 'HALL-002',
        hallName: 'Examination Hall 2 (West Wing)',
        capacity: 60,
        examName: 'Mid-Term Board Examination 2025',
        subject: 'Mathematics',
        sessionDate: '2026-03-24',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        primaryInvigilator: 'S. Ramanathan (Math Dept)',
        primaryInvigilatorId: 'EMP-TCH-006',
        reserveInvigilator: 'K. Meenakshi',
        reserveInvigilatorId: 'EMP-TCH-012',
        candidateClasses: 'Grade 12-A, 12-B',
        status: 'Scheduled',
    },
    {
        id: 'DUTY-103',
        hallId: 'HALL-003',
        hallName: 'Hall 301 (Senior Secondary Block)',
        capacity: 40,
        examName: 'Mid-Term Board Examination 2025',
        subject: 'Chemistry',
        sessionDate: '2026-03-25',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        primaryInvigilator: 'Ananya Sharma (Chemistry)',
        primaryInvigilatorId: 'EMP-TCH-008',
        reserveInvigilator: 'R. Venkatesh',
        reserveInvigilatorId: 'EMP-TCH-015',
        candidateClasses: 'Grade 9-A',
        status: 'Scheduled',
    },
    {
        id: 'DUTY-104',
        hallId: 'HALL-004',
        hallName: 'Hall 302 (Senior Secondary Block)',
        capacity: 40,
        examName: 'Mid-Term Board Examination 2025',
        subject: 'English Literature',
        sessionDate: '2026-03-26',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        primaryInvigilator: 'M. Harikrishnan (English)',
        primaryInvigilatorId: 'EMP-TCH-007',
        reserveInvigilator: 'S. Divya',
        reserveInvigilatorId: 'EMP-TCH-019',
        candidateClasses: 'Grade 9-B',
        status: 'Scheduled',
    },
]

export const FACULTY_INVIGILATOR_POOL = [
    { id: 'EMP-TCH-004', name: 'Dr. Subramanian (Physics Lead)', department: 'Physics' },
    { id: 'EMP-TCH-006', name: 'S. Ramanathan (Math Dept)', department: 'Mathematics' },
    { id: 'EMP-TCH-007', name: 'M. Harikrishnan (English)', department: 'English' },
    { id: 'EMP-TCH-008', name: 'Ananya Sharma (Chemistry)', department: 'Chemistry' },
    { id: 'EMP-TCH-009', name: 'Priya Menon (Computer Science)', department: 'Computer Science' },
    { id: 'EMP-TCH-012', name: 'K. Meenakshi (Social Science)', department: 'Social Science' },
    { id: 'EMP-TCH-015', name: 'R. Venkatesh (Physical Education)', department: 'Sports' },
    { id: 'EMP-TCH-019', name: 'S. Divya (Biology)', department: 'Biology' },
]

function readStorage(key, defaultValue) {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(key)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    return defaultValue
}

function writeStorage(key, value) {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(value))
        }
    } catch {
        /* ignore */
    }
}

// ─── EXAMINATION HALLS API ───────────────────────────────────────────────────

export function getExamHalls() {
    return readStorage(STORAGE_KEY_HALLS, DEFAULT_EXAM_HALLS)
}

export function saveExamHalls(halls) {
    writeStorage(STORAGE_KEY_HALLS, halls)
    return halls
}

export function addExamHall(hallData) {
    const list = getExamHalls()
    const newHall = {
        id: `HALL-${String(list.length + 1).padStart(3, '0')}`,
        hallName: hallData.hallName?.trim() || 'New Examination Hall',
        wingBlock: hallData.wingBlock?.trim() || 'Academic Block',
        capacity: Number(hallData.capacity) || 40,
        rows: Number(hallData.rows) || 5,
        columns: Number(hallData.columns) || 8,
        facilities: hallData.facilities || ['CCTV Surveillance'],
        status: hallData.status || 'Active',
    }
    const updated = [newHall, ...list]
    saveExamHalls(updated)
    return newHall
}

export function updateExamHall(id, patch) {
    const list = getExamHalls()
    const updated = list.map((h) => (h.id === id ? { ...h, ...patch } : h))
    saveExamHalls(updated)
    return updated.find((h) => h.id === id) || null
}

export function deleteExamHall(id) {
    const list = getExamHalls()
    const updated = list.filter((h) => h.id !== id)
    saveExamHalls(updated)
    return updated
}

// ─── INVIGILATION DUTIES API & CONFLICT VALIDATOR ────────────────────────────

export function getInvigilationDuties() {
    return readStorage(STORAGE_KEY_DUTIES, DEFAULT_INVIGILATION_DUTIES)
}

export function saveInvigilationDuties(duties) {
    writeStorage(STORAGE_KEY_DUTIES, duties)
    return duties
}

/**
 * Validates teacher availability and detects double booking conflicts.
 * Checks whether the given teacher is already allocated to another hall on the same date and overlapping session time.
 */
export function checkInvigilatorClash({
    invigilatorName,
    sessionDate,
    startTime,
    endTime,
    excludeDutyId = null,
}) {
    if (!invigilatorName || !sessionDate) return null
    const duties = getInvigilationDuties()

    const clash = duties.find((d) => {
        if (d.status === 'Cancelled') return false
        if (excludeDutyId && d.id === excludeDutyId) return false
        if (d.sessionDate !== sessionDate) return false

        // Check if teacher is either primary or reserve
        const matchesTeacher =
            (d.primaryInvigilator || '').toLowerCase().includes(invigilatorName.toLowerCase()) ||
            (d.reserveInvigilator || '').toLowerCase().includes(invigilatorName.toLowerCase())

        if (!matchesTeacher) return false

        // Check time overlap
        return d.startTime === startTime && d.endTime === endTime
    })

    if (clash) {
        return {
            hasClash: true,
            conflictingDuty: clash,
            message: `Conflict Detected: ${invigilatorName} is already assigned to ${clash.hallName} on ${sessionDate} (${clash.startTime} – ${clash.endTime}).`,
        }
    }

    return { hasClash: false }
}

export function scheduleInvigilationDuty(dutyData) {
    // 1. Run conflict validation
    const primaryClash = checkInvigilatorClash({
        invigilatorName: dutyData.primaryInvigilator,
        sessionDate: dutyData.sessionDate,
        startTime: dutyData.startTime,
        endTime: dutyData.endTime,
    })
    if (primaryClash.hasClash) {
        throw new Error(primaryClash.message)
    }

    if (dutyData.reserveInvigilator) {
        const reserveClash = checkInvigilatorClash({
            invigilatorName: dutyData.reserveInvigilator,
            sessionDate: dutyData.sessionDate,
            startTime: dutyData.startTime,
            endTime: dutyData.endTime,
        })
        if (reserveClash.hasClash) {
            throw new Error(reserveClash.message)
        }
    }

    const list = getInvigilationDuties()
    const newDuty = {
        id: `DUTY-${Date.now()}`,
        hallId: dutyData.hallId || 'HALL-001',
        hallName: dutyData.hallName || 'Examination Hall',
        capacity: Number(dutyData.capacity) || 50,
        examName: dutyData.examName || 'Annual Exam 2025–26',
        subject: dutyData.subject || 'All Subjects',
        sessionDate: dutyData.sessionDate || new Date().toISOString().split('T')[0],
        startTime: dutyData.startTime || '09:00 AM',
        endTime: dutyData.endTime || '12:00 PM',
        primaryInvigilator: dutyData.primaryInvigilator,
        primaryInvigilatorId: dutyData.primaryInvigilatorId || 'EMP-TCH-001',
        reserveInvigilator: dutyData.reserveInvigilator || 'Staff Reserve',
        reserveInvigilatorId: dutyData.reserveInvigilatorId || 'EMP-TCH-002',
        candidateClasses: dutyData.candidateClasses || 'Grade 10-A',
        status: 'Scheduled',
    }
    const updated = [newDuty, ...list]
    saveInvigilationDuties(updated)
    return newDuty
}

export function updateInvigilationDuty(id, patch) {
    const list = getInvigilationDuties()
    const updated = list.map((d) => (d.id === id ? { ...d, ...patch } : d))
    saveInvigilationDuties(updated)
    return updated.find((d) => d.id === id) || null
}

export function cancelInvigilationDuty(id, reason = 'Cancelled by Administrator') {
    const list = getInvigilationDuties()
    const updated = list.map((d) => (d.id === id ? { ...d, status: 'Cancelled', cancellationReason: reason } : d))
    saveInvigilationDuties(updated)
    return updated
}
