import React, { useMemo, useState, useEffect } from 'react'
import { Star, Award, Trophy } from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import { formatGradeSection } from '../studentPortalConfig'
import { getAcademicSomRecords } from '../../../Common/Recognition/recognitionData'
import { getStudentSomHistory } from '../../../Common/StudentStarRatings/somChecklist'

const MAX_STARS = 3

const StarRatingDisplay = ({ rating, size = 26 }) => {
    const clampedRating = Math.min(Math.max(Number(rating) || 0, 0), MAX_STARS)

    return (
        <div className='flex items-center gap-1.5'>
            {Array.from({ length: MAX_STARS }, (_, index) => {
                const isFilled = index < clampedRating
                return (
                    <Star
                        key={index}
                        size={size}
                        className={
                            isFilled
                                ? 'fill-[#F59E0B] text-[#F59E0B] drop-shadow-xs'
                                : 'fill-none text-slate-300'
                        }
                    />
                )
            })}
            <span className='text-sm font-bold text-slate-700 ml-2'>
                ({clampedRating}/{MAX_STARS} Stars)
            </span>
        </div>
    )
}

const InfoField = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>{label}</span>
        <span className='text-sm font-bold text-slate-900'>{value}</span>
    </div>
)

const ViewRatings = () => {
    const { activeStudent } = useActiveStudent()
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    useEffect(() => {
        const handleSync = () => setRefreshTrigger((k) => k + 1)
        window.addEventListener('schoolerp-som-published', handleSync)
        return () => window.removeEventListener('schoolerp-som-published', handleSync)
    }, [])

    const somHistory = useMemo(() => {
        if (!activeStudent?.id) return []
        const history = getStudentSomHistory(activeStudent.id)
        if (history.length > 0) return history

        const records = getAcademicSomRecords()
        return records.filter((r) =>
            r.studentId === activeStudent.id ||
            r.studentId === activeStudent.rollNumber ||
            r.studentName?.toLowerCase() === activeStudent.name?.toLowerCase()
        )
    }, [activeStudent, refreshTrigger])

    const publishedRecord = somHistory[0] || null

    const rating = {
        month: publishedRecord?.month || 'September 2025',
        academicYear: publishedRecord?.academicYear || '2025-2026',
        ratedBy: publishedRecord?.nominatedBy || 'Class Mentor (Priya Menon)',
        rating: publishedRecord?.ratingStars || 3,
        score: publishedRecord?.score || 98,
        remarks: publishedRecord?.citation || 'Exemplary attendance, classroom leadership, and consistent academic excellence.',
        awardTitle: publishedRecord?.awardTitle || (publishedRecord ? 'Star of the Month Nominee' : 'Star of the Month Recognition'),
    }

    const student = {
        name: activeStudent.name,
        classSection: formatGradeSection(activeStudent),
        classTeacher: 'Mrs. Priya Menon',
        rollNumber: activeStudent.rollNumber,
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-5'>
                <h2 className='text-lg font-bold text-slate-900 mb-5'>Student Information</h2>
                <div className='flex flex-col sm:flex-row sm:items-center gap-4 mb-6'>
                    <img
                        src={mo_user}
                        alt=''
                        className='w-16 h-16 rounded-full object-cover ring-2 ring-indigo-100 shadow-2xs'
                    />
                    <div>
                        <h1 className='text-2xl font-bold text-slate-900'>{student.name}</h1>
                        <p className='text-xs font-medium text-slate-500 mt-0.5'>
                            Roll No: <span className='font-mono font-bold text-slate-700'>{student.rollNumber}</span>
                        </p>
                    </div>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100'>
                    <InfoField label='Student Name' value={student.name} />
                    <InfoField label='Class & Section' value={student.classSection} />
                    <InfoField label='Class Teacher' value={student.classTeacher} />
                    <InfoField label='Roll Number' value={student.rollNumber} />
                </div>
            </div>

            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5'>
                <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4'>
                    <div>
                        <h2 className='text-lg font-bold text-slate-900'>Official Monthly Star Rating</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            Evaluated on the official Queen Mira 12-category / 26-subparameter checklist (Strict 1–3 Integer Star Scale).
                        </p>
                    </div>
                    {rating.awardTitle && (
                        <span className='px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 shadow-2xs'>
                            <Trophy size={14} className='text-amber-600' />
                            <span>{rating.awardTitle}</span>
                        </span>
                    )}
                </div>

                <div className='border border-slate-200 rounded-xl p-5 max-w-2xl bg-gradient-to-br from-white via-slate-50/50 to-white shadow-2xs'>
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5'>
                        <InfoField label='Evaluation Month' value={rating.month} />
                        <InfoField label='Academic Session' value={rating.academicYear} />
                        <InfoField label='Evaluator' value={rating.ratedBy} />
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-t border-slate-200'>
                        <div>
                            <span className='text-xs font-bold text-slate-500 uppercase tracking-wide block'>
                                Overall Rating (1–3 Integer Stars)
                            </span>
                            <span className='text-xs font-semibold text-emerald-700'>
                                Calculated Performance: {rating.score}%
                            </span>
                        </div>
                        <StarRatingDisplay rating={rating.rating} />
                    </div>

                    <div className='pt-4 border-t border-slate-200'>
                        <span className='text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1'>
                            Performance Citation & Mentor Remarks
                        </span>
                        <p className='text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200'>
                            "{rating.remarks}"
                        </p>
                    </div>
                </div>

                {/* Historical Archive of Previous Months */}
                {somHistory.length > 0 && (
                    <div className='pt-5 border-t border-slate-200'>
                        <h3 className='text-sm font-bold text-slate-900 mb-3 flex items-center gap-2'>
                            <Award size={16} className='text-amber-600' />
                            <span>Monthly Star Recognition Archive ({somHistory.length} Records)</span>
                        </h3>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-xs text-left border-collapse'>
                                <thead className='bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider'>
                                    <tr>
                                        <th className='px-4 py-2.5'>Month & Year</th>
                                        <th className='px-4 py-2.5'>Class Section</th>
                                        <th className='px-4 py-2.5 text-center'>Rating</th>
                                        <th className='px-4 py-2.5 text-center'>Score %</th>
                                        <th className='px-4 py-2.5'>Award Title</th>
                                        <th className='px-4 py-2.5'>Citation</th>
                                        <th className='px-4 py-2.5'>Class Teacher</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {somHistory.map((rec, i) => (
                                        <tr key={rec.id || i} className='hover:bg-slate-50/50'>
                                            <td className='px-4 py-2.5 font-bold text-slate-900'>{rec.month}</td>
                                            <td className='px-4 py-2.5 font-medium text-indigo-700'>{rec.classSection}</td>
                                            <td className='px-4 py-2.5 text-center font-bold text-amber-600'>
                                                {'⭐'.repeat(rec.ratingStars || 3)}
                                            </td>
                                            <td className='px-4 py-2.5 text-center font-bold text-slate-800'>{rec.score}%</td>
                                            <td className='px-4 py-2.5 font-semibold text-slate-800'>
                                                <span className='px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900'>
                                                    {rec.awardTitle}
                                                </span>
                                            </td>
                                            <td className='px-4 py-2.5 text-slate-600 max-w-[260px] truncate' title={rec.citation}>{rec.citation}</td>
                                            <td className='px-4 py-2.5 text-slate-500 text-[11px]'>{rec.nominatedBy}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

export default ViewRatings
