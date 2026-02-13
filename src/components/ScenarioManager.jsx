import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore';
import { ChevronDown, Check, Layers } from 'lucide-react';

export default function ScenarioManager() {
    const {
        scenarios,
        activeScenarioId,
        switchScenario
    } = useOrgStore();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const scenarioNames = Object.keys(scenarios);
    if (scenarioNames.length === 0) return null;

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
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Layers size={16} color="var(--color-primary)" />
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                            <span style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Scenario
                            </span>
                            <span style={{ fontWeight: 600 }}>{activeScenarioId}</span>
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
                        width: '240px',
                        padding: '8px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        animation: 'fadeIn 0.2s',
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)'
                    }}
                >
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
                                    background: activeScenarioId === name ? 'rgba(255,255,255,0.05)' : 'transparent',
                                    marginBottom: '2px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = activeScenarioId === name ? 'rgba(255,255,255,0.05)' : 'transparent'}
                            >
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>{name}</span>
                                {activeScenarioId === name && <Check size={14} color="var(--color-primary)" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
