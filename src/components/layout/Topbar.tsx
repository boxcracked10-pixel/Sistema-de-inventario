import React from 'react';
import { useStore } from '../../store/useStore';
import { Menu, Sun, Moon, LogOut, Bell } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

export const Topbar: React.FC = () => {
  const { theme, toggleTheme, toggleSidebar, sidebarExpanded, currentUser, logout, logAction, bcvRates, products } = useStore();
  const isDark = theme === 'dark';

  const lowStockCount = products.filter(p => p.active && p.stock <= p.minStock).length;

  const handleLogout = () => {
    logAction('Cierre de sesión', `Usuario: ${currentUser?.username}`);
    logout();
    toast.success('Sesión cerrada');
  };

  return (
    <header className={`fixed top-0 right-0 z-30 h-16 flex items-center px-4 gap-4 transition-all duration-300 ${
      sidebarExpanded ? 'left-60' : 'left-16'
    } ${isDark ? 'bg-slate-900/95 border-b border-slate-700/50' : 'bg-white/95 border-b border-slate-200'} backdrop-blur-sm shadow-sm`}>
      
      <button
        onClick={toggleSidebar}
        className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
      >
        <Menu size={20} />
      </button>

      {/* BCV Rate pills */}
      <div className="hidden md:flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
          isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
        }`}>
          <span>USD</span>
          <span className="font-mono">{formatCurrency(bcvRates.USD, 'BS').replace('Bs. ', '')}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
          isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-700'
        }`}>
          <span>EUR</span>
          <span className="font-mono">{formatCurrency(bcvRates.EUR, 'BS').replace('Bs. ', '')}</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Low stock alert */}
        {lowStockCount > 0 && (
          <div className="relative">
            <button className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-100 text-amber-500'}`}>
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {lowStockCount}
              </span>
            </button>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* User badge */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            {currentUser?.fullName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium">{currentUser?.fullName}</span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
          title="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};
