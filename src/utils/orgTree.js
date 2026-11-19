/**
 * Reduces the full historical employee list down to a snapshot: at most one
 * row per Title, whichever row was active on `asOfDate` (Start Date <= date
 * <= End Date, either bound optional). Dates are compared as 'YYYY-MM-DD'
 * strings, which sort correctly lexicographically. If `asOfDate` is falsy,
 * every row is returned as-is (no time filtering).
 */
export const getEmployeesAsOf = (employees, asOfDate) => {
    if (!employees || employees.length === 0) return [];
    if (!asOfDate) return employees;

    const activeByTitle = {};

    employees.forEach(emp => {
        const title = emp['Title']?.trim();
        if (!title) return;

        const start = emp['Start Date'] || '';
        const end = emp['End Date'] || '';
        const isActive = (!start || start <= asOfDate) && (!end || end >= asOfDate);
        if (!isActive) return;

        const existing = activeByTitle[title];
        // If ranges overlap (a data-entry mistake), prefer the most recently started row.
        if (!existing || start > (existing['Start Date'] || '')) {
            activeByTitle[title] = emp;
        }
    });

    return Object.values(activeByTitle);
};

/**
 * Builds a hierarchical tree from a flat list of employees.
 *
 * Nodes are keyed by each employee's stable `__id`, not by Title — two
 * employees can legitimately share a Title (e.g. "Regional Manager" in two
 * regions), and keying by Title would silently merge them into one node,
 * so editing either one would edit whichever of them happened to win.
 * "Reporting To" is still a Title string, so it's resolved to the first
 * employee found with that Title (ambiguous only when the *manager's*
 * Title is itself duplicated).
 */
export const buildOrgTree = (employees) => {
    if (!employees || employees.length === 0) return [];

    const nodeId = (emp) => emp.__id || emp['Title']?.trim();

    const empMap = {};
    employees.forEach(emp => {
        const id = nodeId(emp);
        if (id) {
            empMap[id] = { ...emp, children: [] };
        }
    });

    // First employee found for each Title, used to resolve "Reporting To".
    const managerIdByTitle = {};
    employees.forEach(emp => {
        const title = emp['Title']?.trim();
        if (title && !(title in managerIdByTitle)) {
            managerIdByTitle[title] = nodeId(emp);
        }
    });

    const roots = [];
    const seenIds = new Set();

    employees.forEach(originalEmp => {
        const id = nodeId(originalEmp);
        if (!id || !empMap[id]) return;

        const managerTitle = originalEmp['Reporting To']?.trim();
        const managerId = managerTitle ? managerIdByTitle[managerTitle] : null;

        if (managerId && empMap[managerId] && managerId !== id) {
            // Check if adding this child would create a cycle (simplified)
            // In a real app we'd do a full path check, but at least prevent direct self-reporting
            empMap[managerId].children.push(empMap[id]);
            seenIds.add(id);
        }
    });

    // Only nodes that haven't been added as children are roots
    employees.forEach(emp => {
        const id = nodeId(emp);
        if (id && empMap[id] && !seenIds.has(id)) {
            roots.push(empMap[id]);
        }
    });

    return roots.filter(Boolean);
};

/**
 * Builds a hierarchical tree of groups (Departments or Teams).
 *
 * Groups are identified by a "leader" employee's `__id`, not by the raw
 * group name — two different branches of the org can have, say, a "Support"
 * team under two different departments, or a Team and a Department can
 * literally share a name. Keying by name alone would merge those unrelated
 * groups into a single node (silently losing one of them, since only one
 * parent link can win), which is exactly what used to happen. A group's
 * "leader" is the topmost employee in its reporting chain who still shares
 * its group value, found by walking up "Reporting To" while the value
 * doesn't change; that employee's `__id` is unique and stable, so it makes
 * a safe group key regardless of what two unrelated groups are named.
 */
export const buildGroupTree = (employees, groupField) => {
    if (!employees || employees.length === 0) return [];

    const byId = {};
    employees.forEach(e => { if (e.__id) byId[e.__id] = e; });

    // First employee found for each Title, used to resolve "Reporting To".
    const managerIdByTitle = {};
    employees.forEach(e => {
        const title = e['Title']?.trim();
        if (title && !(title in managerIdByTitle)) managerIdByTitle[title] = e.__id;
    });

    const groupValue = (emp) => (emp[groupField] || 'Unassigned').trim();
    const managerOf = (emp) => {
        const managerTitle = emp['Reporting To']?.trim();
        const managerId = managerTitle ? managerIdByTitle[managerTitle] : null;
        return managerId ? byId[managerId] : null;
    };

    const leaderIdCache = {};
    const resolveLeaderId = (emp, guard) => {
        if (!emp || !emp.__id) return null;
        if (leaderIdCache[emp.__id]) return leaderIdCache[emp.__id];
        const seen = guard || new Set();
        if (seen.has(emp.__id)) return emp.__id; // cycle guard
        seen.add(emp.__id);

        const manager = managerOf(emp);
        const leaderId = (manager && groupValue(manager) === groupValue(emp))
            ? resolveLeaderId(manager, seen)
            : emp.__id;

        leaderIdCache[emp.__id] = leaderId;
        return leaderId;
    };

    // 1. Group employees by their contiguous same-value reporting chain.
    const groups = {};
    employees.forEach(emp => {
        const leaderId = resolveLeaderId(emp) || emp.__id;
        if (!groups[leaderId]) {
            groups[leaderId] = {
                id: leaderId,
                name: groupValue(emp),
                employees: [],
                children: [],
                parentGroup: null
            };
        }
        groups[leaderId].employees.push(emp);
    });

    // 2. Determine inter-group hierarchy: each group's parent is whichever
    // group its leader's own manager belongs to.
    Object.entries(groups).forEach(([leaderId, group]) => {
        const leader = byId[leaderId];
        const manager = leader && managerOf(leader);
        if (!manager) return;
        const managerLeaderId = resolveLeaderId(manager);
        if (managerLeaderId && managerLeaderId !== leaderId) {
            group.parentGroup = managerLeaderId;
        }
    });

    // 3. Assemble tree
    const roots = [];
    const addedAsChild = new Set();

    Object.entries(groups).forEach(([leaderId, group]) => {
        if (group.parentGroup && groups[group.parentGroup]) {
            groups[group.parentGroup].children.push(group);
            addedAsChild.add(leaderId);
        }
    });

    Object.entries(groups).forEach(([leaderId, group]) => {
        if (!addedAsChild.has(leaderId)) {
            roots.push(group);
        }
    });

    return roots;
};
