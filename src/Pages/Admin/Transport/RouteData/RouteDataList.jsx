import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Bus, MapPin, ChevronRight, Navigation, Clock, ShieldCheck } from 'lucide-react'
import { ROUTES } from '../../../../Pages/TransportManager/RouteManagement/routeManagementData'

const MapPlaceholder = () => (
    <div className='relative h-44 bg-gradient-to-br from-[#E8EBFF] via-[#F4F6FF] to-[#EDEEF5] overflow-hidden'>
        <div
            className='absolute inset-0 opacity-30'
            style={{
                backgroundImage: `
                    linear-gradient(#515DEF22 1px, transparent 1px),
                    linear-gradient(90deg, #515DEF22 1px, transparent 1px)
                `,
                backgroundSize: '24px 24px',
            }}
        />
        <div className='absolute inset-0 flex items-center justify-center'>
            <div className='flex flex-col items-center gap-2 text-[#515DEF]'>
                <div className='p-3 rounded-full bg-white/80 shadow-sm'>
                    <MapPin size={28} />
                </div>
                <span className='text-xs font-semibold uppercase tracking-wider'>Route GPS Preview</span>
            </div>
        </div>
        <div className='absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm'>
            <span className='relative flex h-2 w-2'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
                <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500' />
            </span>
            <span className='text-[10px] font-semibold text-[#0C1E5B]'>LIVE GPS</span>
        </div>
    </div>
)

const RouteDataList = () => {
    const navigate = useNavigate()

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-5'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                    <div>
                        <h2 className='text-xl font-bold text-slate-900'>Live Route Data & Telemetry Tracking</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Monitor active school fleet routes, vehicle telemetry, driver assignments, and live transit corridors.
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <span className='inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                            <ShieldCheck size={14} /> Fleet GPS Active
                        </span>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'>
                {ROUTES.map((route) => (
                    <div
                        key={route.id}
                        className='bg-white rounded-2xl shadow-md overflow-hidden text-left hover:shadow-lg transition-all duration-200 flex flex-col justify-between'
                    >
                        <div>
                            <MapPlaceholder />
                            <div className='p-4'>
                                <div className='flex items-start justify-between gap-3'>
                                    <div className='min-w-0 flex-1'>
                                        <h3 className='text-base font-semibold text-[#0C1E5B] truncate'>
                                            {route.routeName}
                                        </h3>
                                        <p className='text-xs text-[#667085] mt-1 truncate'>
                                            {route.startLocation} → {route.endLocation}
                                        </p>
                                    </div>
                                    <span className='font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded'>
                                        {route.id}
                                    </span>
                                </div>

                                <div className='mt-4 pt-4 border-t border-[#f2f4f7] space-y-2.5 text-xs text-[#667085]'>
                                    <div className='flex items-center justify-between'>
                                        <span className='flex items-center gap-2'>
                                            <Bus size={15} className='text-[#515DEF]' />
                                            <span>Vehicle: <strong className='text-slate-800'>{route.vehicleNumber}</strong></span>
                                        </span>
                                        <span className='flex items-center gap-1 font-mono text-[11px] text-slate-500'>
                                            <Navigation size={12} /> {route.distance || '18.5 km'}
                                        </span>
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        <span className='flex items-center gap-2'>
                                            <span className='text-[#515DEF]'>👤</span>
                                            <span>Driver: <strong className='text-slate-800'>{route.driverName}</strong></span>
                                        </span>
                                        <span className='text-[11px] font-mono text-slate-500'>{route.driverContact}</span>
                                    </div>
                                    <div className='flex items-center justify-between text-[11px] text-slate-500 pt-1'>
                                        <span className='flex items-center gap-1'><Clock size={12} /> Pickup: {route.pickUpTime}</span>
                                        <span>Drop: {route.dropTime}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='p-4 pt-0'>
                            <button
                                type='button'
                                onClick={() => navigate(`/admin/transport/route-details`)}
                                className='w-full py-2 bg-[#515DEF]/10 hover:bg-[#515DEF] text-[#515DEF] hover:text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer'
                            >
                                View Route Stops & Pricing <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default RouteDataList
