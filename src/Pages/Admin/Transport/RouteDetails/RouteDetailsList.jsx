import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, EllipsisIcon, ChevronLeft, ChevronRight, Plus, Download, X, Bus, MapPin, Clock } from 'lucide-react'
import { toast } from 'react-toastify'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import { ROUTES } from '../../../TransportManager/RouteManagement/routeManagementData'

const RouteDetailsList = () => {
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [routes, setRoutes] = useState(() => ROUTES)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRouteForView, setSelectedRouteForView] = useState(null)

    const filteredRoutes = routes.filter((r) => {
        const q = searchQuery.toLowerCase()
        return (
            !q ||
            r.routeName.toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q) ||
            (r.vehicleNumber || '').toLowerCase().includes(q) ||
            (r.driverName || '').toLowerCase().includes(q)
        )
    })

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearchQuery('')
                            setFromDate(new Date())
                            setToDate(new Date())
                        }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
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
                            placeholder='Route ID, route name, bus, driver...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Status</label>
                        <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All Active Routes</option>
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
                    <h2 className='text-xl font-medium text-black'>Route Details List</h2>
                    <div className='flex gap-x-2 items-center'>
                        <NavLink
                            to='/admin/transport/add-route-details'
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Add New Route
                        </NavLink>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
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
                        <option value='40'>40</option>
                        <option value='50'>50</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Route ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Route Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Start Location</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>End Location</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Vehicle Number</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Driver Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Timings</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredRoutes.map((r) => (
                                <tr key={r.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                    <td className='px-2 py-4 font-mono font-semibold text-slate-800 rounded-s-lg'>{r.id}</td>
                                    <td className='px-2 py-4 font-medium text-slate-900'>{r.routeName}</td>
                                    <td className='px-2 py-4'>{r.startLocation}</td>
                                    <td className='px-2 py-4'>{r.endLocation}</td>
                                    <td className='px-2 py-4 font-mono'>{r.vehicleNumber}</td>
                                    <td className='px-2 py-4'>{r.driverName}</td>
                                    <td className='px-2 py-4'>{r.pickUpTime} – {r.dropTime}</td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <button
                                                type='button'
                                                onClick={() => setSelectedRouteForView(r)}
                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                            >
                                                View Details
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => toast.info(`Editing route ${r.id}...`)}
                                                className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                            >
                                                Edit
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
                <p className='text-sm font-medium text-[#515DEF]'>Showing 1 to {filteredRoutes.length} of {filteredRoutes.length} entries</p>
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

            {/* ROUTE VIEW MODAL */}
            {selectedRouteForView && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900 flex items-center gap-2'>
                                <Bus className='text-blue-600' size={18} /> {selectedRouteForView.routeName}
                            </h3>
                            <button
                                type='button'
                                onClick={() => setSelectedRouteForView(null)}
                                className='text-slate-400 hover:text-slate-600 cursor-pointer'
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className='grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200'>
                            <div>
                                <span className='text-slate-400 block text-[11px]'>Route ID</span>
                                <span className='font-mono font-bold text-slate-900'>{selectedRouteForView.id}</span>
                            </div>
                            <div>
                                <span className='text-slate-400 block text-[11px]'>Vehicle Number</span>
                                <span className='font-mono font-bold text-slate-900'>{selectedRouteForView.vehicleNumber}</span>
                            </div>
                            <div>
                                <span className='text-slate-400 block text-[11px]'>Driver</span>
                                <span className='font-semibold text-slate-800'>{selectedRouteForView.driverName} ({selectedRouteForView.driverContact})</span>
                            </div>
                            <div>
                                <span className='text-slate-400 block text-[11px]'>Corridor</span>
                                <span className='font-semibold text-slate-800'>{selectedRouteForView.startLocation} → {selectedRouteForView.endLocation}</span>
                            </div>
                            <div>
                                <span className='text-slate-400 block text-[11px]'>Total Stops</span>
                                <span className='font-semibold text-slate-800'>{selectedRouteForView.totalStops || 6} Stops ({selectedRouteForView.distance || '18.5 km'})</span>
                            </div>
                            <div>
                                <span className='text-slate-400 block text-[11px]'>Annual Transport Fee</span>
                                <span className='font-bold text-emerald-700'>{selectedRouteForView.yearlyFees || '₹45,000'}</span>
                            </div>
                        </div>

                        {selectedRouteForView.stops && selectedRouteForView.stops.length > 0 && (
                            <div>
                                <h4 className='text-xs font-bold text-slate-800 mb-2'>Configured Route Stops & Timings</h4>
                                <div className='space-y-2'>
                                    {selectedRouteForView.stops.map((stop, idx) => (
                                        <div key={idx} className='p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs'>
                                            <span className='font-medium text-slate-800 flex items-center gap-1.5'>
                                                <MapPin size={13} className='text-blue-600' /> {stop.startLocation} → {stop.endLocation}
                                            </span>
                                            <span className='text-slate-500 font-mono text-[11px]'>{stop.pickUpTime}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className='flex justify-end pt-3 border-t border-slate-100'>
                            <button
                                type='button'
                                onClick={() => setSelectedRouteForView(null)}
                                className='px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition cursor-pointer'
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default RouteDetailsList
