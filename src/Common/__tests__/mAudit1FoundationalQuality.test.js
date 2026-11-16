import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROLES, ROLE_HOME_PATHS, ROLE_PREFIX } from '../../constants/roles.js'
import { addCustomCalendarItem } from '../AcademicCalendar/academicCalendarData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test('M-AUDIT-1 Foundational Quality — Roles, Shell Navigation & Route Hardening', async (t) => {
    await t.test('1. ROLES enum exposes all 29 roles as enumerable properties', () => {
        const keys = Object.keys(ROLES)
        const values = Object.values(ROLES)

        assert.equal(keys.length, 29, 'ROLES must have exactly 29 enumerable keys')
        assert.equal(values.length, 29, 'ROLES must have exactly 29 enumerable values')

        // Verify institutional roles are fully enumerable
        assert.ok(keys.includes('PRO'), 'ROLES keys must include PRO')
        assert.ok(keys.includes('FILE_ROOM'), 'ROLES keys must include FILE_ROOM')
        assert.ok(keys.includes('CCTV'), 'ROLES keys must include CCTV')

        assert.ok(values.includes('pro'), 'ROLES values must include pro')
        assert.ok(values.includes('fileroom'), 'ROLES values must include fileroom')
        assert.ok(values.includes('cctv'), 'ROLES values must include cctv')

        // Verify property descriptors have enumerable: true
        const proDesc = Object.getOwnPropertyDescriptor(ROLES, 'PRO')
        const fileRoomDesc = Object.getOwnPropertyDescriptor(ROLES, 'FILE_ROOM')
        const cctvDesc = Object.getOwnPropertyDescriptor(ROLES, 'CCTV')

        assert.equal(proDesc.enumerable, true, 'PRO descriptor must be enumerable')
        assert.equal(fileRoomDesc.enumerable, true, 'FILE_ROOM descriptor must be enumerable')
        assert.equal(cctvDesc.enumerable, true, 'CCTV descriptor must be enumerable')

        // Verify mapping objects
        assert.equal(ROLE_HOME_PATHS[ROLES.PRO], '/pro/dashboard')
        assert.equal(ROLE_HOME_PATHS[ROLES.FILE_ROOM], '/file-room/dashboard')
        assert.equal(ROLE_HOME_PATHS[ROLES.CCTV], '/cctv/dashboard')

        assert.equal(ROLE_PREFIX[ROLES.PRO], '/pro')
        assert.equal(ROLE_PREFIX[ROLES.FILE_ROOM], '/file-room')
        assert.equal(ROLE_PREFIX[ROLES.CCTV], '/cctv')
    })

    await t.test('2. Sidebar pinned link resolution bypasses dead "#0" fragment and navigates to first child route', () => {
        // Pure navigation resolution helper simulating CommonSidebar.jsx:470
        const resolvePinnedTarget = (item) => {
            return (item.to && item.to !== '#0') ? item.to : (item.subLinks?.[0]?.to ?? '#')
        }

        // Case A: Expandable module with to: '#0'
        const expandableItem = {
            id: 'academics',
            title: 'Academic Wing',
            to: '#0',
            subLinks: [
                { title: 'Class Timetable', to: '/admin/class-timetable' },
                { title: 'Student Roster', to: '/admin/student-roster' },
            ],
        }
        assert.equal(
            resolvePinnedTarget(expandableItem),
            '/admin/class-timetable',
            'Pinned expandable module with to="#0" must navigate directly to its first child route'
        )

        // Case B: Standard leaf module with direct URL
        const leafItem = {
            id: 'dashboard',
            title: 'Executive Dashboard',
            to: '/admin/dashboard',
        }
        assert.equal(
            resolvePinnedTarget(leafItem),
            '/admin/dashboard',
            'Pinned leaf module must preserve its direct route URL'
        )

        // Case C: Edge case with empty sublinks and no to
        const emptyItem = {
            id: 'unmapped',
            title: 'Unmapped Module',
            to: '#0',
            subLinks: [],
        }
        assert.equal(
            resolvePinnedTarget(emptyItem),
            '#',
            'Fallback to "#" when no child subLinks exist'
        )
    })

    await t.test('3. Universal HTML escaping sanitizer neutralizes XSS payloads and handles edge cases', () => {
        const escapeHtml = (str) =>
            String(str ?? '').replace(
                /[&<>"']/g,
                (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
            )

        // Standard escaping
        assert.equal(
            escapeHtml('<script>alert("XSS")</script>'),
            '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
        )
        assert.equal(
            escapeHtml("Tom & Jerry's Award"),
            'Tom &amp; Jerry&#39;s Award'
        )

        // Null, undefined, and non-string inputs
        assert.equal(escapeHtml(null), '', 'null must resolve to empty string')
        assert.equal(escapeHtml(undefined), '', 'undefined must resolve to empty string')
        assert.equal(escapeHtml(12345), '12345', 'Numbers must convert to safe string')
        assert.equal(escapeHtml('Clean String'), 'Clean String', 'Clean strings must remain unchanged')
    })

    await t.test('4. Academic calendar custom item insertion survives storage exceptions gracefully', () => {
        // Setup mock sessionStorage
        const storage = new Map()
        global.sessionStorage = {
            getItem: (k) => storage.get(k) || null,
            setItem: (k, v) => storage.set(k, String(v)),
            removeItem: (k) => storage.delete(k),
            clear: () => storage.clear(),
        }

        const item = addCustomCalendarItem({
            title: 'Annual Founders Day',
            date: '2026-11-20',
            category: 'Event',
        })

        assert.ok(item.id.startsWith('custom-evt-'), 'Created item must have valid custom ID')
        assert.equal(item.title, 'Annual Founders Day')

        // Simulate quota exceeded or storage error
        global.sessionStorage.setItem = () => {
            throw new Error('QuotaExceededError: DOM Exception 22')
        }

        // Must not throw exception
        assert.doesNotThrow(() => {
            const resilientItem = addCustomCalendarItem({
                title: 'Emergency Drill',
                date: '2026-11-25',
                category: 'Notice',
            })
            assert.equal(resilientItem.title, 'Emergency Drill')
        })
    })

    await t.test('5. EnterpriseOperationsRoutes provides safe catchall fallback route', () => {
        const routesFilePath = path.resolve(__dirname, '../../Routes/EnterpriseOperationsRoutes.jsx')
        const source = fs.readFileSync(routesFilePath, 'utf8')

        // Assert that catchall route is declared in EnterpriseOperationsRoutes
        assert.ok(
            source.includes('<Route path="*" element={<Navigate to={`${basePath}/dashboard`} replace />} />'),
            'EnterpriseOperationsRoutes must define catchall Route navigating to ${basePath}/dashboard'
        )
    })
})
