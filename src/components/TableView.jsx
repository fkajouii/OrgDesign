import React from 'react';
import { useOrgStore } from '../store/orgStore.js';
import { Trash2, Plus } from 'lucide-react';

const CELL_STYLE = {
    width: '100%',
    padding: '8px 10px',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text-main)',
    fontSize: '0.85rem',
    fontFamily: 'inherit'
};

function EditableCell({ value, onChange, placeholder, as = 'input' }) {
    const Tag = as === 'textarea' ? 'textarea' : 'input';
    return (
        <Tag
            value={value || ''}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            rows={as === 'textarea' ? 1 : undefined}
            style={{
                ...CELL_STYLE,
                resize: as === 'textarea' ? 'vertical' : undefined,
                minHeight: as === 'textarea' ? '36px' : undefined
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
        />
    );
}

const COLUMNS = [
    { key: 'Name', label: 'Name', width: '160px' },
    { key: 'Title', label: 'Title', width: '160px' },
    { key: 'Department', label: 'Department', width: '140px' },
    { key: 'Team', label: 'Team', width: '140px' },
    { key: 'Reporting To', label: 'Reporting To', width: '160px' },
    { key: 'Accountabilities', label: 'Accountabilities', width: '220px', textarea: true },
    { key: 'Metrics', label: 'Metrics', width: '220px', textarea: true }
];

export default function TableView() {
    const { employees, updateEmployeeField, addEmployeeRow, removeEmployeeAt } = useOrgStore();

    return (
        <div className="glass-panel" style={{
            margin: '0 auto 40px',
            maxWidth: '1400px',
            padding: '16px',
            overflowX: 'auto'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>Employee Table</h3>
                <button
                    onClick={addEmployeeRow}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 12px',
                        background: 'var(--color-primary)',
                        color: 'var(--color-bg-base)',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                    }}
                >
                    <Plus size={14} /> Add Row
                </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
                <thead>
                    <tr>
                        {COLUMNS.map(col => (
                            <th key={col.key} style={{
                                textAlign: 'left',
                                padding: '8px 10px',
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                color: 'var(--color-text-muted)',
                                borderBottom: '1px solid var(--color-border)',
                                width: col.width
                            }}>
                                {col.label}
                            </th>
                        ))}
                        <th style={{ width: '48px', borderBottom: '1px solid var(--color-border)' }} />
                    </tr>
                </thead>
                <tbody>
                    {employees.map((emp, index) => (
                        <tr key={`${emp['Title'] || 'row'}-${index}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            {COLUMNS.map(col => {
                                if (col.key === 'Reporting To') {
                                    const options = employees
                                        .map(e => e['Title'])
                                        .filter(t => t && t !== emp['Title']);
                                    return (
                                        <td key={col.key} style={{ padding: '2px' }}>
                                            <select
                                                value={emp['Reporting To'] || ''}
                                                onChange={(e) => updateEmployeeField(index, 'Reporting To', e.target.value)}
                                                style={CELL_STYLE}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                                onBlur={(e) => e.target.style.borderColor = 'transparent'}
                                            >
                                                <option value="">(None)</option>
                                                {options.map(title => (
                                                    <option key={title} value={title}>{title}</option>
                                                ))}
                                            </select>
                                        </td>
                                    );
                                }
                                return (
                                    <td key={col.key} style={{ padding: '2px' }}>
                                        <EditableCell
                                            value={emp[col.key]}
                                            placeholder={col.label}
                                            as={col.textarea ? 'textarea' : 'input'}
                                            onChange={(val) => updateEmployeeField(index, col.key, val)}
                                        />
                                    </td>
                                );
                            })}
                            <td style={{ padding: '2px', textAlign: 'center' }}>
                                <button
                                    onClick={() => {
                                        if (window.confirm(`Delete "${emp['Name'] || emp['Title']}"?`)) {
                                            removeEmployeeAt(index);
                                        }
                                    }}
                                    title="Delete row"
                                    style={{
                                        background: 'transparent',
                                        color: 'hsl(var(--hue-error), 80%, 60%)',
                                        padding: '6px'
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {employees.length === 0 && (
                <p style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No employees yet. Click "Add Row" to get started.
                </p>
            )}
        </div>
    );
}
