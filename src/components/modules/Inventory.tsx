import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Input';
import { formatDateTime } from '../../utils/format';
import { Search, Warehouse, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

type AdjustType = 'entrada' | 'salida' | 'ajuste';

export const Inventory: React.FC = () => {
  const { products, kardex, adjustStock, theme, categories } = useStore();
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showAdjust, setShowAdjust] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<AdjustType>('entrada');
  const [adjustReason, setAdjustReason] = useState('');
  const [kardexFilter, setKardexFilter] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p =>
      p.active &&
      (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) &&
      (filterCat === '' || p.categoryId === filterCat)
    );
  }, [products, search, filterCat]);

  const filteredKardex = useMemo(() => {
    if (!kardexFilter) return [...kardex].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100);
    return [...kardex].filter(k => k.productId === kardexFilter).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);
  }, [kardex, kardexFilter]);

  const handleAdjust = () => {
    if (!selectedProductId) { toast.error('Selecciona un producto'); return; }
    if (adjustQty <= 0) { toast.error('La cantidad debe ser mayor a 0'); return; }
    if (!adjustReason.trim()) { toast.error('Indica el motivo del ajuste'); return; }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (adjustType === 'salida' && adjustQty > product.stock) {
      toast.error(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }

    adjustStock(selectedProductId, adjustQty, adjustType, adjustReason);
    toast.success('Ajuste de inventario registrado');
    setShowAdjust(false);
    setAdjustQty(1);
    setAdjustReason('');
    setSelectedProductId('');
  };

  const cardBg = isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200';
  const typeColors: Record<string, string> = {
    entrada: 'success', salida: 'danger', ajuste: 'warning', venta: 'info'
  };
  const typeLabels: Record<string, string> = {
    entrada: 'Entrada', salida: 'Salida', ajuste: 'Ajuste', venta: 'Venta'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Inventario</h1><p className="text-sm opacity-50">Control de stock y movimientos</p></div>
        <button onClick={() => setShowAdjust(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all">
          <RefreshCw size={16} /> Ajuste de Stock
        </button>
      </div>

      {/* Stock table */}
      <div className={`flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border ${cardBg}`}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm border-2 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-400'}`} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className={`px-3 py-2 rounded-xl text-sm border-2 outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-slate-50 border-slate-200'}`}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-slate-700/60' : 'bg-slate-50'}>
                {['Código', 'Producto', 'Categoría', 'Stock Actual', 'Mínimo', 'Estado', 'Acción'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold opacity-60 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.map(p => {
                const cat = categories.find(c => c.id === p.categoryId);
                const isOut = p.stock === 0;
                const isLow = p.stock <= p.minStock && p.stock > 0;
                return (
                  <tr key={p.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                    <td className="px-4 py-3"><Badge variant="secondary">{cat?.name || '—'}</Badge></td>
                    <td className="px-4 py-3 font-bold text-lg">{p.stock}</td>
                    <td className="px-4 py-3 opacity-60">{p.minStock}</td>
                    <td className="px-4 py-3">
                      <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
                        {isOut ? 'Agotado' : isLow ? 'Stock Bajo' : 'Normal'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setSelectedProductId(p.id); setAdjustType('entrada'); setShowAdjust(true); }}
                          className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-emerald-900/40 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-600'}`} title="Entrada">
                          <ArrowUp size={14} />
                        </button>
                        <button onClick={() => { setSelectedProductId(p.id); setAdjustType('salida'); setShowAdjust(true); }}
                          className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-50 text-red-500'}`} title="Salida">
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kardex */}
      <div className={`rounded-2xl border ${cardBg}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <h2 className="font-bold">Kardex — Últimos movimientos</h2>
          <select value={kardexFilter} onChange={e => setKardexFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs border-2 outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-slate-200'}`}>
            <option value="">Todos los productos</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-slate-700/40' : 'bg-slate-50'}>
                {['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Antes', 'Después', 'Motivo', 'Usuario'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold opacity-60 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filteredKardex.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 opacity-40"><Warehouse size={32} className="mx-auto mb-2" /><p>Sin movimientos</p></td></tr>
              ) : filteredKardex.map(k => (
                <tr key={k.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 py-2 text-xs opacity-60 whitespace-nowrap">{formatDateTime(k.createdAt)}</td>
                  <td className="px-4 py-2 text-xs font-semibold">{k.productName}</td>
                  <td className="px-4 py-2"><Badge variant={typeColors[k.type] as any}>{typeLabels[k.type]}</Badge></td>
                  <td className="px-4 py-2 font-bold">{k.quantity}</td>
                  <td className="px-4 py-2 opacity-60">{k.stockBefore}</td>
                  <td className="px-4 py-2 font-semibold">{k.stockAfter}</td>
                  <td className="px-4 py-2 text-xs opacity-60 max-w-xs truncate">{k.reason}</td>
                  <td className="px-4 py-2 text-xs opacity-60">{k.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      <Modal isOpen={showAdjust} onClose={() => setShowAdjust(false)} title="Ajuste de Stock" size="md">
        <div className="space-y-4">
          <Select label="Producto" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
            <option value="">Seleccionar producto...</option>
            {products.filter(p => p.active).map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
          </Select>

          <Select label="Tipo de movimiento" value={adjustType} onChange={e => setAdjustType(e.target.value as AdjustType)}>
            <option value="entrada">Entrada (incrementa stock)</option>
            <option value="salida">Salida (reduce stock)</option>
            <option value="ajuste">Ajuste (establece cantidad)</option>
          </Select>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium opacity-80">Cantidad</label>
            <input type="number" min="1" value={adjustQty} onChange={e => setAdjustQty(Math.max(1, Number(e.target.value)))}
              className={`w-full rounded-xl border-2 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-400'}`} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium opacity-80">Motivo *</label>
            <input value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="Ej: Compra a proveedor, Merma, Inventario físico..."
              className={`w-full rounded-xl border-2 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-400'}`} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowAdjust(false)} className={`px-4 py-2 rounded-xl text-sm border ${isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}>Cancelar</button>
          <button onClick={handleAdjust} className="px-4 py-2 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Registrar Movimiento</button>
        </div>
      </Modal>
    </div>
  );
};
