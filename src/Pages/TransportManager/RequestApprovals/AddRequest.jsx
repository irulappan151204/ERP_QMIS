import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bus, Fuel, Wrench, Plus, Check } from 'lucide-react'
import { toast } from 'react-toastify'
import { addMaintenanceRequest, addFuelRequest, ISSUE_TYPES, PRIORITIES } from './requestApprovalsData'
import { VEHICLES } from '../VehicleManagement/vehicleManagementData'
import { ROUTES } from '../RouteManagement/routeManagementData'

const FLEET_VEHICLES = VEHICLES || [
    { id: 'VH-001', vehicleNumber: 'TN-09-AB-4521' },
    { id: 'VH-002', vehicleNumber: 'TN-09-CD-8834' },
    { id: 'VH-003', vehicleNumber: 'TN-09-EF-2210' },
    { id: 'VH-004', vehicleNumber: 'TN-09-GH-5567' },
    { id: 'VH-005', vehicleNumber: 'TN-09-IJ-3344' },
]

const DRIVERS = [
    { id: 'VAN-1001', name: 'Sandy Selva' },
    { id: 'VAN-1002', name: 'Rajesh K. Kumar' },
    { id: 'VAN-1003', name: 'Priya M. Venkatesh' },
    { id: 'VAN-1004', name: 'Mohan R. Das' },
    { id: 'VAN-1005', name: 'M. Anand' },
]

const AddRequest = () => {
    const navigate = useNavigate()
    const [requestType, setRequestType] = useState('maintenance') // 'maintenance' or 'fuel'

    // Maintenance form state
    const [maintenanceForm, setMaintenanceForm] = useState({
        vehicleNumber: FLEET_VEHICLES[0]?.vehicleNumber || 'TN-09-AB-4521',
        reportedBy: 'Transport Manager',
        driverName: DRIVERS[0]?.name || 'Sandy Selva',
        issueType: ISSUE_TYPES[0] || 'Engine Issue',
        priority: 'High',
        description: '',
        workshop: '',
        estimatedCost: '',
    })

    // Fuel form state
    const [fuelForm, setFuelForm] = useState({
        vehicleNumber: FLEET_VEHICLES[0]?.vehicleNumber || 'TN-09-AB-4521',
        driverName: DRIVERS[0]?.name || 'Sandy Selva',
        driverId: DRIVERS[0]?.id || 'VAN-1001',
        routeName: ROUTES[0]?.routeName || 'Route 5 — North Campus',
        currentOdometerReading: '',
        requestedQuantity: '',
        fuelStation: 'Indian Oil Depot - Bypass Road',
        estimatedCost: '',
        justification: '',
    })

    const [errors, setErrors] = useState({})

    const handleDriverSelectForFuel = (driverName) => {
        const found = DRIVERS.find((d) => d.name === driverName)
        setFuelForm((prev) => ({
            ...prev,
            driverName,
            driverId: found?.id || 'VAN-1001',
        }))
    }

    const handleMaintenanceSubmit = (e) => {
        e.preventDefault()
        const newErrors = {}
        if (!maintenanceForm.description.trim()) {
            newErrors.description = 'Please describe the maintenance issue or requirement.'
        }
        if (!maintenanceForm.vehicleNumber) {
            newErrors.vehicleNumber = 'Please select a vehicle.'
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        const created = addMaintenanceRequest({
            ...maintenanceForm,
            estimatedCost: Number(maintenanceForm.estimatedCost) || 0,
        })
        toast.success(`Maintenance request #${created.requestId} submitted successfully.`)
        navigate('/transport-manager/request-approvals')
    }

    const handleFuelSubmit = (e) => {
        e.preventDefault()
        const newErrors = {}
        if (!fuelForm.requestedQuantity.trim()) {
            newErrors.requestedQuantity = 'Please specify fuel quantity in litres (e.g. 120 L).'
        }
        if (!fuelForm.currentOdometerReading.trim()) {
            newErrors.currentOdometerReading = 'Please enter current odometer reading (e.g. 48,500 km).'
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        const created = addFuelRequest({
            ...fuelForm,
            estimatedCost: Number(fuelForm.estimatedCost) || 0,
        })
        toast.success(`Fuel request #${created.requestId} submitted successfully.`)
        navigate('/transport-manager/request-approvals')
    }

    return (
        <section className="space-y-6 pb-12 font-inter max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/transport-manager/request-approvals')}
                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        title="Back to Request List"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Create Transport Request</h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Submit a new vehicle maintenance work order or fuel indent for institutional approval.
                        </p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                        type="button"
                        onClick={() => {
                            setRequestType('maintenance')
                            setErrors({})
                        }}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            requestType === 'maintenance'
                                ? 'bg-white text-indigo-700 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Wrench size={14} /> Maintenance Request
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setRequestType('fuel')
                            setErrors({})
                        }}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            requestType === 'fuel'
                                ? 'bg-white text-indigo-700 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Fuel size={14} /> Fuel Request
                    </button>
                </div>
            </div>

            {/* Maintenance Form */}
            {requestType === 'maintenance' && (
                <form onSubmit={handleMaintenanceSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
                    <div className="border-b border-slate-100 pb-3">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Wrench className="text-indigo-600" size={18} /> Vehicle Maintenance & Repair Request
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Work orders are reviewed by Joint Director Operations and Finance before vendor authorization.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Vehicle Number <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={maintenanceForm.vehicleNumber}
                                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, vehicleNumber: e.target.value })}
                                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                            >
                                {FLEET_VEHICLES.map((v) => (
                                    <option key={v.vehicleNumber} value={v.vehicleNumber}>
                                        {v.vehicleNumber} {v.id ? `(${v.id})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Assigned Driver / Submitter
                            </label>
                            <select
                                value={maintenanceForm.driverName}
                                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, driverName: e.target.value })}
                                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                            >
                                {DRIVERS.map((d) => (
                                    <option key={d.name} value={d.name}>{d.name} ({d.id})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Issue Classification <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={maintenanceForm.issueType}
                                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, issueType: e.target.value })}
                                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                            >
                                {ISSUE_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Priority Level
                            </label>
                            <select
                                value={maintenanceForm.priority}
                                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
                                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Proposed Workshop / Vendor
                            </label>
                            <input
                                type="text"
                                value={maintenanceForm.workshop}
                                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, workshop: e.target.value })}
                                placeholder="e.g. Apex Auto Cool Services, Depot Workshop"
                                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Estimated Cost (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={maintenanceForm.estimatedCost}
                                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, estimatedCost: e.target.value })}
                                placeholder="e.g. 12500"
                                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Issue Description & Defect Details <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={maintenanceForm.description}
                                onChange={(e) => {
                                    setMaintenanceForm({ ...maintenanceForm, description: e.target.value })
                                    if (errors.description) setErrors({})
                                }}
                                placeholder="Provide specific operational defect symptoms, parts requiring replacement, or inspection recommendations..."
                                className={`w-full text-xs text-slate-800 border rounded-xl p-3 focus:outline-none transition ${
                                    errors.description ? 'border-rose-400 focus:ring-1 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500'
                                }`}
                            />
                            {errors.description && (
                                <p className="text-[11px] text-rose-600 mt-1">{errors.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => navigate('/transport-manager/request-approvals')}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                            <Check size={15} /> Submit Maintenance Request
                        </button>
                    </div>
                </form>
            )}

            {/* Fuel Form */}
            {requestType === 'fuel' && (
                <form onSubmit={handleFuelSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
                    <div className="border-b border-slate-100 pb-3">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Fuel className="text-indigo-600" size={18} /> Fleet Fuel Indent & Dispensation Request
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Fuel requisitions are cross-verified against route kilometrage and tank volume limits.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Vehicle Number <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={fuelForm.vehicleNumber}
                                onChange={(e) => setFuelForm({ ...fuelForm, vehicleNumber: e.target.value })}
                                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                            >
                                {FLEET_VEHICLES.map((v) => (
                                    <option key={v.vehicleNumber} value={v.vehicleNumber}>
                                        {v.vehicleNumber} {v.id ? `(${v.id})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Assigned Driver
                            </label>
                            <select
                                value={fuelForm.driverName}
                                onChange={(e) => handleDriverSelectForFuel(e.target.value)}
                                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                            >
                                {DRIVERS.map((d) => (
                                    <option key={d.name} value={d.name}>{d.name} ({d.id})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Transit Route
                            </label>
                            <select
                                value={fuelForm.routeName}
                                onChange={(e) => setFuelForm({ ...fuelForm, routeName: e.target.value })}
                                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                            >
                                {ROUTES.map((r) => (
                                    <option key={r.routeName} value={r.routeName}>{r.routeName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Current Odometer Reading <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={fuelForm.currentOdometerReading}
                                onChange={(e) => {
                                    setFuelForm({ ...fuelForm, currentOdometerReading: e.target.value })
                                    if (errors.currentOdometerReading) setErrors({})
                                }}
                                placeholder="e.g. 48,350 km"
                                className={`w-full text-xs text-slate-800 border rounded-xl px-3 py-2.5 focus:outline-none transition ${
                                    errors.currentOdometerReading ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-500'
                                }`}
                            />
                            {errors.currentOdometerReading && (
                                <p className="text-[11px] text-rose-600 mt-1">{errors.currentOdometerReading}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Requested Fuel Quantity <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={fuelForm.requestedQuantity}
                                onChange={(e) => {
                                    setFuelForm({ ...fuelForm, requestedQuantity: e.target.value })
                                    if (errors.requestedQuantity) setErrors({})
                                }}
                                placeholder="e.g. 120 L"
                                className={`w-full text-xs text-slate-800 border rounded-xl px-3 py-2.5 focus:outline-none transition ${
                                    errors.requestedQuantity ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-500'
                                }`}
                            />
                            {errors.requestedQuantity && (
                                <p className="text-[11px] text-rose-600 mt-1">{errors.requestedQuantity}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Authorized Fuel Dispensation Point
                            </label>
                            <input
                                type="text"
                                value={fuelForm.fuelStation}
                                onChange={(e) => setFuelForm({ ...fuelForm, fuelStation: e.target.value })}
                                placeholder="e.g. Indian Oil Depot - Bypass Road"
                                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Estimated Cost (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={fuelForm.estimatedCost}
                                onChange={(e) => setFuelForm({ ...fuelForm, estimatedCost: e.target.value })}
                                placeholder="e.g. 11400"
                                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Special Justification / Route Notes
                            </label>
                            <textarea
                                rows={2}
                                value={fuelForm.justification}
                                onChange={(e) => setFuelForm({ ...fuelForm, justification: e.target.value })}
                                placeholder="Add notes on extra trips, sports meet transit, or deviation from normal route quota..."
                                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => navigate('/transport-manager/request-approvals')}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                            <Check size={15} /> Submit Fuel Indent
                        </button>
                    </div>
                </form>
            )}
        </section>
    )
}

export default AddRequest
