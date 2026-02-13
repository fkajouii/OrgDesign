import React, { useMemo, useState, useRef } from 'react';
import { useOrgStore } from '../store/orgStore';
import { buildOrgTree } from '../utils/orgTree';
import EmployeeNode from './EmployeeNode';
import EditEmployeeModal from './EditEmployeeModal';
import '../styles/org-tree.css';

import { ZoomIn, ZoomOut, Maximize, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';

const TreeNode = ({ node, onNodeClick, onDrop, onDragStart, collapsedNodes, toggleCollapse }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node.Title);

    return (
        <li>
            <div style={{ position: 'relative' }}>
                <div className="node-card" onClick={(e) => { e.stopPropagation(); onNodeClick(node); }}>
                    <EmployeeNode
                        data={node}
                        onDragStart={onDragStart}
                        onDrop={onDrop}
                    />
                </div>
                {hasChildren && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleCollapse(node.Title);
                        }}
                        style={{
                            position: 'absolute',
                            bottom: '-12px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'var(--color-primary)',
                            color: 'var(--color-bg-base)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                        }}
                        title={isCollapsed ? `Show ${node.children.length} direct report(s)` : 'Hide direct reports'}
                    >
                        {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                )}
            </div>
            {hasChildren && !isCollapsed && (
                <ul>
                    {node.children.map((child, index) => (
                        <TreeNode
                            key={index}
                            node={child}
                            onNodeClick={onNodeClick}
                            onDrop={onDrop}
                            onDragStart={onDragStart}
                            collapsedNodes={collapsedNodes}
                            toggleCollapse={toggleCollapse}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

export default function OrgChart() {
    const { employees, updateEmployee } = useOrgStore();
    const [editingNode, setEditingNode] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
    const [collapsedNodes, setCollapsedNodes] = useState(new Set());

    const toggleCollapse = (nodeTitle) => {
        setCollapsedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeTitle)) {
                newSet.delete(nodeTitle);
            } else {
                newSet.add(nodeTitle);
            }
            return newSet;
        });
    };

    // Helper function to get all node titles that have children
    const getAllNodesWithChildren = (nodes) => {
        const titles = [];
        const traverse = (node) => {
            if (node.children && node.children.length > 0) {
                titles.push(node.Title);
                node.children.forEach(traverse);
            }
        };
        nodes.forEach(traverse);
        return titles;
    };

    const handleExpandCollapseAll = () => {
        const allNodesWithChildren = getAllNodesWithChildren(treeRoots);

        // If any nodes are expanded, collapse all. Otherwise, expand all.
        const hasExpandedNodes = allNodesWithChildren.some(title => !collapsedNodes.has(title));

        if (hasExpandedNodes) {
            // Collapse all
            setCollapsedNodes(new Set(allNodesWithChildren));
        } else {
            // Expand all
            setCollapsedNodes(new Set());
        }
    };

    const treeRoots = useMemo(() => buildOrgTree(employees), [employees]);

    const departments = useMemo(() => {
        const depts = new Set();
        employees.forEach(emp => {
            if (emp['Department']) depts.add(emp['Department']);
        });
        return Array.from(depts).sort();
    }, [employees]);

    const getDepartmentColor = (dept) => {
        if (!dept) return 'var(--color-primary)';
        let hash = 0;
        for (let i = 0; i < dept.length; i++) {
            hash = dept.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 65%)`;
    };

    const handleSave = (originalTitle, data) => {
        updateEmployee(originalTitle, data);
        setEditingNode(null);
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.4));
    const handleResetZoom = () => setZoom(1);

    /**
     * Checks if 'targetTitle' is a descendant of 'possibleAncestorTitle'.
     * Used to prevent cycles (e.g., A cannot report to B if B is a child of A).
     */
    const IsDescendant = (possibleAncestorTitle, targetTitle) => {
        if (possibleAncestorTitle === targetTitle) return true; // Self

        // Find target employee object
        let current = employees.find(e => e['Title'] === targetTitle);

        // Traverse up the chain
        while (current && current['Reporting To']) {
            if (current['Reporting To'] === possibleAncestorTitle) return true;
            current = employees.find(e => e['Title'] === current['Reporting To']);
            // Break if circular references already exist (safety break)
            if (current && current['Title'] === targetTitle) break;
        }
        return false;
    };

    const handleDropNode = (draggedTitle, targetTitle) => {
        if (draggedTitle === targetTitle) return; // Dropped on self

        // Check for cycles: Can't drop Parent onto Child
        if (IsDescendant(draggedTitle, targetTitle)) {
            alert("Cannot move a manager to report to their own subordinate.");
            return;
        }

        // Update the store
        const employee = employees.find(e => e['Title'] === draggedTitle);
        if (employee) {
            updateEmployee(draggedTitle, { ...employee, 'Reporting To': targetTitle });
        }
    };

    const handleDropBackground = (e) => {
        e.preventDefault();
        e.stopPropagation(); // If it bubbled here, it wasn't handled by a node
        // Make root only if data was dragged
        if (draggedItem) {
            handleDropNode(draggedItem['Title'], ""); // Empty string = No reporting manager = Root
        }
    };

    const handleDragOverBackground = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleMouseDown = (e) => {
        // Trigger panning unless clicking on interactive elements (buttons, inputs, or draggable nodes)
        // This allows panning by clicking on the background, UL elements, or LI elements
        const isInteractiveElement =
            e.target.tagName === 'BUTTON' ||
            e.target.tagName === 'INPUT' ||
            e.target.closest('.glass-panel') || // Don't pan when clicking on employee cards
            e.target.closest('button'); // Don't pan when clicking on any button

        if (!isInteractiveElement) {
            e.preventDefault(); // Prevent text selection while dragging
            setIsDragging(true);
            setDragStart({
                x: e.pageX - containerRef.current.offsetLeft,
                y: e.pageY - containerRef.current.offsetTop,
                scrollLeft: containerRef.current.scrollLeft,
                scrollTop: containerRef.current.scrollTop
            });
        }
    };

    const handleMouseLeaveOrUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - containerRef.current.offsetLeft;
        const y = e.pageY - containerRef.current.offsetTop;
        const walkX = (x - dragStart.x);
        const walkY = (y - dragStart.y);
        containerRef.current.scrollLeft = dragStart.scrollLeft - walkX;
        containerRef.current.scrollTop = dragStart.scrollTop - walkY;
    };

    const handleWheel = (e) => {
        // Check if Command key (metaKey on Mac) is pressed
        if (e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(prev => Math.max(0.4, Math.min(2, prev + delta)));
        }
    };

    if (!employees.length) return null;
    if (!treeRoots.length) return <div style={{ textAlign: 'center', padding: 40 }}>Could not determine hierarchy. Check "Reporting To" matches "Title".</div>;

    return (
        <div style={{ position: 'relative' }}>
            {/* Zoom Controls */}
            <div className="glass-panel" style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 100,
                display: 'flex',
                gap: '8px',
                padding: '8px',
                borderRadius: 'var(--radius-md)'
            }}>
                <button
                    onClick={handleExpandCollapseAll}
                    title={collapsedNodes.size > 0 ? "Expand All" : "Collapse All"}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)', padding: '4px' }}
                >
                    {collapsedNodes.size > 0 ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <button
                    onClick={handleZoomOut}
                    title="Zoom Out"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)', padding: '4px' }}
                >
                    <ZoomOut size={18} />
                </button>
                <button
                    onClick={handleResetZoom}
                    title="Reset Zoom"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, padding: '4px' }}
                >
                    {Math.round(zoom * 100)}%
                </button>
                <button
                    onClick={handleZoomIn}
                    title="Zoom In"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)', padding: '4px' }}
                >
                    <ZoomIn size={18} />
                </button>
            </div>

            {/* Department Legend */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'center',
                padding: '0 40px',
                marginBottom: '20px'
            }}>
                {departments.map(dept => (
                    <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: getDepartmentColor(dept) }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>{dept}</span>
                    </div>
                ))}
            </div>

            <div
                ref={containerRef}
                className="org-tree"
                style={{
                    overflow: 'auto',
                    minHeight: '600px',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: isDragging ? 'none' : 'auto',
                    position: 'relative'
                }}
                onDragOver={handleDragOverBackground}
                onDrop={handleDropBackground}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseLeaveOrUp}
                onMouseLeave={handleMouseLeaveOrUp}
                onWheel={handleWheel}
            >
                {/* Inner wrapper with padding to create scrollable area */}
                <div style={{
                    padding: '400px',
                    minWidth: 'max-content',
                    display: 'flex',
                    justifyContent: 'center'
                }}>
                    <ul style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.2s ease-out'
                    }}>
                        {treeRoots.map((root, index) => (
                            <TreeNode
                                key={index}
                                node={root}
                                onNodeClick={setEditingNode}
                                onDrop={handleDropNode}
                                onDragStart={setDraggedItem}
                                collapsedNodes={collapsedNodes}
                                toggleCollapse={toggleCollapse}
                            />
                        ))}
                    </ul>
                </div>
            </div>

            {editingNode && (
                <EditEmployeeModal
                    employee={editingNode}
                    onClose={() => setEditingNode(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
