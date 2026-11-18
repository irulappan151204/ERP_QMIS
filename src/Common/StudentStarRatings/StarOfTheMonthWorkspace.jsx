import React, { useMemo, useState, useEffect } from 'react'
import {
    Award,
    Trophy,
    Star,
    CheckCircle2,
    Printer,
    Download,
    RotateCcw,
    ChevronDown,
    ChevronRight,
    Users,
    Zap,
    HelpCircle,
    Check,
    Lock,
    Eye,
    Send
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui'
import { openPrintDocument } from '../printDocument'
import {
    SOM_MONTHS,
    SOM_RATINGS,
    SOM_RATING_META,
    getChecklist,
    getStarTitles,
    getRatings,
    saveRatings,
    getMatrixMeta,
    saveMatrixMeta,
    visibleSubs,
    ratingFor,
    upsertRating,
    bulkFillColumn,
    bulkFillStudent,
    bulkInitializeClass,
    clearClassRatings,
    studentScore,
    titlePlacements,
    publishClassSomAwards,
    parseClassKey,
    normalizeClassKey,
    getStudentsForClass,
    checklistTemplateCsv,
    previewSomImport,
    importSomRows
} from './somChecklist'
import {
    CLASS_ASSIGNMENTS,
    getAuthorizedClassesForUser,
    getAcademicSomRecords
} from '../Recognition/recognitionData'
import { dispatchSomPublishNotifications } from './somNotifications'

/**
 * Interactive Graphical Star Rating Component
 * Strict integer scale (1, 2, 3 stars) with hover preview, plus NA and AB.
 */
const GraphicalStarPicker = ({ value, onChange, disabled = false, size = 'md' }) => {
    const [hoverValue, setHoverValue] = useState(null)
    const activeValue = hoverValue !== null ? hoverValue : (Number(value) || 0)
    const starSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 15

    return (
        <div className="inline-flex items-center gap-1 select-none">
            <div className="flex items-center gap-0.5 p-1 rounded-lg bg-slate-50 border border-slate-200">
                {[1, 2, 3].map((starNum) => {
                    const isFilled = activeValue >= starNum
                    return (
                        <button
                            key={starNum}
                            type="button"
                            disabled={disabled}
                            title={`${starNum} Star${starNum > 1 ? 's' : ''} (${SOM_RATING_META[String(starNum)]?.label})`}
                            onClick={() => onChange(String(starNum))}
                            onMouseEnter={() => setHoverValue(starNum)}
                            onMouseLeave={() => setHoverValue(null)}
                            className="p-1 rounded transition-transform hover:scale-120 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Star
                                size={starSize}
                                className={`transition-colors ${
                                    isFilled
                                        ? 'text-amber-500 fill-amber-500 drop-shadow-xs'
                                        : 'text-slate-300 hover:text-amber-300'
                                }`}
                            />
                        </button>
                    )
                })}
            </div>

            <button
                type="button"
                disabled={disabled}
                title="Not Applicable"
                onClick={() => onChange(value === 'NA' ? '' : 'NA')}
                className={`px-1.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    value === 'NA'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
            >
                NA
            </button>

            <button
                type="button"
                disabled={disabled}
                title="Absent"
                onClick={() => onChange(value === 'AB' ? '' : 'AB')}
                className={`px-1.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    value === 'AB'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                }`}
            >
                AB
            </button>
        </div>
    )
}

/**
 * Modern, Scrollbar-Free Star of the Month Workspace
 * Fits seamlessly into page layout without nested scroll containers.
 * Hierarchically scopes classes (Teacher -> Coordinator -> Principal/SuperAdmin).
 */
const StarOfTheMonthWorkspace = ({ onPublished }) => {
    const { role: userRole, email: userEmail, name: authName } = useAuth()
    const teacherName = authName || 'Priya Menon'

    // 1. Hierarchical Class Authorization
    const authorizedClasses = useMemo(() => {
        return getAuthorizedClassesForUser(userRole, userEmail)
    }, [userRole, userEmail])

    const isTeacher = userRole === 'teacher'
    const isCoordinator = userRole === 'coordinator'
    const isLeadership = ['principal', 'director', 'superadmin', 'admin'].includes(userRole)

    // Default class is strictly teacher's assigned class or first authorized class
    const [selectedClassKey, setSelectedClassKey] = useState(() => {
        return authorizedClasses[0] || 'Grade 10-A'
    })

    useEffect(() => {
        if (authorizedClasses.length > 0 && !authorizedClasses.includes(selectedClassKey)) {
            setSelectedClassKey(authorizedClasses[0])
        }
    }, [authorizedClasses, selectedClassKey])

    // Time & Session Context
    const [month, setMonth] = useState('September')
    const [year, setYear] = useState('2025')
    const [academicYear, setAcademicYear] = useState('2025-2026')
    const [podiumExpanded, setPodiumExpanded] = useState(true)

    const parsedClass = useMemo(() => parseClassKey(selectedClassKey), [selectedClassKey])
    const grade = parsedClass.grade
    const section = parsedClass.section

    const context = useMemo(() => ({
        month,
        year,
        academicYear,
        grade,
        section,
        classKey: selectedClassKey,
    }), [month, year, academicYear, grade, section, selectedClassKey])

    // 2. Fetch Complete Student Roster (guaranteed 100% of students, no 0-students bug)
    const students = useMemo(() => {
        return getStudentsForClass(selectedClassKey)
    }, [selectedClassKey])

    // 3. Checklist & Ratings State
    const checklist = useMemo(() => getChecklist(), [])
    const titles = useMemo(() => getStarTitles(), [])
    const [ratings, setRatings] = useState(() => getRatings())
    const [isPublishing, setIsPublishing] = useState(false)
    const [collapsedCats, setCollapsedCats] = useState({})

    const subs = useMemo(() => visibleSubs(checklist, context), [checklist, context])
    const placements = useMemo(() => titlePlacements(titles, students, subs, ratings, context), [titles, students, subs, ratings, context])

    // Toggle category group
    const toggleCat = (catId) => {
        setCollapsedCats((prev) => ({ ...prev, [catId]: !prev[catId] }))
    }

    // Set single rating
    const handleSetRating = (studentId, subId, rating) => {
        const next = upsertRating(context, studentId, subId, rating)
        setRatings([...next])
    }

    // Bulk column quick fill
    const handleBulkColumn = (subId, rating) => {
        const next = bulkFillColumn(context, subId, rating, students.map((s) => s.id))
        setRatings([...next])
        toast.info(`Parameter set to ${rating} ⭐ for all ${students.length} students.`)
    }

    // Bulk student row quick fill
    const handleBulkStudent = (studentId, rating) => {
        const next = bulkFillStudent(context, studentId, rating, subs.map((s) => s.id))
        setRatings([...next])
        toast.info(`Assigned ${rating} ⭐ across all parameters for student.`)
    }

    // Bulk class baseline
    const handleBulkClassBaseline = (ratingVal = '3') => {
        if (!students.length) {
            toast.warning('No students in this class section.')
            return
        }
        const next = bulkInitializeClass(context, ratingVal)
        setRatings([...next])
        toast.success(`✓ Class initialized: All ${students.length} students set to ${ratingVal} Stars baseline!`)
    }

    // Set empty cells to NA
    const handleSetUnevaluatedToNa = () => {
        let rows = [...ratings]
        let count = 0
        students.forEach((stu) => {
            subs.forEach((sub) => {
                const current = ratingFor(rows, context, stu.id, sub.id)
                if (!current) {
                    rows = upsertRating(context, stu.id, sub.id, 'NA')
                    count += 1
                }
            })
        })
        setRatings([...rows])
        toast.info(`Marked ${count} unevaluated parameters as NA.`)
    }

    // Clear class ratings
    const handleClearClass = () => {
        if (window.confirm(`Are you sure you want to clear ratings for ${selectedClassKey} (${month} ${year})?`)) {
            const next = clearClassRatings(context)
            setRatings([...next])
            toast.info('Ratings reset for this class evaluation cycle.')
        }
    }

    // Official Publishing Workflow with Multi-Channel Notifications
    const handlePublish = async () => {
        setIsPublishing(true)
        try {
            // 1. Generate & save official SOM records
            const publishedRecords = publishClassSomAwards(context, placements, teacherName)

            // 2. Dispatch multi-channel in-app notifications
            dispatchSomPublishNotifications({
                classKey: selectedClassKey,
                month,
                year,
                academicYear,
                teacherName,
                publishedAwards: publishedRecords,
                students,
            })

            if (onPublished) onPublished(publishedRecords)
        } catch (err) {
            toast.error('Failed to publish awards. Please try again.')
        } finally {
            setIsPublishing(false)
        }
    }

    // Print Queen Mira Official Evaluation Sheet
    const handlePrintSheet = () => {
        const overallWinner = placements.find((p) => p.id === 'som')?.winner
        const academicLead = placements.find((p) => p.id === 'academic')?.winner
        const sportsLead = placements.find((p) => p.id === 'sports')?.winner

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 900px; margin: 0 auto;">
                <div style="text-align: center; border-bottom: 2px solid #3F46C7; padding-bottom: 12px; margin-bottom: 16px;">
                    <h1 style="color: #3F46C7; margin: 0; font-size: 22px; text-transform: uppercase;">Queen Mira International School</h1>
                    <h2 style="color: #64748b; margin: 4px 0 0; font-size: 14px; font-weight: normal;">CIS Accredited · Affiliation CBSE/P/2025</h2>
                    <h3 style="color: #0f172a; margin: 8px 0 0; font-size: 16px; font-weight: bold;">Official Star of the Month Evaluation Roster</h3>
                    <div style="margin-top: 6px; font-size: 12px; color: #475569;">
                        <strong>Class:</strong> ${selectedClassKey} &nbsp;|&nbsp; 
                        <strong>Month:</strong> ${month} ${year} &nbsp;|&nbsp; 
                        <strong>Class Teacher:</strong> ${teacherName} &nbsp;|&nbsp; 
                        <strong>Total Evaluated:</strong> ${students.length} Students
                    </div>
                </div>

                <div style="margin-bottom: 20px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h4 style="margin: 0 0 8px; color: #3F46C7; font-size: 13px;">Official Top Recognition Honors</h4>
                    <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 4px 8px; font-weight: bold;">🥇 Star of the Month (Overall):</td>
                            <td style="padding: 4px 8px;">${overallWinner ? `${overallWinner.name} (${overallWinner.score} ⭐)` : 'None'}</td>
                            <td style="padding: 4px 8px; font-weight: bold;">🥈 Academic Accolades:</td>
                            <td style="padding: 4px 8px;">${academicLead ? `${academicLead.name} (${academicLead.score} ⭐)` : 'None'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 8px; font-weight: bold;">🏅 Sports Star:</td>
                            <td style="padding: 4px 8px;">${sportsLead ? `${sportsLead.name} (${sportsLead.score} ⭐)` : 'None'}</td>
                            <td style="padding: 4px 8px; font-weight: bold;">Official Status:</td>
                            <td style="padding: 4px 8px; color: #059669; font-weight: bold;">Verified & Approved</td>
                        </tr>
                    </table>
                </div>

                <h4 style="margin: 0 0 8px; font-size: 13px; color: #1e293b;">Complete Class Student Standings</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px;">
                    <thead>
                        <tr style="background: #0f172a; color: white;">
                            <th style="padding: 6px 8px; text-align: left; border: 1px solid #334155;">#</th>
                            <th style="padding: 6px 8px; text-align: left; border: 1px solid #334155;">Student Name</th>
                            <th style="padding: 6px 8px; text-align: center; border: 1px solid #334155;">Roll No</th>
                            <th style="padding: 6px 8px; text-align: center; border: 1px solid #334155;">Average Stars</th>
                            <th style="padding: 6px 8px; text-align: center; border: 1px solid #334155;">Score %</th>
                            <th style="padding: 6px 8px; text-align: left; border: 1px solid #334155;">Institutional Standing</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map((stu, i) => {
                            const avg = studentScore(subs, ratings, context, stu.id)
                            const pct = avg !== null ? Math.round((avg / 3) * 100) : 0
                            return `
                                <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                                    <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${i + 1}</td>
                                    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: bold;">${stu.name}</td>
                                    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">${stu.rollNumber || i + 1}</td>
                                    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #b45309;">${avg !== null ? `${avg} ⭐` : '—'}</td>
                                    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">${pct}%</td>
                                    <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${pct >= 90 ? 'Outstanding (3 Stars)' : pct >= 75 ? 'Good (2 Stars)' : 'Developing (1 Star)'}</td>
                                </tr>
                            `
                        }).join('')}
                    </tbody>
                </table>

                <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 16px; border-top: 1px dashed #cbd5e1; font-size: 11px;">
                    <div style="text-align: center; width: 180px;">
                        <div style="height: 30px;"></div>
                        <div style="border-top: 1px solid #64748b; padding-top: 4px; font-weight: bold;">Class Teacher</div>
                        <div style="color: #64748b;">${teacherName}</div>
                    </div>
                    <div style="text-align: center; width: 180px;">
                        <div style="height: 30px;"></div>
                        <div style="border-top: 1px solid #64748b; padding-top: 4px; font-weight: bold;">Academic Coordinator</div>
                        <div style="color: #64748b;">Signature & Date</div>
                    </div>
                    <div style="text-align: center; width: 180px;">
                        <div style="height: 30px;"></div>
                        <div style="border-top: 1px solid #64748b; padding-top: 4px; font-weight: bold;">Principal / Director</div>
                        <div style="color: #64748b;">Official Seal & Sign</div>
                    </div>
                </div>
            </div>
        `
        openPrintDocument({
            title: `Star of the Month — ${selectedClassKey} (${month} ${year})`,
            html,
        })
    }

    return (
        <section className="space-y-5 w-full">
            {/* Top Workspace Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            Star of the Month
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                            Monthly Evaluation Matrix
                        </span>
                        {isTeacher && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1">
                                <Lock size={11} className="text-emerald-600" />
                                <span>Assigned Class: {selectedClassKey}</span>
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        Class Teacher: <strong className="text-slate-800">{teacherName}</strong> · Evaluates 12 canonical categories on strict integer star scale (1, 2, 3 ⭐).
                    </p>
                </div>

                {/* Header Action Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="secondary"
                        onClick={handlePrintSheet}
                        icon={<Printer size={14} />}
                    >
                        Print SOM Sheet
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handlePublish}
                        disabled={isPublishing}
                        loading={isPublishing}
                        loadingText="Publishing Awards..."
                        icon={<Trophy size={14} />}
                    >
                        Publish Star of the Month Awards
                    </Button>
                </div>
            </div>

            {/* Hierarchical Scoping & Filtering Controls Bar */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Class Selector based on user hierarchy */}
                        {isTeacher ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                                <Users size={14} className="text-indigo-600" />
                                <span>Class: <strong>{selectedClassKey}</strong></span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                                    <Users size={14} className="text-indigo-600" />
                                    <span>Select Class:</span>
                                </label>
                                <select
                                    value={selectedClassKey}
                                    onChange={(e) => setSelectedClassKey(e.target.value)}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-indigo-600"
                                >
                                    {authorizedClasses.map((cls) => (
                                        <option key={cls} value={cls}>
                                            {cls} {CLASS_ASSIGNMENTS[cls]?.classTeacherName ? `(${CLASS_ASSIGNMENTS[cls].classTeacherName})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Month Selector */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-500">Month:</span>
                            <select
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-indigo-600"
                            >
                                {SOM_MONTHS.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Year Selector */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-500">Year:</span>
                            <select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-indigo-600"
                            >
                                {['2025', '2026'].map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Quick-Fill Bulk Marks Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1 mr-1">
                            <Zap size={13} className="fill-amber-500" /> Bulk Marks:
                        </span>
                        <button
                            type="button"
                            onClick={() => handleBulkClassBaseline('3')}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                            Quick-Fill All 3 ⭐
                        </button>
                        <button
                            type="button"
                            onClick={() => handleBulkClassBaseline('2')}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                            Quick-Fill All 2 ⭐
                        </button>
                        <button
                            type="button"
                            onClick={handleSetUnevaluatedToNa}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                            Set Empty to NA
                        </button>
                        <button
                            type="button"
                            onClick={handleClearClass}
                            title="Reset ratings for class"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                            <RotateCcw size={15} />
                        </button>
                    </div>
                </div>

                {/* Accolades & Podium Summary Bar */}
                <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <Trophy size={14} className="text-amber-500" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Live Calculated Star Accolades ({month} {year})
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPodiumExpanded(!podiumExpanded)}
                            className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                            <span>{podiumExpanded ? 'Hide Accolades' : 'Show Accolades'}</span>
                            {podiumExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </button>
                    </div>

                    {podiumExpanded && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                            {placements.map((placement) => {
                                const isOverall = placement.id === 'som'
                                return (
                                    <div
                                        key={placement.id}
                                        className={`rounded-xl p-2.5 border transition-all ${
                                            isOverall
                                                ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                                                : 'bg-slate-50/70 border-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5 truncate">
                                            <span>{placement.name}</span>
                                            {isOverall && (
                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-white uppercase">
                                                    Premier
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs font-bold text-slate-900 truncate flex items-center justify-between">
                                            <span className="text-amber-700 truncate">
                                                🥇 {placement.winner ? placement.winner.name : 'TBD'}
                                            </span>
                                            <span className="text-[11px] text-amber-900 font-extrabold ml-1">
                                                {placement.winner ? `${placement.winner.score} ⭐` : '-'}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between truncate">
                                            <span>🥈 {placement.runnerUp1 ? placement.runnerUp1.name : '-'}</span>
                                            <span>🥉 {placement.runnerUp2 ? placement.runnerUp2.name : '-'}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Complete Student Evaluation Matrix (Zero Nested Scrollbars) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <Star size={16} className="text-amber-500 fill-amber-500" />
                            <span>Evaluation Matrix ({students.length} Students)</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            All students in {selectedClassKey} are loaded. Click stars to assign ratings; use column headers for batch-marks.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <span className="size-2.5 rounded-full bg-amber-500" /> 3 ⭐ (Outstanding)
                        </span>
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <span className="size-2.5 rounded-full bg-blue-500" /> 2 ⭐ (Good)
                        </span>
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <span className="size-2.5 rounded-full bg-emerald-500" /> 1 ⭐ (Developing)
                        </span>
                    </div>
                </div>

                {/* Full-width Responsive Table Wrapper */}
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="bg-slate-900 text-white sticky top-0 z-20 shadow-xs">
                            <tr>
                                <th className="p-3 text-xs font-bold uppercase tracking-wider w-[280px] min-w-[280px] sticky left-0 z-30 bg-slate-900 border-r border-slate-800">
                                    Evaluation Criteria (12 Categories)
                                </th>
                                {students.map((stu) => {
                                    const avg = studentScore(subs, ratings, context, stu.id)
                                    const pct = avg !== null ? Math.round((avg / 3) * 100) : 0
                                    return (
                                        <th
                                            key={stu.id}
                                            className="p-3 text-center border-r border-slate-800 min-w-[140px] max-w-[160px]"
                                        >
                                            <div className="font-bold text-xs text-white truncate" title={stu.name}>
                                                {stu.name}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">
                                                Roll #{stu.rollNumber || '—'}
                                            </div>
                                            <div className="mt-1.5 flex items-center justify-center gap-1">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                                                    avg !== null ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {avg !== null ? `${avg} ⭐` : '—'}
                                                </span>
                                            </div>

                                            {/* Quick row fills */}
                                            <div className="mt-1 flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    title="Assign 3 Stars across all parameters for this student"
                                                    onClick={() => handleBulkStudent(stu.id, '3')}
                                                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300 font-bold cursor-pointer"
                                                >
                                                    All 3⭐
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Assign 2 Stars across all parameters for this student"
                                                    onClick={() => handleBulkStudent(stu.id, '2')}
                                                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-blue-300 font-bold cursor-pointer"
                                                >
                                                    All 2⭐
                                                </button>
                                            </div>
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 text-xs">
                            {checklist.map((category) => {
                                const isCollapsed = Boolean(collapsedCats[category.id])
                                const catSubs = category.subs || []

                                return (
                                    <React.Fragment key={category.id}>
                                        {/* Category Accordion Header */}
                                        <tr className="bg-slate-100/90 font-bold text-slate-800 border-t border-b border-slate-200">
                                            <td
                                                colSpan={students.length + 1}
                                                className="p-2.5 px-3 cursor-pointer hover:bg-slate-200/80 transition-colors select-none"
                                                onClick={() => toggleCat(category.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 text-xs text-slate-900">
                                                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                                        <span>{category.name}</span>
                                                        <span className="text-[11px] font-normal text-slate-500">
                                                            ({catSubs.length} subparameters)
                                                        </span>
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-indigo-700">
                                                        {isCollapsed ? 'Click to Expand' : 'Click to Collapse'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Subparameter Rows */}
                                        {!isCollapsed && catSubs.map((subItem) => (
                                            <tr key={subItem.id} className="hover:bg-slate-50/60 transition-colors">
                                                {/* Left Column: Subparameter name and column quick-fills */}
                                                <td className="p-2.5 px-3 font-medium text-slate-700 sticky left-0 z-10 bg-white border-r border-slate-200">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="truncate" title={subItem.name}>
                                                            {subItem.name}
                                                        </span>
                                                        <div className="flex items-center gap-0.5 shrink-0">
                                                            <button
                                                                type="button"
                                                                title={`Set all students to 3 ⭐ for ${subItem.name}`}
                                                                onClick={() => handleBulkColumn(subItem.id, '3')}
                                                                className="px-1 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer"
                                                            >
                                                                3⭐
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title={`Set all students to 2 ⭐ for ${subItem.name}`}
                                                                onClick={() => handleBulkColumn(subItem.id, '2')}
                                                                className="px-1 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                                                            >
                                                                2⭐
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title={`Set all students to NA for ${subItem.name}`}
                                                                onClick={() => handleBulkColumn(subItem.id, 'NA')}
                                                                className="px-1 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                                                            >
                                                                NA
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Student Star Picker Cells */}
                                                {students.map((stu) => {
                                                    const cellRating = ratingFor(ratings, context, stu.id, subItem.id)
                                                    return (
                                                        <td
                                                            key={stu.id}
                                                            className="p-2 text-center border-r border-slate-200 align-middle"
                                                        >
                                                            <div className="flex items-center justify-center">
                                                                <GraphicalStarPicker
                                                                    value={cellRating}
                                                                    onChange={(newVal) => handleSetRating(stu.id, subItem.id, newVal)}
                                                                />
                                                            </div>
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                )
                            })}
                        </tbody>

                        {/* Bottom Total / Summary Row */}
                        <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 z-20 shadow-xs">
                            <tr>
                                <td className="p-3 uppercase tracking-wider text-xs sticky left-0 z-30 bg-slate-900 border-r border-slate-800">
                                    Overall Average Rating (3-Point Scale)
                                </td>
                                {students.map((stu) => {
                                    const avg = studentScore(subs, ratings, context, stu.id)
                                    const pct = avg !== null ? Math.round((avg / 3) * 100) : 0
                                    return (
                                        <td key={stu.id} className="p-3 text-center border-r border-slate-800">
                                            <div className="text-sm font-extrabold text-amber-400">
                                                {avg !== null ? `${avg} ⭐` : '—'}
                                            </div>
                                            <div className="text-[10px] text-slate-300 font-semibold mt-0.5">
                                                {pct}% Aggregate
                                            </div>
                                        </td>
                                    )
                                })}
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                        Ratings auto-save to local workspace state. Click <strong>"Publish Star of the Month Awards"</strong> to finalize awards and notify students & parents.
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={handlePrintSheet}
                            icon={<Printer size={14} />}
                        >
                            Print Official Sheet
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handlePublish}
                            disabled={isPublishing}
                            loading={isPublishing}
                            loadingText="Publishing Awards..."
                            icon={<Trophy size={14} />}
                        >
                            Publish Official Star Awards
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default StarOfTheMonthWorkspace
