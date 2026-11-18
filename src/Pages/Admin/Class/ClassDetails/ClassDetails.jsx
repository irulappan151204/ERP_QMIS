import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Calendar, EllipsisIcon, ChevronLeft, ChevronRight, Plus, Download } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import EditRequestModal from '../../../../Common/CommonComponents/EditRequestModal'
import DeleteRequestModal from '../../../../Common/CommonComponents/DeleteRequestModal'
import { Button } from '../../../../Common/ui'
import { inputClass, selectClass, labelClass } from '../../../../Common/ui/formStyles'
import {
    getClassDetails,
    removeClassDetails,
} from '../../../../Common/RBAC/academicsCatalogData'

const ClassDetails = () => {
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)
    const [search, setSearch] = useState('')
    const [records, setRecords] = useState(() => getClassDetails())
    const [pendingDeleteId, setPendingDeleteId] = useState(null)

    const refresh = () => setRecords(getClassDetails())

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return records
        return records.filter((item) => {
            const sectionNames = (item.sections || []).map((section) => section.name).join(', ')
            return (
                item.className.toLowerCase().includes(query)
                || (item.displayName || '').toLowerCase().includes(query)
                || sectionNames.toLowerCase().includes(query)
                || (item.classTeacher || '').toLowerCase().includes(query)
            )
        })
    }, [records, search])

    const confirmDelete = () => {
        if (!pendingDeleteId) return
        removeClassDetails(pendingDeleteId)
        setPendingDeleteId(null)
        setDeleteRequestModal(false)
        refresh()
        toast.success('Class details deleted.')
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-4'>
                    <Button
                        variant='secondary'
                        size='sm'
                        onClick={() => setSearch('')}
                    >
                        Clear Filters
                    </Button>
                    <select className={`w-full md:max-w-xs sm:max-w-full ${selectClass}`}>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4'>
                    <div className='flex flex-col'>
                        <label htmlFor='search' className={labelClass}>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Class, section, teacher...'
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col'>
                        <label htmlFor='status' className={labelClass}>Status</label>
                        <select id='status' className={selectClass}>
                            <option value=''>All</option>
                        </select>
                    </div>
                    <div className='flex flex-col'>
                        <label className={labelClass}>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable={true}
                                className={inputClass}
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col'>
                        <label className={labelClass}>To</label>
                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable={true}
                                className={inputClass}
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-3 mb-4'>
                    <h2 className='text-lg font-bold text-slate-900'>Class Details List</h2>
                    <div className='flex gap-2'>
                        <Button
                            as={NavLink}
                            to='/admin/class/add-class-details'
                            icon={<Plus size={15} />}
                        >
                            Add New Class
                        </Button>
                        <Button
                            variant='secondary'
                            icon={<Download size={15} />}
                            onClick={() => setExportModal(true)}
                        >
                            Export
                        </Button>
                    </div>
                </div>

                {filteredRecords.length === 0 ? (
                    <div className='py-16 text-center'>
                        <h3 className='text-base font-semibold text-slate-800'>No class details yet</h3>
                        <p className='text-sm text-slate-500 mt-1 max-w-md mx-auto'>
                            Create classes and sections here. They will appear in Mark Entry and student creation dropdowns.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className='flex gap-x-2 items-center my-3'>
                            <select className='px-2.5 py-1 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-lg'>
                                <option value='10'>10</option>
                                <option value='20'>20</option>
                                <option value='30'>30</option>
                                <option value='40'>40</option>
                                <option value='50'>50</option>
                            </select>
                            <span className='text-xs font-medium text-slate-500'>Entries Per Page</span>
                        </div>
                        <div className='relative overflow-x-auto rounded-xl border border-slate-200/80'>
                            <table className='w-full text-sm text-left rtl:text-right'>
                                <thead className='text-[11px] bg-slate-50/90 text-slate-600 font-semibold uppercase tracking-wider whitespace-nowrap border-b border-slate-200/80'>
                                    <tr>
                                        <th className='px-4 py-3'>Class</th>
                                        <th className='px-4 py-3'>Section</th>
                                        <th className='px-4 py-3'>Section Capacity</th>
                                        <th className='px-4 py-3'>Class Capacity</th>
                                        <th className='px-4 py-3'>Class Teacher</th>
                                        <th className='px-4 py-3'>Class Room Number</th>
                                        <th className='px-4 py-3 text-center'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {filteredRecords.map((record) => {
                                        const sectionNames = (record.sections || []).map((section) => section.name).join(', ')
                                        const sectionCapacities = (record.sections || [])
                                            .map((section) => `${section.name}=${section.capacity || '—'}`)
                                            .join(', ')

                                        return (
                                            <tr key={record.id} className='hover:bg-slate-50/80 text-slate-700 transition-colors'>
                                                <td className='px-4 py-3.5 font-medium text-slate-900'>{record.className || record.displayName}</td>
                                                <td className='px-4 py-3.5'>{sectionNames || '—'}</td>
                                                <td className='px-4 py-3.5'>{sectionCapacities || '—'}</td>
                                                <td className='px-4 py-3.5'>{record.classCapacity || '—'}</td>
                                                <td className='px-4 py-3.5'>{record.classTeacher || '—'}</td>
                                                <td className='px-4 py-3.5'>{record.classRoomNumber || '—'}</td>
                                                <td className='px-4 py-3.5 text-center'>
                                                    <Dropdown buttonContent={<EllipsisIcon size={16} className='text-slate-600' />}>
                                                        <button
                                                            type='button'
                                                            onClick={() => setEditRequestModal(true)}
                                                            className='w-full text-left p-2 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg cursor-pointer'
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type='button'
                                                            onClick={() => {
                                                                setPendingDeleteId(record.id)
                                                                setDeleteRequestModal(true)
                                                            }}
                                                            className='w-full text-left p-2 hover:bg-rose-50 text-rose-700 text-xs font-medium rounded-lg cursor-pointer'
                                                        >
                                                            Delete
                                                        </button>
                                                    </Dropdown>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className='flex justify-between items-center px-2 mt-4'>
                            <p className='text-xs font-medium text-slate-500'>
                                Showing 1 to {filteredRecords.length} of {filteredRecords.length} entries
                            </p>
                            <div className='flex justify-center items-center gap-1.5'>
                                <Button
                                    variant='secondary'
                                    size='icon-sm'
                                    icon={<ChevronLeft size={16} />}
                                    disabled
                                />
                                <span className='px-2.5 py-1 text-xs font-bold text-white bg-[#3F46C7] rounded-lg shadow-2xs'>
                                    1
                                </span>
                                <Button
                                    variant='secondary'
                                    size='icon-sm'
                                    icon={<ChevronRight size={16} />}
                                    disabled
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
            <DeleteRequestModal
                deleteRequestModal={deleteRequestModal}
                setDeleteRequestModal={(open) => {
                    setDeleteRequestModal(open)
                    if (!open) setPendingDeleteId(null)
                }}
                onConfirm={confirmDelete}
                title='Delete Class Details?'
                message='This will remove the class and its sections from Mark Entry and student assignment dropdowns.'
                confirmLabel='Delete'
            />
        </section>
    )
}

export default ClassDetails
