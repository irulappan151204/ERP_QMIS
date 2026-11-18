import React, { useState, useMemo, useEffect } from 'react'
import {
    BarChart3,
    Download,
    Calendar,
    Search,
    Filter,
    FileText,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Layers,
    TrendingUp,
    TrendingDown,
    Building2,
    Users,
    GraduationCap,
    Truck,
    Shield,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Check,
    DollarSign,
    RefreshCw,
    Printer
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'

const ROLE_REPORT_SUITES = {
    academic: {
        category: 'Academics & Examination',
        reports: [
            { id: 'exam-results', name: 'Annual & Term Examination Performance', desc: 'Consolidated marks, class pass percentage, and subject averages' },
            { id: 'attendance-analytics', name: 'Student Attendance & Absence Analysis', desc: 'Class-wise attendance rates, chronic absenteeism, and leave frequency' },
            { id: 'capca-evaluation', name: 'Continuous Assessment (CA / PCA) Analysis', desc: 'Internal test score progression and rubric performance benchmarks' },
            { id: 'grade-distribution', name: 'CBES Merit & Grade Distribution Roster', desc: 'A+ through F percentile bands and honor roll student roster' }
        ],
        sampleData: [
            { col1: 'Grade 10 - Section A', col2: 'Mathematics', col3: 'Annual Exam 2026', col4: '88.4%', col5: '100% Pass', col6: 'Rank 1: Aarav Sharma', status: 'Completed', date: '2026-10-28' },
            { col1: 'Grade 10 - Section B', col2: 'Science', col3: 'Annual Exam 2026', col4: '82.1%', col5: '97.2% Pass', col6: 'Rank 1: Diya Nair', status: 'Completed', date: '2026-10-28' },
            { col1: 'Grade 9 - Section A', col2: 'English Language', col3: 'Term 1 Exam', col4: '79.5%', col5: '95.0% Pass', col6: 'Rank 1: Rohan Verma', status: 'Completed', date: '2026-10-25' },
            { col1: 'Grade 9 - Section B', col2: 'Computer Science', col3: 'Continuous Assessment 2', col4: '91.0%', col5: '100% Pass', col6: 'Rank 1: Ananya Reddy', status: 'Completed', date: '2026-10-20' },
            { col1: 'Grade 8 - Section A', col2: 'Social Studies', col3: 'Mid Term Test', col4: '76.8%', col5: '92.5% Pass', col6: 'Rank 1: Aditya Menon', status: 'Completed', date: '2026-10-15' }
        ],
        columns: ['Class / Batch', 'Subject', 'Assessment Phase', 'Class Average', 'Pass Rate', 'Top Performer', 'Audit Status', 'Date']
    },
    administrative: {
        category: 'Administration & Human Resources',
        reports: [
            { id: 'staff-attendance', name: 'Staff Attendance & Leave Utilization', desc: 'Biometric punches, sick leave vs casual leave rates, and duty hours' },
            { id: 'enrollment-funnel', name: 'Student Enrollment & Admission Funnel', desc: 'Inquiries, entrance tests, completed admissions, and TC requests' },
            { id: 'escalation-helpdesk', name: 'Escalation & Helpdesk Resolution Velocity', desc: 'Department response times, unresolved grievances, and resolution velocity' },
            { id: 'payroll-headcount', name: 'Workforce Headcount & Payroll Allocation', desc: 'Department staffing quotas, contract renewals, and gratuity fund' }
        ],
        sampleData: [
            { col1: 'Academic Administration', col2: '48 Staff Members', col3: '96.4% Present', col4: '4 Approved Leaves', col5: '0 Pending Escalations', col6: 'Full Compliance', status: 'Completed', date: '2026-10-30' },
            { col1: 'Operations & Maintenance', col2: '32 Staff Members', col3: '93.8% Present', col4: '2 Approved Leaves', col5: '1 Pending Task', col6: 'Reviewed by HR', status: 'Completed', date: '2026-10-30' },
            { col1: 'Transport & Fleet Logistics', col2: '24 Drivers/Attendants', col3: '100% Present', col4: '0 Leaves', col5: '14 Routes Active', col6: 'Verified by HOD', status: 'Completed', date: '2026-10-30' },
            { col1: 'Front Office & Admissions', col2: '8 Executives', col3: '100% Present', col4: '0 Leaves', col5: '18 New Enquiries', col6: 'Active Follow-up', status: 'Completed', date: '2026-10-29' }
        ],
        columns: ['Department / Unit', 'Staff Strength', 'Attendance Rate', 'Leave Outflow', 'Operational Metric', 'HR Audit Sign', 'Status', 'Date']
    },
    financial: {
        category: 'Finance, Accounts & Fee Collections',
        reports: [
            { id: 'fee-collections', name: 'Fee Collection & Defaulter Aging', desc: 'Term tuition, bus fee collection efficiency, and overdue aging slabs' },
            { id: 'budget-expenditure', name: 'Departmental Budget & Expense Ledger', desc: 'Procurement costs, utility payments, and variance against allocations' },
            { id: 'concessions-audit', name: 'Staff Child & Merit Concession Audit', desc: 'Authorized fee waivers, sports scholarships, and documentation proofs' }
        ],
        sampleData: [
            { col1: 'Term 2 Tuition Fee', col2: '₹ 84,50,000 Expected', col3: '₹ 79,20,000 Collected', col4: '93.7% Realized', col5: '₹ 5,30,000 Outstanding', col6: 'Reminder SMS Sent', status: 'Active', date: '2026-10-30' },
            { col1: 'Transport Bus Fleet Fee', col2: '₹ 18,20,000 Expected', col3: '₹ 17,90,000 Collected', col4: '98.3% Realized', col5: '₹ 30,000 Outstanding', col6: 'Reconciled with Fleet', status: 'Completed', date: '2026-10-28' },
            { col1: 'Science Lab Modernization', col2: '₹ 12,00,000 Allocated', col3: '₹ 11,45,000 Utilized', col4: '95.4% Spent', col5: '₹ 55,000 Surplus', col6: 'PO Processed', status: 'Completed', date: '2026-10-22' }
        ],
        columns: ['Financial Head', 'Target Budget', 'Total Realized', 'Collection %', 'Variance / Dues', 'Finance Notes', 'Status', 'Date']
    },
    itsupport: {
        category: 'IT Support & Systems Infrastructure',
        reports: [
            { id: 'it-hardware-inventory', name: 'IT Hardware & Device Inventory', desc: 'Workstations, displays, printers, switches, and warranty lifecycles' },
            { id: 'it-incident-resolution', name: 'IT Incident Log & Resolution Times', desc: 'Hardware, networking, and application support tickets' },
            { id: 'it-spares-consumption', name: 'IT Spares & Consumables Consumption', desc: 'Cables, RAM modules, SSDs, adapters, and peripheral replacements' },
            { id: 'it-network-uptime', name: 'Campus Wi-Fi & Network Infrastructure', desc: 'Core switch health, internet bandwidth, and firewall uptime' }
        ],
        sampleData: [
            { col1: 'Computer Lab 01', col2: '36 Desktop All-in-Ones', col3: '100% Operational', col4: '0 Faults', col5: 'OS Windows 11 Pro', col6: 'Tech: Sandy Selva', status: 'Completed', date: '2026-10-30' },
            { col1: 'Primary Wing Smartboards', col2: '14 Interactive Displays', col3: '98% Uptime', col4: '1 HDMI Cable Replaced', col5: 'Firmware v4.2', col6: 'Tech: Sandy Selva', status: 'Completed', date: '2026-10-29' },
            { col1: 'Campus Wi-Fi Core Switch', col2: 'Aruba 48-Port PoE', col3: '99.98% Uptime', col4: '0 Packet Drops', col5: 'Bandwidth 1 Gbps', col6: 'Verified by HOD', status: 'Completed', date: '2026-10-28' },
            { col1: 'Admin Office Multi-Function Printer', col2: 'HP LaserJet Managed', col3: 'Toner Level 84%', col4: 'Toner Cartridge Inward', col5: 'Page Count: 18,400', col6: 'Tech: Sandy Selva', status: 'Completed', date: '2026-10-25' }
        ],
        columns: ['Asset / Facility', 'Device Configuration', 'Operational Status', 'Maintenance Activity', 'Technical Spec', 'Officer Incharge', 'Audit Status', 'Date']
    },
    maintenance: {
        category: 'Campus Maintenance & Facility Operations',
        reports: [
            { id: 'maintenance-work-orders', name: 'Campus Facility Work Orders & Remediation', desc: 'Electrical, plumbing, carpentry, and masonry repair turnaround' },
            { id: 'maintenance-preventive-schedule', name: 'Preventive Maintenance Audit Schedule', desc: 'HVAC filters, generator load testing, and RO water TDS compliance' },
            { id: 'maintenance-spares-ledger', name: 'Maintenance Spares & Material Consumption', desc: 'Wiring, plumbing fixtures, LED tubes, and hardware replenishment' }
        ],
        sampleData: [
            { col1: 'Main Block - Floor 2', col2: 'LED Light & Fixture Replacement', col3: 'WO-2026-089', col4: 'Electrical', col5: 'Completed within 4h', col6: 'Tech: R. Sundar', status: 'Completed', date: '2026-10-30' },
            { col1: 'Kindergarten Restrooms', col2: 'Tap Sensor & Plumbing Overhaul', col3: 'WO-2026-077', col4: 'Plumbing', col5: 'Fitted New Cartridge', col6: 'Tech: P. Murugan', status: 'Completed', date: '2026-10-29' },
            { col1: 'Central RO Plant', col2: 'Membrane & TDS Inspection', col3: 'WO-2026-054', col4: 'Water Facility', col5: 'TDS: 42 ppm (Pristine)', col6: 'Signed by Maintenance Head', status: 'Completed', date: '2026-10-27' }
        ],
        columns: ['Campus Zone', 'Work Order Description', 'Work Order #', 'Trade / Category', 'Remediation Action', 'Assigned Specialist', 'Status', 'Date']
    },
    transport: {
        category: 'Transport & Fleet Logistics',
        reports: [
            { id: 'transport-fleet-fuel', name: 'Transport Fleet Fuel & Route Mileage', desc: 'Daily diesel consumption, mileage per liter, and route efficiency' },
            { id: 'transport-route-inspection', name: 'Bus Route Capacity & Student Headcount', desc: 'Student boarding count, stop schedule timings, and delays' },
            { id: 'transport-fitness-expiry', name: 'RTO Vehicle Fitness & Insurance Compliance', desc: 'FC renewal dates, insurance policies, pollution testing, and road tax' }
        ],
        sampleData: [
            { col1: 'Route 01 - North Sector', col2: 'Bus TN-58-A-1024', col3: '42 Students', col4: '14.2 km/Ltr', col5: 'Fitness Exp: Dec 2027', col6: 'Driver: K. Selvam', status: 'Active', date: '2026-10-30' },
            { col1: 'Route 04 - IT Expressway', col2: 'Bus TN-58-B-3389', col3: '38 Students', col4: '13.8 km/Ltr', col5: 'Fitness Exp: Jan 2028', col6: 'Driver: R. Munusamy', status: 'Active', date: '2026-10-30' },
            { col1: 'Route 07 - South Extn', col2: 'Bus TN-58-A-9011', col3: '45 Students', col4: '12.9 km/Ltr', col5: 'Fitness Exp: Aug 2027', col6: 'Driver: M. Pandi', status: 'Active', date: '2026-10-29' }
        ],
        columns: ['Route Identifier', 'Vehicle Registration', 'Passenger Load', 'Fuel Economy', 'Statutory Compliance', 'Designated Driver', 'Fleet Status', 'Date']
    },
    stores: {
        category: 'Stores, Stationery & Uniform Inventory',
        reports: [
            { id: 'stores-inventory-valuation', name: 'Stores Inventory Valuation & Movement', desc: 'Fast-moving stationery items, stockouts, and replenishment triggers' },
            { id: 'stores-indent-fulfillment', name: 'Department Indent & Stationery Issuance', desc: 'Fulfillment rate of departmental requests and student distribution' },
            { id: 'stores-reorder-alerts', name: 'Low Stock & Critical Reorder Alerts', desc: 'SKUs nearing safety minimum threshold requiring procurement' }
        ],
        sampleData: [
            { col1: 'A4 Copier Paper (75 GSM)', col2: 'SKU-PAP-001', col3: '142 Reams', col4: '₹ 280 / Ream', col5: '₹ 39,760 Total', col6: 'Stock Healthy', status: 'Completed', date: '2026-10-30' },
            { col1: 'Student Notebooks (Ruled)', col2: 'SKU-NBK-012', col3: '480 Units', col4: '₹ 45 / Book', col5: '₹ 21,600 Total', col6: 'Stock Healthy', status: 'Completed', date: '2026-10-29' },
            { col1: 'School Blazer (Size 34)', col2: 'SKU-UNF-045', col3: '6 Units', col4: '₹ 1,200 / Unit', col5: 'Below Min (Reorder: 15)', col6: 'Indent Raised to Vendor', status: 'Active', date: '2026-10-28' }
        ],
        columns: ['Item Description', 'SKU Part Code', 'Available Stock', 'Unit Cost', 'Inventory Value / Alert', 'Warehouse State', 'Audit Status', 'Date']
    },
    canteen: {
        category: 'Canteen, Catering & Nutrition',
        reports: [
            { id: 'canteen-meal-sales', name: 'Daily Meal Token Sales & Collection', desc: 'Student and staff token collections across breakfast, lunch, and snack counters' },
            { id: 'canteen-inventory-usage', name: 'Canteen Kitchen Grocery & Ingredient Usage', desc: 'Bulk dry provisions, cooking oil, dairy, and perishable vegetable ledger' },
            { id: 'canteen-kitchen-hygiene', name: 'Kitchen Hygiene & Food Safety Checklist', desc: 'Daily sanitization, water purity, temperature logs, and FSSAI audits' }
        ],
        sampleData: [
            { col1: 'Primary Lunch Meal Tokens', col2: '340 Tokens', col3: '₹ 120 / Token', col4: '₹ 40,800 Realized', col5: '100% Reconciled', col6: 'Supervisor: Meena', status: 'Completed', date: '2026-10-30' },
            { col1: 'Staff Breakfast & Beverage', col2: '65 Orders', col3: '₹ 60 / Meal', col4: '₹ 3,900 Realized', col5: 'Reconciled', col6: 'Supervisor: Meena', status: 'Completed', date: '2026-10-30' },
            { col1: 'Kitchen Hygiene & Water QA', col2: 'Daily Inspection', col3: 'Food Safety Grade A', col4: 'Oil Freshness Passed', col5: 'All Surface Swabs Clean', col6: 'Certified by QA', status: 'Completed', date: '2026-10-29' }
        ],
        columns: ['Meal Category', 'Volume / Units', 'Unit Rate', 'Revenue Realized', 'Reconciliation State', 'Canteen Lead', 'Status', 'Date']
    },
    library: {
        category: 'Library Information & Resource Center',
        reports: [
            { id: 'library-book-circulation', name: 'Daily Book Lending & Return Flow', desc: 'Class-wise book issue rates, active loans, and return turnaround' },
            { id: 'library-overdue-fines', name: 'Overdue Books & Fines Recovery', desc: 'Borrowed titles past due date, reminder alerts, and fine reconciliation' },
            { id: 'library-student-reading', name: 'Student Reading Activity by Class', desc: 'Top student readers, genre popularity, and book club engagement' }
        ],
        sampleData: [
            { col1: 'Grade 9 - English Fiction', col2: '48 Books Borrowed', col3: '44 Returned On Time', col4: '4 Active Borrows', col5: '0 Overdue', col6: 'Librarian: Anitha', status: 'Completed', date: '2026-10-30' },
            { col1: 'Senior STEM Reference', col2: '26 Volumes Issued', col3: '26 Returned On Time', col4: '0 Active', col5: 'All Catalogs Verified', col6: 'Librarian: Anitha', status: 'Completed', date: '2026-10-29' },
            { col1: 'General Knowledge & Magazines', col2: '18 Subscriptions', col3: 'Full Circulation', col4: 'Digital Portal Active', col5: '120 Student Reads', col6: 'Librarian: Anitha', status: 'Completed', date: '2026-10-28' }
        ],
        columns: ['Resource Category', 'Lending Volume', 'Return Metrics', 'Outstanding Borrows', 'Compliance & Fines', 'Librarian Sign', 'Status', 'Date']
    },
    security: {
        category: 'Campus Security & Gatehouse Operations',
        reports: [
            { id: 'security-visitor-log', name: 'Campus Gate Passes & Visitor Footfall', desc: 'Parent check-ins, delivery vehicles, and security gate clearances' },
            { id: 'security-student-departure', name: 'Early Student Departure Gatepass Log', desc: 'Parent OTP authorization, escort details, and emergency departures' },
            { id: 'security-vehicle-entry', name: 'Campus Vehicle Entry & Parking Allocation', desc: 'Staff vehicles, visitor parking, and commercial delivery check-ins' }
        ],
        sampleData: [
            { col1: 'Main Gate - Parent Visitors', col2: '18 Visitors Checked-in', col3: 'All Photo IDs Verified', col4: 'Printed Visitor Badges', col5: '0 Security Incidents', col6: 'Officer: K. Raman', status: 'Completed', date: '2026-10-30' },
            { col1: 'Early Departure Student Gatepass', col2: '4 Students Authorized', col3: 'Parent Mobile OTP Validated', col4: 'Escort Accompanied', col5: 'Gatepass Archival Done', col6: 'Officer: K. Raman', status: 'Completed', date: '2026-10-30' },
            { col1: 'Commercial Delivery Vehicles', col2: '6 Delivery Trucks', col3: 'Goods Checked & Registered', col4: 'Parking Bay 2 Allocated', col5: 'Campus Speed Limit Followed', col6: 'Officer: K. Raman', status: 'Completed', date: '2026-10-29' }
        ],
        columns: ['Gatehouse Sector', 'Passes / Count', 'Identity Proof Verification', 'Movement Purpose', 'Security Clearance', 'Gate Officer', 'Status', 'Date']
    },
    housekeeping: {
        category: 'Housekeeping, Sanitation & Facility Hygiene',
        reports: [
            { id: 'housekeeping-sanitation-schedule', name: 'Restroom & Corridor Sanitation Log', desc: 'Daily cleaning rotations, disinfection logs, and soap replenishment' },
            { id: 'housekeeping-block-inspection', name: 'Academic Block Cleanliness Scores', desc: 'Floor inspections, surface hygiene audits, and supervisor sign-offs' },
            { id: 'housekeeping-chemical-inventory', name: 'Cleaning Spares & Consumables Ledger', desc: 'Disinfectant liquids, mops, trash bags, and cleaning chemical stock' }
        ],
        sampleData: [
            { col1: 'Academic Block A - Floors 1-3', col2: '12 Restrooms Cleaned', col3: '4 Inspections / Day', col4: 'Sanitizer Replenished', col5: 'Score: 98% Pristine', col6: 'Lead: Shanthi', status: 'Completed', date: '2026-10-30' },
            { col1: 'Academic Block B - Science Labs', col2: '6 Lab Floors Polished', col3: 'Hazardous Waste Disposed', col4: 'Disinfectant Mop Done', col5: 'Score: 100% Pristine', col6: 'Lead: Shanthi', status: 'Completed', date: '2026-10-29' },
            { col1: 'Central Dining Hall & Kitchen', col2: 'Post-Lunch Deep Clean', col3: 'Floor Scrub Machine Run', col4: 'Trash Compacted', col5: 'Score: 99% Pristine', col6: 'Lead: Shanthi', status: 'Completed', date: '2026-10-28' }
        ],
        columns: ['Facility Zone', 'Sanitation Tasks', 'Inspection Frequency', 'Consumables Used', 'Hygiene Audit Score', 'Housekeeping Lead', 'Status', 'Date']
    },
    fileroom: {
        category: 'Physical File Room & Records Custody',
        reports: [
            { id: 'fileroom-inward-outward', name: 'Physical Document Issue & Retrieval Log', desc: 'Physical dossiers checked out by management, return tracking, and custody chains' },
            { id: 'fileroom-retention-schedule', name: 'Statutory Record Retention Tracker', desc: 'Archived files aging, mandatory retention years, and scheduled shredding' }
        ],
        sampleData: [
            { col1: 'Student Academic Dossiers', col2: '14 Files Issued to HOD', col3: '14 Returned Same Day', col4: 'Rack 3, Shelf B', col5: 'Custody Sign Complete', col6: 'Incharge: Lakshmi', status: 'Completed', date: '2026-10-30' },
            { col1: 'Staff Service Books (2020-2025)', col2: '8 Files Audited by HR', col3: 'Re-indexed into Vault', col4: 'Fireproof Cabinet 1', col5: '100% File Integrity', col6: 'Incharge: Lakshmi', status: 'Completed', date: '2026-10-29' }
        ],
        columns: ['Archive Series', 'Movement Volume', 'Custody Status', 'Location & Shelf', 'Audit Verification', 'Records Officer', 'Status', 'Date']
    },
    cctv: {
        category: 'CCTV Surveillance & Security Monitoring',
        reports: [
            { id: 'cctv-surveillance-coverage', name: 'Camera Online Uptime & Storage Days', desc: 'Live IP camera health, DVR storage capacity, and recording retention' },
            { id: 'cctv-teachers-late', name: 'Campus Morning Movement & Entry Timings', desc: 'Gate entry verification and staff reporting timeline audits' }
        ],
        sampleData: [
            { col1: 'Main Entrance & Perimeter Zone', col2: '16 4K IP Cameras', col3: '100% Online', col4: '60 Days DVR Storage', col5: 'Zero Blindspots', col6: 'Operator: Vinoth', status: 'Completed', date: '2026-10-30' },
            { col1: 'Academic Corridors & Sports Area', col2: '24 HD IP Cameras', col3: '100% Online', col4: '60 Days DVR Storage', col5: 'Night Vision Operational', col6: 'Operator: Vinoth', status: 'Completed', date: '2026-10-29' }
        ],
        columns: ['Surveillance Zone', 'Hardware Config', 'Live System Uptime', 'Storage Archive', 'Security Parameter', 'Control Desk Lead', 'Status', 'Date']
    },
    audit: {
        category: 'Governance, Audit & Institutional Quality',
        reports: [
            { id: 'audit-findings', name: 'Internal Audit Finding Closure & ATR Matrix', desc: 'High/Medium/Low observations, corrective actions taken, and overdue items' },
            { id: 'compliance-index', name: 'Departmental Compliance Scorecard', desc: 'Overall quality index, statutory compliance scores, and process audits' }
        ],
        sampleData: [
            { col1: 'Academics & Examination Cell', col2: 'Process Audit 2026', col3: '96.2% Index', col4: '2 Observations', col5: '2 Rectified (ATR Closed)', col6: 'Full Compliance', status: 'Completed', date: '2026-10-27' },
            { col1: 'Finance & Accounts', col2: 'Statutory Audit 2026', col3: '98.5% Index', col4: '0 Observations', col5: '0 Pending', col6: 'Certified', status: 'Completed', date: '2026-10-26' },
            { col1: 'Transport & Safety Logistics', col2: 'Safety Process Audit', col3: '94.0% Index', col4: '3 Observations', col5: '3 Rectified (First Aid Replenished)', col6: 'Verified by Auditor', status: 'Completed', date: '2026-10-24' }
        ],
        columns: ['Auditee Department', 'Audit Scope', 'Compliance Index', 'Obs Count', 'Corrective Action (ATR)', 'Auditor Recommendation', 'Status', 'Date']
    }
}

export default function UniversalReportsAnalyticsWorkspace({ roleOverride = null }) {
    const { role: authRole, name: authName } = useAuth()
    const activeRole = (roleOverride || authRole || 'admin').toLowerCase().replace(/[-_\s]/g, '')
    const roleLabel = getProfileLabel(roleOverride || authRole || 'admin')

    // Allowed suites based on RBAC role scoping
    const allowedSuiteKeys = useMemo(() => {
        // Executive Leadership can access all suites
        if (['superadmin', 'director', 'principal', 'jointdirector', 'admin', 'administrator'].includes(activeRole)) {
            return ['academic', 'administrative', 'financial', 'itsupport', 'maintenance', 'transport', 'stores', 'canteen', 'library', 'security', 'cctv', 'fileroom', 'housekeeping', 'audit']
        }
        // Teachers & Coordinators: Academic only
        if (['teacher', 'coordinator'].includes(activeRole)) {
            return ['academic']
        }
        // Finance / Account Head: Financial only
        if (['accounthead', 'account-head', 'finance'].includes(activeRole)) {
            return ['financial']
        }
        // IT Support: IT Support suite only
        if (['itsupportmanager', 'itsupport'].includes(activeRole)) {
            return ['itsupport']
        }
        // Maintenance: Maintenance suite only
        if (['maintenancemanager', 'maintenance'].includes(activeRole)) {
            return ['maintenance']
        }
        // Transport: Transport suite only
        if (['transportmanager', 'driver'].includes(activeRole)) {
            return ['transport']
        }
        // Stores: Stores suite only
        if (['stationerystoremanager', 'stores'].includes(activeRole)) {
            return ['stores']
        }
        // Canteen: Canteen suite only
        if (['canteenmanager', 'canteen'].includes(activeRole)) {
            return ['canteen']
        }
        // Library: Library suite only
        if (['librarian', 'library'].includes(activeRole)) {
            return ['library']
        }
        // Gatekeeper & Security: Security suite only
        if (['gatekeeper', 'gatekeepermanager', 'security'].includes(activeRole)) {
            return ['security']
        }
        // CCTV: CCTV suite only
        if (['cctv', 'cctvoperator'].includes(activeRole)) {
            return ['cctv']
        }
        // File Room: File Room suite only
        if (['fileroom', 'fileroommanager'].includes(activeRole)) {
            return ['fileroom']
        }
        // Housekeeping: Housekeeping suite only
        if (['housekeepingmanager', 'housekeeping'].includes(activeRole)) {
            return ['housekeeping']
        }
        // Governance & Audit: Audit only
        if (['jointdirectoraudit', 'processauditor', 'qualityauditor'].includes(activeRole)) {
            return ['audit']
        }
        // Administration & HR: Administrative only
        if (['hr', 'prm', 'frontoffice', 'jointdirectorassistant'].includes(activeRole)) {
            return ['administrative']
        }
        return ['academic', 'administrative', 'financial', 'itsupport', 'maintenance', 'transport', 'stores', 'canteen', 'library', 'security', 'cctv', 'fileroom', 'housekeeping', 'audit']
    }, [activeRole])

    // Determine default suite for role (clamped to allowedSuiteKeys)
    const initialSuiteKey = useMemo(() => {
        if (['teacher', 'coordinator'].includes(activeRole)) return 'academic'
        if (['accounthead', 'account-head', 'finance'].includes(activeRole)) return 'financial'
        if (['itsupportmanager', 'itsupport'].includes(activeRole)) return 'itsupport'
        if (['maintenancemanager', 'maintenance'].includes(activeRole)) return 'maintenance'
        if (['transportmanager', 'driver'].includes(activeRole)) return 'transport'
        if (['stationerystoremanager', 'stores'].includes(activeRole)) return 'stores'
        if (['canteenmanager', 'canteen'].includes(activeRole)) return 'canteen'
        if (['librarian', 'library'].includes(activeRole)) return 'library'
        if (['gatekeeper', 'gatekeepermanager', 'security'].includes(activeRole)) return 'security'
        if (['cctv', 'cctvoperator'].includes(activeRole)) return 'cctv'
        if (['fileroom', 'fileroommanager'].includes(activeRole)) return 'fileroom'
        if (['housekeepingmanager', 'housekeeping'].includes(activeRole)) return 'housekeeping'
        if (['jointdirectoraudit', 'processauditor', 'qualityauditor'].includes(activeRole)) return 'audit'
        if (['hr', 'prm', 'frontoffice', 'jointdirectorassistant'].includes(activeRole)) return 'administrative'
        return allowedSuiteKeys[0] || 'academic'
    }, [activeRole, allowedSuiteKeys])

    const [selectedSuiteKey, setSelectedSuiteKey] = useState(initialSuiteKey)

    // Sync selectedSuiteKey if allowedSuiteKeys changes or initial doesn't match
    useEffect(() => {
        if (!allowedSuiteKeys.includes(selectedSuiteKey)) {
            setSelectedSuiteKey(allowedSuiteKeys[0] || 'academic')
        }
    }, [allowedSuiteKeys, selectedSuiteKey])
    const [selectedReportId, setSelectedReportId] = useState(ROLE_REPORT_SUITES[initialSuiteKey]?.reports[0]?.id || '')
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFrom, setDateFrom] = useState('2026-09-01')
    const [dateTo, setDateTo] = useState('2026-10-31')
    const [statusFilter, setStatusFilter] = useState('All')

    const currentSuite = ROLE_REPORT_SUITES[selectedSuiteKey] || ROLE_REPORT_SUITES.administrative
    const activeReport = (currentSuite?.reports || []).find((r) => r && r.id === selectedReportId) || currentSuite?.reports?.[0] || { id: 'default', name: 'General Report', columns: [] }

    // Filtered data
    const filteredRows = useMemo(() => {
        return currentSuite.sampleData.filter((row) => {
            const matchesSearch =
                !searchQuery ||
                Object.values(row).some((val) => String(val).toLowerCase().includes(searchQuery.toLowerCase()))
            const matchesStatus = statusFilter === 'All' || row.status === statusFilter
            const matchesDate = (!dateFrom || row.date >= dateFrom) && (!dateTo || row.date <= dateTo)
            return matchesSearch && matchesStatus && matchesDate
        })
    }, [currentSuite, searchQuery, statusFilter, dateFrom, dateTo])

    const handleExportExcel = () => {
        if (!filteredRows.length) {
            toast.warn('No records match the current filters to export.')
            return
        }
        const headers = currentSuite.columns
        const escapeCsv = (val) => {
            let s = String(val ?? '')
            if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
            return `"${s.replace(/"/g, '""')}"`
        }
        const rows = filteredRows.map((row) => [
            row.col1,
            row.col2,
            row.col3,
            row.col4,
            row.col5,
            row.col6,
            row.status,
            row.date,
        ])
        const csvContent = [
            headers.map(escapeCsv).join(','),
            ...rows.map((r) => r.map(escapeCsv).join(',')),
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        const cleanName = (activeReport.name || 'report').toLowerCase().replace(/[^a-z0-9_-]/g, '_')
        const filename = `${cleanName}_${dateFrom}_${dateTo}.csv`
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success(`Exported "${activeReport.name}" to CSV (${filename})`)
    }

    const handlePrint = () => {
        if (!filteredRows.length) {
            toast.warn('No records to print for the selected filter range.')
            return
        }
        const tableHeadersHtml = currentSuite.columns
            .map(
                (c) =>
                    `<th style="border:1px solid #cbd5e1;padding:8px 12px;background:#f8fafc;text-align:left;font-size:12px;color:#1e293b;">${c}</th>`
            )
            .join('')
        const tableRowsHtml = filteredRows
            .map(
                (row) => `
            <tr>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.col1 ?? ''}</td>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.col2 ?? ''}</td>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.col3 ?? ''}</td>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.col4 ?? ''}</td>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.col5 ?? ''}</td>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.col6 ?? ''}</td>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.status ?? ''}</td>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.date ?? ''}</td>
            </tr>
        `
            )
            .join('')

        const printHtml = `
            <!doctype html>
            <html>
            <head>
                <title>${activeReport.name} - ${dateFrom} to ${dateTo}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; margin: 0; }
                    h1 { font-size: 20px; font-weight: 700; margin: 0 0 6px 0; color: #0f172a; }
                    p { font-size: 13px; color: #64748b; margin: 0 0 16px 0; }
                    .meta { display: flex; gap: 16px; margin-bottom: 20px; font-size: 12px; color: #475569; }
                    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                    @media print {
                        @page { margin: 15mm; }
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <h1>${activeReport.name}</h1>
                <p>${activeReport.desc || ''}</p>
                <div class="meta">
                    <span><strong>Role:</strong> ${roleLabel}</span>
                    <span><strong>Category:</strong> ${currentSuite.category}</span>
                    <span><strong>Date Range:</strong> ${dateFrom} to ${dateTo}</span>
                    <span><strong>Total Records:</strong> ${filteredRows.length}</span>
                </div>
                <table>
                    <thead><tr>${tableHeadersHtml}</tr></thead>
                    <tbody>${tableRowsHtml}</tbody>
                </table>
            </body>
            </html>
        `

        if (typeof window !== 'undefined') {
            const printWindow = window.open('', '_blank', 'width=900,height=700')
            if (printWindow) {
                printWindow.document.write(printHtml)
                printWindow.document.close()
                printWindow.focus()
                setTimeout(() => {
                    printWindow.print()
                }, 300)
            } else {
                window.print()
            }
        }
        toast.info(`Triggered print view for "${activeReport.name}"`)
    }

    const handleExportPDF = () => {
        toast.info(`Preparing "${activeReport.name}" for PDF print export...`)
        handlePrint()
    }

    return (
        <div className="space-y-6 font-inter pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
                        <BarChart3 size={26} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                                Institutional Reports & Analytics
                            </h1>
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
                                {roleLabel}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Role-governed intelligence reports, metric aggregations, and exportable operational audit dossiers.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
                    >
                        <Printer size={14} className="text-indigo-600" />
                        <span>Print</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleExportPDF}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
                    >
                        <Download size={14} className="text-rose-600" />
                        <span>Export PDF</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition cursor-pointer"
                    >
                        <Download size={14} />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Suite Category Switcher - Multi-Suite for Executives, Single Department Banner for Department Roles */}
            {allowedSuiteKeys.length > 1 ? (
                <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs sidebar-scroll-hide">
                    {allowedSuiteKeys.map((key) => {
                        const suite = ROLE_REPORT_SUITES[key]
                        if (!suite) return null
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    setSelectedSuiteKey(key)
                                    setSelectedReportId(suite.reports[0]?.id || '')
                                }}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    selectedSuiteKey === key
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                {key === 'academic' && <GraduationCap size={14} />}
                                {key === 'administrative' && <Building2 size={14} />}
                                {key === 'financial' && <DollarSign size={14} />}
                                {key === 'itsupport' && <Layers size={14} />}
                                {key === 'maintenance' && <Package size={14} />}
                                {key === 'transport' && <Truck size={14} />}
                                {key === 'stores' && <Package size={14} />}
                                {key === 'canteen' && <Users size={14} />}
                                {key === 'library' && <FileText size={14} />}
                                {key === 'security' && <Shield size={14} />}
                                {key === 'housekeeping' && <CheckCircle2 size={14} />}
                                {key === 'fileroom' && <FileText size={14} />}
                                {key === 'cctv' && <Shield size={14} />}
                                {key === 'audit' && <Shield size={14} />}
                                <span>{suite.category}</span>
                            </button>
                        )
                    })}
                </div>
            ) : (
                <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                            <Layers size={16} />
                        </span>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Authorized Department Dossier</span>
                            <h2 className="text-sm font-bold text-slate-900">{currentSuite.category}</h2>
                        </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        Department Scoped (Strict Privacy)
                    </span>
                </div>
            )}

            {/* Sub-report selector tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(currentSuite?.reports || []).map((rep) => {
                    const isSelected = rep.id === activeReport?.id
                    return (
                        <button
                            key={rep.id}
                            type="button"
                            onClick={() => setSelectedReportId(rep.id)}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                isSelected
                                    ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                                    : 'bg-white border-slate-200 hover:bg-slate-50/80 shadow-2xs'
                            }`}
                        >
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Report Module</span>
                            <h3 className={`text-xs font-bold mt-1 ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                                {rep.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                {rep.desc}
                            </p>
                        </button>
                    )
                })}
            </div>

            {/* Custom Date Range & Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search within report records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="font-semibold text-slate-400 uppercase text-[10px]">From:</span>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="font-semibold text-slate-400 uppercase text-[10px]">To:</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Completed">Completed</option>
                        <option value="Active">Active / In-progress</option>
                    </select>
                </div>

                <div className="text-xs text-slate-500 font-semibold shrink-0">
                    Showing <strong>{filteredRows.length}</strong> audited records
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">{activeReport.name}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{activeReport.desc}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Live Data Certified
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200/80 bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                                {currentSuite.columns.map((col, idx) => (
                                    <th key={idx} className="py-3 px-4">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={currentSuite.columns.length} className="py-8 text-center text-slate-400">
                                        No records found matching filters for this date window.
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3 px-4 font-bold text-slate-900">{row.col1}</td>
                                        <td className="py-3 px-4 font-medium text-slate-700">{row.col2}</td>
                                        <td className="py-3 px-4 font-semibold text-indigo-700">{row.col3}</td>
                                        <td className="py-3 px-4 font-semibold text-slate-800">{row.col4}</td>
                                        <td className="py-3 px-4 text-slate-600">{row.col5}</td>
                                        <td className="py-3 px-4 text-slate-700 font-medium">{row.col6}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                row.status === 'Completed'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-slate-400">{row.date}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
