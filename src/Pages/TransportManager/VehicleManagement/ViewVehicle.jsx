import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Wrench, Plus, X, Clock, CheckCircle2 } from 'lucide-react'
import { getVehicleById } from './vehicleManagementData'

const Section = ({ title, children, action = null }) => (
    <div className='bg-white rounded-2xl shadow-md p-5 border border-slate-100'>
        <div className='flex items-center justify-between mb-4 pb-2 border-b border-slate-100'>
            <h2 className='text-lg font-bold text-slate-900'>{title}</h2>
            {action}
        </div>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>{label}</span>
        <span className='text-sm font-medium text-slate-800 whitespace-pre-wrap wrap-break-word'>
            {value || '—'}
        </span>
    </div>
)

const ViewVehicle = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const vehicle = getVehicleById(id)

    // Interactive Service History Records state
    const [serviceHistory, setServiceHistory] = useState([
        {
            id: 'SRV-2026-081',
            serviceDate: vehicle?.lastServiceDate || '02-05-2026',
            serviceType: 'Periodic Major Maintenance',
            description: 'Engine oil replacement, oil filter, air filter, brake pad inspection & fluid top-up.',
            cost: '₹12,500',
            serviceCenter: 'Chennai Automotive Service — Velachery',
            nextServiceDue: vehicle?.nextServiceDate || '02-08-2026',
            status: 'Completed'
        },
        {
            id: 'SRV-2026-044',
            serviceDate: '15-01-2026',
            serviceType: 'Quarterly Safety Audit & Wheel Alignment',
            description: 'Four-wheel alignment, computer balancing, tyre tread depth assessment & emergency exit door latch servicing.',
            cost: '₹4,800',
            serviceCenter: 'TN Transport Works — Guindy',
            nextServiceDue: vehicle?.lastServiceDate || '02-05-2026',
            status: 'Completed'
        },
        {
            id: 'SRV-2026-092',
            serviceDate: vehicle?.nextServiceDate || '02-08-2026',
            serviceType: 'Monsoon Fitness & Suspension Check',
            description: 'Wiper blade replacement, electrical harness water sealing, underbody anti-rust coat inspection.',
            cost: '₹6,500',
            serviceCenter: 'Royal Motors Service — Adyar',
            nextServiceDue: '02-11-2026',
            status: 'Scheduled'
        }
    ])

    // Modal state for adding a new service entry
    const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)
    const [newService, setNewService] = useState({
        serviceDate: new Date().toISOString().split('T')[0],
        serviceType: 'Periodic Inspection',
        description: '',
        cost: '',
        serviceCenter: 'Chennai Automotive Service — Velachery',
        nextServiceDue: '',
        status: 'Completed'
    })

    const handleAddServiceSubmit = (e) => {
        e.preventDefault()
        if (!newService.description.trim()) {
            alert('Please provide a service description.')
            return
        }
        const created = {
            id: `SRV-2026-${String(serviceHistory.length + 100).slice(-3)}`,
            ...newService,
            cost: newService.cost ? `₹${newService.cost}` : '₹0'
        }
        setServiceHistory([created, ...serviceHistory])
        setIsAddServiceOpen(false)
        setNewService({
            serviceDate: new Date().toISOString().split('T')[0],
            serviceType: 'Periodic Inspection',
            description: '',
            cost: '',
            serviceCenter: 'Chennai Automotive Service — Velachery',
            nextServiceDue: '',
            status: 'Completed'
        })
    }

    return (
        <section className='space-y-6 font-sans'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/vehicle-management')}
                    className='inline-flex items-center gap-2 text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50/50 rounded-xl px-4 py-2 hover:bg-blue-100 transition cursor-pointer'
                >
                    <ArrowLeft size={16} />
                    Back to Vehicle List
                </button>
            </div>

            {!vehicle ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-slate-500'>
                    Vehicle record not found or could not be loaded.
                </div>
            ) : (
                <>
                    {/* Header Banner */}
                    <div className='bg-white rounded-2xl shadow-md p-5 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                        <div>
                            <div className='flex items-center gap-3'>
                                <h1 className='text-2xl font-bold text-slate-900'>{vehicle.vehicleNumber}</h1>
                                <span className='px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200'>
                                    {vehicle.category || 'Bus'}
                                </span>
                                <span className='px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                                    Operational & Active
                                </span>
                            </div>
                            <p className='text-xs text-slate-500 mt-1 font-mono'>
                                Vehicle Identifier: {vehicle.id} · Type: {vehicle.vehicleType} · Capacity: {vehicle.capacity} Seats
                            </p>
                        </div>
                    </div>

                    {/* Section 1: Vehicle Specifications */}
                    <Section title='Vehicle Specifications & Identity'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
                            <Field label='Vehicle Number' value={vehicle.vehicleNumber} />
                            <Field label='Vehicle Type' value={vehicle.vehicleType} />
                            <Field label='Seating Capacity' value={`${vehicle.capacity} Passengers`} />
                            <Field label='Category' value={vehicle.category || 'Bus'} />
                            <Field label='Student Strength' value={`${vehicle.studentStrength || 0} Students`} />
                            <Field label='Staff Strength' value={`${vehicle.staffStrength || 0} Staff`} />
                            <Field label='Current Odometer' value={`${vehicle.currentOdometer?.toLocaleString?.() || vehicle.currentOdometer || 0} KM`} />
                            <Field label='Fuel Type / Standard' value='BS-VI Diesel / High Capacity' />
                        </div>
                    </Section>

                    {/* Section 2: Driver Allocation, Usage & Custody Issue/Return Tracking */}
                    <Section title='Driver Allocation & Custody Issue/Return Tracking'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
                            <Field label='Designated Driver' value={vehicle.driverName || 'P. Selvam (Senior Driver)'} />
                            <Field label='Driver Contact Phone' value={vehicle.driverContact || '9944076993'} />
                            <Field label='Assigned Conductor' value={vehicle.conductorName || 'Murugan R.'} />
                            <Field label='Active Route Allocation' value='Route #04 (Morning & Evening Student Run)' />
                            <Field label='Custody Status' value='Allocated & In Service' />
                            <Field label='Vehicle Issue Date' value='01-08-2026 06:00 AM' />
                            <Field label='Daily Return Due Time' value='06:30 PM (Campus Security Post #1)' />
                            <Field label='Depot / Garage Station' value='North Campus Fleet Yard #B3' />
                        </div>
                    </Section>

                    {/* Section 3: Detailed Service & Maintenance History */}
                    <Section
                        title='Comprehensive Service & Maintenance History'
                        action={
                            <button
                                type='button'
                                onClick={() => setIsAddServiceOpen(true)}
                                className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer'
                            >
                                <Plus size={14} /> Log Service Entry
                            </button>
                        }
                    >
                        <div className='overflow-x-auto rounded-xl border border-slate-200 mt-2'>
                            <table className='w-full text-left border-collapse text-xs'>
                                <thead>
                                    <tr className='bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]'>
                                        <th className='p-3'>Service ID</th>
                                        <th className='p-3'>Service Date</th>
                                        <th className='p-3'>Service Type & Description</th>
                                        <th className='p-3'>Service Center / Provider</th>
                                        <th className='p-3'>Total Cost</th>
                                        <th className='p-3'>Next Due Date</th>
                                        <th className='p-3'>Status</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {serviceHistory.map((srv) => (
                                        <tr key={srv.id} className='hover:bg-slate-50/60 transition'>
                                            <td className='p-3 font-mono font-bold text-blue-600'>{srv.id}</td>
                                            <td className='p-3 font-medium text-slate-700 whitespace-nowrap'>{srv.serviceDate}</td>
                                            <td className='p-3'>
                                                <p className='font-bold text-slate-900'>{srv.serviceType}</p>
                                                <p className='text-[11px] text-slate-500 mt-0.5'>{srv.description}</p>
                                            </td>
                                            <td className='p-3 text-slate-700 font-medium'>{srv.serviceCenter}</td>
                                            <td className='p-3 font-bold text-slate-900 whitespace-nowrap'>{srv.cost}</td>
                                            <td className='p-3 font-medium text-slate-600 whitespace-nowrap'>{srv.nextServiceDue || '—'}</td>
                                            <td className='p-3'>
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        srv.status === 'Completed'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}
                                                >
                                                    {srv.status === 'Completed' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                                                    {srv.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>

                    {/* Section 4: Compliance & Statutory Documentation */}
                    <Section title='Statutory Compliance & Certifications'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs'>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-200'>
                                <span className='text-[10px] font-bold uppercase text-slate-500 block mb-1'>Fitness Certificate (FC)</span>
                                <strong className='text-slate-900 block'>{vehicle.fcExpiryDate ? `Valid until ${vehicle.fcExpiryDate}` : 'Certified & Active'}</strong>
                            </div>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-200'>
                                <span className='text-[10px] font-bold uppercase text-slate-500 block mb-1'>Registration (RC)</span>
                                <strong className='text-slate-900 block'>{vehicle.rcNumber || vehicle.vehicleNumber}</strong>
                            </div>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-200'>
                                <span className='text-[10px] font-bold uppercase text-slate-500 block mb-1'>Commercial Road Permit</span>
                                <strong className='text-slate-900 block'>{vehicle.permitNumber ? `${vehicle.permitNumber} (Exp: ${vehicle.permitExpiryDate || 'Active'})` : 'Institutional Permit Active'}</strong>
                            </div>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-200'>
                                <span className='text-[10px] font-bold uppercase text-slate-500 block mb-1'>Insurance Policy</span>
                                <strong className='text-slate-900 block'>Expires {vehicle.insuranceExpiryDate || '15-03-2027'}</strong>
                            </div>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-200'>
                                <span className='text-[10px] font-bold uppercase text-slate-500 block mb-1'>Pollution Under Control (PUCC)</span>
                                <strong className='text-slate-900 block'>{vehicle.puccExpiryDate ? `Valid until ${vehicle.puccExpiryDate}` : 'Certified & Current'}</strong>
                            </div>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-200'>
                                <span className='text-[10px] font-bold uppercase text-slate-500 block mb-1'>FASTag Account Identifier</span>
                                <strong className='text-slate-900 block'>{vehicle.fastagId || 'FTAG-IND-883411'}</strong>
                            </div>
                        </div>
                    </Section>

                    {/* MODAL: LOG SERVICE ENTRY */}
                    {isAddServiceOpen && (
                        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in'>
                            <div className='bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col'>
                                <div className='flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70'>
                                    <div className='flex items-center gap-2'>
                                        <Wrench size={18} className='text-blue-600' />
                                        <h3 className='text-base font-bold text-slate-900'>Log Service & Maintenance Record</h3>
                                    </div>
                                    <button
                                        type='button'
                                        onClick={() => setIsAddServiceOpen(false)}
                                        className='p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition'
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <form onSubmit={handleAddServiceSubmit} className='p-6 space-y-4 text-xs'>
                                    <div className='grid grid-cols-2 gap-3'>
                                        <div>
                                            <label className='font-semibold text-slate-700 block mb-1'>Service Date *</label>
                                            <input
                                                type='date'
                                                required
                                                value={newService.serviceDate}
                                                onChange={(e) => setNewService({ ...newService, serviceDate: e.target.value })}
                                                className='w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800'
                                            />
                                        </div>
                                        <div>
                                            <label className='font-semibold text-slate-700 block mb-1'>Next Service Due</label>
                                            <input
                                                type='date'
                                                value={newService.nextServiceDue}
                                                onChange={(e) => setNewService({ ...newService, nextServiceDue: e.target.value })}
                                                className='w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800'
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className='font-semibold text-slate-700 block mb-1'>Service Type *</label>
                                        <input
                                            type='text'
                                            required
                                            placeholder='e.g. Periodic Maintenance, Brake Pad Replacement, AC Service'
                                            value={newService.serviceType}
                                            onChange={(e) => setNewService({ ...newService, serviceType: e.target.value })}
                                            className='w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800'
                                        />
                                    </div>

                                    <div>
                                        <label className='font-semibold text-slate-700 block mb-1'>Work Description & Parts *</label>
                                        <textarea
                                            rows={3}
                                            required
                                            placeholder='Describe the work carried out, replaced components, and inspection outcomes...'
                                            value={newService.description}
                                            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                                            className='w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800'
                                        />
                                    </div>

                                    <div className='grid grid-cols-2 gap-3'>
                                        <div>
                                            <label className='font-semibold text-slate-700 block mb-1'>Total Service Cost (₹)</label>
                                            <input
                                                type='number'
                                                placeholder='e.g. 8500'
                                                value={newService.cost}
                                                onChange={(e) => setNewService({ ...newService, cost: e.target.value })}
                                                className='w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800'
                                            />
                                        </div>
                                        <div>
                                            <label className='font-semibold text-slate-700 block mb-1'>Service Provider / Center</label>
                                            <input
                                                type='text'
                                                value={newService.serviceCenter}
                                                onChange={(e) => setNewService({ ...newService, serviceCenter: e.target.value })}
                                                className='w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800'
                                            />
                                        </div>
                                    </div>

                                    <div className='flex items-center justify-end gap-2 pt-4 border-t border-slate-100'>
                                        <button
                                            type='button'
                                            onClick={() => setIsAddServiceOpen(false)}
                                            className='px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition'
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type='submit'
                                            className='px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition'
                                        >
                                            Save Service Record
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </section>
    )
}

export default ViewVehicle
