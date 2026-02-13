import React, { useState } from 'react';
import { useOrgStore } from './store/orgStore';
import { GoogleSheetsService } from './services/googleSheets';
import ConnectSheet from './components/ConnectSheet';
import OrgChart from './components/OrgChart';
import EditEmployeeModal from './components/EditEmployeeModal';
import ScenarioManager from './components/ScenarioManager';
import { RefreshCw, LogOut, FileSpreadsheet, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';

function App() {
  const { employees, refreshData, disconnect, addEmployee, activeScenarioId, scenarios } = useOrgStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleAddEmployee = (originalTitleIgnored, newData) => {
    addEmployee(newData);
    setShowAddModal(false);
  };

  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new();
      Object.entries(scenarios).forEach(([name, data]) => {
        if (data && data.length > 0) {
          const sanitizedName = name.replace(/[\\\/*?:\[\]]/g, ' ').substring(0, 31);
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, ws, sanitizedName);
        }
      });

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);

      // Set the download URL to show the link
      setDownloadUrl(url);

      // Also try automatic download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'org-design-export.xlsx';
      link.click();
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed: ' + error.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top center, var(--color-bg-subtle), var(--color-bg-base))' }}>
      {!employees.length ? (
        <ConnectSheet />
      ) : (
        <div style={{ padding: '0px 0', textAlign: 'center' }}>
          {/* Header Controls */}
          <div className="glass-panel" style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 50,
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ScenarioManager />

            <button
              onClick={() => setShowAddModal(true)}
              title="Add a new employee"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-bg-base)',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', gap: '6px',
                border: 'none',
                fontSize: '0.85rem'
              }}
            >
              <Plus size={16} /> Add Employee
            </button>

            <button
              onClick={() => refreshData(GoogleSheetsService)}
              title="Refetch data from Google Sheet"
              style={{
                background: 'transparent',
                color: 'var(--color-text-main)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', gap: '6px',
                border: 'none',
                fontSize: '0.85rem'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-card-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <RefreshCw size={16} /> Refresh
            </button>

            <button
              onClick={handleExport}
              title="Download all scenarios as Excel"
              style={{
                background: 'transparent',
                color: 'var(--color-text-main)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', gap: '6px',
                border: 'none',
                fontSize: '0.85rem'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-card-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <FileSpreadsheet size={16} /> Export Excel
            </button>

            <button
              onClick={disconnect}
              title="Disconnect from this sheet"
              style={{
                background: 'transparent',
                color: 'hsl(var(--hue-error), 80%, 70%)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', gap: '6px',
                border: 'none',
                fontSize: '0.85rem'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={16} /> Disconnect
            </button>
          </div>

          {/* Download Link (appears after export) */}
          {downloadUrl && (
            <div className="glass-panel" style={{
              position: 'fixed',
              top: '80px',
              right: '20px',
              zIndex: 50,
              padding: '16px',
              maxWidth: '300px'
            }}>
              <p style={{ margin: '0 0 12px 0', color: 'var(--color-text-main)', fontSize: '0.9rem' }}>
                If download didn't start automatically, click below:
              </p>
              <a
                href={downloadUrl}
                download="org-design-export.xlsx"
                style={{
                  display: 'inline-block',
                  background: 'var(--color-primary)',
                  color: 'var(--color-bg-base)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                Download Excel File
              </a>
              <button
                onClick={() => { URL.revokeObjectURL(downloadUrl); setDownloadUrl(null); }}
                style={{
                  marginLeft: '8px',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                ✕ Close
              </button>
            </div>
          )}

          <div style={{
            paddingTop: '80px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <h1 className="text-gradient">Organization Chart</h1>
            {activeScenarioId !== 'live' && (
              <span style={{
                background: 'rgba(var(--hue-primary), 100%, 50%, 0.1)',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                Scenario Mode
              </span>
            )}
            <span style={{
              background: 'var(--color-bg-card)',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)'
            }}>
              {employees.length} Members
            </span>
          </div>



          <OrgChart />

          {showAddModal && (
            <EditEmployeeModal
              employee={{}}
              onClose={() => setShowAddModal(false)}
              onSave={handleAddEmployee}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
