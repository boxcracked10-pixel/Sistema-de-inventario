import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';
import { Login } from './components/Login';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { Dashboard } from './components/Dashboard';
import { Products } from './components/modules/Products';
import { Sales } from './components/modules/Sales';
import { Clients } from './components/modules/Clients';
import { Suppliers } from './components/modules/Suppliers';
import { Inventory } from './components/modules/Inventory';
import { Reports } from './components/modules/Reports';
import { Rates } from './components/modules/Rates';
import { Users } from './components/modules/Users';
import { Audit } from './components/modules/Audit';
import { Settings } from './components/modules/Settings';
import { FloatingTools } from './components/FloatingTools';

const MODULE_COMPONENTS: Record<string, React.ReactNode> = {
  dashboard: <Dashboard />,
  products: <Products />,
  sales: <Sales />,
  clients: <Clients />,
  suppliers: <Suppliers />,
  inventory: <Inventory />,
  reports: <Reports />,
  rates: <Rates />,
  users: <Users />,
  audit: <Audit />,
  settings: <Settings />,
};

export default function App() {
  const { currentUser, theme, activeModule, sidebarExpanded, initializeDefaultData } = useStore();

  useEffect(() => {
    initializeDefaultData();
  }, []);

  const isDark = theme === 'dark';

  if (!currentUser) {
    return (
      <>
        <Login />
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '12px', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#1e293b' }
        }} />
      </>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
      <Sidebar />
      <Topbar />
      
      <main className={`transition-all duration-300 pt-16 min-h-screen ${sidebarExpanded ? 'ml-60' : 'ml-16'}`}>
        <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
          {MODULE_COMPONENTS[activeModule] ?? <Dashboard />}
        </div>
      </main>

      <FloatingTools />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: isDark ? '#1e293b' : '#fff',
            color: isDark ? '#f1f5f9' : '#1e293b',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
}
