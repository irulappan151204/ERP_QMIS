import React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import PersonalInfo from './Components/PersonalInfo'
import ProfessionalInfo from './Components/ProfessionalInfo'
import EmploymentInfo from './Components/EmploymentInfo'
import AccountInfo from './Components/AccountInfo'
import UploadDocuments from './Components/UploadDocuments'

const AddLibrarian = () => {
    const navigate = useNavigate()

    const handleSave = () => {
        toast.success('Librarian profile registered successfully')
        navigate(-1)
    }

    const handleDiscard = () => {
        navigate(-1)
    }
    return (
        <div>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Personal Information</h2>
                <PersonalInfo />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h2 className='text-xl font-semibold text-black'>Professional Information</h2>
                <ProfessionalInfo />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h2 className='text-xl font-semibold text-black'>Employment Information</h2>
                <EmploymentInfo />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h2 className='text-xl font-semibold text-black'>Account Information</h2>
                <AccountInfo />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h2 className='text-xl font-semibold text-black'>Documents Upload - <span className='text-base text-[#808080] font-normal'>Upload the document file as image or Pdf with high resolution. Max file Size 2Mb</span></h2>
                <UploadDocuments />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={handleDiscard}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSave}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Changes
                </button>
            </div>
        </div>
    )
}

export default AddLibrarian