import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore.js';
import { GoogleSheetsService } from '../services/googleSheets';
import { Link, Database, ArrowRight, Loader2, FileUp } from 'lucide-react';

export default function ConnectSheet() {
    const [url, setUrl] = useState('https://docs.google.com/spreadsheets/d/...../edit?usp=sharing');
    const { loadFromPublicUrl, setScenarios, loading, error } = useOrgStore();

    const handleConnect = async (e) => {
        e.preventDefault();
        if (!url) return;
        await loadFromPublicUrl(url, GoogleSheetsService);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const scenarios = await GoogleSheetsService.processLocalFile(file);
            setScenarios(scenarios);
        } catch (err) {
            console.error("File upload error:", err);
            alert("Failed to process file: " + err.message);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', width: '100%', padding: '20px' }}>
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
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                        To avoid proxy issues in production, you can upload an Excel or CSV file directly.
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
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <>Connect via Proxy <ArrowRight size={20} /></>}
                    </button>
                </form>

                <div style={{
                    margin: '24px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.8rem'
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                    <span>OR UPLOAD A FILE</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                </div>

                <div style={{ position: 'relative' }}>
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            opacity: 0,
                            cursor: 'pointer',
                            zIndex: 2
                        }}
                    />
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '24px',
                        background: 'var(--color-bg-subtle)',
                        border: '2px dashed var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-main)',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                            e.currentTarget.style.background = 'var(--color-bg-card-hover)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                            e.currentTarget.style.background = 'var(--color-bg-subtle)';
                        }}
                    >
                        <FileUp size={32} color="var(--color-text-muted)" />
                        <div>
                            <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>Choose Excel or CSV</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Drag and drop or click to browse</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div style={{
                        marginTop: '20px',
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
                        <summary style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Required Columns</summary>

                        <div style={{ marginTop: '12px', lineHeight: '1.6' }}>
                            <p style={{ marginBottom: '8px' }}>Your file must have these exact headers:</p>

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
                                <li><strong>Reporting To</strong>: Must match a <em>Title</em> of another entry.</li>
                                <li>Each <strong>Excel Tab</strong> will be imported as a separate <strong>Scenario</strong>.</li>
                            </ul>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
}
