import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Input, Textarea } from '../ui/Input';
import { Settings as SettingsIcon, Save, Download, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CompanySettings } from '../../types';

export const Settings: React.FC = () => {
  const { companySettings, setCompanySettings, theme } = useStore();
  const isDark = theme === 'dark';

  const [form, setForm] = useState<CompanySettings>({ ...companySettings });

  const handleSave = () => {
    setCompanySettings(form);
    toast.success('Configuración guardada');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { toast.error('El logo debe ser menor a 500KB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, logo: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const createBackup = () => {
    const state = useStore.getState();
    const backup = {
      version: '1.0',
      date: new Date().toISOString(),
      data: {
        users: state.users,
        products: state.products,
        categories: state.categories,
        clients: state.clients,
        suppliers: state.suppliers,
        sales: state.sales,
        kardex: state.kardex,
        cashRegisters: state.cashRegisters,
        auditLog: state.auditLog,
        bcvRates: state.bcvRates,
        bcvHistory: state.bcvHistory,
        companySettings: state.companySettings,
      }
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `POS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success('Backup creado y descargado');
  };

  const restoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const backup = JSON.parse(ev.target?.result as string);
        if (!backup.version || !backup.data) throw new Error('Formato inválido');
        const d = backup.data;
        useStore.setState({
          users: d.users || [],
          products: d.products || [],
          categories: d.categories || [],
          clients: d.clients || [],
          suppliers: d.suppliers || [],
          sales: d.sales || [],
          kardex: d.kardex || [],
          cashRegisters: d.cashRegisters || [],
          auditLog: d.auditLog || [],
          bcvRates: d.bcvRates || { USD: 36.50, EUR: 40.00, lastUpdate: null },
          bcvHistory: d.bcvHistory || [],
          companySettings: d.companySettings || companySettings,
        });
        toast.success('Backup restaurado correctamente');
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        toast.error('El archivo de backup no es válido');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const cardBg = isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200';

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Configuración</h1><p className="text-sm opacity-50">Configura tu empresa y sistema</p></div>

      {/* Company settings */}
      <div className={`rounded-2xl border p-6 ${cardBg}`}>
        <h2 className="font-bold mb-4 flex items-center gap-2"><SettingsIcon size={16} /> Datos de la Empresa</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><Input label="Nombre de la empresa" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <Input label="RIF" value={form.rif} onChange={e => setForm(f => ({ ...f, rif: e.target.value }))} placeholder="J-00000000-0" />
          <Input label="Teléfono" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Prefijo de factura" value={form.invoicePrefix} onChange={e => setForm(f => ({ ...f, invoicePrefix: e.target.value }))} placeholder="FAC-" />
          <div className="sm:col-span-2"><Textarea label="Dirección" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} /></div>
          <Input label="Encabezado del recibo" value={form.receiptHeader} onChange={e => setForm(f => ({ ...f, receiptHeader: e.target.value }))} />
          <Input label="Pie del recibo" value={form.receiptFooter} onChange={e => setForm(f => ({ ...f, receiptFooter: e.target.value }))} />
        </div>

        {/* Logo */}
        <div className="mt-4">
          <label className="text-sm font-medium opacity-80 block mb-2">Logo de la empresa</label>
          <div className="flex items-center gap-4">
            {form.logo ? (
              <div className="relative">
                <img src={form.logo} alt="Logo" className="h-16 w-auto rounded-xl border border-slate-200 object-contain" />
                <button onClick={() => setForm(f => ({ ...f, logo: undefined }))} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
              </div>
            ) : (
              <div className={`h-16 w-32 rounded-xl border-2 border-dashed flex items-center justify-center text-xs opacity-40 ${isDark ? 'border-slate-600' : 'border-slate-300'}`}>Sin logo</div>
            )}
            <label className={`cursor-pointer px-4 py-2 rounded-xl text-sm border-2 transition-colors ${isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}>
              Subir logo
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all">
            <Save size={16} /> Guardar configuración
          </button>
        </div>
      </div>

      {/* Categories */}
      <CategoriesSection isDark={isDark} cardBg={cardBg} />

      {/* Backup */}
      <div className={`rounded-2xl border p-6 ${cardBg}`}>
        <h2 className="font-bold mb-4">Backup y Restauración</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={createBackup} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all">
            <Download size={16} /> Crear Backup
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer">
            <Upload size={16} /> Restaurar Backup
            <input type="file" accept=".json" onChange={restoreBackup} className="hidden" />
          </label>
        </div>
        <p className="text-xs opacity-40 mt-3">El backup incluye todos los datos: productos, ventas, clientes, usuarios y configuración.</p>
      </div>
    </div>
  );
};

const CategoriesSection: React.FC<{ isDark: boolean; cardBg: string }> = ({ isDark, cardBg }) => {
  const { categories, addCategory, updateCategory, deleteCategory } = useStore();
  const [newCat, setNewCat] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');


  const handleAdd = () => {
    if (!newCat.trim()) return;
    const dup = categories.find(c => c.name.toLowerCase() === newCat.toLowerCase());
    if (dup) { toast.error('Esa categoría ya existe'); return; }
    addCategory({ id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name: newCat.trim(), createdAt: new Date().toISOString() });
    setNewCat('');
    toast.success('Categoría creada');
  };

  const handleEdit = (id: string) => {
    if (!editName.trim()) return;
    updateCategory(id, { name: editName.trim() });
    setEditId(null);
    toast.success('Categoría actualizada');
  };

  return (
    <div className={`rounded-2xl border p-6 ${cardBg}`}>
      <h2 className="font-bold mb-4">Categorías de Productos</h2>
      <div className="flex gap-2 mb-4">
        <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Nueva categoría..."
          className={`flex-1 rounded-xl border-2 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-400'}`} />
        <button onClick={handleAdd} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">Agregar</button>
      </div>
      <div className="space-y-2">
        {categories.map(c => (
          <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
            {editId === c.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                  className={`flex-1 rounded-lg border-2 px-3 py-1 text-sm outline-none ${isDark ? 'bg-slate-600 border-slate-500 text-slate-100' : 'bg-white border-slate-200'}`} />
                <button onClick={() => handleEdit(c.id)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs">Guardar</button>
                <button onClick={() => setEditId(null)} className={`px-3 py-1 rounded-lg text-xs border ${isDark ? 'border-slate-600' : 'border-slate-200'}`}>Cancelar</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{c.name}</span>
                <button onClick={() => { setEditId(c.id); setEditName(c.name); }} className={`p-1.5 rounded-lg text-xs ${isDark ? 'hover:bg-slate-600 text-indigo-400' : 'hover:bg-white text-indigo-600'}`}>Editar</button>
                <button onClick={() => { deleteCategory(c.id); toast.success('Categoría eliminada'); }} className={`p-1.5 rounded-lg text-xs ${isDark ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-50 text-red-500'}`}><Trash2 size={13} /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
