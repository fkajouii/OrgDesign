import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore';
import { GoogleSheetsService } from '../services/googleSheets';
import { Link, Database, ArrowRight, Loader2 } from 'lucide-react';

export default function ConnectSheet() {
    const [url, setUrl] = useState('https://docs.google.com/spreadsheets/d/11g6sOMelVMpbzR-ClVIHnyNH6XhZ_oIF5FdFU6zubHM/edit?usp=sharing');
    const { loadFromPublicUrl, loading, error } = useOrgStore();

    const handleConnect = async (e) => {
        e.preventDefault();
        if (!url) return;
        await loadFromPublicUrl(url, GoogleSheetsService);
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', width: '100%' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: 'var(--space-xl)' }}>

                <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                    <div className="flex-center" style={{
                        width: '64px', height: '64px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-bg-subtle)',
                        margin: '0 auto var(--space-md)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <Database size={32} color="var(--color-primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-sm)' }}>Connect Data Source</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Link your public Google Sheet to visualize your organization.
                    </p>
                </div>

                <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Google Sheet Public URL
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Link size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="text"
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    background: 'var(--color-bg-base)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--color-text-main)',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            background: 'hsl(var(--hue-error), 20%, 10%)',
                            border: '1px solid hsl(var(--hue-error), 50%, 20%)',
                            color: 'hsl(var(--hue-error), 80%, 70%)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.875rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '14px',
                            background: 'var(--color-primary)',
                            color: 'var(--color-bg-base)',
                            fontWeight: '600',
                            borderRadius: 'var(--radius-sm)',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <>Connect <ArrowRight size={20} /></>}
                    </button>
                </form>

                <div style={{ marginTop: 'var(--space-lg)' }}>
                    <details style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        background: 'var(--color-bg-base)',
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <summary style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Required Sheet Format</summary>

                        <div style={{ marginTop: '12px', lineHeight: '1.6' }}>
                            <p style={{ marginBottom: '8px' }}>Your sheet must have these exact column headers:</p>

                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '6px',
                                marginBottom: '12px'
                            }}>
                                {['Name', 'Title', 'Department', 'Team', 'Reporting To', 'Accountabilities', 'Metrics'].map(h => (
                                    <span key={h} style={{
                                        padding: '2px 8px',
                                        background: 'var(--color-bg-subtle)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        color: 'var(--color-primary)'
                                    }}>
                                        {h}
                                    </span>
                                ))}
                            </div>

                            <p style={{ marginBottom: '4px' }}><strong>Note:</strong></p>
                            <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                                <li><strong>Reporting To</strong>: Must match a <em>Title</em> of another employee (or leave empty).</li>
                                <li><strong>Accountabilities</strong>: Comma-separated list.</li>
                                <li><strong>Metrics</strong>: Comma-separated list.</li>
                            </ul>
                        </div>
                    </details>

                    <p style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Make sure your sheet is set to "Anyone with the link".
                    </p>
                </div>
            </div>
        </div>
    );
}
