import React, { useState } from 'react'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, ChevronLeft, ChevronRight, EllipsisIcon, Eye, Download, X, FileText } from "lucide-react";
import { toast } from 'react-toastify';
import pdf_icon from "../../../assets/images/pdf-icon.png"
import Dropdown from '../../../Common/CommonComponents/Dropdown';
import SubmitAssignModal from './Components/SubmitAssignModal';

const ASSIGNMENTS = [
    {
        id: 1,
        title: 'Algebra Homework',
        subject: 'Mathematics',
        teacher: 'Mr. Ravi',
        assignedDate: '01-08-2025',
        dueDate: '10-08-2025',
        description: 'Solve algebra equations from chapter 3 and practice exercises 3.1 to 3.4.',
        fileName: 'Maths_Questions.pdf',
        status: 'Submitted',
    },
    {
        id: 2,
        title: 'Geometry Proofs Assignment',
        subject: 'Mathematics',
        teacher: 'Mr. Ravi',
        assignedDate: '01-08-2025',
        dueDate: '10-08-2025',
        description: 'Complete triangle congruence proofs from chapter 4.',
        fileName: 'Maths_Questions.pdf',
        status: 'Late Submission',
    },
    {
        id: 3,
        title: 'Chemical Reactions & Equations',
        subject: 'Science',
        teacher: 'Mrs. Divya',
        assignedDate: '05-08-2025',
        dueDate: '15-08-2025',
        description: 'Balance given redox reactions and submit lab observations.',
        fileName: 'Science_Lab_Assignment.pdf',
        status: 'Pending',
    },
]

const AssignmentList = () => {

    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [assignments] = useState(ASSIGNMENTS);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const bagdeColor = {
        "Submitted": "bg-[#4CAF5033] text-[#4CAF50]",
        "Pending": "bg-[#FF980033] text-[#FF9800]",
        "Late Submission": "bg-[#FF000033] text-[#FF0000]",
    }

    const [submitAssignModal, setSubmitAssignModal] = useState(false);

    const handleDownload = (fileName) => {
        toast.success(`Downloading ${fileName}...`)
    }

    const filteredAssignments = assignments.filter((item) => {
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            const match = item.title.toLowerCase().includes(q) || item.subject.toLowerCase().includes(q) || item.teacher.toLowerCase().includes(q)
            if (!match) return false
        }
        if (statusFilter && item.status !== statusFilter) return false
        return true
    })

    return (
        <>
            <section>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                        <button className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
                        <select name="" id="" className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                            <option value="">From Beginning</option>
                        </select>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor="search" className='text-base font-medium text-[#808080]'>Search</label>
                            <input type="text" className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor="class" className='text-base font-medium text-[#808080]'>Status</label>
                            <select name="" id="" className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                                <option value="">All</option>
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#808080]'>From</label>

                            <div className='relative w-full'>
                                <DatePicker
                                    selected={fromDate}
                                    onChange={(date) => setFromDate(date)}
                                    isClearable={true}
                                    showMonthYearDropdown={true}
                                    scrollableMonthYearDropdown={true}
                                    className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                                />

                                <Calendar
                                    size={16}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                                />
                            </div>
                        </div>

                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#808080]'>To</label>

                            <div className='relative'>
                                <DatePicker
                                    selected={toDate}
                                    onChange={(date) => setToDate(date)}
                                    isClearable={true}
                                    showMonthYearDropdown={true}
                                    scrollableMonthYearDropdown={true}
                                    className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                                />

                                <Calendar
                                    size={16}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                                />
                            </div>
                        </div>
                    </div>
                </div>


                <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                    <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                        <h2 className='text-xl font-medium text-black'>Assignment List</h2>
                    </div>
                    <div className='flex gap-x-2 items-center my-2'>
                        <select name="" id="" className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="30">30</option>
                            <option value="40">40</option>
                            <option value="50">50</option>
                        </select>
                        <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                    </div>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left rtl:text-right">
                            <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                                <tr className='rounded-lg'>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Assignment Title</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Subject</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Teacher Name</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Assigned Date</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Due Date</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Description</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">File Name</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Status</th>
                                    <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredAssignments.map((assignment) => (
                                    <tr key={assignment.id} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg">
                                        <td className="px-2 py-4 font-medium text-gray-900 rounded-s-lg">{assignment.title}</td>
                                        <td className="px-2 py-4">{assignment.subject}</td>
                                        <td className="px-2 py-4">{assignment.teacher}</td>
                                        <td className="px-2 py-4">{assignment.assignedDate}</td>
                                        <td className="px-2 py-4">{assignment.dueDate}</td>
                                        <td className="px-2 py-4 max-w-xs truncate" title={assignment.description}>{assignment.description}</td>
                                        <td className="px-2 py-4">
                                            <button
                                                type='button'
                                                onClick={() => handleDownload(assignment.fileName)}
                                                className='flex items-center gap-x-2 text-left hover:underline cursor-pointer'
                                            >
                                                <img src={pdf_icon} alt="pdf-icon" className='w-6 h-6' />
                                                <span className='text-sm font-normal text-[#515DEF]'>{assignment.fileName}</span>
                                            </button>
                                        </td>
                                        <td className="px-2 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${bagdeColor[assignment.status]}`}>
                                                {assignment.status}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 rounded-e-lg'>
                                            <Dropdown
                                                buttonContent={<EllipsisIcon size={16} className='text-black' />}
                                            >
                                                <button
                                                    type='button'
                                                    onClick={() => setSelectedAssignment(assignment)}
                                                    className="w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => setSubmitAssignModal(true)}
                                                    className="w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer"
                                                >
                                                    Submit
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => handleDownload(assignment.fileName)}
                                                    className="w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer"
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

                {/* Pagination */}
                <div className='flex justify-between items-center px-4 mt-4'>
                    <p className='text-sm font-medium text-[#515DEF]'>Showing 1 to 10 of 20 entries</p>

                    <div className="flex justify-center gap-x-2 flex-wrap">
                        <button className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer">
                            <ChevronLeft size={16} />
                        </button>

                        <button className="size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer">
                            1
                        </button>

                        <button className="size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer">
                            2
                        </button>

                        <button className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

            </section>

            <SubmitAssignModal submitAssignModal={submitAssignModal} setSubmitAssignModal={setSubmitAssignModal} />

            {/* View Assignment Modal */}
            {selectedAssignment && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl'>
                        <div className='flex items-center justify-between pb-3 border-b mb-4'>
                            <h3 className='text-lg font-bold text-gray-900 flex items-center gap-2'>
                                <FileText className='w-5 h-5 text-[#515DEF]' />
                                {selectedAssignment.title}
                            </h3>
                            <button
                                type='button'
                                onClick={() => setSelectedAssignment(null)}
                                className='text-gray-400 hover:text-gray-600'
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className='space-y-3 text-sm'>
                            <div className='grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl'>
                                <div>
                                    <span className='text-xs text-gray-500 block'>Subject</span>
                                    <span className='font-semibold text-gray-900'>{selectedAssignment.subject}</span>
                                </div>
                                <div>
                                    <span className='text-xs text-gray-500 block'>Assigned Teacher</span>
                                    <span className='font-semibold text-gray-900'>{selectedAssignment.teacher}</span>
                                </div>
                                <div>
                                    <span className='text-xs text-gray-500 block'>Assigned Date</span>
                                    <span className='font-medium text-gray-700'>{selectedAssignment.assignedDate}</span>
                                </div>
                                <div>
                                    <span className='text-xs text-gray-500 block'>Due Date</span>
                                    <span className='font-semibold text-red-600'>{selectedAssignment.dueDate}</span>
                                </div>
                            </div>
                            <div>
                                <span className='text-xs text-gray-500 font-semibold block mb-1'>Description & Instructions</span>
                                <p className='text-gray-700 p-3 bg-gray-50 rounded-xl leading-relaxed'>
                                    {selectedAssignment.description}
                                </p>
                            </div>
                            <div className='flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl'>
                                <span className='font-medium text-indigo-900 text-xs flex items-center gap-2'>
                                    <img src={pdf_icon} alt="pdf" className='w-5 h-5' />
                                    {selectedAssignment.fileName}
                                </span>
                                <button
                                    type='button'
                                    onClick={() => handleDownload(selectedAssignment.fileName)}
                                    className='px-3 py-1.5 bg-[#515DEF] text-white rounded-lg text-xs font-semibold hover:bg-opacity-90 flex items-center gap-1'
                                >
                                    <Download size={13} />
                                    Download File
                                </button>
                            </div>
                        </div>
                        <div className='flex justify-end gap-2 mt-5 pt-3 border-t'>
                            <button
                                type='button'
                                onClick={() => setSelectedAssignment(null)}
                                className='px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200'
                            >
                                Close
                            </button>
                            <button
                                type='button'
                                onClick={() => {
                                    setSelectedAssignment(null)
                                    setSubmitAssignModal(true)
                                }}
                                className='px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 font-medium'
                            >
                                Submit Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default AssignmentList