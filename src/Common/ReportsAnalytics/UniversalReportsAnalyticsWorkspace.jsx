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
    Printer,
    Database,
    RotateCcw,
    FileSpreadsheet,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Activity,
    SlidersHorizontal
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'
import { exportDataset } from '../ui/exportUtils'
import {
    getMaterialRequisitions,
    getPurchaseOrders,
    getInventoryCatalog
} from '../StoresProcurement/storesProcurementData'
import {
    getAttendanceRecords,
    getLeaveRequests
} from '../AttendanceAndLeave/attendanceLeaveData'
import {
    FEE_TRANSACTIONS,
    CONCESSIONS_REGISTER
} from '../../Pages/AccountHead/FeesManagement/feesManagementData'
import EnterpriseBarChart from '../ui/EnterpriseBarChart'
import EnterpriseDonutChart from '../ui/EnterpriseDonutChart'
import EnterpriseTrendChart from '../ui/EnterpriseTrendChart'

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
            { col1: 'Grade 8 - Section A', col2: 'Social Studies', col3: 'Mid Term Test', col4: '76.8%', col5: '92.5% Pass', col6: 'Rank 1: Aditya Menon', status: 'Completed', date: '2026-10-15' },
            { col1: 'Grade 8 - Section B', col2: 'Mathematics', col3: 'Term 1 Exam', col4: '84.2%', col5: '98.0% Pass', col6: 'Rank 1: Maya Sundar', status: 'Completed', date: '2026-10-12' },
            { col1: 'Grade 7 - Section A', col2: 'Science', col3: 'Unit Test 2', col4: '81.5%', col5: '94.0% Pass', col6: 'Rank 1: Rahul Iyer', status: 'Completed', date: '2026-10-10' }
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
            { col1: 'Front Office & Admissions', col2: '8 Executives', col3: '100% Present', col4: '0 Leaves', col5: '18 New Enquiries', col6: 'Active Follow-up', status: 'Completed', date: '2026-10-29' },
            { col1: 'Finance & Accounts', col2: '12 Accounts Personnel', col3: '100% Present', col4: '0 Leaves', col5: 'Reconciliation on Track', col6: 'Audited by Lead', status: 'Completed', date: '2026-10-28' },
            { col1: 'Security & Campus Safety', col2: '18 Security Staff', col3: '94.4% Present', col4: '1 Leave', col5: 'Perimeter Secure', col6: 'Signed by Lead', status: 'Completed', date: '2026-10-27' }
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
            { col1: 'Science Lab Modernization', col2: '₹ 12,00,000 Allocated', col3: '₹ 11,45,000 Utilized', col4: '95.4% Spent', col5: '₹ 55,000 Surplus', col6: 'PO Processed', status: 'Completed', date: '2026-10-22' },
            { col1: 'Campus Wi-Fi Upgrade', col2: '₹ 4,50,000 Allocated', col3: '₹ 4,25,000 Utilized', col4: '94.4% Spent', col5: '₹ 25,000 Surplus', col6: 'Hardware Inwarded', status: 'Completed', date: '2026-10-18' },
            { col1: 'Sports Complex Maintenance', col2: '₹ 3,00,000 Allocated', col3: '₹ 2,90,000 Utilized', col4: '96.6% Spent', col5: '₹ 10,000 Surplus', col6: 'Court Relined', status: 'Completed', date: '2026-10-15' }
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
    },
    logistics: {
        category: 'Logistics, Transport & Stores Procurement',
        reports: [
            { id: 'fleet-dispatch-roster', name: 'Fleet Route Dispatch & Student Boarding Roster', desc: 'Daily bus trip completion, student check-in percentages, and transit telemetry' },
            { id: 'stores-stock-valuation', name: 'Central Stores Inventory Valuation & Stock Turnover', desc: 'SKU catalog valuation, minimum buffer thresholds, and monthly consumption' },
            { id: 'store-requisition-velocity', name: 'Store Requisition & Issue Turnaround Velocity', desc: 'Department indent fulfillment times, pending HOD sign-offs, and stockouts' },
            { id: 'vendor-grn-roster', name: 'Vendor Purchase Delivery & GRN Inspection Roster', desc: 'PO delivery timelines, accepted quantities, and damage return registers' }
        ],
        sampleData: [
            { col1: 'Route 14 (Madurai North)', col2: 'Bus TN-58-B-1001', col3: '38 Students Boarded', col4: '100% Trip Completed', col5: 'Driver: K. Murugan', col6: 'On-time (08:22 AM)', status: 'Completed', date: '2026-10-30' },
            { col1: 'A4 Copier Paper (75 GSM)', col2: 'Stock: 95 Reams', col3: 'Valuation: ₹ 27,075', col4: 'Reorder Level: 30', col5: 'Store: Central Rack A', col6: 'Buffer Healthy', status: 'Completed', date: '2026-10-30' },
            { col1: 'Senior Science Lab Requisition', col2: 'MR-2026-001', col3: '5 Reams Issued', col4: 'HOD Approved', col5: 'Requester: Ananya Roy', col6: 'Fulfilled Same Day', status: 'Completed', date: '2026-10-28' },
            { col1: 'Apex Educational Supplies (PO-01)', col2: 'PO ₹ 21,769', col3: 'GRN-2026-088 Inward', col4: 'Quality Certified', col5: 'AP Voucher Linked', col6: 'Store Mgr: Ramesh', status: 'Completed', date: '2026-10-26' }
        ],
        columns: ['Logistics Unit / Resource', 'Asset / Item Description', 'Operational Activity', 'Compliance Standard', 'Custodian / Driver', 'Verification Sign', 'Status', 'Date']
    }
}

export default function UniversalReportsAnalyticsWorkspace({ roleOverride = null }) {
    const { role: authRole, name: authName } = useAuth()
    const activeRole = (roleOverride || authRole || 'admin').toLowerCase().replace(/[-_\s]/g, '')
    const roleLabel = getProfileLabel(roleOverride || authRole || 'admin')

    // Allowed suites based on RBAC role scoping
    const allowedSuiteKeys = useMemo(() => {
        if (['superadmin', 'director', 'principal', 'jointdirector', 'admin', 'administrator'].includes(activeRole)) {
            return ['academic', 'administrative', 'financial', 'logistics', 'itsupport', 'maintenance', 'transport', 'stores', 'canteen', 'library', 'security', 'cctv', 'fileroom', 'housekeeping', 'audit']
        }
        if (['teacher', 'coordinator'].includes(activeRole)) {
            return ['academic']
        }
        if (['accounthead', 'account-head', 'finance', 'financial'].includes(activeRole)) {
            return ['financial']
        }
        if (['itsupportmanager', 'itsupport', 'itsupport-manager', 'it-support-manager'].includes(activeRole)) {
            return ['itsupport']
        }
        if (['maintenancemanager', 'maintenance', 'maintenance-manager'].includes(activeRole)) {
            return ['maintenance']
        }
        if (['transportmanager', 'driver', 'transport', 'transport-manager'].includes(activeRole)) {
            return ['transport']
        }
        if (['stationerystoremanager', 'stores', 'stationery-store-manager', 'stationerystore'].includes(activeRole)) {
            return ['stores']
        }
        if (['canteenmanager', 'canteen', 'canteen-manager'].includes(activeRole)) {
            return ['canteen']
        }
        if (['librarian', 'library'].includes(activeRole)) {
            return ['library']
        }
        if (['gatekeeper', 'gatekeepermanager', 'security', 'gate-keeper', 'gate-keeper-manager'].includes(activeRole)) {
            return ['security']
        }
        if (['cctv', 'cctvoperator', 'cctv-operator'].includes(activeRole)) {
            return ['cctv']
        }
        if (['fileroom', 'fileroommanager', 'file-room', 'file-room-manager'].includes(activeRole)) {
            return ['fileroom']
        }
        if (['housekeepingmanager', 'housekeeping', 'housekeeping-manager'].includes(activeRole)) {
            return ['housekeeping']
        }
        if (['jointdirectoraudit', 'processauditor', 'qualityauditor', 'audit', 'joint-director-audit', 'process-auditor', 'quality-auditor'].includes(activeRole)) {
            return ['audit']
        }
        if (['hr', 'prm', 'frontoffice', 'jointdirectorassistant', 'administrative'].includes(activeRole)) {
            return ['administrative']
        }
        return ['academic', 'administrative', 'financial', 'itsupport', 'maintenance', 'transport', 'stores', 'canteen', 'library', 'security', 'cctv', 'fileroom', 'housekeeping', 'audit']
    }, [activeRole])

    const initialSuiteKey = useMemo(() => {
        if (['teacher', 'coordinator'].includes(activeRole)) return 'academic'
        if (['accounthead', 'account-head', 'finance', 'financial'].includes(activeRole)) return 'financial'
        if (['itsupportmanager', 'itsupport', 'itsupport-manager', 'it-support-manager'].includes(activeRole)) return 'itsupport'
        if (['maintenancemanager', 'maintenance', 'maintenance-manager'].includes(activeRole)) return 'maintenance'
        if (['transportmanager', 'driver', 'transport', 'transport-manager'].includes(activeRole)) return 'transport'
        if (['stationerystoremanager', 'stores', 'stationery-store-manager', 'stationerystore'].includes(activeRole)) return 'stores'
        if (['canteenmanager', 'canteen', 'canteen-manager'].includes(activeRole)) return 'canteen'
        if (['librarian', 'library'].includes(activeRole)) return 'library'
        if (['gatekeeper', 'gatekeepermanager', 'security', 'gate-keeper', 'gate-keeper-manager'].includes(activeRole)) return 'security'
        if (['cctv', 'cctvoperator', 'cctv-operator'].includes(activeRole)) return 'cctv'
        if (['fileroom', 'fileroommanager', 'file-room', 'file-room-manager'].includes(activeRole)) return 'fileroom'
        if (['housekeepingmanager', 'housekeeping', 'housekeeping-manager'].includes(activeRole)) return 'housekeeping'
        if (['jointdirectoraudit', 'processauditor', 'qualityauditor', 'audit', 'joint-director-audit', 'process-auditor', 'quality-auditor'].includes(activeRole)) return 'audit'
        if (['hr', 'prm', 'frontoffice', 'jointdirectorassistant', 'administrative'].includes(activeRole)) return 'administrative'
        return allowedSuiteKeys[0] || 'academic'
    }, [activeRole, allowedSuiteKeys])

    const [selectedSuiteKey, setSelectedSuiteKey] = useState(initialSuiteKey)

    useEffect(() => {
        if (!allowedSuiteKeys.includes(selectedSuiteKey)) {
            setSelectedSuiteKey(allowedSuiteKeys[0] || 'academic')
        }
    }, [allowedSuiteKeys, selectedSuiteKey])

    const [selectedReportId, setSelectedReportId] = useState(ROLE_REPORT_SUITES[initialSuiteKey]?.reports[0]?.id || '')
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [showExportMenu, setShowExportMenu] = useState(false)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const currentSuite = ROLE_REPORT_SUITES[selectedSuiteKey] || ROLE_REPORT_SUITES.administrative
    const activeReport = (currentSuite?.reports || []).find((r) => r && r.id === selectedReportId) || currentSuite?.reports?.[0] || { id: 'default', name: 'General Report', columns: [] }

    // Dynamic Live Data Enrichment from Operational Services
    const activeSuiteRows = useMemo(() => {
        try {
            if (selectedSuiteKey === 'logistics' || selectedSuiteKey === 'stores') {
                if (selectedReportId === 'stores-stock-valuation' || selectedReportId === 'stores-inventory-valuation') {
                    const catalog = getInventoryCatalog()
                    if (catalog && catalog.length > 0) {
                        return catalog.map((item, idx) => ({
                            col1: item.name || `Inventory Item ${idx + 1}`,
                            col2: item.sku || item.id || `SKU-${idx + 101}`,
                            col3: `${item.currentStock ?? item.stock ?? 0} ${item.unit || 'Units'}`,
                            col4: `₹ ${Number(item.unitPrice || item.price || 0).toLocaleString('en-IN')}`,
                            col5: `₹ ${(Number(item.currentStock ?? item.stock ?? 0) * Number(item.unitPrice || item.price || 0)).toLocaleString('en-IN')} Total`,
                            col6: (item.currentStock ?? item.stock ?? 0) > (item.minStock || 10) ? 'Central Stores Rack' : 'Below Safety Buffer',
                            status: (item.currentStock ?? item.stock ?? 0) > (item.minStock || 10) ? 'Completed' : 'Active',
                            date: item.updatedAt ? item.updatedAt.split('T')[0] : '2026-10-30',
                            isLive: true
                        }))
                    }
                } else if (selectedReportId === 'store-requisition-velocity' || selectedReportId === 'stores-indent-fulfillment') {
                    const reqs = getMaterialRequisitions()
                    if (reqs && reqs.length > 0) {
                        return reqs.map((req) => ({
                            col1: req.department || 'Academic Department',
                            col2: req.id,
                            col3: `${(req.items || []).length || 1} Item(s) Requested`,
                            col4: req.urgency || 'Standard Priority',
                            col5: `Requester: ${req.requestedBy || 'Staff'}`,
                            col6: req.status === 'Approved' ? 'HOD Approved' : req.status === 'Issued' ? 'Store Issued' : 'Under Review',
                            status: ['Issued', 'Collected', 'Completed'].includes(req.status) ? 'Completed' : 'Active',
                            date: req.createdAt ? req.createdAt.split('T')[0] : '2026-10-28',
                            isLive: true
                        }))
                    }
                } else if (selectedReportId === 'vendor-grn-roster') {
                    const pos = getPurchaseOrders()
                    if (pos && pos.length > 0) {
                        return pos.map((po) => ({
                            col1: `${po.vendorName || 'Procurement Vendor'} (${po.id})`,
                            col2: `PO ₹ ${Number(po.totalAmount || 0).toLocaleString('en-IN')}`,
                            col3: po.grnNumber ? `${po.grnNumber} Inward` : 'Pending Delivery GRN',
                            col4: po.qualityInspection || 'Quality Certified',
                            col5: po.financeLiabilityLinked ? 'AP Voucher Linked' : 'Pending Invoice Sync',
                            col6: `Approver: ${po.approvedBy || 'Finance Head'}`,
                            status: ['Delivered', 'Completed', 'Approved'].includes(po.status) ? 'Completed' : 'Active',
                            date: po.createdAt ? po.createdAt.split('T')[0] : '2026-10-26',
                            isLive: true
                        }))
                    }
                }
            } else if (selectedSuiteKey === 'administrative' && selectedReportId === 'staff-attendance') {
                const attRecords = getAttendanceRecords()
                if (attRecords && attRecords.length > 0) {
                    const deptMap = {}
                    attRecords.forEach((r) => {
                        const dept = r.department || 'General Administration'
                        if (!deptMap[dept]) {
                            deptMap[dept] = { total: 0, present: 0, leaves: 0 }
                        }
                        deptMap[dept].total += 1
                        if (r.status === 'Present') deptMap[dept].present += 1
                        if (r.status === 'Leave' || r.status === 'Half-Day') deptMap[dept].leaves += 1
                    })
                    const deptRows = Object.entries(deptMap).map(([dept, stats]) => {
                        const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 100
                        return {
                            col1: dept,
                            col2: `${stats.total} Staff Members`,
                            col3: `${rate}% Present`,
                            col4: `${stats.leaves} Approved Leaves`,
                            col5: stats.leaves === 0 ? 'Full Staffing' : 'Duty Reassigned',
                            col6: 'Biometric Verified',
                            status: 'Completed',
                            date: '2026-10-30',
                            isLive: true
                        }
                    })
                    if (deptRows.length > 0) return deptRows
                }
            } else if (selectedSuiteKey === 'financial') {
                if (selectedReportId === 'fee-collections' && FEE_TRANSACTIONS && FEE_TRANSACTIONS.length > 0) {
                    return FEE_TRANSACTIONS.map((tx) => ({
                        col1: `${tx.studentName || 'Student'} (${tx.grade || 'Tuition'})`,
                        col2: `₹ ${Number(tx.amount || 0).toLocaleString('en-IN')} Received`,
                        col3: tx.paymentMode || 'Online Banking',
                        col4: tx.receiptNo || 'RCP-LIVE',
                        col5: tx.academicYear || '2026-2027',
                        col6: `Cashier: ${tx.collectedBy || 'Finance Desk'}`,
                        status: tx.status === 'Paid' || tx.status === 'Successful' ? 'Completed' : 'Active',
                        date: tx.date || '2026-10-30',
                        isLive: true
                    }))
                } else if (selectedReportId === 'concessions-audit' && CONCESSIONS_REGISTER && CONCESSIONS_REGISTER.length > 0) {
                    return CONCESSIONS_REGISTER.map((c) => ({
                        col1: `${c.studentName || 'Student'} (${c.grade || ''})`,
                        col2: c.category || 'Scholarship',
                        col3: `₹ ${Number(c.amount || 0).toLocaleString('en-IN')} Concession`,
                        col4: c.percentage ? `${c.percentage}% Waiver` : 'Fixed Waiver',
                        col5: `Sanctioned by: ${c.approvedBy || 'Director'}`,
                        col6: c.referenceDoc || 'Audit Proof Attached',
                        status: c.status === 'Approved' ? 'Completed' : 'Active',
                        date: c.date || '2026-10-25',
                        isLive: true
                    }))
                }
            }
        } catch (err) {
            console.warn('Error computing live report data:', err)
        }
        return currentSuite.sampleData || []
    }, [selectedSuiteKey, selectedReportId, currentSuite])

    const isLiveDataActive = useMemo(() => {
        return activeSuiteRows.some((r) => r.isLive)
    }, [activeSuiteRows])

    // Filtered data
    const filteredRows = useMemo(() => {
        return activeSuiteRows.filter((row) => {
            const matchesSearch =
                !searchQuery ||
                Object.values(row).some((val) => String(val).toLowerCase().includes(searchQuery.toLowerCase()))
            const matchesStatus = statusFilter === 'All' || row.status === statusFilter
            const matchesDate = (!dateFrom || !row.date || row.date >= dateFrom) && (!dateTo || !row.date || row.date <= dateTo)
            return matchesSearch && matchesStatus && matchesDate
        })
    }, [activeSuiteRows, searchQuery, statusFilter, dateFrom, dateTo])

    // Pagination calculations
    const totalRecords = filteredRows.length
    const totalPages = Math.ceil(totalRecords / pageSize) || 1
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filteredRows.slice(start, start + pageSize)
    }, [filteredRows, currentPage, pageSize])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, statusFilter, dateFrom, dateTo, selectedReportId, selectedSuiteKey, pageSize])

    const handleResetFilters = () => {
        setSearchQuery('')
        setDateFrom('')
        setDateTo('')
        setStatusFilter('All')
        setCurrentPage(1)
        toast.info('Report filters reset to default view.')
    }

    // Chart Data calculations
    const categoryBarData = useMemo(() => {
        const counts = {}
        filteredRows.forEach((r) => {
            const label = String(r.col1 || 'Item').split('-')[0].trim()
            counts[label] = (counts[label] || 0) + 1
        })
        const categories = Object.keys(counts).slice(0, 6)
        const data = categories.map((c) => counts[c])
        return { categories, data }
    }, [filteredRows])

    const statusDonutData = useMemo(() => {
        const completed = filteredRows.filter((r) => r.status === 'Completed').length
        const active = filteredRows.filter((r) => r.status === 'Active').length
        return [
            { name: 'Completed & Certified', value: completed, color: '#10B981' },
            { name: 'Active / In Execution', value: active, color: '#3B82F6' }
        ]
    }, [filteredRows])

    const trendData = useMemo(() => {
        return {
            'Report Inflows': {
                current: [12, 18, 16, 24, 28, 32, 29],
                previous: [8, 14, 12, 19, 22, 25, 27]
            },
            'Audit Velocity': {
                current: [94, 96, 95, 98, 97, 99, 98],
                previous: [88, 91, 90, 93, 94, 95, 95]
            },
            'Execution Health': {
                current: [100, 98, 99, 100, 99, 100, 100],
                previous: [95, 96, 94, 97, 98, 98, 98]
            }
        }
    }, [])

    const exportColumns = useMemo(() => {
        return (currentSuite?.columns || []).map((colName, index) => {
            let key = `col${index + 1}`
            if (index === currentSuite.columns.length - 2) key = 'status'
            if (index === currentSuite.columns.length - 1) key = 'date'
            return { key, header: colName }
        })
    }, [currentSuite])

    const handleExport = (format) => {
        setShowExportMenu(false)
        if (!filteredRows.length) {
            toast.warn('No records match current filters to export.')
            return
        }

        exportDataset({
            data: filteredRows,
            columns: exportColumns,
            format,
            filename: `${activeReport.id}_report_${new Date().toISOString().split('T')[0]}`,
            title: activeReport.name,
            subtitle: `${currentSuite.category} - ${activeReport.desc || ''}`,
            metadata: {
                'Audited Category': currentSuite.category,
                'Generated By Role': roleLabel,
                'Filter Date From': dateFrom || 'All Records',
                'Filter Date To': dateTo || 'Present',
                'Total Audited Records': String(filteredRows.length),
                'Export Timestamp': new Date().toLocaleString('en-GB')
            }
        })
        toast.success(`Exporting ${filteredRows.length} records as ${format.toUpperCase()}...`)
    }

    const handleExportPDF = () => handleExport('pdf')
    const handleExportExcel = () => handleExport('xlsx')
    const handleExportCSV = () => handleExport('csv')

    // KPI Metrics
    const completedCount = filteredRows.filter((r) => r.status === 'Completed').length
    const activeCount = filteredRows.filter((r) => r.status === 'Active').length
    const completionRate = filteredRows.length > 0 ? Math.round((completedCount / filteredRows.length) * 100) : 100

    return (
        <div className="space-y-6 font-inter pb-8 p-4 md:p-6 bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 md:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                                Institutional Reports & Analytics
                            </h1>
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
                                {roleLabel} • Executive Intelligence
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Role-governed operational analytics, live telemetry metrics, and multi-format exportable dossiers.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Export Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                        >
                            <Download size={14} className="text-emerald-600" />
                            <span>Export Dossier</span>
                            <ChevronDown size={13} className="text-slate-400" />
                        </button>

                        {showExportMenu && (
                            <div className="absolute right-0 mt-1 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-30 space-y-1 text-xs">
                                <button
                                    type="button"
                                    onClick={() => handleExport('xlsx')}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition text-left"
                                >
                                    <FileSpreadsheet size={15} className="text-emerald-600" />
                                    <span>Excel Workbook (.xlsx)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleExport('csv')}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition text-left"
                                >
                                    <FileText size={15} className="text-blue-600" />
                                    <span>CSV Spreadsheet (.csv)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleExport('pdf')}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition text-left"
                                >
                                    <Printer size={15} className="text-rose-600" />
                                    <span>Printable PDF Dossier</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => toast.info('Refreshed real-time analytics data cache.')}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                    >
                        <RefreshCw size={14} className="text-blue-600" />
                        <span>Sync Live Data</span>
                    </button>
                </div>
            </div>

            {/* Role-Governed KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[1.25rem] border border-blue-100 bg-[#E8F1FD]/70 p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">Tracked Records</span>
                        <Database size={16} className="text-blue-600" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">{filteredRows.length}</span>
                        <span className="text-[11px] font-medium text-blue-700">Audited Items</span>
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Filtered within date window</div>
                </div>

                <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50/50 p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">Completed & Certified</span>
                        <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-emerald-700">{completedCount}</span>
                        <span className="text-[11px] font-medium text-emerald-800">Verified Units</span>
                    </div>
                    <div className="mt-1 text-[10px] text-emerald-700">{completionRate}% Completion Rate</div>
                </div>

                <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50/50 p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">Active in Pipeline</span>
                        <Clock size={16} className="text-amber-600" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-amber-700">{activeCount}</span>
                        <span className="text-[11px] font-medium text-amber-800">In Execution</span>
                    </div>
                    <div className="mt-1 text-[10px] text-amber-700">Awaiting closing reconciliation</div>
                </div>

                <div className="rounded-[1.25rem] border border-indigo-100 bg-indigo-50/50 p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">Live Data Pipeline</span>
                        <Activity size={16} className="text-indigo-600" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-indigo-700">Connected</span>
                        {isLiveDataActive && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                    </div>
                    <div className="mt-1 text-[10px] text-indigo-700">
                        {isLiveDataActive ? 'Live Operational Records Active' : 'Statutory Standard Roster'}
                    </div>
                </div>
            </div>

            {/* Suite Category Switcher */}
            {allowedSuiteKeys.length > 1 ? (
                <div className="flex items-center gap-2 overflow-x-auto bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs scrollbar-none">
                    {allowedSuiteKeys.map((key) => {
                        const suite = ROLE_REPORT_SUITES[key]
                        if (!suite) return null
                        const isSelected = selectedSuiteKey === key
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    setSelectedSuiteKey(key)
                                    setSelectedReportId(suite.reports[0]?.id || '')
                                }}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                    isSelected
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
                <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-2xs">
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
                            className={`p-4 rounded-2xl border text-left transition ${
                                isSelected
                                    ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                                    : 'bg-white border-slate-200/80 hover:bg-slate-50/80 shadow-2xs'
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

            {/* Interactive Visualizations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <EnterpriseTrendChart
                        tabs={['Report Inflows', 'Audit Velocity', 'Execution Health']}
                        dataByTab={trendData}
                        categories={['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Current']}
                        height={260}
                        onPointClick={(name) => {
                            toast.info(`Viewing trend point telemetry for: ${name}`)
                        }}
                    />
                </div>

                <div>
                    <EnterpriseDonutChart
                        title="Delivery Status Composition"
                        data={statusDonutData}
                        height={260}
                        onSliceClick={(name) => {
                            if (name.includes('Completed')) {
                                setStatusFilter('Completed')
                            } else {
                                setStatusFilter('Active')
                            }
                            toast.info(`Filtered table by status: ${name}`)
                        }}
                    />
                </div>
            </div>

            {/* Multi-Facet Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search within report records (item, batch, status, auditor)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                        <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
                            Showing {filteredRows.length} records
                        </span>
                        {(searchQuery || dateFrom || dateTo || statusFilter !== 'All') && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 text-xs font-semibold transition"
                            >
                                <RotateCcw size={12} /> Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-2.5 py-1 text-xs text-slate-800 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date To</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-2.5 py-1 text-xs text-slate-800 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status Filter</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 bg-white"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Completed">Completed / Reconciled</option>
                            <option value="Active">Active / In-progress</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Rows Per Page</label>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 bg-white"
                        >
                            <option value={10}>10 records</option>
                            <option value={25}>25 records</option>
                            <option value={50}>50 records</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">{activeReport.name}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{activeReport.desc}</p>
                    </div>
                    {isLiveDataActive ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Operational Records ({filteredRows.length})
                        </span>
                    ) : (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                            Institutional Standard Roster
                        </span>
                    )}
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
                            {paginatedRows.length === 0 ? (
                                <tr>
                                    <td colSpan={currentSuite.columns.length} className="py-10 text-center text-slate-400">
                                        <div className="max-w-xs mx-auto space-y-2">
                                            <FileText size={28} className="mx-auto text-slate-300" />
                                            <p className="font-semibold text-slate-600">No records found matching filters</p>
                                            <p className="text-[11px] text-slate-400">Try broadening your search query or clearing the date window.</p>
                                            <button
                                                type="button"
                                                onClick={handleResetFilters}
                                                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                                            >
                                                <RotateCcw size={12} /> Reset Filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3 px-4 font-bold text-slate-900">{row.col1}</td>
                                        <td className="py-3 px-4 font-medium text-slate-700">{row.col2}</td>
                                        <td className="py-3 px-4 font-semibold text-indigo-700">{row.col3}</td>
                                        <td className="py-3 px-4 font-semibold text-slate-800">{row.col4}</td>
                                        <td className="py-3 px-4 text-slate-600">{row.col5}</td>
                                        <td className="py-3 px-4 text-slate-700 font-medium">{row.col6}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                row.status === 'Completed'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">{row.date}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600">
                        <div>
                            Showing <span className="font-bold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                            <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, totalRecords)}</span> of{' '}
                            <span className="font-bold text-slate-800">{totalRecords}</span> entries
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(1)}
                                className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="First Page"
                            >
                                <ChevronsLeft size={14} />
                            </button>
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                                className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Previous Page"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="px-3 py-1 font-semibold text-slate-800">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                                className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Next Page"
                            >
                                <ChevronRight size={14} />
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Last Page"
                            >
                                <ChevronsRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
