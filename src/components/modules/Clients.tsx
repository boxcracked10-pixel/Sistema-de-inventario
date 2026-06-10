import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Input, Textarea } from '../ui/Input';
import { generateId } from '../../utils/format';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Client } from '../../types';

const empty = (): Omit<Client, 'id' | 'createdAt'> => ({ name: '', rif: '', cedula: '', phone: '', email: '', address: '' });

export const Clients: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, theme } = useStore();
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(empty());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(q) || (c.rif || '').toLowerCase().includes(q) || (c.phone || '').includes(q));
  }, [clients, search]);

  const openAdd = () => { setForm(empty()); setErrors({}); setEditingId(null); setShowModal(true); };
  const openEdit = (c: Client) => { setForm({ name: c.name, rif: c.rif || '', cedula: c.cedula || '', phone: c.phone || '', email: c.email || '', address: c.address || '' }); setErrors({}); setEditingId(c.id); setShowModal(true); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editingId) { updateClient(editingId, form); toast.success('Cliente actualizado'); }
    else { addClient({ ...form, id: generateId(), createdAt: new Date().toISOString() }); toast.success('Cliente creado'); }
    setShowModal(false);
  };

  const cardBg = isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Clientes</h1><p className="text-sm opacity-50">{clients.length} clientes registrados</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20">
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      <div className={`p-4 rounded-2xl border ${cardBg}`}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, RIF o teléfono..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm border-2 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-400'}`} />
        </div>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-slate-700/60' : 'bg-slate-50'}>
                {['Nombre', 'RIF / Cédula', 'Teléfono', 'Email', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold opacity-60 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 opacity-40"><Users size={40} className="mx-auto mb-2" /><p>No hay clientes</p></td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  <td className="px-4 py-3 opacity-60">{c.rif || c.cedula || '—'}</td>
                  <td className="px-4 py-3 opacity-60">{c.phone || '—'}</td>
                  <td className="px-4 py-3 opacity-60">{c.email || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(c)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-indigo-900/40 text-indigo-400' : 'hover:bg-indigo-50 text-indigo-600'}`}><Edit size={15} /></button>
                      <button onClick={() => setDeleteId(c.id)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-50 text-red-500'}`}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Cliente' : 'Nuevo Cliente'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} /></div>
          <Input label="RIF" value={form.rif || ''} onChange={e => setForm(f => ({ ...f, rif: e.target.value }))} placeholder="J-12345678-9" />
          <Input label="Cédula" value={form.cedula || ''} onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))} placeholder="V-12345678" />
          <Input label="Teléfono" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0412-0000000" />
          <Input label="Email" type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <div className="sm:col-span-2"><Textarea label="Dirección" value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowModal(false)} className={`px-4 py-2 rounded-xl text-sm border ${isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}>Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">{editingId ? 'Guardar' : 'Crear'}</button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && (deleteClient(deleteId), toast.success('Cliente eliminado'))} title="Eliminar Cliente" message="¿Eliminar este cliente? Esta acción no se puede deshacer." confirmText="Eliminar" danger />
    </div>
  );
};
