import * as XLSX from 'xlsx';

/**
 * Exports data to an XLSX file.
 * @param data Array of objects representing rows.
 * @param fileName Name of the file without extension.
 */
export function exportToExcel(data: any[], fileName: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    // Generate buffer and trigger download
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Formats a period string (YYYYMM) to a more readable format (Ene 2026).
 */
export function formatPeriodLabel(p: string): string {
    if (p.length === 6) {
        const yr = p.substring(0, 4);
        const ms = p.substring(4, 6);
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const mIdx = parseInt(ms, 10) - 1;
        return `${monthNames[mIdx] || ms} ${yr}`;
    }
    return p;
}
