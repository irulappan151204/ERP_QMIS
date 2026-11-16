import React, { useState, useMemo } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, EllipsisIcon, Download, X, BookOpen, Video } from 'lucide-react'
import { toast } from 'react-toastify'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import pdf_icon from '../../../assets/images/pdf-icon.png'
import mp4_icon from '../../../assets/images/mp4-icon.png'

const STUDY_MATERIALS = [
    {
        id: 1,
        subject: 'Mathematics',
        chapter: 'Algebra Basics',
        fileName: 'Algebra_Notes.pdf',
        fileType: 'pdf',
        teacher: 'Mr. Ravi',
        date: '05-08-2025',
        description: 'Comprehensive study notes on introduction to algebra concepts, variable simplification, and standard equations.',
    },
    {
        id: 2,
        subject: 'Science',
        chapter: 'Electricity & Circuits',
        fileName: 'Electricity_Notes.mp4',
        fileType: 'video',
        teacher: 'Mrs. Divya',
        date: '04-08-2025',
        description: 'Animated video lecture explaining electric current flow, Ohm’s Law, series-parallel resistor circuits, and real examples.',
    },
    {
        id: 3,
        subject: 'English',
        chapter: 'Grammar Rules & Usage',
        fileName: 'Grammar_Handbook.pdf',
        fileType: 'pdf',
        teacher: 'Mr. Paul',
        date: '03-08-2025',
        description: 'Basic and advanced grammar rules with sentence transformation examples and practice exercises.',
    },
]

const StudyMaterialList = () => {
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [subjectFilter, setSubjectFilter] = useState('')
    const [selectedMaterial, setSelectedMaterial] = useState(null)

    const handleClearFilters = () => {
        setSearchQuery('')
        setSubjectFilter('')
        setFromDate(null)
        setToDate(null)
    }

    const handleDownload = (fileName) => {
        toast.success(`Downloading ${fileName}...`)
    }

    const filteredMaterials = useMemo(() => {
        return STUDY_MATERIALS.filter((item) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const match =
                    item.subject.toLowerCase().includes(q) ||
                    item.chapter.toLowerCase().includes(q) ||
                    item.fileName.toLowerCase().includes(q) ||
                    item.teacher.toLowerCase().includes(q)
                if (!match) return false
            }
            if (subjectFilter && item.subject !== subjectFilter) return false
            return true
        })
    }, [searchQuery, subjectFilter])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={handleClearFilters}
                        className='bg-[#515DEF] text-white uppercase text-xs font-semibold px-4 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <span className='text-xs text-gray-500'>
                        {filteredMaterials.length} materials available
                    </span>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 lg:mt-6 mt-3'>
                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-semibold text-gray-600'>Search</label>
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Subject, chapter, or teacher...'
                            className='text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#515DEF]'
                        />
                    </div>
                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-semibold text-gray-600'>Subject</label>
                        <select
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                            className='text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#515DEF]'
                        >
                            <option value=''>All Subjects</option>
                            <option value='Mathematics'>Mathematics</option>
                            <option value='Science'>Science</option>
                            <option value='English'>English</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-semibold text-gray-600'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable
                                placeholderText='Start Date'
                                className='w-full text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-[#515DEF]'
                            />
                            <Calendar
                                size={15}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
                            />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-semibold text-gray-600'>To</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable
                                placeholderText='End Date'
                                className='w-full text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-[#515DEF]'
                            />
                            <Calendar
                                size={15}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <div>
                        <h2 className='text-xl font-bold text-gray-900'>Study Material List</h2>
                        <p className='text-xs text-gray-500 mt-0.5'>Course notes, reading references, and video tutorials.</p>
                    </div>
                </div>

                <div className='relative overflow-x-auto rounded-lg border border-gray-100'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase rounded-s-lg'>Subject</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Chapter / Topic</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>File Material</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Teacher</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Date</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Description</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase rounded-e-lg text-center'>Actions</th>
                            </tr>
                        </thead>

                        <tbody className='divide-y divide-gray-100'>
                            {filteredMaterials.map((item) => (
                                <tr
                                    key={item.id}
                                    className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg transition-colors'
                                >
                                    <td className='px-3 py-4 font-semibold text-gray-900 rounded-s-lg'>{item.subject}</td>
                                    <td className='px-3 py-4 font-medium text-gray-900'>{item.chapter}</td>
                                    <td className='px-3 py-4'>
                                        <button
                                            type='button'
                                            onClick={() => handleDownload(item.fileName)}
                                            className='flex items-center gap-x-2 text-left hover:underline cursor-pointer'
                                        >
                                            <img
                                                src={item.fileType === 'video' ? mp4_icon : pdf_icon}
                                                alt='file-icon'
                                                className='w-6 h-6'
                                            />
                                            <span className='text-sm font-normal text-[#515DEF]'>{item.fileName}</span>
                                        </button>
                                    </td>
                                    <td className='px-3 py-4'>{item.teacher}</td>
                                    <td className='px-3 py-4 text-gray-500'>{item.date}</td>
                                    <td className='px-3 py-4 text-gray-600 max-w-xs truncate' title={item.description}>
                                        {item.description}
                                    </td>
                                    <td className='px-3 py-4 rounded-e-lg text-center'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <button
                                                type='button'
                                                onClick={() => setSelectedMaterial(item)}
                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer text-sm'
                                            >
                                                View
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => handleDownload(item.fileName)}
                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer text-sm'
                                            >
                                                Download
                                            </button>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Material Modal */}
            {selectedMaterial && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-xl'>
                        <div className='flex items-center justify-between pb-3 border-b mb-4'>
                            <h3 className='text-lg font-bold text-gray-900 flex items-center gap-2'>
                                {selectedMaterial.fileType === 'video' ? (
                                    <Video className='w-5 h-5 text-purple-600' />
                                ) : (
                                    <BookOpen className='w-5 h-5 text-[#515DEF]' />
                                )}
                                {selectedMaterial.chapter}
                            </h3>
                            <button
                                type='button'
                                onClick={() => setSelectedMaterial(null)}
                                className='text-gray-400 hover:text-gray-600'
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className='space-y-3 text-sm'>
                            <div className='p-3 bg-gray-50 rounded-xl space-y-1.5'>
                                <div className='flex justify-between'>
                                    <span className='text-xs text-gray-500'>Subject:</span>
                                    <span className='font-semibold text-gray-900'>{selectedMaterial.subject}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-xs text-gray-500'>Teacher:</span>
                                    <span className='text-gray-700'>{selectedMaterial.teacher}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-xs text-gray-500'>Uploaded On:</span>
                                    <span className='text-gray-700'>{selectedMaterial.date}</span>
                                </div>
                            </div>
                            <div>
                                <span className='text-xs text-gray-500 font-semibold block mb-1'>Description:</span>
                                <p className='text-gray-700 p-3 bg-gray-50 rounded-xl leading-relaxed'>
                                    {selectedMaterial.description}
                                </p>
                            </div>
                            <div className='flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl'>
                                <span className='font-medium text-indigo-900 text-xs flex items-center gap-2'>
                                    <img
                                        src={selectedMaterial.fileType === 'video' ? mp4_icon : pdf_icon}
                                        alt='file'
                                        className='w-5 h-5'
                                    />
                                    {selectedMaterial.fileName}
                                </span>
                                <button
                                    type='button'
                                    onClick={() => handleDownload(selectedMaterial.fileName)}
                                    className='px-3 py-1.5 bg-[#515DEF] text-white rounded-lg text-xs font-semibold hover:bg-opacity-90 flex items-center gap-1'
                                >
                                    <Download size={13} />
                                    Download
                                </button>
                            </div>
                        </div>
                        <div className='flex justify-end mt-4 pt-3 border-t'>
                            <button
                                type='button'
                                onClick={() => setSelectedMaterial(null)}
                                className='px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200'
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default StudyMaterialList
