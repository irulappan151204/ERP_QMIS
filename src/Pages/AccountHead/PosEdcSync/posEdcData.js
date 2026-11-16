/**
 * POS / EDC Machine Synchronization Store & Services
 * Supports Paytm, PineLabs, and Bank EDC payment terminal integration,
 * transaction polling, automated intervals, reconciliation against fee invoices, and audit logging.
 */

const STORAGE_KEY_TERMINALS = 'schoolerp_pos_terminals'
const STORAGE_KEY_TRANSACTIONS = 'schoolerp_pos_transactions'
const STORAGE_KEY_SYNC_LOGS = 'schoolerp_pos_sync_logs'
const STORAGE_KEY_SETTINGS = 'schoolerp_pos_settings'

export const DEFAULT_POS_TERMINALS = [
    {
        id: 'POS-001',
        terminalId: 'PTM-TID-8821',
        name: 'Fee Counter 1 — Paytm All-in-One POS',
        provider: 'Paytm Payments Bank / EDC',
        model: 'Paytm Android Smart POS (T500)',
        merchantId: 'MID_QM_CAMPUS_01',
        counterLocation: 'Central Accounts & Cash Counter 1',
        assignedOperator: 'M. Sridhar (Senior Cashier)',
        serialNumber: 'SN-PTM-2025-0914',
        status: 'Active',
        connectionType: '4G SIM + Wi-Fi',
        apiEndpoint: 'https://securegw.paytm.in/edc/v2/transactions',
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
        id: 'POS-002',
        terminalId: 'PTM-TID-8822',
        name: 'Fee Counter 2 — Paytm Soundbox POS',
        provider: 'Paytm Payments Bank / EDC',
        model: 'Paytm Soundbox 4.0 Pro + QR EDC',
        merchantId: 'MID_QM_CAMPUS_01',
        counterLocation: 'Junior Wing Accounts Counter',
        assignedOperator: 'K. Meenakshi (Accounts Officer)',
        serialNumber: 'SN-PTM-2025-1102',
        status: 'Active',
        connectionType: 'Wi-Fi Enterprise',
        apiEndpoint: 'https://securegw.paytm.in/edc/v2/transactions',
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
        id: 'POS-003',
        terminalId: 'PLB-TID-4410',
        name: 'Admin Reception — PineLabs Plutus',
        provider: 'PineLabs EDC Gateway',
        model: 'PineLabs Smart POS Plutus A920',
        merchantId: 'PL_MID_QM_ADMIN_09',
        counterLocation: 'Front Office & Admissions Desk',
        assignedOperator: 'R. Vignesh (Front Office Lead)',
        serialNumber: 'SN-PLB-2024-8843',
        status: 'Active',
        connectionType: 'Ethernet LAN',
        apiEndpoint: 'https://api.pinelabs.com/pos/v1/sync',
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    },
    {
        id: 'POS-004',
        terminalId: 'SBI-TID-1904',
        name: 'Bookstore & Uniforms EDC',
        provider: 'State Bank of India Merchant POS',
        model: 'Ingenico Move 2500',
        merchantId: 'SBI_MERCHANT_44021',
        counterLocation: 'Campus Stationery & Uniform Store',
        assignedOperator: 'P. Anand (Store Manager)',
        serialNumber: 'SN-ING-2024-0321',
        status: 'Inactive',
        connectionType: '4G SIM',
        apiEndpoint: 'https://sbiepay.sbi/pos/gateway/poll',
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
]

export const DEFAULT_POS_TRANSACTIONS = [
    {
        id: 'TXN-POS-1001',
        terminalId: 'PTM-TID-8821',
        transactionRef: 'RRN-99201488102',
        studentId: 'STU-2024-1042',
        studentName: 'Arjun Sharma (Grade 10-A)',
        feeInvoiceId: 'INV-2025-Q1-1042',
        amount: 24500,
        paymentMethod: 'Debit Card (Visa ending 4129)',
        paymentMode: 'Card Swipe / Chip',
        status: 'SUCCESS',
        reconciliationStatus: 'Matched',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        rrnNumber: '99201488102',
        authCode: 'AUTH91024',
        cardType: 'Visa',
        notes: 'Term 1 Tuition & Transport Fee settlement verified',
    },
    {
        id: 'TXN-POS-1002',
        terminalId: 'PTM-TID-8821',
        transactionRef: 'RRN-99201488103',
        studentId: 'STU-PAR-001',
        studentName: 'Abhinav Raj (Grade 10-A)',
        feeInvoiceId: 'INV-2025-Q1-0912',
        amount: 18000,
        paymentMethod: 'Paytm UPI QR',
        paymentMode: 'Dynamic QR Scan',
        status: 'SUCCESS',
        reconciliationStatus: 'Matched',
        timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
        rrnNumber: '99201488103',
        authCode: 'UPI550192',
        cardType: 'UPI',
        notes: 'Annual Lab & Library Fee payment verified',
    },
    {
        id: 'TXN-POS-1003',
        terminalId: 'PTM-TID-8822',
        transactionRef: 'RRN-99201488104',
        studentId: 'STU-2025-1001',
        studentName: 'Aarav Sharma (Grade 10-A)',
        feeInvoiceId: null,
        amount: 12500,
        paymentMethod: 'Credit Card (Mastercard ending 8812)',
        paymentMode: 'Contactless Tap',
        status: 'SUCCESS',
        reconciliationStatus: 'Unlinked POS Transaction',
        timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
        rrnNumber: '99201488104',
        authCode: 'AUTH88391',
        cardType: 'Mastercard',
        notes: 'Paid at counter; pending ERP fee receipt linking',
    },
    {
        id: 'TXN-POS-1004',
        terminalId: 'PLB-TID-4410',
        transactionRef: 'RRN-99201488105',
        studentId: 'STU-ADM-9941',
        studentName: 'Rohan Mehra (Grade 6-B)',
        feeInvoiceId: 'INV-2025-ADM-9941',
        amount: 35000,
        paymentMethod: 'Debit Card (RuPay ending 1044)',
        paymentMode: 'Card Chip Insertion',
        status: 'SUCCESS',
        reconciliationStatus: 'Matched',
        timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
        rrnNumber: '99201488105',
        authCode: 'AUTH33190',
        cardType: 'RuPay',
        notes: 'New Admission Registration & Kit Charges',
    },
    {
        id: 'TXN-POS-1005',
        terminalId: 'PTM-TID-8821',
        transactionRef: 'RRN-99201488106',
        studentId: 'STU-2024-1088',
        studentName: 'Priya Sundaram (Grade 8-C)',
        feeInvoiceId: 'INV-2025-Q1-1088',
        amount: 15000,
        paymentMethod: 'Credit Card (Visa ending 3301)',
        paymentMode: 'Card Swipe',
        status: 'SUCCESS',
        reconciliationStatus: 'Discrepancy',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        rrnNumber: '99201488106',
        authCode: 'AUTH44810',
        cardType: 'Visa',
        notes: 'ERP invoice booked as ₹15,500; POS charged ₹15,000 (₹500 variance to reconcile)',
    },
    {
        id: 'TXN-POS-1006',
        terminalId: 'PTM-TID-8822',
        transactionRef: 'RRN-99201488107',
        studentId: 'STU-2024-1102',
        studentName: 'K. Karthikeyan (Grade 11-A)',
        feeInvoiceId: null,
        amount: 8500,
        paymentMethod: 'Paytm UPI QR',
        paymentMode: 'UPI Scan',
        status: 'FAILED',
        reconciliationStatus: 'Failed Transaction',
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        rrnNumber: '99201488107',
        authCode: 'ERR_TIMEOUT',
        cardType: 'UPI',
        notes: 'Bank gateway timeout at terminal; no deduction made',
    },
    {
        id: 'TXN-POS-1007',
        terminalId: 'PLB-TID-4410',
        transactionRef: 'RRN-99201488108',
        studentId: 'STU-2025-1049',
        studentName: 'Sneha Venkatesh (Grade 9-B)',
        feeInvoiceId: 'INV-2025-Q1-1049',
        amount: 14200,
        paymentMethod: 'Debit Card (Visa ending 9920)',
        paymentMode: 'Contactless Tap',
        status: 'SUCCESS',
        reconciliationStatus: 'Duplicate Transaction',
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        rrnNumber: '99201488108',
        authCode: 'AUTH77102',
        cardType: 'Visa',
        notes: 'Duplicate swipe detected within 90 seconds of prior charge',
    },
]

export const DEFAULT_POS_SYNC_LOGS = [
    {
        id: 'SYNC-LOG-5001',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        terminalId: 'PTM-TID-8821',
        terminalName: 'Fee Counter 1 — Paytm All-in-One POS',
        initiatedBy: 'Auto-Scheduler (15m Interval)',
        polledCount: 14,
        syncedCount: 14,
        mismatchCount: 0,
        status: 'Completed',
        durationMs: 840,
        details: '14 transaction vouchers successfully synchronized and validated.',
    },
    {
        id: 'SYNC-LOG-5002',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        terminalId: 'PTM-TID-8822',
        terminalName: 'Fee Counter 2 — Paytm Soundbox POS',
        initiatedBy: 'Auto-Scheduler (15m Interval)',
        polledCount: 8,
        syncedCount: 7,
        mismatchCount: 1,
        status: 'Completed with Warnings',
        durationMs: 1120,
        details: '7 settled transactions synced; 1 failed swipe logged (RRN-99201488107).',
    },
    {
        id: 'SYNC-LOG-5003',
        timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
        terminalId: 'PLB-TID-4410',
        terminalName: 'Admin Reception — PineLabs Plutus',
        initiatedBy: 'Manual Trigger (Account Head)',
        polledCount: 9,
        syncedCount: 9,
        mismatchCount: 0,
        status: 'Completed',
        durationMs: 960,
        details: 'Manual verification completed against PineLabs cloud settlement batch.',
    },
]

export const DEFAULT_POS_SETTINGS = {
    autoSyncEnabled: true,
    syncInterval: '15m', // '15m' | '30m' | '1h' | 'daily'
    autoReconcileThreshold: 0, // In rupees difference
    merchantWebhookUrl: 'https://schoolerp.internal/api/webhooks/pos-settlement',
    retryAttempts: 3,
    alertOnDiscrepancy: true,
    supportedProviders: ['Paytm', 'PineLabs', 'State Bank of India', 'HDFC SmartHub'],
}

// Helper: Read from LocalStorage or fallback
function readStorage(key, defaultValue) {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(key)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) ? parsed.length >= 0 : parsed) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    return defaultValue
}

function writeStorage(key, value) {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(value))
        }
    } catch {
        /* ignore */
    }
}

// ─── POS TERMINALS API ────────────────────────────────────────────────────────

export function getPosTerminals() {
    return readStorage(STORAGE_KEY_TERMINALS, DEFAULT_POS_TERMINALS)
}

export function savePosTerminals(terminals) {
    writeStorage(STORAGE_KEY_TERMINALS, terminals)
    return terminals
}

export function addPosTerminal(terminalData) {
    const terminals = getPosTerminals()
    const newTerminal = {
        id: `POS-${String(terminals.length + 1).padStart(3, '0')}`,
        terminalId: terminalData.terminalId?.trim() || `TID-${Date.now()}`,
        name: terminalData.name?.trim() || 'New POS Terminal',
        provider: terminalData.provider || 'Paytm Payments Bank / EDC',
        model: terminalData.model || 'Standard Smart EDC',
        merchantId: terminalData.merchantId?.trim() || 'MID_CAMPUS_DEFAULT',
        counterLocation: terminalData.counterLocation || 'Accounts Desk',
        assignedOperator: terminalData.assignedOperator || 'Duty Cashier',
        serialNumber: terminalData.serialNumber?.trim() || `SN-${Date.now()}`,
        status: terminalData.status || 'Active',
        connectionType: terminalData.connectionType || '4G SIM + Wi-Fi',
        apiEndpoint: terminalData.apiEndpoint || 'https://securegw.paytm.in/edc/v2/transactions',
        lastSyncAt: new Date().toISOString(),
    }
    const updated = [newTerminal, ...terminals]
    savePosTerminals(updated)
    return newTerminal
}

export function updatePosTerminal(id, patch) {
    const terminals = getPosTerminals()
    const updated = terminals.map((t) => (t.id === id ? { ...t, ...patch } : t))
    savePosTerminals(updated)
    return updated.find((t) => t.id === id) || null
}

export function deletePosTerminal(id) {
    const terminals = getPosTerminals()
    const updated = terminals.filter((t) => t.id !== id)
    savePosTerminals(updated)
    return updated
}

// ─── POS TRANSACTIONS API ────────────────────────────────────────────────────

export function getPosTransactions() {
    return readStorage(STORAGE_KEY_TRANSACTIONS, DEFAULT_POS_TRANSACTIONS)
}

export function savePosTransactions(transactions) {
    writeStorage(STORAGE_KEY_TRANSACTIONS, transactions)
    return transactions
}

export function addPosTransaction(txnData) {
    const transactions = getPosTransactions()
    const newTxn = {
        id: `TXN-POS-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        reconciliationStatus: 'Unlinked POS Transaction',
        ...txnData,
    }
    const updated = [newTxn, ...transactions]
    savePosTransactions(updated)
    return newTxn
}

export function reconcileTransaction(transactionId, feeInvoiceId, notes = '') {
    const transactions = getPosTransactions()
    const updated = transactions.map((t) => {
        if (t.id === transactionId || t.transactionRef === transactionId) {
            return {
                ...t,
                feeInvoiceId: feeInvoiceId || t.feeInvoiceId || `INV-RECON-${Date.now()}`,
                reconciliationStatus: 'Matched',
                notes: notes || 'Manually reconciled and linked to student ledger by Account Head',
            }
        }
        return t
    })
    savePosTransactions(updated)
    return updated.find((t) => t.id === transactionId || t.transactionRef === transactionId)
}

// ─── POS SYNC ENGINE & LOGS ──────────────────────────────────────────────────

export function getPosSyncLogs() {
    return readStorage(STORAGE_KEY_SYNC_LOGS, DEFAULT_POS_SYNC_LOGS)
}

export function savePosSyncLogs(logs) {
    writeStorage(STORAGE_KEY_SYNC_LOGS, logs)
    return logs
}

export function executePosSync(terminalId = null, initiatedBy = 'Manual Trigger (Account Head)') {
    const terminals = getPosTerminals()
    const targetTerminals = terminalId
        ? terminals.filter((t) => t.id === terminalId || t.terminalId === terminalId)
        : terminals.filter((t) => t.status === 'Active')

    const now = new Date()
    const syncTimestamp = now.toISOString()

    // Update last sync on terminals
    const updatedTerminals = terminals.map((t) => {
        if (targetTerminals.some((target) => target.id === t.id)) {
            return { ...t, lastSyncAt: syncTimestamp }
        }
        return t
    })
    savePosTerminals(updatedTerminals)

    // Simulate newly fetched transactions during sync
    const transactions = getPosTransactions()
    const simulatedRef = `RRN-${Math.floor(10000000000 + Math.random() * 90000000000)}`
    const simulatedNewTxn = {
        id: `TXN-POS-${Date.now()}`,
        terminalId: targetTerminals[0]?.terminalId || 'PTM-TID-8821',
        transactionRef: simulatedRef,
        studentId: 'STU-2024-1042',
        studentName: 'Arjun Sharma (Grade 10-A)',
        feeInvoiceId: `INV-2025-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: Math.floor(5000 + Math.random() * 20000),
        paymentMethod: 'Paytm Smart POS (Contactless)',
        paymentMode: 'Tap to Pay (Visa)',
        status: 'SUCCESS',
        reconciliationStatus: 'Matched',
        timestamp: syncTimestamp,
        rrnNumber: simulatedRef,
        authCode: `AUTH${Math.floor(10000 + Math.random() * 90000)}`,
        cardType: 'Visa',
        notes: 'Real-time EDC machine batch synchronization confirmed with bank gateway',
    }

    const updatedTransactions = [simulatedNewTxn, ...transactions]
    savePosTransactions(updatedTransactions)

    // Add log entry
    const newLog = {
        id: `SYNC-LOG-${Date.now()}`,
        timestamp: syncTimestamp,
        terminalId: targetTerminals.map((t) => t.terminalId).join(', ') || 'ALL_ACTIVE',
        terminalName: targetTerminals.map((t) => t.name).join('; ') || 'All Active Devices',
        initiatedBy,
        polledCount: targetTerminals.length * 3 + 1,
        syncedCount: targetTerminals.length * 3 + 1,
        mismatchCount: 0,
        status: 'Completed',
        durationMs: Math.floor(650 + Math.random() * 600),
        details: `Successfully synchronized ${targetTerminals.length} online terminal(s). Latest payment batch verified.`,
    }

    const logs = getPosSyncLogs()
    const updatedLogs = [newLog, ...logs]
    savePosSyncLogs(updatedLogs)

    return {
        success: true,
        syncedCount: newLog.syncedCount,
        newTransaction: simulatedNewTxn,
        log: newLog,
    }
}

// ─── POS SETTINGS API ────────────────────────────────────────────────────────

export function getPosSettings() {
    return readStorage(STORAGE_KEY_SETTINGS, DEFAULT_POS_SETTINGS)
}

export function savePosSettings(settings) {
    writeStorage(STORAGE_KEY_SETTINGS, settings)
    return settings
}

export function updatePosSettings(patch) {
    const current = getPosSettings()
    const updated = { ...current, ...patch }
    savePosSettings(updated)
    return updated
}
