import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { formatDateTime } from '../../utils/format';
import { ClipboardList, Search, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import toast from 'react-hot-toast';

export const Audit: React.FC = () => {
  const store = useStore();
  const isDark = store.theme === 'dark';
  const [search, setSearch] = useState('');
  const [showClear, setShowClear] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...store.auditLog]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(l => l.action.toLowerCase().includes(q) || l.userName.toLowerCase().includes(q) || (l.details || '').toLowerCase().includes(q))
      .slice(0, 200);
  }, [store.auditLog, search]);

  const clearLog = () => {
    // Reset audit log via store state update
    useStore.setState({ auditLog: [] });
    toast.success('Registro de auditoría limpiado');
  };

  const cardBg = isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Auditoría</h1><p className="text-sm opacity-50">{store.auditLog.length} registros</p></div>
        <button onClick={() => setShowClear(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">
          <Trash2 size={14} /> Limpiar
        </button>
      </div>

      <div className={`p-4 rounded-2xl border ${cardBg}`}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por acción, usuario o detalles..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm border-2 outline-none focus:ring-2 focus:ring-indigo-500/30 ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-400'}`} />
        </div>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-slate-700/60' : 'bg-slate-50'}>
                {['Fecha y Hora', 'Usuario', 'Acción', 'Detalles'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold opacity-60 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 opacity-40"><ClipboardList size={40} className="mx-auto mb-2" /><p>Sin registros</p></td></tr>
              ) : filtered.map(log => (
                <tr key={log.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 py-2 text-xs opacity-60 whitespace-nowrap">{formatDateTime(log.date)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">
                        {log.userName.charAt(0)}
                      </div>
                      <span className="text-xs">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-semibold text-xs">{log.action}</td>
                  <td className="px-4 py-2 text-xs opacity-60 max-w-sm truncate">{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog isOpen={showClear} onClose={() => setShowClear(false)} onConfirm={clearLog} title="Limpiar Auditoría" message="¿Eliminar todos los registros de auditoría? Esta acción no se puede deshacer." confirmText="Limpiar" danger />
    </div>
  );
};
