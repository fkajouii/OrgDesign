/**
 * Builds a hierarchical tree from a flat list of employees.
 * @param {Array} employees - Array of employee objects.
 * @returns {Array} - Array of root nodes with a 'children' array populated.
 */
export const buildOrgTree = (employees) => {
    if (!employees || employees.length === 0) return [];

    // Create a map for fast lookup by Title (assuming Title is unique identifier for 'Reporting To' as per instructions)
    // Instructions said: "reporting to can either be an existing role or null" -> so Title is the ID?
    // Let's assume Title is unique enough for this MVP. If multiple people have same Title, this breaks. 
    // But often 'Role' or 'ID' is better. The prompt said "reporting to can either be an existing role".
    // So I'll map by Title.

    const empMap = {};
    employees.forEach(emp => {
        // Normalize keys to lowercase to be safe? No, let's trust headers for now but trim
        const id = emp['Title']?.trim();
        if (id) {
            empMap[id] = { ...emp, children: [] };
        }
    });

    const roots = [];

    employees.forEach(originalEmp => {
        const id = originalEmp['Title']?.trim();
        if (!id) return;

        const emp = empMap[id];
        const managerTitle = originalEmp['Reporting To']?.trim();

        if (managerTitle && empMap[managerTitle]) {
            empMap[managerTitle].children.push(emp);
        } else {
            roots.push(emp);
        }
    });

    return roots;
};
