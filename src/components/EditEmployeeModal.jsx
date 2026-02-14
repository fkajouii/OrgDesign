import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore.js';
import { X, Save } from 'lucide-react';

export default function EditEmployeeModal({ employee, onClose, onSave }) {
    const [formData, setFormData] = useState({ ...employee });
    const { employees, deleteEmployee } = useOrgStore();

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(employee['Title'], formData); // Use original Title as ID
    };

    // Get unique titles for the dropdown, excluding current employee's title to avoid loops
    const availableTitles = employees
        .map(e => e['Title'])
        .filter(t => t && t !== employee['Title'])
        .sort();

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
        }}>
            <div className="glass-panel" style={{
                width: '500px',
                maxWidth: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '24px',
                animation: 'fadeIn 0.2s ease-out'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.25rem' }}>Edit Employee</h2>
                    <button onClick={onClose} style={{ background: 'transparent', color: 'var(--color-text-muted)' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {['Name', 'Title'].map(field => (
                        <div key={field}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                {field}
                            </label>
                            <input
                                type="text"
                                value={formData[field] || ''}
                                onChange={(e) => handleChange(field, e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: 'var(--color-bg-base)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--color-text-main)'
                                }}
                            />
                        </div>
                    ))}

                    {['Department', 'Team'].map(field => {
                        const uniqueValues = Array.from(new Set(employees.map(e => e[field]).filter(Boolean))).sort();
                        const currentValue = formData[field] || '';
                        const isNewValue = currentValue && !uniqueValues.includes(currentValue);

                        return (
                            <div key={field}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                    {field}
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <select
                                        value={uniqueValues.includes(currentValue) ? currentValue : (currentValue ? 'ADD_NEW' : '')}
                                        onChange={(e) => {
                                            if (e.target.value === 'ADD_NEW') {
                                                handleChange(field, '');
                                            } else {
                                                handleChange(field, e.target.value);
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: 'var(--color-bg-base)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: 'var(--color-text-main)'
                                        }}
                                    >
                                        <option value="">(None)</option>
                                        {uniqueValues.map(val => (
                                            <option key={val} value={val}>{val}</option>
                                        ))}
                                        <option value="ADD_NEW">+ Add New...</option>
                                    </select>

                                    {(!uniqueValues.includes(currentValue) || currentValue === '') && (
                                        <input
                                            type="text"
                                            placeholder={`Type new ${field}...`}
                                            value={currentValue}
                                            onChange={(e) => handleChange(field, e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                background: 'var(--color-bg-base)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-sm)',
                                                color: 'var(--color-text-main)'
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                            Reporting To
                        </label>
                        <select
                            value={formData['Reporting To'] || ''}
                            onChange={(e) => handleChange('Reporting To', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                background: 'var(--color-bg-base)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="">(None)</option>
                            {availableTitles.map(title => (
                                <option key={title} value={title}>{title}</option>
                            ))}
                        </select>
                    </div>


                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {['Accountabilities', 'Metrics'].map(field => (
                            <div key={field}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                    {field} (comma sep)
                                </label>
                                <textarea
                                    value={formData[field] || ''}
                                    onChange={(e) => handleChange(field, e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'var(--color-bg-base)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--color-text-main)',
                                        minHeight: '80px',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '12px' }}>
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
                                    deleteEmployee(employee['Title']);
                                    onClose();
                                }
                            }}
                            style={{
                                padding: '10px 16px',
                                background: 'transparent',
                                border: '1px solid #ef4444',
                                borderRadius: 'var(--radius-sm)',
                                color: '#ef4444',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Delete Employee
                        </button>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    padding: '10px 16px',
                                    background: 'transparent',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--color-text-main)',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    background: 'var(--color-primary)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--color-bg-base)',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}
