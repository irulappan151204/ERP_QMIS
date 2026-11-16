import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, User, Truck } from 'lucide-react'
import { toast } from 'react-toastify'
import { getDriverById, updateDriver } from './driverManagementData'
import { VEHICLES } from '../VehicleManagement/vehicleManagementData'
import { ROUTES } from '../RouteManagement/routeManagementData'

export default function EditDriver() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [driver, setDriver] = useState(() => getDriverById(id))

    const [form, setForm] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        gender: 'Male',
        mobileNumber: '',
        alternativeNumber: '',
        email: '',
        licenseNumber: '',
        licenseExpiry: '2028-12-31',
        experience: '5 Years',
        city: 'Chennai',
        state: 'Tamil Nadu',
        zipCode: '600001',
        address: '',
        bloodGroup: 'B+',
        vehicleNumber: '',
        routeAssigned: '',
        salary: '₹30,000 / month',
        workShift: 'Morning (6:00 AM – 2:00 PM)',
        status: 'Active',
    })

    useEffect(() => {
        const found = getDriverById(id)
        if (found) {
            setDriver(found)
            setForm({
                firstName: found.firstName || '',
                middleName: found.middleName || '',
                lastName: found.lastName || '',
                gender: found.gender || 'Male',
                mobileNumber: found.mobileNumber || '',
                alternativeNumber: found.alternativeNumber || '',
                email: found.email || '',
                licenseNumber: found.licenseNumber || '',
                licenseExpiry: found.licenseExpiry || '2028-12-31',
                experience: found.experience || '5 Years',
                city: found.city || 'Chennai',
                state: found.state || 'Tamil Nadu',
                zipCode: found.zipCode || '600001',
                address: found.address || '',
                bloodGroup: found.bloodGroup || 'B+',
                vehicleNumber: found.vehicleNumber || VEHICLES[0]?.vehicleNumber || '',
                routeAssigned: found.routeAssigned || ROUTES[0]?.routeName || '',
                salary: found.salary || '₹30,000 / month',
                workShift: found.workShift || 'Morning (6:00 AM – 2:00 PM)',
                status: found.status || 'Active',
            })
        }
    }, [id])

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.firstName.trim() || !form.mobileNumber.trim() || !form.licenseNumber.trim()) {
            toast.error('First Name, Mobile Number, and License Number are mandatory.')
            return
        }
        updateDriver(id, form)
        toast.success(`Driver ${form.firstName} ${form.lastName} profile updated successfully!`)
        navigate('/transport-manager/driver-management')
    }

    if (!driver) {
        return (
            <div className='bg-white rounded-2xl p-8 text-center space-y-4 shadow-sm'>
                <p className='text-sm text-slate-500'>Driver record not found for ID: {id}</p>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/driver-management')}
                    className='px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold'
                >
                    Back to Driver List
                </button>
            </div>
        )
    }

    return (
        <section className='space-y-6 pb-8'>
            <div className='flex items-center justify-between'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/driver-management')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to Driver List
                </button>
                <h1 className='text-xl font-bold text-slate-900'>Edit Driver: {driver.firstName} {driver.lastName} ({driver.id})</h1>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='bg-white rounded-2xl shadow-md p-6 space-y-4'>
                    <h2 className='text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2'>
                        <User size={18} className='text-blue-600' /> Personal & Contact Details
                    </h2>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                        <div>
                            <label className='block text-xs font-semibold text-slate-700 mb-1'>First Name *</label>
                            <input
                                type='text'
                                required
                                name='firstName'
                                value={form.firstName}
                                onChange={handleChange}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-blue-600'
                            />
                        </div>
                        <div>
                            <label className='block text-xs font-semibold text-slate-700 mb-1'>Middle Name</label>
                            <input
                                type='text'
                                name='middleName'
                                value={form.middleName}
                                onChange={handleChange}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-blue-600'
                            />
                        </div>
                        <div>
                            <label className='block text-xs font-semibold text-slate-700 mb-1'>Last Name</label>
                            <input
                                type='text'
                                name='lastName'
                                value={form.lastName}
                                onChange={handleChange}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-blue-600'
                            />
                        </div>
                        <div>
                            <label className='block text-xs font-semibold text-slate-700 mb-1'>Gender</label>
                            <select
                                name='gender'
                                value={form.gender}
                                onChange={handleChange}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
                            >
                                <option value='Male'>Male</option>
                                <option value='Female'>Female</option>
                                <option value='Other'>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className='block text-xs font-semibold text-slate-700 mb-1'>Mobile Number *</label>
                            <input
                                type='tel'
                                required
                                name='mobileNumber'
                                value={form.mobileNumber}
                                onChange={handleChange}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-blue-600'
                            />
                        </div>
                        <div>
                            <label className='block text-xs font-semibold text-slate-700 mb-1'>Email Address</label>
                            <input
                                type='email'
                                name='email'
                                value={form.email}
                                onChange={handleChange}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-blue-600'
                            />
                        </div>
                    </div>
                </div>

                <div className='bg-white rounded-2xl shadow-md p-6 space-y-4'>
                    <h2 className='text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2'>
                        <Truck size={18} className='text-blue-600' /> Driving License & Vehicle Assignment
                    </h2>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                        <div>
                            <label className='block text-xs font-semibold text-slate-700 mb-1'>License Number *</label>
                            <input
                                type='text'
                                required
                                name='licenseNumber'
                                value={form.licenseNumber}
                                onChange={handleChange}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-blue-600 font-mono uppercase'
                            />
                        </div>
                        <div>
                            <label className='block text-xs font-semibold text-slate-700 mb-1'>Driving Experience</label>
                            <input
                                type='text'
                                name='experience'
                                value={form.experience}
                                onChange={handleChange}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-blue-600'
                            />
                        </div>
                        <div>
                            <label className='block text-xs font-semibold text-slate-700 mb-1'>Assigned Vehicle</label>
                            <select
                                name='vehicleNumber'
                                value={form.vehicleNumber}
                                onChange={handleChange}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
                            >
                                {VEHICLES.map((v) => (
                                    <option key={v.id} value={v.vehicleNumber}>
                                        {v.vehicleNumber} ({v.type || 'Bus'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className='block text-xs font-semibold text-slate-700 mb-1'>Assigned Route</label>
                            <select
                                name='routeAssigned'
                                value={form.routeAssigned}
                                onChange={handleChange}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
                            >
                                {ROUTES.map((r) => (
                                    <option key={r.id} value={r.routeName}>
                                        {r.routeName} ({r.startLocation} → {r.endLocation})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className='block text-xs font-semibold text-slate-700 mb-1'>Operational Status</label>
                            <select
                                name='status'
                                value={form.status}
                                onChange={handleChange}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
                            >
                                <option value='Active'>Active</option>
                                <option value='On Leave'>On Leave</option>
                                <option value='Inactive'>Inactive</option>
                            </select>
                        </div>
                        <div>
                            <label className='block text-xs font-semibold text-slate-700 mb-1'>Shift Timing</label>
                            <input
                                type='text'
                                name='workShift'
                                value={form.workShift}
                                onChange={handleChange}
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-blue-600'
                            />
                        </div>
                    </div>
                </div>

                <div className='flex items-center justify-end gap-3'>
                    <button
                        type='button'
                        onClick={() => navigate('/transport-manager/driver-management')}
                        className='px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition'
                    >
                        Cancel
                    </button>
                    <button
                        type='submit'
                        className='px-6 py-2.5 rounded-xl bg-[#515DEF] text-white text-sm font-semibold hover:opacity-90 transition shadow-sm'
                    >
                        Save & Update Driver
                    </button>
                </div>
            </form>
        </section>
    )
}
