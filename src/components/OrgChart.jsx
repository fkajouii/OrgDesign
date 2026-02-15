import React, { useState, useMemo, useRef } from 'react';
import { useOrgStore } from '../store/orgStore.js';
import { buildOrgTree, buildGroupTree } from '../utils/orgTree';
import EmployeeNode from './EmployeeNode';
import GroupNode from './GroupNode';
import EditEmployeeModal from './EditEmployeeModal';
import ExportModal from './ExportModal';
import '../styles/org-tree.css';

import { ZoomIn, ZoomOut, Maximize, ChevronDown, ChevronUp, Maximize2, Minimize2, Camera, User, Users, Briefcase, CheckCircle, Activity } from 'lucide-react';

const TreeNode = ({ node, onNodeClick, onDrop, onDragStart, collapsedNodes, toggleCollapse, vizMode }) => {
    if (!node) return null;
    const hasChildren = node.children && node.children.length > 0;
    const nodeKey = vizMode === 'employee' ? node.Title : node.name;
    const isCollapsed = collapsedNodes.has(nodeKey);

    return (
        <li>
            <div style={{ position: 'relative' }}>
                <div className="node-card" onClick={(e) => {
                    e.stopPropagation();
                    if (vizMode === 'employee') onNodeClick(node);
                }}>
                    {vizMode === 'employee' ? (
                        <EmployeeNode
                            data={node}
                            onDragStart={onDragStart}
                            onDrop={onDrop}
                        />
                    ) : (
                        <GroupNode
                            data={node}
                            type={vizMode === 'team' ? 'Team' : 'Department'}
                        />
                    )}
                </div>
                {hasChildren && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleCollapse(nodeKey);
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
                        title={isCollapsed ? `Show ${node.children.length} sub-group(s)` : 'Hide'}
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
                            vizMode={vizMode}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

export default function OrgChart() {
    const {
        employees,
        updateEmployee,
        vizMode,
        setVizMode,
        expandAllAccountabilities,
        expandAllMetrics,
        expandedAccountabilities,
        expandedMetrics
    } = useOrgStore();
    const [editingNode, setEditingNode] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
    const [collapsedNodes, setCollapsedNodes] = useState(new Set());
    const [showExportModal, setShowExportModal] = useState(false);

    const toggleCollapse = (nodeKey) => {
        setCollapsedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeKey)) {
                newSet.delete(nodeKey);
            } else {
                newSet.add(nodeKey);
            }
            return newSet;
        });
    };

    const treeRoots = useMemo(() => {
        try {
            if (!employees || employees.length === 0) return [];
            if (vizMode === 'employee') return buildOrgTree(employees);
            if (vizMode === 'team') return buildGroupTree(employees, 'Team');
            if (vizMode === 'department') return buildGroupTree(employees, 'Department');
            return [];
        } catch (err) {
            console.error("Tree building error:", err);
            return [];
        }
    }, [employees, vizMode]);

    const handleExpandCollapseAll = () => {
        try {
            const getAllKeys = (nodes) => {
                let keys = [];
                nodes?.forEach(node => {
                    if (node && node.children && node.children.length > 0) {
                        const key = vizMode === 'employee' ? node.Title : node.name;
                        if (key) keys.push(key);
                        keys = [...keys, ...getAllKeys(node.children)];
                    }
                });
                return keys;
            };
            const allKeys = getAllKeys(treeRoots);
            const hasExpanded = allKeys.some(k => !collapsedNodes.has(k));
            setCollapsedNodes(hasExpanded ? new Set(allKeys) : new Set());
        } catch (err) {
            console.log("Collapse toggle error:", err);
        }
    };

    const departments = useMemo(() => {
        if (!Array.isArray(employees)) return [];
        const depts = new Set();
        employees.forEach(emp => {
            if (emp && emp['Department']) depts.add(emp['Department']);
        });
        return Array.from(depts).sort();
    }, [employees]);

    const getDepartmentColor = (dept) => {
        if (!dept) return 'var(--color-primary)';
        let hash = 0;
        const s = String(dept);
        for (let i = 0; i < s.length; i++) {
            hash = s.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 45%)`;
    };

    const handleSave = (originalTitle, data) => {
        updateEmployee(originalTitle, data);
        setEditingNode(null);
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.4));
    const handleResetZoom = () => setZoom(1);

    const IsDescendant = (possibleAncestorTitle, targetTitle) => {
        if (possibleAncestorTitle === targetTitle) return true;
        let current = employees.find(e => e['Title'] === targetTitle);
        while (current && current['Reporting To']) {
            if (current['Reporting To'] === possibleAncestorTitle) return true;
            current = employees.find(e => e['Title'] === current['Reporting To']);
            if (current && current['Title'] === targetTitle) break;
        }
        return false;
    };

    const handleDropNode = (draggedTitle, targetTitle) => {
        if (vizMode !== 'employee') return; // Only allow drag-drop in employee mode
        if (draggedTitle === targetTitle) return;
        if (IsDescendant(draggedTitle, targetTitle)) {
            alert("Cannot move a manager to report to their own subordinate.");
            return;
        }
        const employee = employees.find(e => e['Title'] === draggedTitle);
        if (employee) {
            updateEmployee(draggedTitle, { ...employee, 'Reporting To': targetTitle });
        }
    };

    const handleDropBackground = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (vizMode === 'employee' && draggedItem) {
            handleDropNode(draggedItem['Title'], "");
        }
    };

    const handleDragOverBackground = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleMouseDown = (e) => {
        const isInteractiveElement =
            e.target.tagName === 'BUTTON' ||
            e.target.tagName === 'INPUT' ||
            e.target.closest('.glass-panel') ||
            e.target.closest('button');

        if (!isInteractiveElement) {
            setIsDragging(true);
            setDragStart({
                x: e.pageX - containerRef.current.offsetLeft,
                y: e.pageY - containerRef.current.offsetTop,
                scrollLeft: containerRef.current.scrollLeft,
                scrollTop: containerRef.current.scrollTop
            });
        }
    };

    const handleMouseLeaveOrUp = () => setIsDragging(false);

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const x = e.pageX - containerRef.current.offsetLeft;
        const y = e.pageY - containerRef.current.offsetTop;
        const walkX = (x - dragStart.x);
        const walkY = (y - dragStart.y);
        containerRef.current.scrollLeft = dragStart.scrollLeft - walkX;
        containerRef.current.scrollTop = dragStart.scrollTop - walkY;
    };

    const handleWheel = (e) => {
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
                    title={collapsedNodes.size > 0 ? "Expand All Nodes" : "Collapse All Nodes"}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)', padding: '4px' }}
                >
                    {collapsedNodes.size > 0 ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

                <button
                    onClick={() => expandAllAccountabilities(expandedAccountabilities.size === 0)}
                    title={expandedAccountabilities.size === 0 ? "Expand All Accountabilities" : "Collapse All Accountabilities"}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: expandedAccountabilities.size > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        padding: '4px'
                    }}
                >
                    <CheckCircle size={18} />
                </button>
                <button
                    onClick={() => expandAllMetrics(expandedMetrics.size === 0)}
                    title={expandedMetrics.size === 0 ? "Expand All Metrics" : "Collapse All Metrics"}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: expandedMetrics.size > 0 ? 'var(--color-text-accent)' : 'var(--color-text-muted)',
                        padding: '4px'
                    }}
                >
                    <Activity size={18} />
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
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <button
                    onClick={() => setShowExportModal(true)}
                    title="Export Image/PDF"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '4px' }}
                >
                    <Camera size={18} />
                </button>
            </div>

            {/* View Mode Toggle */}
            <div className="glass-panel" style={{
                position: 'fixed',
                bottom: '24px',
                left: '24px',
                display: 'flex',
                gap: '4px',
                padding: '4px',
                zIndex: 100,
                border: '1px solid var(--color-border)'
            }}>
                {[
                    { mode: 'employee', icon: User, label: 'Employees' },
                    { mode: 'team', icon: Users, label: 'Teams' },
                    { mode: 'department', icon: Briefcase, label: 'Depts' }
                ].map((item) => (
                    <button
                        key={item.mode}
                        onClick={() => setVizMode(item.mode)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            background: vizMode === item.mode ? 'var(--color-primary)' : 'transparent',
                            color: vizMode === item.mode ? 'var(--color-bg-base)' : 'var(--color-text-muted)',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                    >
                        <item.icon size={16} />
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Department Legend */}
            {vizMode === 'employee' && (
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
            )}

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
                                vizMode={vizMode}
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
            {showExportModal && (
                <ExportModal
                    onClose={() => setShowExportModal(false)}
                    chartRef={containerRef}
                />
            )}
        </div>
    );
}
