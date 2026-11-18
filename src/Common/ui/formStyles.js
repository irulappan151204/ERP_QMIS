/**
 * Standardized Enterprise UI Form & Control Presets
 * Single source of truth for modern form controls, buttons, labels, and React-Select styling.
 */

export const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-hidden transition-all'

export const readOnlyInputClass =
    'w-full rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-600 cursor-not-allowed'

export const selectClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-hidden transition-all'

export const labelClass =
    'text-xs font-semibold text-slate-700 mb-1 block'

export const cardClass =
    'rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-xs'

export const btnPrimaryClass =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#3F46C7] hover:bg-[#3038A8] active:bg-[#242B94] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#3F46C7] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

export const btnSecondaryClass =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-slate-400 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

export const btnOutlineClass =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[#3F46C7] bg-white hover:bg-[#3F46C7] hover:text-white active:bg-[#242B94] text-[#3F46C7] text-xs font-semibold shadow-2xs transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#3F46C7] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

export const btnSuccessClass =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

export const btnDangerClass =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

export const btnGhostClass =
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-slate-400 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

export const btnIconClass =
    'inline-flex items-center justify-center size-8 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

/**
 * Standardized Modern React-Select Styles
 * Replaces legacy #515DEF and #D9D9D9 styles with modern indigo/slate rounded-xl styling.
 */
export const erpSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '38px',
        borderColor: state.isFocused ? '#3F46C7' : '#E2E8F0',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(63, 70, 199, 0.15)' : 'none',
        borderRadius: '0.75rem',
        fontSize: '0.75rem',
        backgroundColor: '#fff',
        transition: 'all 150ms ease',
        '&:hover': {
            borderColor: '#3F46C7',
        },
    }),
    menu: (base) => ({
        ...base,
        borderRadius: '0.75rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E2E8F0',
        zIndex: 50,
        fontSize: '0.75rem',
        overflow: 'hidden',
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#3F46C7' : state.isFocused ? '#EEF2FF' : '#fff',
        color: state.isSelected ? '#fff' : '#172033',
        cursor: 'pointer',
        fontSize: '0.75rem',
        padding: '0.5rem 0.75rem',
        '&:active': {
            backgroundColor: '#3038A8',
            color: '#fff',
        },
    }),
    placeholder: (base) => ({
        ...base,
        color: '#94A3B8',
        fontSize: '0.75rem',
    }),
    singleValue: (base) => ({
        ...base,
        color: '#172033',
        fontSize: '0.75rem',
        fontWeight: '500',
    }),
}
