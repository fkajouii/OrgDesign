import React from 'react';
import { Users, User } from 'lucide-react';
import { useOrgStore } from '../store/orgStore';

export default function GroupNode({ data, type }) {
    const { name, employees } = data;
    const { showNamesInGroups } = useOrgStore();

    // Sort employees by Title
    const sortedEmployees = [...employees].sort((a, b) => (a.Title || '').localeCompare(b.Title || ''));

    const getGroupColor = (name) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 85%, 40%)`;
    };

    const groupColor = getGroupColor(name);

    return (
        <div className="glass-panel" style={{
            minWidth: '240px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: `2px solid ${groupColor}`,
            borderTop: `10px solid ${groupColor}`,
            animation: 'fadeIn 0.3s ease-out',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
            <div style={{ padding: '12px 16px', background: 'rgba(var(--hue-primary), 100%, 100%, 0.05)' }}>
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
                background: 'rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
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
                            {showNamesInGroups && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                    {emp.Name || 'Unassigned'}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
