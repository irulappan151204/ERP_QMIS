import test from 'node:test'
import assert from 'node:assert/strict'
import {
    SOM_RATINGS,
    VALID_INTEGER_RATINGS,
    isNumericRating,
    averageRatings,
    studentScore,
    rankStudents,
    titlePlacements,
    bulkFillColumn,
    bulkFillStudent,
    bulkInitializeClass,
    clearClassRatings,
    publishClassSomAwards,
    DEFAULT_SOM_CHECKLIST,
    DEFAULT_STAR_TITLES
} from '../somChecklist.js'

test('1. Star scale strictly enforces 1, 2, 3 integer ratings with NO fractional 0.5 steps', () => {
    // Valid integer ratings must only be 1, 2, 3
    assert.deepEqual(VALID_INTEGER_RATINGS, [3, 2, 1])

    // Scale must include 1, 2, 3, NA, AB but NO 2.5, 1.5, or other .5 fractions
    assert.deepEqual(SOM_RATINGS, ['1', '2', '3', 'NA', 'AB'])
    assert.ok(!SOM_RATINGS.includes('2.5'))
    assert.ok(!SOM_RATINGS.includes('1.5'))
    assert.ok(!SOM_RATINGS.includes('0.5'))

    // isNumericRating strictly accepts 1, 2, 3
    assert.equal(isNumericRating('3'), true)
    assert.equal(isNumericRating('2'), true)
    assert.equal(isNumericRating('1'), true)
    assert.equal(isNumericRating(3), true)
    assert.equal(isNumericRating(2), true)
    assert.equal(isNumericRating(1), true)

    // isNumericRating rejects fractional 0.5 ratings and invalid values
    assert.equal(isNumericRating('2.5'), false)
    assert.equal(isNumericRating(2.5), false)
    assert.equal(isNumericRating('1.5'), false)
    assert.equal(isNumericRating('4'), false)
    assert.equal(isNumericRating('0'), false)
    assert.equal(isNumericRating('NA'), false)
    assert.equal(isNumericRating('AB'), false)
    assert.equal(isNumericRating(''), false)
    assert.equal(isNumericRating(null), false)
})

test('2. Average ratings calculate arithmetic mean on integer scale, omitting NA and AB from denominator', () => {
    // Basic integer rating average: 3, 3, 2, 2 = 10 / 4 = 2.50
    const ratings1 = ['3', '3', '2', '2']
    assert.equal(averageRatings(ratings1), 2.5)

    // Omission of NA and AB: [3, 3, 'NA', 'AB', 3] => 9 / 3 = 3.00
    const ratings2 = ['3', '3', 'NA', 'AB', '3']
    assert.equal(averageRatings(ratings2), 3)

    // Single rating: [1] => 1.00
    assert.equal(averageRatings(['1']), 1)

    // All NA or AB => null (not evaluated)
    assert.equal(averageRatings(['NA', 'AB', 'NA']), null)
    assert.equal(averageRatings([]), null)

    // Fraction 2.5 if passed inadvertently is rejected and omitted from average
    const ratingsWithFraction = ['3', '3', '2.5', '3']
    assert.equal(averageRatings(ratingsWithFraction), 3) // 2.5 is rejected, 9 / 3 = 3.0
})

test('3. Checklist definition provides canonical 12 categories and 26 subparameters', () => {
    assert.equal(DEFAULT_SOM_CHECKLIST.length, 12)

    const totalSubs = DEFAULT_SOM_CHECKLIST.reduce((sum, cat) => sum + cat.subs.length, 0)
    assert.equal(totalSubs, 26)

    // Verify key categories exist
    const catNames = DEFAULT_SOM_CHECKLIST.map((c) => c.name)
    assert.ok(catNames.some((n) => n.includes('Punctuality')))
    assert.ok(catNames.some((n) => n.includes('Active Participation')))
    assert.ok(catNames.some((n) => n.includes('Classroom Behaviour')))
    assert.ok(catNames.some((n) => n.includes('Personal Grooming')))
    assert.ok(catNames.some((n) => n.includes('Table Etiquette')))
    assert.ok(catNames.some((n) => n.includes('Handling Resources')))
    assert.ok(catNames.some((n) => n.includes('Communication in English')))
    assert.ok(catNames.some((n) => n.includes('Socializing')))
    assert.ok(catNames.some((n) => n.includes('Academic Performance')))
    assert.ok(catNames.some((n) => n.includes('Creativity')))
    assert.ok(catNames.some((n) => n.includes('Leadership')))
    assert.ok(catNames.some((n) => n.includes('Library Usage')))
})

test('4. Title placements accurately calculate Top 3 (Winner, Runner-Up 1, Runner-Up 2) for all star titles', () => {
    const students = [
        { id: 'STU-001', name: 'Alice Smith' },
        { id: 'STU-002', name: 'Bob Jones' },
        { id: 'STU-003', name: 'Charlie Brown' },
        { id: 'STU-004', name: 'Diana Prince' }
    ]

    const subs = [
        { id: 'sub-assessments', name: 'Assessments', categoryName: 'Academic Performance' },
        { id: 'sub-english', name: 'Communication in English', categoryName: 'Communication in English' },
        { id: 'sub-books', name: 'Maintenance of books', categoryName: 'Handling Resources' },
        { id: 'sub-attendance', name: 'Attendance', categoryName: 'Punctuality' },
        { id: 'sub-bfit', name: 'BFIT', categoryName: 'Active Participation' }
    ]

    const context = { month: 'September', year: '2025', grade: 'Grade 10', section: 'A' }

    // Mock ratings table:
    // Alice has all 3s
    // Bob has 2s
    // Charlie has 1s
    // Diana has NA
    const mockRatings = [
        // Alice
        ...subs.map((s) => ({ ...context, studentId: 'STU-001', subId: s.id, rating: '3' })),
        // Bob
        ...subs.map((s) => ({ ...context, studentId: 'STU-002', subId: s.id, rating: '2' })),
        // Charlie
        ...subs.map((s) => ({ ...context, studentId: 'STU-003', subId: s.id, rating: '1' })),
        // Diana
        ...subs.map((s) => ({ ...context, studentId: 'STU-004', subId: s.id, rating: 'NA' }))
    ]

    const placements = titlePlacements(DEFAULT_STAR_TITLES, students, subs, mockRatings, context)
    assert.ok(placements.length >= 5)

    const overallSom = placements.find((p) => p.id === 'som')
    assert.ok(overallSom)
    assert.equal(overallSom.winner.id, 'STU-001') // Alice (3.0 ⭐)
    assert.equal(overallSom.winner.score, 3)
    assert.equal(overallSom.runnerUp1.id, 'STU-002') // Bob (2.0 ⭐)
    assert.equal(overallSom.runnerUp1.score, 2)
    assert.equal(overallSom.runnerUp2.id, 'STU-003') // Charlie (1.0 ⭐)
    assert.equal(overallSom.runnerUp2.score, 1)

    // Academic Accolades
    const academicTitle = placements.find((p) => p.id === 'academic')
    assert.ok(academicTitle)
    assert.equal(academicTitle.winner.id, 'STU-001')
    assert.equal(academicTitle.runnerUp1.id, 'STU-002')
})

test('5. Bulk marks functions correctly initialize and assign ratings across class, column, and student', () => {
    // Test in-memory simulation of bulk operations
    const context = { month: 'October', year: '2025', grade: 'Grade 10', section: 'A' }
    const studentIds = ['STU-T1', 'STU-T2', 'STU-T3']

    // 1. Column quick-fill: set sub-attendance to 3 for all 3 students
    const colRows = bulkFillColumn(context, 'sub-attendance', '3', studentIds)
    const attendanceRatings = colRows.filter((r) => r.subId === 'sub-attendance' && r.month === 'October' && r.grade === 'Grade 10')
    assert.equal(attendanceRatings.length, 3)
    assert.ok(attendanceRatings.every((r) => r.rating === '3'))

    // 2. Student row quick-fill: set STU-T1 to 2 across multiple subIds
    const targetSubs = ['sub-attendance', 'sub-homework', 'sub-reporting']
    const stuRows = bulkFillStudent(context, 'STU-T1', '2', targetSubs)
    const stu1Ratings = stuRows.filter((r) => r.studentId === 'STU-T1' && targetSubs.includes(r.subId))
    assert.equal(stu1Ratings.length, 3)
    assert.ok(stu1Ratings.every((r) => r.rating === '2'))

    // 3. Clear ratings
    const cleared = clearClassRatings(context)
    const remaining = cleared.filter((r) => r.month === 'October' && r.year === '2025' && r.grade === 'Grade 10' && r.section === 'A')
    assert.equal(remaining.length, 0)
})

test('6. publishClassSomAwards generates properly formatted academic SOM records with correct percentages and star badges', () => {
    const context = {
        month: 'September',
        year: '2025',
        academicYear: '2025-2026',
        grade: 'Grade 10',
        section: 'A'
    }

    const mockPlacements = [
        {
            id: 'som',
            name: 'Star of the Month',
            winner: { id: 'STU-001', name: 'Alice Smith', score: 3.0 },
            runnerUp1: { id: 'STU-002', name: 'Bob Jones', score: 2.8 },
            runnerUp2: { id: 'STU-003', name: 'Charlie Brown', score: 2.5 }
        },
        {
            id: 'academic',
            name: 'Academic Accolades',
            winner: { id: 'STU-001', name: 'Alice Smith', score: 3.0 },
            runnerUp1: null,
            runnerUp2: null
        }
    ]

    const published = publishClassSomAwards(context, mockPlacements, 'Priya Menon')
    assert.ok(published.length >= 4)

    // Check winner record
    const winnerRec = published.find((p) => p.awardTitle === 'Star of the Month' && p.awardTier === 'Winner')
    assert.ok(winnerRec)
    assert.equal(winnerRec.studentId, 'STU-001')
    assert.equal(winnerRec.studentName, 'Alice Smith')
    assert.equal(winnerRec.score, 100) // 3.0 / 3.0 * 100 = 100%
    assert.equal(winnerRec.ratingStars, 3)
    assert.equal(winnerRec.status, 'Published')
    assert.equal(winnerRec.nominatedBy, 'Priya Menon')
    assert.ok(winnerRec.citation.includes('Star of the Month (Winner)'))
})
