import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore.js';
import { ChevronDown, Check, Layers, Plus, Save, X } from 'lucide-react';

export default function ScenarioManager() {
    const {
        scenarios,
        activeScenarioId,
        switchScenario,
        createScenario
    } = useOrgStore();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newScenarioName, setNewScenarioName] = useState('');

    const scenarioNames = Object.keys(scenarios);
    if (scenarioNames.length === 0) return null;

    const handleCreate = () => {
        if (newScenarioName.trim()) {
            createScenario(newScenarioName.trim());
            setNewScenarioName('');
            setIsCreating(false);
            setIsMenuOpen(false);
        }
    };

    return (
        <div className="scenario-manager" style={{ position: 'relative', zIndex: 100 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div
                    className="glass-panel"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        minWidth: '200px',
                        justifyContent: 'space-between',
                        border: '1px solid var(--color-border)',
                        transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Layers size={16} color="var(--color-primary)" />
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                            <span style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                                Scenario
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{activeScenarioId}</span>
                        </div>
                    </div>
                    <ChevronDown size={16} style={{
                        transform: isMenuOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                        color: 'var(--color-text-muted)'
                    }} />
                </div>
            </div>

            {isMenuOpen && (
                <div
                    className="glass-panel"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '8px',
                        width: '260px',
                        padding: '8px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        animation: 'fadeIn 0.2s',
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)'
                    }}
                >
                    <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '8px' }}>
                        {scenarioNames.map((name) => (
                            <div
                                key={name}
                                onClick={() => {
                                    switchScenario(name);
                                    setIsMenuOpen(false);
                                }}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: activeScenarioId === name ? 'var(--color-bg-subtle)' : 'transparent',
                                    marginBottom: '2px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-card-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = activeScenarioId === name ? 'var(--color-bg-subtle)' : 'transparent'}
                            >
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: activeScenarioId === name ? 600 : 400 }}>{name}</span>
                                {activeScenarioId === name && <Check size={14} color="var(--color-primary)" />}
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '4px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                        {!isCreating ? (
                            <button
                                onClick={() => setIsCreating(true)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px',
                                    background: 'rgba(var(--hue-primary), 100%, 50%, 0.1)',
                                    color: 'var(--color-primary)',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600
                                }}
                            >
                                <Plus size={16} /> New Scenario
                            </button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Scenario name..."
                                    value={newScenarioName}
                                    onChange={e => setNewScenarioName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        background: 'var(--color-bg-base)',
                                        border: '1px solid var(--color-primary)',
                                        borderRadius: '6px',
                                        color: 'var(--color-text-main)',
                                        fontSize: '0.85rem'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        onClick={handleCreate}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            background: 'var(--color-primary)',
                                            color: 'white',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                        }}
                                    >
                                        <Save size={14} /> Create
                                    </button>
                                    <button
                                        onClick={() => setIsCreating(false)}
                                        style={{
                                            padding: '8px',
                                            background: 'var(--color-bg-subtle)',
                                            color: 'var(--color-text-muted)',
                                            borderRadius: '6px',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
