export const DRIVER_STATUSES = ['Active', 'On Leave', 'Inactive']

export const DRIVERS = [
    {
        id: 'VAN-1001',
        profileImage: null,
        firstName: 'Sandy',
        middleName: '',
        lastName: 'Selva',
        email: 'san@gmail.com',
        gender: 'Male',
        mobileNumber: '9944076993',
        alternativeNumber: '9876543210',
        licenseNumber: 'AG7586NG78',
        licenseExpiry: '15-08-2028',
        experience: '8 Years',
        city: 'Trichy',
        state: 'Tamil Nadu',
        country: 'India',
        zipCode: '620001',
        address: '45, Main Road, Cantonment',
        bloodGroup: 'O+',
        height: '172 cm',
        weight: '68 kg',
        dateOfBirth: '12-03-1985',
        medicalHistory: 'None.',
        vehicleNumber: 'TN-09-AB-4521',
        vehicleType: 'School Van (32 Seater)',
        routeAssigned: 'Route 5 — North Campus',
        employeeType: 'Full-time',
        joiningDate: '2016-04-01',
        reportingTo: 'Transport Manager',
        status: 'Active',
        documents: {
            idProof: 'Aadhaar Card',
            licenseCopy: 'Driving License — TN',
            experienceCertificate: 'Experience Letter — City Fleet',
        },
    },
    {
        id: 'VAN-1002',
        profileImage: null,
        firstName: 'Rajesh',
        middleName: 'K.',
        lastName: 'Kumar',
        email: 'rajesh.kumar@school.edu',
        gender: 'Male',
        mobileNumber: '9845012345',
        alternativeNumber: '9845098765',
        licenseNumber: 'TN8823456789',
        licenseExpiry: '22-11-2027',
        experience: '12 Years',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        zipCode: '600042',
        address: '18, Velachery Main Road',
        bloodGroup: 'B+',
        height: '175 cm',
        weight: '72 kg',
        dateOfBirth: '05-07-1980',
        medicalHistory: 'Mild hypertension — under medication.',
        vehicleNumber: 'TN-09-CD-8834',
        vehicleType: 'School Bus (45 Seater)',
        routeAssigned: 'Route 2 — East Campus',
        employeeType: 'Full-time',
        joiningDate: '2012-06-15',
        reportingTo: 'Transport Manager',
        status: 'Active',
        documents: {
            idProof: 'Aadhaar Card',
            licenseCopy: 'Heavy Vehicle License — TN',
            experienceCertificate: 'Experience Letter — Metro Transport',
        },
    },
    {
        id: 'VAN-1003',
        profileImage: null,
        firstName: 'Priya',
        middleName: 'M.',
        lastName: 'Venkatesh',
        email: 'priya.venkatesh@school.edu',
        gender: 'Female',
        mobileNumber: '9789012345',
        alternativeNumber: '9789054321',
        licenseNumber: 'TN7734567890',
        licenseExpiry: '30-01-2029',
        experience: '6 Years',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        zipCode: '600020',
        address: '7, Adyar 2nd Street',
        bloodGroup: 'A+',
        height: '162 cm',
        weight: '58 kg',
        dateOfBirth: '18-11-1990',
        medicalHistory: 'None.',
        vehicleNumber: 'TN-09-EF-2210',
        vehicleType: 'School Van (24 Seater)',
        routeAssigned: 'Route 8 — West Campus',
        employeeType: 'Full-time',
        joiningDate: '2019-08-10',
        reportingTo: 'Transport Manager',
        status: 'On Leave',
        documents: {
            idProof: 'Aadhaar Card',
            licenseCopy: 'Driving License — TN',
            experienceCertificate: 'Experience Letter — SafeRide Logistics',
        },
    },
    {
        id: 'VAN-1004',
        profileImage: null,
        firstName: 'Mohan',
        middleName: 'R.',
        lastName: 'Das',
        email: 'mohan.das@school.edu',
        gender: 'Male',
        mobileNumber: '9654321098',
        alternativeNumber: '9654387654',
        licenseNumber: 'TN6645678901',
        licenseExpiry: '10-05-2026',
        experience: '15 Years',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        zipCode: '600043',
        address: '22, Pallavaram Bus Stand Road',
        bloodGroup: 'AB+',
        height: '168 cm',
        weight: '70 kg',
        dateOfBirth: '25-02-1978',
        medicalHistory: 'Back pain — physiotherapy ongoing.',
        vehicleNumber: 'TN-09-GH-5567',
        vehicleType: 'School Bus (45 Seater)',
        routeAssigned: 'Route 3 — South Campus',
        employeeType: 'Full-time',
        joiningDate: '2010-01-20',
        reportingTo: 'Transport Manager',
        status: 'Active',
        documents: {
            idProof: 'Aadhaar Card',
            licenseCopy: 'Heavy Vehicle License — TN',
            experienceCertificate: 'Experience Letter — State Transport Corp.',
        },
    },
]

const DRIVERS_STORAGE_KEY = 'schoolerp_drivers'

export const getDrivers = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(DRIVERS_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    return DRIVERS
}

export const saveDrivers = (drivers) => {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(drivers))
        }
    } catch {
        /* ignore */
    }
    return drivers
}

export const addDriver = (driverData) => {
    const list = getDrivers()
    const nextId = `VAN-${1000 + list.length + 1}`
    const newDriver = {
        id: nextId,
        profileImage: null,
        firstName: driverData.firstName?.trim() || 'Driver',
        middleName: driverData.middleName?.trim() || '',
        lastName: driverData.lastName?.trim() || '',
        email: driverData.email?.trim() || `driver.${Date.now()}@school.edu`,
        gender: driverData.gender || 'Male',
        mobileNumber: driverData.mobileNumber?.trim() || '',
        alternativeNumber: driverData.alternativeNumber?.trim() || '',
        licenseNumber: driverData.licenseNumber?.trim() || '',
        licenseExpiry: driverData.licenseExpiry || '2028-12-31',
        experience: driverData.experience || '5 Years',
        city: driverData.city || 'Chennai',
        state: driverData.state || 'Tamil Nadu',
        country: 'India',
        zipCode: driverData.zipCode || '600001',
        address: driverData.address || '',
        bloodGroup: driverData.bloodGroup || 'B+',
        vehicleNumber: driverData.vehicleNumber || 'Unassigned',
        vehicleType: driverData.vehicleType || 'School Bus',
        routeAssigned: driverData.routeAssigned || 'Unassigned',
        status: driverData.status || 'Active',
        salary: driverData.salary || '₹30,000 / month',
        workShift: driverData.workShift || 'Morning (6:00 AM – 2:00 PM)',
    }
    const updated = [newDriver, ...list]
    saveDrivers(updated)
    return newDriver
}

export const updateDriver = (id, patch) => {
    const list = getDrivers()
    const updated = list.map((d) => (d.id === id ? { ...d, ...patch } : d))
    saveDrivers(updated)
    return updated.find((d) => d.id === id) || null
}

export const deleteDriver = (id) => {
    const list = getDrivers()
    const updated = list.filter((d) => d.id !== id)
    saveDrivers(updated)
    return updated
}

export const getDriverById = (id) => getDrivers().find((driver) => driver.id === id) ?? null

export const getDriverDisplayName = (driver) =>
    [driver?.firstName, driver?.middleName, driver?.lastName].filter(Boolean).join(' ') || 'Driver'

export const statusBadgeColor = {
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    'On Leave': 'bg-[#FF980033] text-[#FF9800]',
    Inactive: 'bg-[#66708533] text-[#667085]',
}
