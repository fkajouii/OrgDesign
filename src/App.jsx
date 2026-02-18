import React, { useState, useEffect } from 'react';
import { useOrgStore } from './store/orgStore.js';
import { GoogleSheetsService } from './services/googleSheets';
import ConnectSheet from './components/ConnectSheet';
import OrgChart from './components/OrgChart';
import EditEmployeeModal from './components/EditEmployeeModal';
import ScenarioManager from './components/ScenarioManager';
import { RefreshCw, LogOut, FileSpreadsheet, Plus, Moon, Sun } from 'lucide-react';
import * as XLSX from 'xlsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("App Crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: 'var(--color-text-main)',
          background: 'var(--color-bg-base)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2 style={{ marginBottom: '16px' }}>Oops! Something went wrong.</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', maxWidth: '400px' }}>
            {this.state.error?.message || "An unexpected error occurred in the application."}
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              padding: '12px 24px',
              background: 'var(--color-primary)',
              color: 'var(--color-bg-base)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Reset and Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { employees, refreshData, disconnect, addEmployee, activeScenarioId, scenarios, theme, toggleTheme, currentUrl } = useOrgStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  // Apply theme to document body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

      setDownloadUrl(url);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'org-design-export.xlsx';
      link.click();
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed: ' + error.message);
    }
  };

  const renderContent = () => {
    if (!employees || employees.length === 0) {
      return <ConnectSheet />;
    }

    return (
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

          {currentUrl && (
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
          )}

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

          <div style={{ width: '1px', background: 'var(--color-border)', height: '24px', margin: '0 4px' }} />

          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              background: 'transparent',
              color: 'var(--color-text-main)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center',
              border: 'none'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-card-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
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
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800 }}>Organization Chart</h1>
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
    );
  };

  return (
    <ErrorBoundary>
      <div className={`app ${theme}`} style={{ minHeight: '100vh', background: 'radial-gradient(circle at top center, var(--color-bg-subtle), var(--color-bg-base))', color: 'var(--color-text-main)' }}>
        {renderContent()}
      </div>
    </ErrorBoundary>
  );
}

export default App;
