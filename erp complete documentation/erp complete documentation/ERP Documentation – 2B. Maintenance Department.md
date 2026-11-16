# ERP Documentation – 2B. Maintenance Department

## 1. Department Overview & Governance Alignment

In accordance with institutional Standard Operating Procedures (**ERP Documentation – 2. Non-Academics Department**):

> *"Housekeeping and Maintenance are separate departments, each with its own duty allotment, schedule and checklist."*
>
> *"Hierarchy: MD → Joint Director (Operations) → Joint Director Assistant → Department Heads (Store Officer, Transport Manager, IT Head, Housekeeping Head, Maintenance Head, Camera Room In-charge, File Room In-charge) → Staff"*

The **Maintenance Department** oversees the continuous reliability, preventive servicing, regulatory compliance, and emergency restoration of all physical campus infrastructure, electro-mechanical systems, life safety assets, and civil installations.

---

## 2. Role Definition: Maintenance Manager (`maintenancemanager`)

- **Role Identifier**: `ROLES.MAINTENANCE_MANAGER` (`'maintenancemanager'`)
- **Default Profile**: Gopalakrishnan R (`EMP-MNT-001`)
- **Reporting Line**: Reports to **Joint Director (Operations)** / **Joint Director Assistant**
- **Direct Reports**: Campus Electricians, Plumbers & Pump Operators, HVAC Technicians, Civil & Carpenters, DG Plant Operators
- **Default Dashboard**: `/maintenance-manager/dashboard`
- **Demo Credentials**: `maintenancemanager@school.com` / `School@123`

---

## 3. Department Functional Modules & Navigation Architecture

| Navigation Item | Route | Purpose & Key Workflows |
|---|---|---|
| **Dashboard** | `/maintenance-manager/dashboard` | Active work orders, preventive checklists due, DG fuel telemetry, open helpdesk tickets, technicians on duty, and critical spares alerts. |
| **Attendance & Leave Management** | `/maintenance-manager/attendance-and-leave` | Departmental biometric logs, leave requests approval for maintenance staff, and attendance tracking. |
| **Task Management** | `/maintenance-manager/task-management` | Assignment, tracking, and evidence submission for planned and ad-hoc engineering tasks. |
| **Campus Maintenance & Work Orders** | `/maintenance-manager/campus-maintenance` | Detailed work order dispatch (Electrical EB, Civil & Plumbing, DG GenSet, HVAC) and Diesel Generator runtime/fuel logging. |
| **Building Maintenance Register** | `/maintenance-manager/building-maintenance` | Physical infrastructure repairs log by building block, category (Wire, Light, Civil), and expenditure. |
| **Spares & Equipment Inventory** | `/maintenance-manager/inventory` | Catalog of electrical spares, contactors, LED panels, pump valves, refrigerant cylinders, engine oil, and diagnostic tools. |
| **Requests & Approvals** | `/maintenance-manager/requests-approvals` | Requisitions for spares, capital equipment, and vendor AMC renewals progressing through Joint Director Operations and Finance. |
| **Duty Allotment** | `/maintenance-manager/duty-allotment` | Daily shift and zone allotments for trade specialists (Electrician, Plumber, HVAC, Civil, DG Operator). |
| **Preventive Maintenance Schedules** | `/maintenance-manager/schedules` | Recurring schedules across daily, weekly, monthly, and quarterly cadences (Substation, DG, Elevators, Fire Hydrant, RO Water). |
| **Equipment & Safety Inspections** | `/maintenance-manager/equipment-inspections` | Periodic technical inspections and safety certification for critical assets (DG Sets, Transformers, Lifts, Fire Pumps, Precision ACs). |
| **Star of the Month** | `/maintenance-manager/star-of-the-month` | Non-academic staff excellence rating and recognition for technicians and ground crew. |
| **Reports & Metrics** | `/maintenance-manager/reports` | Work order turnaround, preventive maintenance compliance %, DG running logs, and critical spares shortage reports. |
| **Announcement** | `/maintenance-manager/broadcast` | Broadcast institutional advisories (power cuts, tank cleanings, maintenance shutdowns). |
| **Spares Requirement** | `/maintenance-manager/inventory-requirement` | Indents forwarded to the Central Stationery & Stores department. |
| **Purchase Workflow** | `/maintenance-manager/purchase-workflow` | Multi-vendor quotation, purchase order tracking, and delivery confirmations. |
| **Request Product from Store** | `/maintenance-manager/stores-procurement` | Direct store withdrawals for consumables (tape, fuses, washers, lubricants). |
| **Department Helpdesk** | `/maintenance-manager/department-ticketing` | Resolve inter-departmental maintenance and electrical tickets raised by teachers, coordinators, and staff. |
| **Physical File Room** | `/maintenance-manager/file-room` | Access engineering drawings, building plans, statutory NOCs, and AMC contract files. |
| **Lost & Found** | `/maintenance-manager/lost-and-found` | Campus-wide lost and found item logging and claim tracking. |
| **Audit Observations** | `/maintenance-manager/audit-observations` | Review and respond to safety, electrical, and infrastructure findings raised by Process/Quality Auditors. |
| **Staff Relieving & NOC** | `/maintenance-manager/relieving-request` | Departmental NOC clearance for departing engineering and technical staff. |
| **Report Issue / Escalation** | `/maintenance-manager/escalation-management` | Escalate critical infrastructure risks or supply bottlenecks to Joint Director / Managing Director. |

---

## 4. Key Differences: Housekeeping vs Maintenance

| Dimension | Housekeeping Department | Maintenance Department |
|---|---|---|
| **Primary Focus** | Hygiene, sanitation, waste disposal, floor cleaning, restroom potability, pest control. | Physical campus assets, electrical grid, DG generators, water pumps, HVAC, civil structures. |
| **Head of Dept** | Housekeeping Manager (`housekeepingmanager`) | Maintenance Manager (`maintenancemanager`) |
| **Staff Profile** | Janitors, sweepers, sanitarians, deep cleaning crew. | Certified electricians, plumbers, HVAC technicians, carpenters, DG operators. |
| **Key Equipment** | Scrubber dryers, wet/dry vacuums, mops, chemical dispensers, waste trolleys. | Power transformers, 250kVA DG sets, booster pumps, multimeters, refrigerant manifolds, elevators. |
| **Key Regulatory Checks** | IS 10500 Drinking Water potability, disinfection logs. | CEA electrical safety inspections, lift fitness certificates, fire hydrant pressure tests, DG emission checks. |

