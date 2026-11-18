import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import RouteDetailsForm from './Components/RouteDetailsForm'
import StopDetailsForm from './Components/StopDetailsForm'
import { getRouteById } from './routeManagementData'
import { Button } from '../../../Common/ui'

const EditRoute = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const route = getRouteById(id)

    const handleSave = () => {
        toast.success(`Route ${route?.routeName || id} updated successfully`)
        navigate('/transport-manager/route-management')
    }

    if (!route) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Route not found or could not be loaded.
                </div>
                <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                    <Button
                        variant='primary'
                        onClick={() => navigate('/transport-manager/route-management')}
                    >
                        Back to list
                    </Button>
                </div>
            </section>
        )
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Route Details Information</h2>
                <p className='text-sm text-[#667085] mt-1'>Editing {route.id} — {route.routeName}</p>
                <RouteDetailsForm route={route} />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h2 className='text-xl font-semibold text-black'>Add Stops</h2>
                {route.stops.map((stop, index) => (
                    <StopDetailsForm key={`${route.id}-stop-${index}`} stop={stop} index={index} />
                ))}
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <Button
                    variant='secondary'
                    onClick={() => navigate('/transport-manager/route-management')}
                >
                    Discard Changes
                </Button>
                <Button
                    variant='primary'
                    onClick={handleSave}
                >
                    Save Changes
                </Button>
            </div>
        </section>
    )
}

export default EditRoute
