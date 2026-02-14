import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore';
import { Download, FileImage, FileText, Check, X, Camera } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function ExportModal({ onClose, chartRef }) {
    const { exportSettings, setExportSettings, activeScenarioId } = useOrgStore();
    const [format, setFormat] = useState('png'); // 'png' or 'pdf'
    const [isProcessing, setIsProcessing] = useState(false);

    const availableFields = [
        { id: 'Name', label: 'Employee Name' },
        { id: 'Title', label: 'Job Title' },
        { id: 'Department', label: 'Department' },
        { id: 'Team', label: 'Team' },
        { id: 'Accountabilities', label: 'Accountabilities' },
        { id: 'Metrics', label: 'Metrics' }
    ];

    const toggleField = (fieldId) => {
        const current = exportSettings.visibleFields;
        if (current.includes(fieldId)) {
            // Keep at least Title
            if (fieldId === 'Title' && current.length === 1) return;
            setExportSettings({ visibleFields: current.filter(f => f !== fieldId) });
        } else {
            setExportSettings({ visibleFields: [...current, fieldId] });
        }
    };

    const handleExport = async () => {
        if (!chartRef.current) return;
        setIsProcessing(true);

        // Let state update and DOM re-render
        setExportSettings({ isExporting: true });

        // Wait for a bit for the UI to adjust
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const orgTreeElement = chartRef.current.querySelector('.org-tree > div');
            if (!orgTreeElement) throw new Error("Could not find chart element");

            // Temporary styles for capture
            const originalStyle = orgTreeElement.style.cssText;
            const originalTransform = chartRef.current.querySelector('ul').style.transform;

            // Force scale to 1 for capture and remove padding
            orgTreeElement.style.padding = '40px';
            chartRef.current.querySelector('ul').style.transform = 'scale(1)';

            const canvas = await html2canvas(orgTreeElement, {
                useCORS: true,
                backgroundColor: getComputedStyle(document.body).backgroundColor,
                scale: 2, // Higher quality
                logging: false,
                onclone: (clonedDoc) => {
                    // Ensure the cloned version is visible for capture
                    const clonedChart = clonedDoc.querySelector('.org-tree > div');
                    if (clonedChart) {
                        clonedChart.style.padding = '60px';
                        clonedChart.style.background = getComputedStyle(document.body).backgroundColor;
                    }
                }
            });

            const filename = `OrgChart-${activeScenarioId}-${new Date().toISOString().split('T')[0]}`;

            if (format === 'png') {
                const link = document.createElement('a');
                link.download = `${filename}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } else {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: canvas.width > canvas.height ? 'l' : 'p',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save(`${filename}.pdf`);
            }

            // Restore
            orgTreeElement.style.cssText = originalStyle;
            chartRef.current.querySelector('ul').style.transform = originalTransform;

        } catch (error) {
            console.error("Export capture failed:", error);
            alert("Export failed. Please try again.");
        } finally {
            setExportSettings({ isExporting: false });
            setIsProcessing(false);
            onClose();
        }
    };

    return (
        <div className="flex-center" style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '500px',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px',
                            background: 'var(--color-primary)',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-bg-base)'
                        }}>
                            <Camera size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Custom Export</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Configure your org chart snapshot</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'transparent',
                        color: 'var(--color-text-muted)',
                        padding: '8px'
                    }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Visible Content</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px'
                    }}>
                        {availableFields.map(field => (
                            <button
                                key={field.id}
                                onClick={() => toggleField(field.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '12px',
                                    background: exportSettings.visibleFields.includes(field.id) ? 'rgba(var(--hue-primary), 100%, 50%, 0.1)' : 'var(--color-bg-subtle)',
                                    border: `1px solid ${exportSettings.visibleFields.includes(field.id) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    borderRadius: '8px',
                                    color: exportSettings.visibleFields.includes(field.id) ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontSize: '0.85rem',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '18px', height: '18px',
                                    borderRadius: '4px',
                                    border: '1px solid currentColor',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {exportSettings.visibleFields.includes(field.id) && <Check size={12} strokeWidth={3} />}
                                </div>
                                {field.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Export Format</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setFormat('png')}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '14px',
                                background: format === 'png' ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                                color: format === 'png' ? 'var(--color-bg-base)' : 'var(--color-text-main)',
                                border: `1px solid ${format === 'png' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                borderRadius: '12px',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}
                        >
                            <FileImage size={18} /> PNG Image
                        </button>
                        <button
                            onClick={() => setFormat('pdf')}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '14px',
                                background: format === 'pdf' ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                                color: format === 'pdf' ? 'var(--color-bg-base)' : 'var(--color-text-main)',
                                border: `1px solid ${format === 'pdf' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                borderRadius: '12px',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}
                        >
                            <FileText size={18} /> PDF Document
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    disabled={isProcessing}
                    style={{
                        width: '100%',
                        padding: '16px',
                        background: 'var(--color-text-main)',
                        color: 'var(--color-bg-base)',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        marginTop: '8px',
                        opacity: isProcessing ? 0.7 : 1
                    }}
                >
                    {isProcessing ? (
                        <>Processing...</>
                    ) : (
                        <><Download size={20} /> Generate {format.toUpperCase()}</>
                    )}
                </button>
            </div>
        </div>
    );
}
