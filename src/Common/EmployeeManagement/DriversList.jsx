import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    EllipsisIcon,
    Download,
    Plus,
    X,
    User,
    Phone,
    Mail,
    Award,
    Truck,
} from 'lucide-react'
import { toast } from 'react-toastify'
import mo_user from '../../assets/images/no-profile.png'
import Dropdown from '../CommonComponents/Dropdown'
import ExportModal from '../CommonComponents/ExportModal'
import {
    getDrivers,
    addDriver,
    updateDriver,
    deleteDriver,
    DRIVER_STATUSES,
    getDriverDisplayName,
    statusBadgeColor,
} from './driversData'

const DriversList = ({ basePath }) => {
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [drivers, setDrivers] = useState(() => getDrivers())
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingDriver, setEditingDriver] = useState(null)
    const [driverForm, setDriverForm] = useState({
        firstName: '',
        lastName: '',
        mobileNumber: '',
        email: '',
        licenseNumber: '',
        experience: '5 Years',
        city: 'Chennai',
        state: 'Tamil Nadu',
        vehicleNumber: 'TN-09-AB-4521',
        routeAssigned: 'Route 1 — Main Campus',
        status: 'Active',
    })

    const refreshDrivers = () => {
        setDrivers(getDrivers())
    }

    useEffect(() => {
        refreshDrivers()
    }, [])

    const filteredDrivers = drivers.filter((driver) => {
        const query = searchQuery.toLowerCase()
        const matchesQuery =
            !query ||
            getDriverDisplayName(driver).toLowerCase().includes(query) ||
            (driver.id || '').toLowerCase().includes(query) ||
            (driver.licenseNumber || '').toLowerCase().includes(query)
        const matchesStatus = !statusFilter || driver.status === statusFilter
        return matchesQuery && matchesStatus
    })

    const handleOpenAdd = () => {
        setDriverForm({
            firstName: '',
            lastName: '',
            mobileNumber: '',
            email: '',
            licenseNumber: '',
            experience: '5 Years',
            city: 'Chennai',
            state: 'Tamil Nadu',
            vehicleNumber: 'TN-09-AB-4521',
            routeAssigned: 'Route 1 — Main Campus',
            status: 'Active',
        })
        setShowAddModal(true)
    }

    const handleSaveAdd = (e) => {
        e.preventDefault()
        if (!driverForm.firstName.trim() || !driverForm.mobileNumber.trim() || !driverForm.licenseNumber.trim()) {
            toast.error('First Name, Mobile Number, and License Number are mandatory.')
            return
        }
        addDriver(driverForm)
        refreshDrivers()
        setShowAddModal(false)
        toast.success(`Driver ${driverForm.firstName} added successfully!`)
    }

    const handleOpenEdit = (driver) => {
        setEditingDriver(driver)
        setDriverForm({
            firstName: driver.firstName || '',
            lastName: driver.lastName || '',
            mobileNumber: driver.mobileNumber || '',
            email: driver.email || '',
            licenseNumber: driver.licenseNumber || '',
            experience: driver.experience || '5 Years',
            city: driver.city || 'Chennai',
            state: driver.state || 'Tamil Nadu',
            vehicleNumber: driver.vehicleNumber || '',
            routeAssigned: driver.routeAssigned || '',
            status: driver.status || 'Active',
        })
        setShowEditModal(true)
    }

    const handleSaveEdit = (e) => {
        e.preventDefault()
        if (!editingDriver) return
        if (!driverForm.firstName.trim() || !driverForm.mobileNumber.trim() || !driverForm.licenseNumber.trim()) {
            toast.error('First Name, Mobile Number, and License Number are mandatory.')
            return
        }
        updateDriver(editingDriver.id, driverForm)
        refreshDrivers()
        setShowEditModal(false)
        setEditingDriver(null)
        toast.success(`Driver ${driverForm.firstName} updated successfully!`)
    }

    const handleDelete = (driver) => {
        if (window.confirm(`Are you sure you want to remove driver ${getDriverDisplayName(driver)}?`)) {
            deleteDriver(driver.id)
            refreshDrivers()
            toast.info(`Driver ${getDriverDisplayName(driver)} removed.`)
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearchQuery('')
                            setStatusFilter('')
                            setFromDate(new Date())
                            setToDate(new Date())
                        }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Name, ID, license...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status'
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {DRIVER_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Drivers List</h2>
                    <div className='flex gap-x-2 items-center'>
                        <button
                            type='button'
                            onClick={handleOpenAdd}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-1.5 font-medium shadow-sm'
                        >
                            <Plus size={16} />
                            Add Driver
                        </button>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-gray-100 text-gray-700 text-sm px-4 py-2 rounded-md hover:bg-gray-200 transition-all duration-200 cursor-pointer flex items-center gap-x-2 font-medium'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Profile</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Driver Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Driver ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Email ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Gender</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Mobile Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>License Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Experience</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>City</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg text-center'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDrivers.map((driver) => (
                                <tr key={driver.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                    <td className='px-2 py-4 object-cover flex justify-center rounded-s-lg'>
                                        <img src={driver.profileImage || mo_user} alt='' className='w-9 h-9 rounded-full object-cover' />
                                    </td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{getDriverDisplayName(driver)}</td>
                                    <td className='px-2 py-4 font-mono'>{driver.id}</td>
                                    <td className='px-2 py-4'>{driver.email}</td>
                                    <td className='px-2 py-4'>{driver.gender || 'Male'}</td>
                                    <td className='px-2 py-4'>{driver.mobileNumber}</td>
                                    <td className='px-2 py-4 font-mono'>{driver.licenseNumber}</td>
                                    <td className='px-2 py-4'>{driver.experience}</td>
                                    <td className='px-2 py-4'>{driver.city}</td>
                                    <td className='px-2 py-4'>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadgeColor[driver.status] || 'bg-gray-100 text-gray-700'}`}>
                                            {driver.status}
                                        </span>
                                    </td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink
                                                to={`${basePath}/view/${driver.id}`}
                                                className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer text-sm'
                                            >
                                                View Details
                                            </NavLink>
                                            <button
                                                type='button'
                                                onClick={() => handleOpenEdit(driver)}
                                                className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer text-sm'
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => handleDelete(driver)}
                                                className='block w-full text-left p-2 hover:bg-red-600 hover:text-white rounded cursor-pointer text-sm text-red-600'
                                            >
                                                Delete
                                            </button>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>Showing 1 to {filteredDrivers.length} of {filteredDrivers.length} entries</p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Add / Edit Driver Modal */}
            {(showAddModal || showEditModal) && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b mb-4'>
                            <h3 className='text-lg font-bold text-gray-900'>
                                {showAddModal ? 'Register New Driver' : `Edit Driver (${editingDriver?.id})`}
                            </h3>
                            <button
                                type='button'
                                onClick={() => {
                                    setShowAddModal(false)
                                    setShowEditModal(false)
                                }}
                                className='text-gray-400 hover:text-gray-600'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit} className='space-y-4'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-gray-700 mb-1'>First Name *</label>
                                    <input
                                        type='text'
                                        required
                                        value={driverForm.firstName}
                                        onChange={(e) => setDriverForm({ ...driverForm, firstName: e.target.value })}
                                        className='w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#515DEF]'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-gray-700 mb-1'>Last Name</label>
                                    <input
                                        type='text'
                                        value={driverForm.lastName}
                                        onChange={(e) => setDriverForm({ ...driverForm, lastName: e.target.value })}
                                        className='w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#515DEF]'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-gray-700 mb-1'>Mobile Number *</label>
                                    <input
                                        type='tel'
                                        required
                                        value={driverForm.mobileNumber}
                                        onChange={(e) => setDriverForm({ ...driverForm, mobileNumber: e.target.value })}
                                        className='w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#515DEF]'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-gray-700 mb-1'>Email</label>
                                    <input
                                        type='email'
                                        value={driverForm.email}
                                        onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                                        className='w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#515DEF]'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-gray-700 mb-1'>License Number *</label>
                                    <input
                                        type='text'
                                        required
                                        value={driverForm.licenseNumber}
                                        onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                                        className='w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#515DEF]'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-gray-700 mb-1'>Experience</label>
                                    <input
                                        type='text'
                                        value={driverForm.experience}
                                        onChange={(e) => setDriverForm({ ...driverForm, experience: e.target.value })}
                                        className='w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#515DEF]'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-gray-700 mb-1'>Assigned Vehicle</label>
                                    <input
                                        type='text'
                                        value={driverForm.vehicleNumber}
                                        onChange={(e) => setDriverForm({ ...driverForm, vehicleNumber: e.target.value })}
                                        placeholder='TN-09-AB-4521'
                                        className='w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#515DEF]'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-gray-700 mb-1'>Status</label>
                                    <select
                                        value={driverForm.status}
                                        onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value })}
                                        className='w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-[#515DEF]'
                                    >
                                        {DRIVER_STATUSES.map((st) => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className='flex justify-end gap-3 pt-4 border-t'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setShowAddModal(false)
                                        setShowEditModal(false)
                                    }}
                                    className='px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-5 py-2 text-sm text-white bg-[#515DEF] rounded-lg hover:bg-opacity-90 font-medium'
                                >
                                    {showAddModal ? 'Create Driver' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default DriversList
