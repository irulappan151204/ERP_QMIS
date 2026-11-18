import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import VehicleDetailsForm from './Components/VehicleDetailsForm'
import { getVehicleById } from './vehicleManagementData'
import { Button } from '../../../Common/ui'

const EditVehicle = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const vehicle = getVehicleById(id)

    const handleSave = () => {
        toast.success(`Vehicle ${vehicle?.vehicleNumber || id} updated successfully`)
        navigate('/transport-manager/vehicle-management')
    }

    if (!vehicle) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Vehicle not found or could not be loaded.
                </div>
                <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                    <Button
                        variant='primary'
                        onClick={() => navigate('/transport-manager/vehicle-management')}
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
                <h2 className='text-xl font-semibold text-black'>Vehicle Details Information</h2>
                <p className='text-sm text-[#667085] mt-1'>Editing {vehicle.id} — {vehicle.vehicleNumber}</p>
                <VehicleDetailsForm vehicle={vehicle} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <Button
                    variant='secondary'
                    onClick={() => navigate('/transport-manager/vehicle-management')}
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

export default EditVehicle
