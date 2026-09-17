import { create } from 'zustand';

/**
 * Ensures every row has a stable internal id, independent of Title, so a
 * given role can have multiple historical rows (e.g. a manager change)
 * without breaking edit/delete/drag operations that target one specific row.
 */
const withIds = (rows) => (rows || []).map(row => (
    row.__id ? row : { ...row, __id: crypto.randomUUID() }
));

/**
 * State store for Organization Data.
 */
export const useOrgStore = create((set, get) => ({
    employees: [],
    loading: false,
    saving: false,
    error: null,
    currentUrl: null,

    // Time travel: the date used to compute which historical row is "active"
    // per role when rendering the org chart. Null = show every row as active.
    asOfDate: null,
    setAsOfDate: (date) => set({ asOfDate: date }),

    // Google Sign-In + Drive connection (an alternative to the public-URL / file-upload flows)
    googleAccessToken: null,
    driveFileId: null,
    driveFileName: null,

    // Theme Management
    theme: 'light',
    toggleTheme: () => set((state) => ({
        theme: state.theme === 'dark' ? 'light' : 'dark'
    })),


    // Group Node Settings
    showNamesInGroups: true,
    toggleShowNamesInGroups: () => set((state) => ({ showNamesInGroups: !state.showNamesInGroups })),

    // Expansion State for Accountabilities and Metrics
    expandedAccountabilities: new Set(),
    expandedMetrics: new Set(),

    toggleAccountability: (title) => set((state) => {
        const newSet = new Set(state.expandedAccountabilities);
        if (newSet.has(title)) newSet.delete(title);
        else newSet.add(title);
        return { expandedAccountabilities: newSet };
    }),

    toggleMetric: (title) => set((state) => {
        const newSet = new Set(state.expandedMetrics);
        if (newSet.has(title)) newSet.delete(title);
        else newSet.add(title);
        return { expandedMetrics: newSet };
    }),

    expandAllAccountabilities: (expand) => set((state) => ({
        expandedAccountabilities: expand ? new Set(state.employees.map(e => e['Title'])) : new Set()
    })),

    expandAllMetrics: (expand) => set((state) => ({
        expandedMetrics: expand ? new Set(state.employees.map(e => e['Title'])) : new Set()
    })),

    // Export Settings
    exportSettings: {
        visibleFields: ['Name', 'Title', 'Department', 'Team', 'Accountabilities', 'Metrics'],
        isExporting: false
    },
    setExportSettings: (settings) => set((state) => ({
        exportSettings: { ...state.exportSettings, ...settings }
    })),

    // Scenario Management: { [scenarioName]: employees[] }
    scenarios: {},
    activeScenarioId: null,

    // Visualization Mode: 'employee' | 'team' | 'department'
    vizMode: 'employee',
    setVizMode: (mode) => set({ vizMode: mode }),

    // View Mode: 'chart' | 'table'
    viewMode: 'chart',
    setViewMode: (mode) => set({ viewMode: mode }),

    createScenario: (newName) => set((state) => {
        if (state.scenarios[newName]) return state; // Already exists
        const currentData = JSON.parse(JSON.stringify(state.employees));
        return {
            scenarios: {
                ...state.scenarios,
                [newName]: currentData
            },
            activeScenarioId: newName,
            employees: currentData
        };
    }),

    setEmployees: (data) => set((state) => {
        const idd = withIds(data);
        return {
            employees: idd,
            scenarios: {
                ...state.scenarios,
                [state.activeScenarioId || 'Default']: idd
            }
        };
    }),

    setScenarios: (scenarios) => {
        const scenarioNames = Object.keys(scenarios);
        if (scenarioNames.length === 0) return;
        const idd = {};
        scenarioNames.forEach(name => { idd[name] = withIds(scenarios[name]); });
        const firstScenarioName = scenarioNames[0];
        set({
            scenarios: idd,
            activeScenarioId: firstScenarioName,
            employees: JSON.parse(JSON.stringify(idd[firstScenarioName] || [])),
            loading: false,
            error: null,
            currentUrl: null
        });
    },

    loadFromPublicUrl: async (url, service) => {
        set({ loading: true, error: null, currentUrl: url });
        try {
            // 1. Discover all sheets
            const sheets = await service.discoverSheets(url);
            const loadedScenarios = {};

            // 2. Fetch data for each discovered sheet
            const fetchPromises = sheets.map(async (sheet) => {
                try {
                    const data = await service.fetchSheetData(url, sheet.gid);
                    loadedScenarios[sheet.name] = withIds(data);
                } catch (e) {
                    console.error(`Failed to fetch sheet ${sheet.name}`, e);
                }
            });

            await Promise.all(fetchPromises);

            const firstScenarioName = Object.keys(loadedScenarios)[0];

            set({
                scenarios: loadedScenarios,
                activeScenarioId: firstScenarioName,
                employees: loadedScenarios[firstScenarioName] || [],
                loading: false
            });
        } catch (err) {
            set({ error: err.message, loading: false });
        }
    },

    /**
     * Loads all tabs of a Drive-picked spreadsheet using the authenticated
     * Sheets API (no CORS proxy needed since the user owns/has access to the file).
     */
    loadFromDrive: async (service, fileId, fileName, accessToken) => {
        set({ loading: true, error: null, currentUrl: null, googleAccessToken: accessToken, driveFileId: fileId, driveFileName: fileName });
        try {
            const sheets = await service.discoverSheetsApi(fileId, accessToken);
            const loadedScenarios = {};

            await Promise.all(sheets.map(async (sheet) => {
                try {
                    loadedScenarios[sheet.name] = withIds(await service.fetchSheetDataApi(fileId, sheet.name, accessToken));
                } catch (e) {
                    console.error(`Failed to fetch tab ${sheet.name}`, e);
                }
            }));

            const firstScenarioName = Object.keys(loadedScenarios)[0];
            set({
                scenarios: loadedScenarios,
                activeScenarioId: firstScenarioName,
                employees: loadedScenarios[firstScenarioName] || [],
                loading: false
            });
        } catch (err) {
            set({ error: err.message, loading: false });
        }
    },

    /**
     * Writes the active scenario back to its Google Sheet tab.
     */
    saveActiveScenarioToDrive: async (service) => {
        const { driveFileId, googleAccessToken, activeScenarioId, employees } = get();
        if (!driveFileId || !googleAccessToken || !activeScenarioId) return;

        set({ saving: true, error: null });
        try {
            const rows = employees.map(row => { const copy = { ...row }; delete copy.__id; return copy; });
            await service.writeSheetDataApi(driveFileId, activeScenarioId, googleAccessToken, rows);
            set({ saving: false });
        } catch (err) {
            set({ error: err.message, saving: false });
        }
    },

    switchScenario: (name) => {
        const scenarioData = get().scenarios[name];
        if (scenarioData) {
            set({
                activeScenarioId: name,
                employees: JSON.parse(JSON.stringify(scenarioData))
            });
        }
    },

    refreshData: async (service) => {
        const { currentUrl } = get();
        if (currentUrl) {
            await get().loadFromPublicUrl(currentUrl, service);
        }
    },

    // Updates the specific row identified by its internal id (not Title,
    // since the same role/Title can have several historical rows).
    updateEmployeeById: (id, updatedData) => set((state) => {
        const updatedEmployees = state.employees.map(emp =>
            emp.__id === id ? { ...emp, ...updatedData } : emp
        );
        return {
            employees: updatedEmployees,
            scenarios: {
                ...state.scenarios,
                [state.activeScenarioId]: updatedEmployees
            }
        };
    }),

    deleteEmployeeById: (id) => set((state) => {
        const target = state.employees.find(e => e.__id === id);
        if (!target) return state;
        const title = target['Title']?.trim();

        const remaining = state.employees.filter(e => e.__id !== id);
        // Only clear dangling "Reporting To" references if no other historical
        // row for this Title still exists; otherwise the role still exists.
        const titleStillExists = remaining.some(e => e['Title']?.trim() === title);
        const sanitized = titleStillExists
            ? remaining
            : remaining.map(e => e['Reporting To'] === title ? { ...e, 'Reporting To': '' } : e);

        return {
            employees: sanitized,
            scenarios: {
                ...state.scenarios,
                [state.activeScenarioId]: sanitized
            }
        };
    }),

    addEmployee: (newEmployee) => set((state) => {
        const updatedEmployees = [...state.employees, ...withIds([newEmployee])];
        return {
            employees: updatedEmployees,
            scenarios: {
                ...state.scenarios,
                [state.activeScenarioId]: updatedEmployees
            }
        };
    }),

    // Adds a blank row for inline table editing.
    addEmployeeRow: () => set((state) => {
        let n = state.employees.length + 1;
        const existingTitles = new Set(state.employees.map(e => e['Title']));
        let title = `New Role ${n}`;
        while (existingTitles.has(title)) {
            n += 1;
            title = `New Role ${n}`;
        }
        const newEmployee = {
            __id: crypto.randomUUID(),
            Name: '',
            Title: title,
            Department: '',
            Team: '',
            'Reporting To': '',
            Accountabilities: '',
            Metrics: '',
            'Start Date': '',
            'End Date': ''
        };
        const updatedEmployees = [...state.employees, newEmployee];
        return {
            employees: updatedEmployees,
            scenarios: {
                ...state.scenarios,
                [state.activeScenarioId]: updatedEmployees
            }
        };
    }),

    /**
     * Duplicates the given row as a new historical version: closes out the
     * old row's End Date (the day before the new one starts) and opens a new
     * row from `newStartDate` onward, carrying over the given field changes
     * (e.g. a new "Reporting To" for a mid-tenure manager change).
     */
    addRoleVersion: (id, newStartDate, changes) => set((state) => {
        const source = state.employees.find(e => e.__id === id);
        if (!source || !newStartDate) return state;

        const dayBefore = new Date(newStartDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const endDate = dayBefore.toISOString().slice(0, 10);

        const closedOldRow = { ...source, 'End Date': endDate };
        const newRow = {
            ...source,
            ...changes,
            __id: crypto.randomUUID(),
            'Start Date': newStartDate,
            'End Date': ''
        };

        const updatedEmployees = state.employees.map(e => e.__id === id ? closedOldRow : e).concat(newRow);
        return {
            employees: updatedEmployees,
            scenarios: {
                ...state.scenarios,
                [state.activeScenarioId]: updatedEmployees
            }
        };
    }),

    // Updates a single field on the employee at `index`. Renaming a Title
    // re-points any employees that reported to the old title.
    updateEmployeeField: (index, field, value) => set((state) => {
        const target = state.employees[index];
        if (!target) return state;

        const oldTitle = target['Title'];
        let updatedEmployees = state.employees.map((emp, i) =>
            i === index ? { ...emp, [field]: value } : emp
        );

        if (field === 'Title' && oldTitle && oldTitle !== value) {
            updatedEmployees = updatedEmployees.map((emp, i) =>
                i !== index && emp['Reporting To'] === oldTitle
                    ? { ...emp, 'Reporting To': value }
                    : emp
            );
        }

        return {
            employees: updatedEmployees,
            scenarios: {
                ...state.scenarios,
                [state.activeScenarioId]: updatedEmployees
            }
        };
    }),

    removeEmployeeAt: (index) => set((state) => {
        const target = state.employees[index];
        if (!target) return state;
        const title = target['Title']?.trim();

        const remaining = state.employees.filter((_, i) => i !== index);
        const titleStillExists = remaining.some(e => e['Title']?.trim() === title);
        const updatedEmployees = titleStillExists
            ? remaining
            : remaining.map(emp => emp['Reporting To'] === title ? { ...emp, 'Reporting To': '' } : emp);

        return {
            employees: updatedEmployees,
            scenarios: {
                ...state.scenarios,
                [state.activeScenarioId]: updatedEmployees
            }
        };
    }),

    disconnect: () => set({
        employees: [],
        currentUrl: null,
        error: null,
        scenarios: {},
        activeScenarioId: null,
        expandedAccountabilities: new Set(),
        expandedMetrics: new Set(),
        googleAccessToken: null,
        driveFileId: null,
        driveFileName: null,
        asOfDate: null
    }),

    reset: () => set({
        employees: [],
        error: null,
        currentUrl: null,
        scenarios: {},
        activeScenarioId: null,
        expandedAccountabilities: new Set(),
        expandedMetrics: new Set(),
        googleAccessToken: null,
        driveFileId: null,
        driveFileName: null,
        asOfDate: null
    })
}));
