import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'react-toastify'
import {
    APPROVAL_RULES,
    ruleStatusBadgeColor,
} from '../approvalsData'
import { tdClass, thClass } from './approvalStyles'

const ApprovalRulesTab = () => {
    const [rules, setRules] = useState(APPROVAL_RULES)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        requestType: 'Expense Claim',
        threshold: 'Up to ₹20,000',
        primaryApprover: 'Finance Manager',
        escalatesTo: 'Principal',
        status: 'Active',
    })

    const handleAddRule = (e) => {
        e.preventDefault()
        const newRule = {
            id: `AR-${String(rules.length + 1).padStart(3, '0')}`,
            ...formData,
        }
        setRules((prev) => [...prev, newRule])
        setIsModalOpen(false)
        toast.success(`Approval rule ${newRule.id} for "${formData.requestType}" created successfully`)
    }

    return (
        <div className='space-y-6'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                <div>
                    <h3 className='text-base font-semibold text-[#1E1E1E]'>Approval routing rules</h3>
                    <p className='text-sm text-[#667085] mt-1'>
                        Defines who approves what, and the threshold-based escalation path
                    </p>
                </div>
                <button
                    type='button'
                    onClick={() => setIsModalOpen(true)}
                    className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                >
                    <Plus size={16} />
                    Add Rule
                </button>
            </div>

            <div className='bg-white rounded-2xl shadow-md overflow-hidden p-4'>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Request Type</th>
                                <th className={thClass}>Amount Threshold</th>
                                <th className={thClass}>Primary Approver</th>
                                <th className={thClass}>Escalates To</th>
                                <th className={`${thClass} rounded-e-lg`}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rules.map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg font-medium text-[#1E1E1E]`}>{row.requestType}</td>
                                    <td className={tdClass}>{row.threshold}</td>
                                    <td className={tdClass}>{row.primaryApprover}</td>
                                    <td className={tdClass}>{row.escalatesTo}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${ruleStatusBadgeColor[row.status]}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4'>
                    <div className='bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex justify-between items-center mb-4'>
                            <h3 className='text-lg font-bold text-slate-900'>Add Approval Routing Rule</h3>
                            <button
                                type='button'
                                onClick={() => setIsModalOpen(false)}
                                className='p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer'
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddRule} className='space-y-4'>
                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Request Type</label>
                                <select
                                    value={formData.requestType}
                                    onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                                    className='w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500'
                                >
                                    <option value='Expense Claim'>Expense Claim</option>
                                    <option value='Concession / Waiver'>Concession / Waiver</option>
                                    <option value='Procurement'>Procurement</option>
                                    <option value='Refund Request'>Refund Request</option>
                                    <option value='Salary Advance'>Salary Advance</option>
                                </select>
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Amount Threshold</label>
                                <input
                                    type='text'
                                    value={formData.threshold}
                                    onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                                    className='w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500'
                                    placeholder='e.g. Up to ₹20,000'
                                    required
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Primary Approver</label>
                                <input
                                    type='text'
                                    value={formData.primaryApprover}
                                    onChange={(e) => setFormData({ ...formData, primaryApprover: e.target.value })}
                                    className='w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500'
                                    placeholder='e.g. Finance Manager'
                                    required
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Escalates To</label>
                                <input
                                    type='text'
                                    value={formData.escalatesTo}
                                    onChange={(e) => setFormData({ ...formData, escalatesTo: e.target.value })}
                                    className='w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500'
                                    placeholder='e.g. Principal / Director'
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className='w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500'
                                >
                                    <option value='Active'>Active</option>
                                    <option value='Draft'>Draft</option>
                                </select>
                            </div>
                            <div className='flex justify-end gap-3 pt-4 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsModalOpen(false)}
                                    className='px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-5 py-2 text-sm font-semibold bg-[#515DEF] text-white hover:opacity-90 rounded-lg transition-all cursor-pointer'
                                >
                                    Save Rule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ApprovalRulesTab
