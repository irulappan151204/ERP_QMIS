import test from 'node:test'
import assert from 'node:assert/strict'

// Polyfill minimal localStorage if running in Node environment
if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map()
    globalThis.localStorage = {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
        clear: () => store.clear()
    }
}

// Polyfill window / CustomEvent if running in Node environment
if (typeof globalThis.window === 'undefined') {
    globalThis.window = {
        dispatchEvent: () => true
    }
}

import {
    parseClassKey,
    normalizeClassKey,
    getStudentsForClass,
    rosterFor,
    getChecklist,
    getStarTitles,
    getRatings,
    visibleSubs,
    upsertRating,
    ratingFor,
    studentScore,
    titlePlacements,
    bulkInitializeClass,
    bulkFillColumn,
    bulkFillStudent,
    publishClassSomAwards,
    getAllStudentSomHistory,
    getStudentSomHistory,
    getLatestStudentSom
} from '../somChecklist.js'

import {
    dispatchSomPublishNotifications
} from '../somNotifications.js'

import {
    getIntegratedStudentProfile
} from '../../UserDatabase/userDatabaseIntegrator.js'

import {
    getAuthorizedClassesForUser,
    CLASS_ASSIGNMENTS
} from '../../Recognition/recognitionData.js'

test('Class Key Parsing & Normalization', () => {
    const parsed10A = parseClassKey('Grade 10-A')
    assert.equal(parsed10A.grade, 'Grade 10')
    assert.equal(parsed10A.section, 'A')

    const parsed10Hyphen = parseClassKey('Grade 10 - A')
    assert.equal(parsed10Hyphen.grade, 'Grade 10')
    assert.equal(parsed10Hyphen.section, 'A')

    const parsed9B = parseClassKey('Grade 9-B')
    assert.equal(parsed9B.grade, 'Grade 9')
    assert.equal(parsed9B.section, 'B')

    const parsed10th = parseClassKey('10th-A')
    assert.equal(parsed10th.grade, 'Grade 10')
    assert.equal(parsed10th.section, 'A')

    assert.equal(normalizeClassKey('Grade 10 - A'), 'Grade 10-A')
    assert.equal(normalizeClassKey('10th-A'), 'Grade 10-A')
    assert.equal(normalizeClassKey('Grade 9-A'), 'Grade 9-A')
})

test('Complete Student Roster Resolution (Fixing 0-students bug)', () => {
    // Grade 10-A has at least 13 enrolled students in the school dataset
    const students10A = getStudentsForClass('Grade 10-A')
    assert.ok(students10A.length >= 13, `Expected at least 13 students, got ${students10A.length}`)

    // Every student must have standard attributes
    students10A.forEach((student) => {
        assert.ok(student.id, 'Student must have an ID')
        assert.ok(student.name, 'Student must have a name')
        assert.ok(student.rollNumber || student.roll, 'Student must have a roll number')
    })

    // rosterFor helper must also resolve complete roster
    const rosterFromHelper = rosterFor('Grade 10', 'A')
    assert.ok(rosterFromHelper.length >= 13)

    // Verify Grade 9-A resolution
    const students9A = getStudentsForClass('Grade 9-A')
    assert.ok(students9A.length > 0, 'Grade 9-A must resolve students')
})

test('Role-Based Class Scoping Authorization', () => {
    // 1. Class Teacher (Priya Menon) must be strictly locked to Grade 10-A
    const teacherClasses = getAuthorizedClassesForUser('teacher', 'teacher@school.com')
    assert.deepEqual(teacherClasses, ['Grade 10-A'])

    // 2. Academic Coordinator must be scoped to Grades 9 to 12
    const coordClasses = getAuthorizedClassesForUser('coordinator', 'coordinator@school.com')
    assert.ok(coordClasses.length >= 4)
    assert.ok(coordClasses.includes('Grade 9-A'))
    assert.ok(coordClasses.includes('Grade 10-A'))
    assert.ok(coordClasses.includes('Grade 11-A'))
    assert.ok(coordClasses.includes('Grade 12-A'))
    assert.ok(!coordClasses.includes('Grade 5-A'), 'Primary classes must not be accessible to Secondary Coordinator')

    // 3. Principal / Director / Super Admin can access all classes
    const principalClasses = getAuthorizedClassesForUser('principal', 'principal@school.com')
    assert.equal(principalClasses.length, Object.keys(CLASS_ASSIGNMENTS).length)
})

test('Strict 1, 2, 3 Integer Star Rating Scale & Evaluation Score Calculation', () => {
    const checklist = getChecklist()
    const context = { month: 'August', year: '2026', grade: 'Grade 10', section: 'A' }
    const subs = visibleSubs(checklist, context)
    assert.equal(subs.length, 26, 'Should have exactly 26 active subparameters across 12 categories')

    const students = getStudentsForClass('Grade 10-A')
    const student1 = students[0]

    // Set ratings on strict integer scale: 3, 2, 1, and NA
    let ratings = {}
    ratings = upsertRating(context, student1.id, subs[0].id, '3', ratings)
    ratings = upsertRating(context, student1.id, subs[1].id, '3', ratings)
    ratings = upsertRating(context, student1.id, subs[2].id, '2', ratings)
    ratings = upsertRating(context, student1.id, subs[3].id, 'NA', ratings) // NA omitted from average

    assert.equal(ratingFor(ratings, context, student1.id, subs[0].id), '3')
    assert.equal(ratingFor(ratings, context, student1.id, subs[1].id), '3')
    assert.equal(ratingFor(ratings, context, student1.id, subs[2].id), '2')
    assert.equal(ratingFor(ratings, context, student1.id, subs[3].id), 'NA')

    // Average of 3, 3, 2 = 8 / 3 = 2.67
    const score = studentScore(subs, ratings, context, student1.id)
    assert.equal(score, 2.67)
})

test('Bulk Marks Initialization & Quick Fill Actions', () => {
    const context = { month: 'August', year: '2026', grade: 'Grade 10', section: 'A' }
    const students = getStudentsForClass('Grade 10-A')
    const subs = visibleSubs(getChecklist(), context)

    // 1. Bulk Initialize All 3 Stars
    const bulkAll3 = bulkInitializeClass(context, '3')
    students.forEach((stu) => {
        subs.forEach((sub) => {
            assert.equal(ratingFor(bulkAll3, context, stu.id, sub.id), '3')
        })
        assert.equal(studentScore(subs, bulkAll3, context, stu.id), 3)
    })

    // 2. Bulk Fill Single Column with 2 Stars
    const bulkCol = bulkFillColumn(context, subs[0].id, '2')
    students.forEach((stu) => {
        assert.equal(ratingFor(bulkCol, context, stu.id, subs[0].id), '2')
        assert.equal(ratingFor(bulkCol, context, stu.id, subs[1].id), '3')
    })

    // 3. Bulk Fill Single Student with 1 Star
    const bulkStu = bulkFillStudent(context, students[0].id, '1')
    subs.forEach((sub) => {
        assert.equal(ratingFor(bulkStu, context, students[0].id, sub.id), '1')
    })
    // Other students retain their scores
    assert.equal(ratingFor(bulkStu, context, students[1].id, subs[1].id), '3')
})

test('Star Titles & Podium Placement Calculation', () => {
    const context = { month: 'August', year: '2026', grade: 'Grade 10', section: 'A' }
    const students = getStudentsForClass('Grade 10-A')
    const subs = visibleSubs(getChecklist(), context)

    // Give students staggered scores
    bulkInitializeClass(context, '2')
    // Give student 0 highest scores
    bulkFillStudent(context, students[0].id, '3')
    // Give student 1 lowest scores
    bulkFillStudent(context, students[1].id, '1')

    const currentRatings = getRatings()
    const placements = titlePlacements(getStarTitles(), students, subs, currentRatings, context)
    assert.ok(placements.length >= 5, 'Must calculate all 5 star titles')

    const overallTitle = placements.find((p) => p.id === 'som')
    assert.ok(overallTitle, 'Star of the Month (SOM) title must exist')
    assert.equal(overallTitle.winner?.id, students[0].id, 'Student 0 must win Star of the Month')
    assert.equal(overallTitle.winner?.score, 3)
})

test('Publishing Awards Updates Student History & Dispatches Multi-Channel Notifications', () => {
    const context = { month: 'August', year: '2026', grade: 'Grade 10', section: 'A' }
    const students = getStudentsForClass('Grade 10-A')
    const subs = visibleSubs(getChecklist(), context)
    bulkInitializeClass(context, '3')

    const currentRatings = getRatings()
    const placements = titlePlacements(getStarTitles(), students, subs, currentRatings, context)

    // Publish awards
    const published = publishClassSomAwards(context, placements, 'Priya Menon (Class Teacher)')
    assert.ok(published.length > 0, 'Must generate published awards')

    // Verify history storage
    const allHistory = getAllStudentSomHistory()
    assert.ok(allHistory.length > 0, 'History repository must contain published awards')

    const topStudentId = published[0].studentId
    const studentHistory = getStudentSomHistory(topStudentId)
    assert.ok(studentHistory.length > 0, 'Individual student history must record award')
    assert.ok(studentHistory.some((item) => item.studentId === topStudentId))

    const latestAward = getLatestStudentSom(topStudentId)
    assert.ok(latestAward, 'getLatestStudentSom must return latest award')
    assert.equal(latestAward.studentId, topStudentId)

    // Verify Multi-Channel Notification Dispatch
    const notificationResult = dispatchSomPublishNotifications({
        month: 'August',
        year: '2026',
        grade: 'Grade 10',
        section: 'A',
        teacherName: 'Priya Menon',
        publishedAwards: published,
        students
    })

    assert.ok(notificationResult.totalNotifications > 0, 'Must create notifications')
    assert.ok(notificationResult.channels.students >= 1, 'Must notify award-winning students')
    assert.ok(notificationResult.channels.parents >= 1, 'Must notify parents of award winners')
    assert.ok(notificationResult.channels.coordinators >= 1, 'Must notify academic coordinator')

    // Verify channel notifications stored in localStorage
    const studentNotifs = JSON.parse(localStorage.getItem('student-notifications') || '[]')
    const parentNotifs = JSON.parse(localStorage.getItem('parent-notifications') || '[]')
    const coordNotifs = JSON.parse(localStorage.getItem('coordinator-notifications') || '[]')
    const teacherNotifs = JSON.parse(localStorage.getItem('teacher-notifications') || '[]')

    assert.ok(studentNotifs.length >= notificationResult.channels.students)
    assert.ok(parentNotifs.length >= notificationResult.channels.parents)
    assert.ok(coordNotifs.length >= 1)
    assert.ok(teacherNotifs.length >= 1)
})

test('Integrated Student Profile includes Star of the Month Records', () => {
    const students = getStudentsForClass('Grade 10-A')
    const student = students[0]

    // Fetch profile through userDatabaseIntegrator
    const profile = getIntegratedStudentProfile(student.id)
    assert.ok(profile, 'Integrated student profile must be found')
    assert.ok(profile.starOfTheMonth, 'Profile must have starOfTheMonth property')
    assert.ok(Array.isArray(profile.starOfTheMonth.history), 'starOfTheMonth.history must be an array')
    assert.equal(typeof profile.starOfTheMonth.totalAwards, 'number')
})
