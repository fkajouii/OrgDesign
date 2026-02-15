import React from 'react';
import { User, Users, CheckCircle, Activity, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useOrgStore } from '../store/orgStore.js';

export default function EmployeeNode({ data, style, onDragStart, onDrop }) {
    const {
        exportSettings,
        deleteEmployee,
        expandedAccountabilities,
        expandedMetrics,
        toggleAccountability,
        toggleMetric
    } = useOrgStore();
    const { visibleFields } = exportSettings;

    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', data['Title']);
        e.dataTransfer.effectAllowed = 'move';
        if (onDragStart) onDragStart(data);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const draggedTitle = e.dataTransfer.getData('text/plain');
        if (onDrop) onDrop(draggedTitle, data['Title']);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete ${data['Title']}?`)) {
            deleteEmployee(data['Title']);
        }
    };

    const getDepartmentColor = (dept) => {
        if (!dept) return 'var(--color-primary)';
        let hash = 0;
        for (let i = 0; i < dept.length; i++) {
            hash = dept.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 45%)`; // Darker for text/header stability
    };

    const deptColor = getDepartmentColor(data['Department']);

    return (
        <div
            className="glass-panel"
            draggable="true"
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
                minWidth: '220px',
                maxWidth: '280px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'grab',
                transition: 'transform 0.2s, box-shadow 0.2s',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                ...style
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
                const deleteBtn = e.currentTarget.querySelector('.delete-btn');
                if (deleteBtn) deleteBtn.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                const deleteBtn = e.currentTarget.querySelector('.delete-btn');
                if (deleteBtn) deleteBtn.style.opacity = '0';
            }}
        >
            {/* Department Label Header */}
            {visibleFields.includes('Department') && data['Department'] && (
                <div style={{
                    background: deptColor,
                    color: 'white',
                    padding: '4px 12px',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    {data['Department']}
                    <button
                        className="delete-btn"
                        onClick={handleDelete}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            padding: '2px'
                        }}
                        title="Delete Employee"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            )}

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                    {visibleFields.includes('Title') && (
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                            {data['Title']}
                        </h3>
                    )}
                    {visibleFields.includes('Name') && (
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-accent)' }}>
                            {data['Name'] || 'Unassigned'}
                        </p>
                    )}
                </div>

                {(visibleFields.includes('Department') || visibleFields.includes('Team')) && (
                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {visibleFields.includes('Department') && data['Department'] && (
                            <span style={{
                                background: 'var(--color-bg-subtle)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                {data['Department']}
                            </span>
                        )}
                        {visibleFields.includes('Team') && data['Team'] && (
                            <span style={{
                                background: 'var(--color-bg-subtle)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                {data['Team']}
                            </span>
                        )}
                    </div>
                )}

                {(visibleFields.includes('Accountabilities') || visibleFields.includes('Metrics')) && (data['Accountabilities'] || data['Metrics']) && (
                    <div style={{
                        marginTop: 'auto',
                        paddingTop: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        {visibleFields.includes('Accountabilities') && data['Accountabilities'] && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div
                                    onClick={(e) => { e.stopPropagation(); toggleAccountability(data['Title']); }}
                                    style={{
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        color: 'var(--color-primary)'
                                    }}
                                >
                                    <div style={{ opacity: 0.8 }}>
                                        <CheckCircle size={14} strokeWidth={2.5} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Accountabilities</span>
                                    <div style={{ marginLeft: 'auto', opacity: 0.5 }}>
                                        {expandedAccountabilities.has(data['Title']) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </div>
                                </div>
                                {expandedAccountabilities.has(data['Title']) && (
                                    <p style={{
                                        fontSize: '0.78rem',
                                        color: 'var(--color-text-main)',
                                        lineHeight: '1.4',
                                        margin: 0,
                                        fontWeight: 400,
                                        whiteSpace: 'pre-wrap',
                                        paddingLeft: '22px'
                                    }}>
                                        {data['Accountabilities']}
                                    </p>
                                )}
                            </div>
                        )}
                        {visibleFields.includes('Metrics') && data['Metrics'] && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div
                                    onClick={(e) => { e.stopPropagation(); toggleMetric(data['Title']); }}
                                    style={{
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        background: 'var(--color-bg-subtle)',
                                        borderRadius: '6px',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-accent)'
                                    }}
                                >
                                    <div style={{ opacity: 0.8 }}>
                                        <Activity size={14} strokeWidth={2.5} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Metrics</span>
                                    <div style={{ marginLeft: 'auto', opacity: 0.5 }}>
                                        {expandedMetrics.has(data['Title']) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </div>
                                </div>
                                {expandedMetrics.has(data['Title']) && (
                                    <p style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--color-text-accent)',
                                        lineHeight: '1.4',
                                        margin: 0,
                                        fontWeight: 600,
                                        letterSpacing: '0.01em',
                                        whiteSpace: 'pre-wrap',
                                        paddingLeft: '30px',
                                        marginTop: '4px'
                                    }}>
                                        {data['Metrics']}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
