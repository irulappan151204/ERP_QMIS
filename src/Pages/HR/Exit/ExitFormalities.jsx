import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Check, CheckCircle2, ChevronRight, FileCheck, ShieldCheck, UserCheck } from 'lucide-react'
import { ConfirmAction, DataTable } from '../../../Common/ui'
import { employeeName, getEmployees, getExits, nextId, pushNotification, saveExits } from '../domain/hrStore'
import { Badge, Modal, PrimaryButton, TableWrap, inputClass } from '../components/HrUi'
import { useHrTick } from '../components/hrUiState'

const LIFECYCLE_STAGES = [
    { id: 1, name: 'Onboarding', phase: 'Induction', defaultState: 'Completed' },
    { id: 2, name: 'Documentation', phase: 'Compliance', defaultState: 'Completed' },
    { id: 3, name: 'Policy Management', phase: 'Governance', defaultState: 'Completed' },
    { id: 4, name: 'Leave/Attendance', phase: 'Operations', defaultState: 'Completed' },
    { id: 5, name: 'Performance', phase: 'Appraisal', defaultState: 'Completed' },
    { id: 6, name: 'Resignation', phase: 'Separation', defaultState: 'Active' },
    { id: 7, name: 'Notice Period', phase: 'Transition', defaultState: 'In Progress' },
    { id: 8, name: 'Handover/Clearance', phase: 'Departmental', defaultState: 'In Progress' },
    { id: 9, name: 'NOC Clearance', phase: 'Verification', defaultState: 'Pending' },
    { id: 10, name: 'Relieving/Settlement', phase: 'Finalization', defaultState: 'Pending' },
]

const CLEARANCE_LABELS = {
    noticeServed: 'Notice Period Served (30 Days)',
    handover: 'Colleague & Work Handover',
    assets: 'IT Assets & Device Surrender',
    documents: 'Library & Document Clearance',
    departmentClearance: 'Department HOD Sign-Off',
    hrClearance: 'Central HR NOC Clearance',
    finance: 'Finance & Accounts Final Settlement',
    exitInterview: 'Exit Interview Questionnaire & Closure',
}

const FLAGS = ['noticeServed', 'handover', 'assets', 'documents', 'finance', 'departmentClearance', 'hrClearance', 'exitInterview']

const ExitFormalities = () => {
    const tick = useHrTick()
    const rows = useMemo(() => { void tick; return getExits().filter((row) => row?.employeeId) }, [tick])
    const employees = useMemo(() => { void tick; return getEmployees().filter((row) => row?.id) }, [tick])
    const [form, setForm] = useState(null)
    const [open, setOpen] = useState(rows[0]?.id)
    const [pendingAction, setPendingAction] = useState(null)
    const [interviewCandidate, setInterviewCandidate] = useState(null)

    const toggle = (row, key) => {
        const next = { ...row, [key]: !row[key] }
        const done = FLAGS.every((flag) => next[flag])
        next.status = done ? 'Completed' : FLAGS.some((flag) => next[flag]) ? 'In Progress' : 'Initiated'
        if (!done && next.finance === false) next.status = next.status === 'Initiated' ? 'Initiated' : 'Pending Clearance'
        saveExits(getExits().filter(Boolean).map((item) => item.id === row?.id ? next : item))
        setPendingAction(null)
    }

    const closeInterview = (row) => {
        saveExits(getExits().map((item) => item.id === row.id ? { ...item, exitInterview: true, exitInterviewClosedBy: 'HR' } : item))
        toast.success('Exit interview closed by HR.')
        setPendingAction(null)
    }

    const current = rows.find((item) => item?.id === open) || rows[0] || null

    // Determine current employee stage across the 10 sequential lifecycle stages
    const getStageState = (stageId) => {
        if (!current) return stageId <= 5 ? 'Completed' : 'Pending'
        if (stageId <= 5) return 'Completed'
        if (stageId === 6) return current.status ? 'Completed' : 'Active'
        if (stageId === 7) return current.noticeServed ? 'Completed' : 'In Progress'
        if (stageId === 8) {
            const handoverDone = current.handover && current.assets && current.documents && current.departmentClearance
            return handoverDone ? 'Completed' : (current.handover || current.assets) ? 'In Progress' : 'Pending'
        }
        if (stageId === 9) {
            const nocDone = current.hrClearance && current.finance && current.exitInterview
            return nocDone ? 'Completed' : current.status === 'In Progress' ? 'In Progress' : 'Pending'
        }
        if (stageId === 10) return current.status === 'Completed' ? 'Completed' : 'Pending'
        return 'Pending'
    }

    const columns = [
        { key: 'employeeId', label: 'Employee', required: true, render: (row) => employeeName(row.employeeId) },
        { key: 'lastWorkingDate', label: 'Last working' },
        { key: 'exitType', label: 'Type' },
        { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
    ]

    return (
        <section className='space-y-6'>
            {/* Unified 10-Stage Visual Pipeline */}
            <div className='rounded-2xl border border-[var(--erp-line)] bg-white p-5 shadow-sm'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--erp-line)] pb-4'>
                    <div>
                        <h2 className='text-base font-bold text-[var(--erp-ink)]'>10-Stage Employee Lifecycle & Relieving Pipeline</h2>
                        <p className='text-xs text-[var(--erp-muted)] mt-0.5'>
                            End-to-end sequential progression from onboarding to final relieving and settlement.
                        </p>
                    </div>
                    {current && (
                        <div className='flex items-center gap-2 text-xs font-semibold text-[var(--erp-indigo)] bg-[var(--erp-canvas)] px-3 py-1.5 rounded-lg'>
                            <UserCheck size={14} />
                            <span>Active Case: {employeeName(current.employeeId)} ({current.status})</span>
                        </div>
                    )}
                </div>

                <div className='mt-4 overflow-x-auto pb-2'>
                    <div className='flex items-center min-w-[920px] justify-between gap-1'>
                        {LIFECYCLE_STAGES.map((st, idx) => {
                            const state = getStageState(st.id)
                            const isCompleted = state === 'Completed'
                            const isInProgress = state === 'In Progress' || state === 'Active'

                            return (
                                <React.Fragment key={st.id}>
                                    <div className='flex flex-col items-center text-center flex-1 min-w-[80px]'>
                                        <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                            isCompleted ? 'bg-emerald-600 text-white' :
                                            isInProgress ? 'bg-[var(--erp-indigo)] text-white ring-4 ring-indigo-100' :
                                            'bg-slate-100 text-slate-400 border border-slate-200'
                                        }`}>
                                            {isCompleted ? <Check size={14} /> : st.id}
                                        </div>
                                        <span className={`text-[11px] font-semibold mt-1.5 leading-tight ${
                                            isCompleted ? 'text-slate-900 font-bold' :
                                            isInProgress ? 'text-[var(--erp-indigo)] font-bold' :
                                            'text-slate-400'
                                        }`}>
                                            {st.name}
                                        </span>
                                        <span className='text-[10px] text-slate-400 mt-0.5'>{state}</span>
                                    </div>
                                    {idx < LIFECYCLE_STAGES.length - 1 && (
                                        <ChevronRight size={14} className={`shrink-0 ${isCompleted ? 'text-emerald-500' : 'text-slate-300'}`} />
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </div>
                </div>
            </div>

            <TableWrap title='Exit & Relieving Formalities' action={<PrimaryButton onClick={() => employees[0] && setForm({ employeeId: employees[0].id, lastWorkingDate: '', exitType: 'Resignation', reason: '' })}>Initiate exit</PrimaryButton>}>
                <DataTable caption='Employee exit register' rows={rows} columns={columns} rowKey='id' emptyTitle='No exit records found' emptyDescription='Initiate an exit to begin notice, handover and clearance tracking.' renderActions={(row) => <button type='button' className='min-h-9 rounded-md border border-[#515DEF] px-3 text-xs font-semibold text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer' onClick={() => setOpen(row.id)}>Clearance</button>} />
            </TableWrap>

            {current && <div className='bg-white rounded-2xl shadow-md p-5 border border-[var(--erp-line)]'>
                <div className='flex items-center justify-between border-b border-[var(--erp-line)] pb-3 mb-4'>
                    <h3 className='font-bold text-base text-[var(--erp-ink)]'>{employeeName(current.employeeId)} — Clearance & Settlement Timeline</h3>
                    <Badge value={current.status} />
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs mb-5 bg-[var(--erp-canvas)] p-3.5 rounded-xl border border-[var(--erp-line)]'>
                    <div><span className='text-[var(--erp-muted)] block'>Exit Reason:</span> <span className='font-semibold text-[var(--erp-ink)]'>{current.reason || 'Not specified'}</span></div>
                    <div><span className='text-[var(--erp-muted)] block'>Notice Period:</span> <span className='font-semibold text-[var(--erp-ink)]'>{current.noticePeriod || '30 days'}</span></div>
                    <div><span className='text-[var(--erp-muted)] block'>Last Working Date:</span> <span className='font-semibold text-[var(--erp-ink)]'>{current.lastWorkingDate}</span></div>
                    <div><span className='text-[var(--erp-muted)] block'>Exit Interview:</span> <span className='font-semibold text-[var(--erp-ink)]'>{current.exitInterviewResponse ? 'Response Recorded' : 'Pending Interview'}</span></div>
                </div>

                {!current.exitInterviewResponse && (
                    <div className='mb-4'>
                        <button
                            type='button'
                            onClick={() => setInterviewCandidate(current)}
                            className='inline-flex items-center gap-1.5 rounded-lg bg-[#515DEF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#434dbd] cursor-pointer shadow-xs'
                        >
                            <FileCheck size={14} />
                            Conduct Exit Interview Questionnaire
                        </button>
                    </div>
                )}
                {current.exitInterviewResponse && (
                    <div className='text-xs mb-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1.5'>
                        <span className='font-bold text-indigo-950 block mb-1'>Exit Interview Summary:</span>
                        {Object.entries(current.exitInterviewResponse).map(([question, answer]) => (
                            <p key={question}><span className='text-slate-500 font-medium'>{question}:</span> <strong className='text-slate-800'>{answer}</strong></p>
                        ))}
                        {!current.exitInterview && (
                            <button type='button' className='text-[#515DEF] font-bold mt-2 cursor-pointer inline-flex items-center gap-1' onClick={() => setPendingAction({ type: 'interview', row: current })}>
                                <CheckCircle2 size={13} /> Close exit interview
                            </button>
                        )}
                    </div>
                )}

                <h4 className='text-xs font-bold text-[var(--erp-slate)] uppercase tracking-wider mb-2.5'>
                    Multi-Departmental Handover, NOC & Relieving Clearance Checklist:
                </h4>
                <div className='grid sm:grid-cols-2 gap-2.5'>
                    {FLAGS.map((flag) => (
                        <label key={flag} className={`text-xs flex gap-2.5 items-center p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            current[flag] ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' : 'bg-white border-slate-200 text-slate-700'
                        }`}>
                            <input
                                type='checkbox'
                                checked={!!current[flag]}
                                disabled={current.status === 'Completed'}
                                onChange={() => setPendingAction({ type: 'clearance', row: current, key: flag })}
                                className='rounded text-indigo-600 focus:ring-indigo-500'
                            />
                            <span>{CLEARANCE_LABELS[flag] || flag.replace(/([A-Z])/g, ' $1')}</span>
                        </label>
                    ))}
                </div>

                {current.status === 'Completed' && (
                    <div className='mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between'>
                        <span className='text-xs font-semibold text-emerald-800 flex items-center gap-1.5'>
                            <ShieldCheck size={16} /> All exit clearances, NOC and relieving settlement completed.
                        </span>
                        <span className='text-xs font-bold text-emerald-700 bg-white px-3 py-1 rounded-md border border-emerald-300'>
                            Relieving Letter Ready
                        </span>
                    </div>
                )}
            </div>}
            {form && <ExitForm form={form} employees={employees} rows={rows} setForm={setForm} />}
            {interviewCandidate && (
                <ExitInterviewModal
                    row={interviewCandidate}
                    onClose={() => setInterviewCandidate(null)}
                    onSave={(answers) => {
                        saveExits(
                            getExits().map((item) =>
                                item.id === interviewCandidate.id
                                    ? {
                                          ...item,
                                          exitInterviewResponse: answers,
                                          exitInterview: true,
                                          exitInterviewClosedBy: 'HR Specialist',
                                          status: 'In Progress',
                                      }
                                    : item
                            )
                        )
                        toast.success('Exit interview questionnaire recorded successfully.')
                        setInterviewCandidate(null)
                    }}
                />
            )}
            <ConfirmAction open={Boolean(pendingAction)} onClose={() => setPendingAction(null)} onConfirm={() => { if (!pendingAction) return; if (pendingAction.type === 'interview') closeInterview(pendingAction.row); else toggle(pendingAction.row, pendingAction.key) }} title={pendingAction?.type === 'interview' ? 'Close exit interview?' : `${pendingAction?.row?.[pendingAction?.key] ? 'Reopen' : 'Complete'} clearance step?`} description='This changes the employee exit timeline and overall clearance status.' confirmLabel={pendingAction?.type === 'interview' ? 'Close interview' : 'Update clearance'}>
                <p><strong>{pendingAction ? employeeName(pendingAction.row.employeeId) : ''}</strong>{pendingAction?.key ? ` · ${pendingAction.key.replace(/([A-Z])/g, ' $1')}` : ''}. Production must record the responsible department, authenticated actor, evidence and timestamp.</p>
            </ConfirmAction>
        </section>
    )
}

const ExitForm = ({ form, employees, rows, setForm }) => {
    const save = (event) => {
        event.preventDefault()
        if (!form?.lastWorkingDate) return toast.error('Last working date is required.')
        const record = { id: nextId('EXT-2026', rows), employeeId: form.employeeId, lastWorkingDate: form.lastWorkingDate, exitType: form.exitType, reason: form.reason, noticePeriod: '30 days', noticeServed: false, handover: false, assets: false, documents: false, finance: false, departmentClearance: false, hrClearance: false, exitInterview: false, remarks: '', status: 'Initiated' }
        saveExits([record, ...getExits()])
        pushNotification({ type: 'Exit', title: 'Exit Clearance Pending', message: `${employeeName(record.employeeId)} exit initiated.`, relatedDate: record.lastWorkingDate })
        toast.success('Exit initiated.')
        setForm(null)
    }
    return (
        <Modal title='Initiate exit' onClose={() => setForm(null)}>
            <form onSubmit={save} className='grid gap-3'>
                <select className={inputClass} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <input className={inputClass} placeholder='Last working date' value={form.lastWorkingDate} onChange={(e) => setForm({ ...form, lastWorkingDate: e.target.value })} />
                <select className={inputClass} value={form.exitType} onChange={(e) => setForm({ ...form, exitType: e.target.value })}><option>Resignation</option><option>Retirement</option><option>Termination</option></select>
                <input className={inputClass} placeholder='Reason' value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                <PrimaryButton type='submit'>Save</PrimaryButton>
            </form>
        </Modal>
    )
}

export default ExitFormalities

const ExitInterviewModal = ({ row, onClose, onSave }) => {
    const [responses, setResponses] = useState({
        primaryReason: 'Career Growth / Higher Role',
        managementSupport: '4',
        workEnvironment: '4',
        resourceAdequacy: '5',
        recommendQMIS: 'Yes',
        itClearance: true,
        libraryClearance: true,
        labClearance: true,
        idCardSurrendered: true,
        feedback: '',
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave({
            'Primary Reason for Leaving': responses.primaryReason,
            'Management Support (1-5)': `${responses.managementSupport} / 5`,
            'Workplace Culture (1-5)': `${responses.workEnvironment} / 5`,
            'Resource Adequacy (1-5)': `${responses.resourceAdequacy} / 5`,
            'Willingness to Recommend QMIS': responses.recommendQMIS,
            'IT Hardware & Credentials Handed Over': responses.itClearance ? 'Verified & Completed' : 'Pending',
            'Library Clearance': responses.libraryClearance ? 'Verified & Completed' : 'Pending',
            'Lab / Equipment Clearance': responses.labClearance ? 'Verified & Completed' : 'Pending',
            'ID Card & Gate Pass Surrendered': responses.idCardSurrendered ? 'Surrendered' : 'Pending',
            'Constructive Feedback': responses.feedback.trim() || 'No additional remarks',
        })
    }

    return (
        <Modal title={`Exit Interview Questionnaire — ${employeeName(row.employeeId)}`} onClose={onClose}>
            <form onSubmit={handleSubmit} className='space-y-4 max-h-[75vh] overflow-y-auto px-1'>
                <div className='grid gap-1'>
                    <label className='text-xs font-semibold text-[var(--erp-slate)]'>Primary Reason for Separation *</label>
                    <select
                        className={inputClass}
                        value={responses.primaryReason}
                        onChange={(e) => setResponses({ ...responses, primaryReason: e.target.value })}
                    >
                        <option>Career Growth / Higher Role</option>
                        <option>Higher Studies / Research</option>
                        <option>Relocation / Family Relocation</option>
                        <option>Better Compensation Package</option>
                        <option>Health / Personal Reasons</option>
                        <option>Retirement</option>
                    </select>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                    <div className='grid gap-1'>
                        <label className='text-xs font-semibold text-[var(--erp-slate)]'>Management Support</label>
                        <select
                            className={inputClass}
                            value={responses.managementSupport}
                            onChange={(e) => setResponses({ ...responses, managementSupport: e.target.value })}
                        >
                            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
                        </select>
                    </div>
                    <div className='grid gap-1'>
                        <label className='text-xs font-semibold text-[var(--erp-slate)]'>Workplace Culture</label>
                        <select
                            className={inputClass}
                            value={responses.workEnvironment}
                            onChange={(e) => setResponses({ ...responses, workEnvironment: e.target.value })}
                        >
                            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
                        </select>
                    </div>
                    <div className='grid gap-1'>
                        <label className='text-xs font-semibold text-[var(--erp-slate)]'>Resource Adequacy</label>
                        <select
                            className={inputClass}
                            value={responses.resourceAdequacy}
                            onChange={(e) => setResponses({ ...responses, resourceAdequacy: e.target.value })}
                        >
                            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
                        </select>
                    </div>
                </div>

                <div className='grid gap-1'>
                    <label className='text-xs font-semibold text-[var(--erp-slate)]'>Would you recommend QMIS as a great place to work?</label>
                    <select
                        className={inputClass}
                        value={responses.recommendQMIS}
                        onChange={(e) => setResponses({ ...responses, recommendQMIS: e.target.value })}
                    >
                        <option>Yes, definitely</option>
                        <option>Maybe / Neutral</option>
                        <option>No</option>
                    </select>
                </div>

                <div className='border-t border-[var(--erp-line)] pt-3'>
                    <p className='text-xs font-bold text-[var(--erp-ink)] mb-2'>Departmental Handover Verification Checklist:</p>
                    <div className='grid sm:grid-cols-2 gap-2 text-xs'>
                        <label className='flex items-center gap-2'>
                            <input
                                type='checkbox'
                                checked={responses.itClearance}
                                onChange={(e) => setResponses({ ...responses, itClearance: e.target.checked })}
                            />
                            IT Hardware & Passwords
                        </label>
                        <label className='flex items-center gap-2'>
                            <input
                                type='checkbox'
                                checked={responses.libraryClearance}
                                onChange={(e) => setResponses({ ...responses, libraryClearance: e.target.checked })}
                            />
                            Library Books & Journal Cards
                        </label>
                        <label className='flex items-center gap-2'>
                            <input
                                type='checkbox'
                                checked={responses.labClearance}
                                onChange={(e) => setResponses({ ...responses, labClearance: e.target.checked })}
                            />
                            Science / Computer Lab Clearance
                        </label>
                        <label className='flex items-center gap-2'>
                            <input
                                type='checkbox'
                                checked={responses.idCardSurrendered}
                                onChange={(e) => setResponses({ ...responses, idCardSurrendered: e.target.checked })}
                            />
                            ID Badge & Vehicle Pass Surrendered
                        </label>
                    </div>
                </div>

                <div className='grid gap-1'>
                    <label className='text-xs font-semibold text-[var(--erp-slate)]'>Closing Remarks & Constructive Suggestions</label>
                    <textarea
                        rows={3}
                        className={inputClass}
                        value={responses.feedback}
                        onChange={(e) => setResponses({ ...responses, feedback: e.target.value })}
                        placeholder='Any reflections, handover notes, or parting advice for the institution...'
                    />
                </div>

                <div className='flex justify-end gap-2 pt-2'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='px-3 py-1.5 text-xs rounded border border-[var(--erp-line)]'
                    >
                        Cancel
                    </button>
                    <PrimaryButton type='submit'>Save Exit Interview</PrimaryButton>
                </div>
            </form>
        </Modal>
    )
}
