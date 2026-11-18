import React from 'react'
import { COUNTRY_OPTIONS } from '../countryData'

const defaultSelectClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-hidden transition-all'

const readOnlySelectClass =
    'w-full rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-600 cursor-not-allowed'

const CountrySelect = ({
    value = '',
    onChange,
    readOnly = false,
    id = 'country',
    label = 'Country:',
    selectClassName = defaultSelectClass,
    placeholder = 'Select Country',
}) => {
    if (readOnly) {
        return (
            <div className='flex flex-col gap-1'>
                <label htmlFor={id} className='text-xs font-semibold text-slate-700'>{label}</label>
                <input
                    id={id}
                    type='text'
                    value={value || '—'}
                    disabled
                    className={readOnlySelectClass}
                />
            </div>
        )
    }

    return (
        <div className='flex flex-col gap-1'>
            <label htmlFor={id} className='text-xs font-semibold text-slate-700'>{label}</label>
            <select
                id={id}
                value={value}
                onChange={(event) => onChange?.(event.target.value)}
                className={selectClassName}
            >
                <option value=''>{placeholder}</option>
                {COUNTRY_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                ))}
            </select>
        </div>
    )
}

export default CountrySelect
