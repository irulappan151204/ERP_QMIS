import React, { useState, useMemo } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, EllipsisIcon, Eye, Download, X, FileText } from 'lucide-react'
import { toast } from 'react-toastify'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import pdf_icon from '../../../assets/images/pdf-icon.png'

const SAMPLE_PAPERS = [
    {
        id: 1,
        subject: 'Mathematics',
        examType: 'Mid Term Exam',
        title: 'Maths_UnitTest_Paper_2025.pdf',
        teacher: 'Mr. Ravi',
        date: '05-08-2025',
        description: 'Practice questions on algebra, linear equations, and introductory geometry.',
    },
    {
        id: 2,
        subject: 'Science',
        examType: 'Unit Test',
        title: 'Science_Model_Paper_2025.pdf',
        teacher: 'Mrs. Divya',
        date: '04-08-2025',
        description: 'Model paper covering physics, electricity, and chemical bonding topics.',
    },
    {
        id: 3,
        subject: 'English',
        examType: 'Annual Exam',
        title: 'English_MidTerm_Paper_2025.pdf',
        teacher: 'Mr. Paul',
        date: '03-08-2025',
        description: 'Includes grammar exercises, reading comprehension, and essay writing prompts.',
    },
]

const SampleQuestionsList = () => {
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [subjectFilter, setSubjectFilter] = useState('')
    const [selectedPaper, setSelectedPaper] = useState(null)

    const handleClearFilters = () => {
        setSearchQuery('')
        setSubjectFilter('')
        setFromDate(null)
        setToDate(null)
    }

    const handleDownload = (title) => {
        toast.success(`Downloading ${title}...`)
    }

    const filteredPapers = useMemo(() => {
        return SAMPLE_PAPERS.filter((item) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const match =
                    item.subject.toLowerCase().includes(q) ||
                    item.examType.toLowerCase().includes(q) ||
                    item.title.toLowerCase().includes(q) ||
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
                    <span className='text-xs text-gray-500'>{filteredPapers.length} papers available</span>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 lg:mt-6 mt-3'>
                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-semibold text-gray-600'>Search</label>
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Subject, exam type, or teacher...'
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
                        <h2 className='text-xl font-bold text-gray-900'>Sample Questions List</h2>
                        <p className='text-xs text-gray-500 mt-0.5'>Previous years questions and model exam papers.</p>
                    </div>
                </div>

                <div className='relative overflow-x-auto rounded-lg border border-gray-100'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase rounded-s-lg'>Subject</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Exam Type</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Paper Title</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Uploaded By</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Date</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase'>Description</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-semibold uppercase rounded-e-lg text-center'>Actions</th>
                            </tr>
                        </thead>

                        <tbody className='divide-y divide-gray-100'>
                            {filteredPapers.map((paper) => (
                                <tr
                                    key={paper.id}
                                    className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg transition-colors'
                                >
                                    <td className='px-3 py-4 font-semibold text-gray-900 rounded-s-lg'>{paper.subject}</td>
                                    <td className='px-3 py-4'>{paper.examType}</td>
                                    <td className='px-3 py-4'>
                                        <button
                                            type='button'
                                            onClick={() => handleDownload(paper.title)}
                                            className='flex items-center gap-x-2 text-left hover:underline cursor-pointer'
                                        >
                                            <img src={pdf_icon} alt='pdf-icon' className='w-6 h-6' />
                                            <span className='text-sm font-normal text-[#515DEF]'>{paper.title}</span>
                                        </button>
                                    </td>
                                    <td className='px-3 py-4'>{paper.teacher}</td>
                                    <td className='px-3 py-4 text-gray-500'>{paper.date}</td>
                                    <td className='px-3 py-4 text-gray-600 max-w-xs truncate' title={paper.description}>
                                        {paper.description}
                                    </td>
                                    <td className='px-3 py-4 rounded-e-lg text-center'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <button
                                                type='button'
                                                onClick={() => setSelectedPaper(paper)}
                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer text-sm'
                                            >
                                                View
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => handleDownload(paper.title)}
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

            {/* View Paper Modal */}
            {selectedPaper && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-xl'>
                        <div className='flex items-center justify-between pb-3 border-b mb-4'>
                            <h3 className='text-lg font-bold text-gray-900 flex items-center gap-2'>
                                <FileText className='w-5 h-5 text-[#515DEF]' />
                                {selectedPaper.subject} - {selectedPaper.examType}
                            </h3>
                            <button
                                type='button'
                                onClick={() => setSelectedPaper(null)}
                                className='text-gray-400 hover:text-gray-600'
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className='space-y-3 text-sm'>
                            <div className='p-3 bg-gray-50 rounded-xl space-y-1.5'>
                                <div className='flex justify-between'>
                                    <span className='text-xs text-gray-500'>Uploaded By:</span>
                                    <span className='font-semibold text-gray-900'>{selectedPaper.teacher}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-xs text-gray-500'>Upload Date:</span>
                                    <span className='text-gray-700'>{selectedPaper.date}</span>
                                </div>
                            </div>
                            <div>
                                <span className='text-xs text-gray-500 font-semibold block mb-1'>Description:</span>
                                <p className='text-gray-700 p-3 bg-gray-50 rounded-xl leading-relaxed'>
                                    {selectedPaper.description}
                                </p>
                            </div>
                            <div className='flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl'>
                                <span className='font-medium text-indigo-900 text-xs flex items-center gap-2'>
                                    <img src={pdf_icon} alt='pdf' className='w-5 h-5' />
                                    {selectedPaper.title}
                                </span>
                                <button
                                    type='button'
                                    onClick={() => handleDownload(selectedPaper.title)}
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
                                onClick={() => setSelectedPaper(null)}
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

export default SampleQuestionsList
