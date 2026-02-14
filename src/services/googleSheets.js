import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Service to handle Google Sheets interactions.
 */
export const GoogleSheetsService = {
    /**
     * Attempts to discover all available sheet names and GIDs from the main spreadsheet URL.
     * @param {string} spreadsheetUrl - The main URL of the spreadsheet.
     * @returns {Promise<Array>} - Array of { name, gid }.
     */
    _getFetchUrl: (url) => {
        if (!url || !url.includes('docs.google.com')) return url;

        if (import.meta.env.DEV) {
            // In dev, we use the local vite proxy configured at /gs-api
            return url.replace(/^https?:\/\/docs\.google\.com/, '/gs-api');
        } else {
            // In production, we use AllOrigins
            return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        }
    },

    discoverSheets: async (spreadsheetUrl) => {
        try {
            if (!spreadsheetUrl) return [{ gid: '0', name: 'Scenario 1' }];

            // Normalize URL
            let url = spreadsheetUrl.trim();
            if (!url.startsWith('http') && url.length > 20) {
                url = `https://docs.google.com/spreadsheets/d/${url}`;
            }

            const fetchUrl = GoogleSheetsService._getFetchUrl(url);
            console.log("Discovering tabs via:", fetchUrl);

            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error(`Discovery fetch failed: ${response.status}`);
            const html = await response.text();

            // Google Sheets embeds sheet data in its HTML. 
            // We look for patterns like: {"gid":0,"name":"Sheet1"} or "gid":"0","name":"Sheet1"
            // or "sheetId":0,"title":"Sheet1"
            // or the complex JSON in topsnapshot: [index,0,"gid",[{"1":[[0,0,"Name"]]
            const patterns = [
                /\{"gid":(\d+),"name":"([^"]+)"/g,
                /"gid":"(\d+)","name":"([^"]+)"/g,
                /"sheetId":(\d+),"title":"([^"]+)"/g,
                /\\+"gid\\+":\\+"?(\d+)\\+"?,\\+"name\\+":"([^"\\]+)\\+"/g,
                /\[\d+,\d+,\\+"(\d+)\\+",\[{\\+"1\\+":\[\[0,0,\\+"([^"\\]+)\\+"/g,
                /gid=(\d+)[^>]*>([^<]+)</g
            ];

            const sheets = [];
            const seenGids = new Set();

            for (const pattern of patterns) {
                const matches = html.matchAll(pattern);
                for (const match of matches) {
                    const gid = match[1];
                    let name = match[2];

                    // Basic unescape if it's unicode or \x22
                    if (name.includes('\\u002') || name.includes('\\x22')) {
                        try {
                            name = name.replace(/\\x22/g, '"').replace(/\\x27/g, "'");
                            if (name.includes('\\u')) name = JSON.parse(`"${name}"`);
                        } catch (e) { }
                    }

                    if (!seenGids.has(gid) && name !== 'Untitled spreadsheet' && !name.includes('\\')) {
                        sheets.push({ gid, name });
                        seenGids.add(gid);
                    }
                }
            }

            if (sheets.length === 0) {
                // Default to Sheet1 / gid=0 if discovery fails
                sheets.push({ gid: '0', name: 'Scenario 1' });
            }

            return sheets;
        } catch (error) {
            console.error("Discovery Error:", error);
            return [{ gid: '0', name: 'Scenario 1' }];
        }
    },

    /**
     * Fetches data from a specific sheet as CSV.
     */
    fetchSheetData: async (baseUrl, gid) => {
        let csvUrl = (baseUrl || '').trim();
        if (csvUrl.includes('/edit')) {
            csvUrl = csvUrl.replace(/\/edit.*$/, `/export?format=csv&gid=${gid}`);
        } else if (csvUrl.includes('/export')) {
            if (csvUrl.includes('gid=')) {
                csvUrl = csvUrl.replace(/gid=\d+/, `gid=${gid}`);
            } else {
                csvUrl += (csvUrl.includes('?') ? '&' : '?') + `gid=${gid}`;
            }
        } else {
            csvUrl = csvUrl.replace(/\/+$/, '') + `/export?format=csv&gid=${gid}`;
        }

        const fetchUrl = GoogleSheetsService._getFetchUrl(csvUrl);
        console.log("Fetching sheet data via:", fetchUrl);

        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error(`Failed to fetch sheet ${gid}`);
        const csvText = await response.text();
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data),
                error: reject
            });
        });
    },

    /**
     * Fetches data from a public Google Sheet CSV link.
     * @param {string} url - The public CSV URL.
     * @returns {Promise<Array>} - Parsed objects.
     */
    fetchPublicSheet: async (url) => {
        // Keeping this for backward compatibility if needed
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to access sheet. Ensure it is shared as "Anyone with the link can view". Status: ${response.status} ${response.statusText}`);
            }
            const csvText = await response.text();

            return new Promise((resolve, reject) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        resolve(results.data);
                    },
                    error: (error) => {
                        reject(error);
                    }
                });
            });
        } catch (error) {
            console.error("Google Sheets Fetch Error:", error);
            throw error;
        }
    },

    /**
     * Validate if a row has necessary fields for the Org Design app.
     */
    validateRow: (row) => {
        const required = ['Title', 'Department', 'Team'];
        return true;
    },

    /**
     * Sanitizes a string for use as an Excel sheet name.
     */
    sanitizeSheetName: (name) => {
        if (!name) return 'Sheet';
        // Remove invalid characters: \ / * ? : [ ]
        let sanitized = name.replace(/[\\\/\*\?\:\[\]]/g, ' ');
        // Max length 31
        sanitized = sanitized.substring(0, 31).trim();
        // Cannot start or end with '
        if (sanitized.startsWith("'")) sanitized = sanitized.substring(1);
        if (sanitized.endsWith("'")) sanitized = sanitized.substring(0, sanitized.length - 1);
        return sanitized || 'Sheet';
    },

    /**
     * Converts scenarios to an Excel file and triggers a download.
     * @param {Object} scenarios - Map of scenario name -> employee data
     */
    downloadExcel: (scenarios, filename = 'org-design-export.xlsx') => {
        try {
            console.log('Starting Excel export with scenarios:', Object.keys(scenarios));

            if (!scenarios || Object.keys(scenarios).length === 0) {
                console.error('No scenarios to export');
                alert('No data to export. Please load data from a Google Sheet first.');
                return;
            }

            const wb = XLSX.utils.book_new();

            Object.entries(scenarios).forEach(([name, data]) => {
                console.log(`Adding sheet: ${name} with ${data.length} rows`);
                const sanitizedName = GoogleSheetsService.sanitizeSheetName(name);

                if (!data || data.length === 0) {
                    console.warn(`Scenario "${name}" has no data, skipping`);
                    return;
                }

                const ws = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, ws, sanitizedName);
            });

            if (wb.SheetNames.length === 0) {
                console.error('No sheets were added to workbook');
                alert('No valid data to export');
                return;
            }

            console.log(`Workbook created with ${wb.SheetNames.length} sheets:`, wb.SheetNames);

            // Use manual blob download method for better browser compatibility
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            console.log('Triggering download click...');
            link.click();
            console.log('Download clicked, cleaning up...');

            // Clean up after a short delay to ensure download starts
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('Excel file download completed');
            }, 100);
        } catch (error) {
            console.error('Error creating Excel file:', error);
            alert(`Failed to export Excel file: ${error.message}`);
        }
    },

    /**
     * Converts JSON data to CSV and triggers a download.
     */
    downloadCSV: (data, filename = 'org-design-export.csv') => {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};
