import { create } from 'zustand';

/**
 * State store for Organization Data.
 */
export const useOrgStore = create((set, get) => ({
    employees: [],
    loading: false,
    error: null,
    currentUrl: null,

    // Theme Management
    theme: 'dark',
    toggleTheme: () => set((state) => ({
        theme: state.theme === 'dark' ? 'light' : 'dark'
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

    setEmployees: (data) => set((state) => ({
        employees: data,
        scenarios: {
            ...state.scenarios,
            [state.activeScenarioId || 'Default']: data
        }
    })),

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
                    loadedScenarios[sheet.name] = data;
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

    updateEmployee: (originalTitle, updatedData) => set((state) => {
        const updatedEmployees = state.employees.map(emp =>
            emp['Title'] === originalTitle ? { ...emp, ...updatedData } : emp
        );
        return {
            employees: updatedEmployees,
            scenarios: {
                ...state.scenarios,
                [state.activeScenarioId]: updatedEmployees
            }
        };
    }),

    addEmployee: (newEmployee) => set((state) => {
        const updatedEmployees = [...state.employees, newEmployee];
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
        activeScenarioId: null
    }),

    reset: () => set({
        employees: [],
        error: null,
        currentUrl: null,
        scenarios: {},
        activeScenarioId: null
    })
}));
