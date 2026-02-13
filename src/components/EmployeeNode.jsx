import React from 'react';
import { User, Users, CheckCircle, Activity } from 'lucide-react';

export default function EmployeeNode({ data, style, onDragStart, onDrop }) {
    // data contains: Name, Title, Department, Team, Metrics, Accountabilities...

    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', data['Title']);
        e.dataTransfer.effectAllowed = 'move';
        if (onDragStart) onDragStart(data);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Stop bubbling up to parent nodes
        const draggedTitle = e.dataTransfer.getData('text/plain');
        if (onDrop) onDrop(draggedTitle, data['Title']);
    };

    // Generate a consistent color based on the department string
    const getDepartmentColor = (dept) => {
        if (!dept) return 'var(--color-primary)';
        let hash = 0;
        for (let i = 0; i < dept.length; i++) {
            hash = dept.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Use HSL for nice, consistent pastel-like colors
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 65%)`;
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
                padding: '16px',
                minWidth: '220px',
                maxWidth: '280px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                borderLeft: `4px solid ${deptColor}`,
                cursor: 'grab',
                transition: 'transform 0.2s, box-shadow 0.2s',
                ...style
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {data['Title']}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-accent)' }}>
                    {data['Name'] || 'Unassigned'}
                </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {data['Department'] && (
                    <span style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                    }}>
                        {data['Department']}
                    </span>
                )}
                {data['Team'] && (
                    <span style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                    }}>
                        {data['Team']}
                    </span>
                )}
            </div>

            {(data['Accountabilities'] || data['Metrics']) && (
                <div style={{
                    marginTop: 'auto',
                    paddingTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    {data['Accountabilities'] && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <div style={{ color: 'var(--color-primary)', opacity: 0.8, marginTop: '2px' }}>
                                <CheckCircle size={14} strokeWidth={2.5} />
                            </div>
                            <p style={{
                                fontSize: '0.78rem',
                                color: 'var(--color-text-main)',
                                lineHeight: '1.4',
                                margin: 0,
                                fontWeight: 400,
                                whiteSpace: 'pre-wrap'
                            }}>
                                {data['Accountabilities']}
                            </p>
                        </div>
                    )}
                    {data['Metrics'] && (
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'flex-start',
                            padding: '6px 8px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ color: 'var(--color-text-accent)', opacity: 0.8, marginTop: '2px' }}>
                                <Activity size={14} strokeWidth={2.5} />
                            </div>
                            <p style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-accent)',
                                lineHeight: '1.4',
                                margin: 0,
                                fontWeight: 600,
                                letterSpacing: '0.01em',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {data['Metrics']}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
