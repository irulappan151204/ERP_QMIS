import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Phone, Mail, Award, Truck, MapPin, Check } from 'lucide-react'
import { toast } from 'react-toastify'
import { addDriver } from './driverManagementData'
import { VEHICLES } from '../VehicleManagement/vehicleManagementData'
import { ROUTES } from '../RouteManagement/routeManagementData'

export default function AddDriver() {
    const navigate = useNavigate()
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
        vehicleNumber: VEHICLES[0]?.vehicleNumber || 'TN-09-AB-4521',
        routeAssigned: ROUTES[0]?.routeName || 'Route 5 — North Campus',
        salary: '₹30,000 / month',
        workShift: 'Morning (6:00 AM – 2:00 PM)',
        status: 'Active',
    })

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
        addDriver(form)
        toast.success(`Driver ${form.firstName} ${form.lastName} registered successfully!`)
        navigate('/transport-manager/driver-management')
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
                <h1 className='text-xl font-bold text-slate-900'>Add New Driver Profile</h1>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
                {/* 1. Personal & Contact Information */}
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
                                placeholder='First name'
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
                                placeholder='Middle name'
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
                                placeholder='Last name'
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
                                placeholder='10-digit mobile number'
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
                                placeholder='driver.official@school.edu'
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-blue-600'
                            />
                        </div>
                    </div>
                </div>

                {/* 2. License & Fleet Assignment */}
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
                                placeholder='e.g. TN8823456789'
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
                                placeholder='e.g. 10 Years'
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
                                placeholder='Morning (6:00 AM – 2:00 PM)'
                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-blue-600'
                            />
                        </div>
                    </div>
                </div>

                {/* Submit / Actions */}
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
                        Save & Register Driver
                    </button>
                </div>
            </form>
        </section>
    )
}
