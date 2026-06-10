import React from 'react';
import { useStore } from '../../store/useStore';
import type { ActiveModule } from '../../types';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Truck,
  Warehouse, BarChart3, DollarSign, Settings, UserCog,
  ClipboardList, ChevronRight, Package2
} from 'lucide-react';

interface NavItem {
  id: ActiveModule;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'cajero', 'almacen'] },
  { id: 'sales', label: 'Punto de Venta', icon: <ShoppingCart size={20} />, roles: ['admin', 'cajero'] },
  { id: 'products', label: 'Productos', icon: <Package size={20} />, roles: ['admin', 'almacen'] },
  { id: 'inventory', label: 'Inventario', icon: <Warehouse size={20} />, roles: ['admin', 'almacen'] },
  { id: 'clients', label: 'Clientes', icon: <Users size={20} />, roles: ['admin', 'cajero'] },
  { id: 'suppliers', label: 'Proveedores', icon: <Truck size={20} />, roles: ['admin', 'almacen'] },
  { id: 'reports', label: 'Reportes', icon: <BarChart3 size={20} />, roles: ['admin'] },
  { id: 'rates', label: 'Tasas BCV', icon: <DollarSign size={20} />, roles: ['admin', 'cajero'] },
  { id: 'users', label: 'Usuarios', icon: <UserCog size={20} />, roles: ['admin'] },
  { id: 'audit', label: 'Auditoría', icon: <ClipboardList size={20} />, roles: ['admin'] },
  { id: 'settings', label: 'Configuración', icon: <Settings size={20} />, roles: ['admin'] },
];

export const Sidebar: React.FC = () => {
  const { theme, activeModule, setActiveModule, sidebarExpanded, currentUser } = useStore();
  const isDark = theme === 'dark';

  const visibleItems = navItems.filter(item =>
    currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <aside className={`fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 ${
      sidebarExpanded ? 'w-60' : 'w-16'
    } ${isDark ? 'bg-slate-900 border-r border-slate-700/50' : 'bg-white border-r border-slate-200'} shadow-xl`}>
      {/* Logo */}
      <div className={`flex items-center h-16 px-3 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Package2 size={20} className="text-white" />
        </div>
        {sidebarExpanded && (
          <span className="ml-3 font-bold text-sm whitespace-nowrap overflow-hidden">
            POS Pro
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {visibleItems.map(item => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              title={!sidebarExpanded ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 mx-auto my-0.5 rounded-xl transition-all duration-200 text-left group
                ${sidebarExpanded ? 'mx-2 w-[calc(100%-16px)]' : 'mx-auto w-10 justify-center'}
                ${isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : isDark
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebarExpanded && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
              {sidebarExpanded && isActive && (
                <ChevronRight size={14} className="ml-auto opacity-60" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User info */}
      {sidebarExpanded && currentUser && (
        <div className={`p-3 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {currentUser.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate">{currentUser.fullName}</p>
              <p className="text-xs opacity-50 capitalize">{currentUser.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
