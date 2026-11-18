import React from 'react'
import { X, CircleCheck } from 'lucide-react'

const MarkAsDoneConfirmModal = ({ open, plan, onCancel, onConfirm }) => {
    if (!open || !plan) return null

    return (
        <div className='fixed inset-0 z-500 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onCancel} />

            <div className='relative z-10 w-full max-w-lg rounded-xl bg-white shadow-lg p-5 py-4 max-h-[90vh] overflow-y-auto'>
                <div className='flex justify-end items-center'>
                    <button type='button' onClick={onCancel} className='hover:text-red-500 cursor-pointer'>
                        <X />
                    </button>
                </div>
                <div className='pt-4 text-center'>
                    <div className='flex justify-center items-center mb-4'>
                        <CircleCheck size={70} strokeWidth={1.5} className='text-[#515DEF]' />
                    </div>
                    <h3 className='text-xl font-bold text-slate-900'>Mark as Done?</h3>
                    <p className='text-sm text-slate-600 font-medium mt-1'>
                        Confirm that you have completed teaching this lesson plan for{' '}
                        <span className='text-[#1E1E1E]'>{plan.subject}</span>
                        {' '}(Class {plan.className}, Section {plan.section})?
                    </p>

                    <div className='flex gap-x-4 mt-10'>
                        <button
                            type='button'
                            onClick={onCancel}
                            className='bg-white text-slate-700 text-sm font-semibold text-center px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 cursor-pointer w-full'
                        >
                            Cancel
                        </button>
                        <button
                            type='button'
                            onClick={onConfirm}
                            className='bg-[#515DEF] text-white text-sm text-center px-4 py-2.5 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer w-full'
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MarkAsDoneConfirmModal
