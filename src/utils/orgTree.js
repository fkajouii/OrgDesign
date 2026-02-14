/**
 * Builds a hierarchical tree from a flat list of employees.
 */
export const buildOrgTree = (employees) => {
    if (!employees || employees.length === 0) return [];

    const empMap = {};
    employees.forEach(emp => {
        const id = emp['Title']?.trim();
        if (id) {
            empMap[id] = { ...emp, children: [] };
        }
    });

    const roots = [];
    const seenIds = new Set();

    employees.forEach(originalEmp => {
        const id = originalEmp['Title']?.trim();
        if (!id || !empMap[id]) return;

        const managerTitle = originalEmp['Reporting To']?.trim();

        if (managerTitle && empMap[managerTitle] && managerTitle !== id) {
            // Check if adding this child would create a cycle (simplified)
            // In a real app we'd do a full path check, but at least prevent direct self-reporting
            empMap[managerTitle].children.push(empMap[id]);
            seenIds.add(id);
        }
    });

    // Only nodes that haven't been added as children are roots
    employees.forEach(emp => {
        const id = emp['Title']?.trim();
        if (id && empMap[id] && !seenIds.has(id)) {
            roots.push(empMap[id]);
        }
    });

    return roots.filter(Boolean);
};

/**
 * Builds a hierarchical tree of groups (Departments or Teams).
 */
export const buildGroupTree = (employees, groupField) => {
    if (!employees || employees.length === 0) return [];

    // 1. Group employees by the field
    const groups = {};
    employees.forEach(emp => {
        const groupName = (emp[groupField] || 'Unassigned').trim();
        if (!groups[groupName]) {
            groups[groupName] = {
                name: groupName,
                employees: [],
                children: [],
                parentGroup: null
            };
        }
        groups[groupName].employees.push(emp);
    });

    // 2. Determine inter-group hierarchy
    employees.forEach(emp => {
        const myGroup = (emp[groupField] || 'Unassigned').trim();
        const managerTitle = emp['Reporting To']?.trim();
        if (managerTitle) {
            const manager = employees.find(e => e['Title'] === managerTitle);
            if (manager) {
                const managerGroup = (manager[groupField] || 'Unassigned').trim();
                if (myGroup !== managerGroup) {
                    groups[myGroup].parentGroup = managerGroup;
                }
            }
        }
    });

    // 3. Assemble tree while avoiding cycles
    const roots = [];
    const addedAsChild = new Set();

    Object.values(groups).forEach(group => {
        if (group.parentGroup && groups[group.parentGroup] && group.parentGroup !== group.name) {
            // Prevent duplicate children if multiple employees link the same groups
            if (!groups[group.parentGroup].children.find(c => c.name === group.name)) {
                groups[group.parentGroup].children.push(group);
                addedAsChild.add(group.name);
            }
        }
    });

    // Roots are those not added as children
    Object.values(groups).forEach(group => {
        if (!addedAsChild.has(group.name)) {
            roots.push(group);
        }
    });

    return roots;
};
