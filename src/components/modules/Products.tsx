import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Badge } from '../ui/Badge';
import { Input, Select, Textarea } from '../ui/Input';
import { formatCurrency, generateId } from '../../utils/format';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '../../types';

const UNITS = ['Unidad', 'Caja', 'Docena', 'Litro', 'Kilogramo', 'Metro', 'Par', 'Paquete', 'Gramo', 'Pieza'];
const CURRENCIES = ['USD', 'BS', 'EUR'];

const emptyProduct = (): Omit<Product, 'id' | 'createdAt' | 'updatedAt'> => ({
  code: '',
  barcode: '',
  name: '',
  description: '',
  categoryId: '',
  stock: 0,
  minStock: 1,
  maxStock: undefined,
  priceBuy: 0,
  priceSell: 0,
  currency: 'USD',
  unit: 'Unidad',
  active: true,
});

export const Products: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct, theme, bcvRates } = useStore();
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p =>
      p.active &&
      (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.barcode || '').includes(q)) &&
      (filterCat === '' || p.categoryId === filterCat)
    );
  }, [products, search, filterCat]);

  const openAdd = () => {
    setForm(emptyProduct());
    setErrors({});
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      code: p.code,
      barcode: p.barcode || '',
      name: p.name,
      description: p.description || '',
      categoryId: p.categoryId,
      stock: p.stock,
      minStock: p.minStock,
      maxStock: p.maxStock,
      priceBuy: p.priceBuy,
      priceSell: p.priceSell,
      currency: p.currency,
      unit: p.unit,
      active: p.active,
    });
    setErrors({});
    setEditingId(p.id);
    setShowModal(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'El código es requerido';
    else {
      const dup = products.find(p => p.code.trim().toLowerCase() === form.code.trim().toLowerCase() && p.id !== editingId);
      if (dup) e.code = 'Código ya existe';
    }
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    if (form.priceSell <= 0) e.priceSell = 'El precio de venta debe ser mayor a 0';
    if (form.minStock < 0) e.minStock = 'El stock mínimo no puede ser negativo';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const now = new Date().toISOString();
    if (editingId) {
      updateProduct(editingId, { ...form });
      toast.success('Producto actualizado');
    } else {
      addProduct({ ...form, id: generateId(), createdAt: now, updatedAt: now });
      toast.success('Producto creado');
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    toast.success('Producto eliminado');
  };

  const getPriceUSD = (p: Product) => {
    if (p.currency === 'USD') return p.priceSell;
    if (p.currency === 'BS') return p.priceSell / bcvRates.USD;
    return p.priceSell * (bcvRates.EUR / bcvRates.USD);
  };

  const cardBg = isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm opacity-50">{filtered.length} productos encontrados</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={16} /> Nuevo Producto
        </button>
      </div>

      {/* Filters */}
      <div className={`flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border ${cardBg}`}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código o código de barras..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm border-2 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${
              isDark ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-400'
            }`}
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className={`px-3 py-2 rounded-xl text-sm border-2 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${
            isDark ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-400'
          }`}
        >
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-slate-700/60' : 'bg-slate-50'}>
                <th className="px-4 py-3 text-left text-xs font-semibold opacity-60 uppercase tracking-wider">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold opacity-60 uppercase tracking-wider">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold opacity-60 uppercase tracking-wider hidden md:table-cell">Categoría</th>
                <th className="px-4 py-3 text-center text-xs font-semibold opacity-60 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-right text-xs font-semibold opacity-60 uppercase tracking-wider hidden sm:table-cell">Precio</th>
                <th className="px-4 py-3 text-right text-xs font-semibold opacity-60 uppercase tracking-wider hidden lg:table-cell">Valor USD</th>
                <th className="px-4 py-3 text-center text-xs font-semibold opacity-60 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 opacity-40">
                    <Package size={40} className="mx-auto mb-2" />
                    <p>No hay productos</p>
                  </td>
                </tr>
              ) : filtered.map(p => {
                const cat = categories.find(c => c.id === p.categoryId);
                const isLow = p.stock <= p.minStock;
                const isOut = p.stock === 0;
                return (
                  <tr key={p.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} ${isOut ? isDark ? 'bg-red-900/10' : 'bg-red-50/50' : isLow ? isDark ? 'bg-amber-900/10' : 'bg-amber-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">{p.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{p.name}</p>
                      {p.description && <p className="text-xs opacity-40 truncate max-w-xs">{p.description}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="secondary">{cat?.name || '—'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
                        {p.stock} {p.unit}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <p className="font-semibold">{formatCurrency(p.priceSell, p.currency)}</p>
                      {p.currency !== 'USD' && <p className="text-xs opacity-40">{formatCurrency(getPriceUSD(p))}</p>}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="font-semibold text-indigo-500">{formatCurrency(getPriceUSD(p) * p.stock)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(p)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-indigo-900/40 text-indigo-400' : 'hover:bg-indigo-50 text-indigo-600'}`}>
                          <Edit size={15} />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-50 text-red-500'}`}>
                          <Trash2 size={15} />
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

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Producto' : 'Nuevo Producto'} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Código *" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} error={errors.code} placeholder="P001" />
          <Input label="Código de Barras" value={form.barcode || ''} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} placeholder="7501234567890" />
          <div className="sm:col-span-2">
            <Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} placeholder="Nombre del producto" />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Descripción" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Descripción opcional" />
          </div>
          <Select label="Categoría" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
            <option value="">Sin categoría</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Unidad de medida" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </Select>
          <Input label="Stock actual" type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} disabled={!!editingId} />
          <Input label="Stock mínimo *" type="number" min="0" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: Number(e.target.value) }))} error={errors.minStock} />
          <Select label="Moneda" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as Product['currency'] }))}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Precio de compra" type="number" min="0" step="0.01" value={form.priceBuy} onChange={e => setForm(f => ({ ...f, priceBuy: Number(e.target.value) }))} />
          <div className="sm:col-span-2">
            <Input label="Precio de venta *" type="number" min="0" step="0.01" value={form.priceSell} onChange={e => setForm(f => ({ ...f, priceSell: Number(e.target.value) }))} error={errors.priceSell} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowModal(false)} className={`px-4 py-2 rounded-xl text-sm border transition-colors ${isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}>Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors">
            {editingId ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Eliminar Producto"
        message="¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        danger
      />
    </div>
  );
};
