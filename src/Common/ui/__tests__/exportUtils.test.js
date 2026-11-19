import test from 'node:test'
import assert from 'node:assert/strict'
import {
    sanitizeCsvValue,
    generateExportFilename,
    exportToCsv,
    exportToExcel,
    exportToPdf,
    exportDataset,
} from '../exportUtils.js'

test('exportUtils.sanitizeCsvValue escapes and neutralizes dangerous formula prefixes', () => {
    // Normal string
    assert.equal(sanitizeCsvValue('Standard Title'), '"Standard Title"')

    // Formula prefixes: =, +, -, @, \t, \r
    assert.equal(sanitizeCsvValue('=SUM(A1:A10)'), '"\'=SUM(A1:A10)"')
    assert.equal(sanitizeCsvValue('+12345'), "\"'+12345\"")
    assert.equal(sanitizeCsvValue('-500'), "\"'-500\"")
    assert.equal(sanitizeCsvValue('@specialCommand'), "\"'@specialCommand\"")

    // Double quotes escaping
    assert.equal(sanitizeCsvValue('John "Doc" Doe'), '"John ""Doc"" Doe"')

    // Null/undefined
    assert.equal(sanitizeCsvValue(null), '')
    assert.equal(sanitizeCsvValue(undefined), '')
})

test('exportUtils.generateExportFilename formats safe sanitized filenames', () => {
    const filename = generateExportFilename('Student Fee Ledger & Defaulters!', 'csv')
    assert.ok(filename.startsWith('student_fee_ledger_defaulters_'))
    assert.ok(filename.endsWith('.csv'))
})

test('exportUtils returns false and warns when dataset is empty', () => {
    const csvResult = exportToCsv('test', [{ key: 'id', label: 'ID' }], [])
    assert.equal(csvResult, false)

    const excelResult = exportToExcel('test', [{ key: 'id', label: 'ID' }], [])
    assert.equal(excelResult, false)

    const pdfResult = exportToPdf('Title', 'Sub', [{ key: 'id', label: 'ID' }], [])
    assert.equal(pdfResult, false)
})

test('exportUtils.exportDataset dispatches supported formats properly', () => {
    const sampleRows = [
        { id: 'REC-01', name: 'Item One', amount: 1200 },
        { id: 'REC-02', name: 'Item Two', amount: 3400 },
    ]
    const columns = [
        { key: 'id', label: 'Record ID' },
        { key: 'name', label: 'Item Name' },
        { key: 'amount', label: 'Amount' },
    ]

    // In Node test environment, Blob and window/document are handled gracefully
    const resCsv = exportDataset('csv', { title: 'Test Export', columns, rows: sampleRows })
    assert.equal(resCsv, true)

    const resExcel = exportDataset('excel', { title: 'Test Export', columns, rows: sampleRows })
    assert.equal(resExcel, true)

    const resUnsupported = exportDataset('unsupported-format', { columns, rows: sampleRows })
    assert.equal(resUnsupported, false)
})
