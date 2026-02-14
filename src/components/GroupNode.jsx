import React from 'react';
import { Users, User } from 'lucide-react';

export default function GroupNode({ data, type }) {
    const { name, employees } = data;

    // Sort employees by Title
    const sortedEmployees = [...employees].sort((a, b) => (a.Title || '').localeCompare(b.Title || ''));

    const getGroupColor = (name) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 45%)`;
    };

    const groupColor = getGroupColor(name);

    return (
        <div className="glass-panel" style={{
            minWidth: '240px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: `1px solid ${groupColor}`,
            borderTop: `6px solid ${groupColor}`,
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Users size={16} style={{ color: groupColor }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>
                        {type}
                    </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {name}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {employees.length} {employees.length === 1 ? 'Member' : 'Members'}
                </p>
            </div>

            <div style={{
                padding: '8px 16px',
                background: 'rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '200px',
                overflowY: 'auto'
            }}>
                {sortedEmployees.map((emp, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 0',
                        borderBottom: i === sortedEmployees.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <User size={12} style={{ opacity: 0.5 }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                                {emp.Title}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                {emp.Name || 'Unassigned'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
