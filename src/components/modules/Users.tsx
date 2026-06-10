import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Badge } from '../ui/Badge';
import { Input, Select } from '../ui/Input';
import { generateId, formatDateTime } from '../../utils/format';
import { hashPassword } from '../../utils/crypto';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User, UserRole } from '../../types';

const ROLE_LABELS: Record<UserRole, string> = { admin: 'Administrador', cajero: 'Cajero', almacen: 'Almacén' };
const ROLE_COLORS: Record<UserRole, any> = { admin: 'danger', cajero: 'info', almacen: 'warning' };

export const Users: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser, theme } = useStore();
  const isDark = theme === 'dark';
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ username: '', fullName: '', role: 'cajero' as UserRole, password: '', confirmPassword: '', active: true });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openAdd = () => { setForm({ username: '', fullName: '', role: 'cajero', password: '', confirmPassword: '', active: true }); setErrors({}); setEditingId(null); setShowModal(true); };
  const openEdit = (u: User) => { setForm({ username: u.username, fullName: u.fullName, role: u.role, password: '', confirmPassword: '', active: u.active }); setErrors({}); setEditingId(u.id); setShowModal(true); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username.trim()) e.username = 'Requerido';
    else {
      const dup = users.find(u => u.username.toLowerCase() === form.username.toLowerCase() && u.id !== editingId);
      if (dup) e.username = 'Usuario ya existe';
    }
    if (!form.fullName.trim()) e.fullName = 'Requerido';
    if (!editingId) {
      if (!form.password) e.password = 'La contraseña es requerida';
      else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    } else if (form.password) {
      if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (editingId) {
      const updates: Partial<User> = { username: form.username, fullName: form.fullName, role: form.role, active: form.active };
      if (form.password) updates.passwordHash = await hashPassword(form.password);
      updateUser(editingId, updates);
      toast.success('Usuario actualizado');
    } else {
      const passwordHash = await hashPassword(form.password);
      addUser({ id: generateId(), username: form.username, passwordHash, fullName: form.fullName, role: form.role, active: true, createdAt: new Date().toISOString() });
      toast.success('Usuario creado');
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (id === currentUser?.id) { toast.error('No puedes eliminar tu propio usuario'); return; }
    deleteUser(id);
    toast.success('Usuario eliminado');
  };

  const cardBg = isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Usuarios</h1><p className="text-sm opacity-50">{users.length} usuarios registrados</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all">
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-slate-700/60' : 'bg-slate-50'}>
                {['Usuario', 'Nombre Completo', 'Rol', 'Estado', 'Creado', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold opacity-60 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {users.map(u => (
                <tr key={u.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} ${u.id === currentUser?.id ? isDark ? 'bg-indigo-900/10' : 'bg-indigo-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-mono text-sm">{u.username}</span>
                      {u.id === currentUser?.id && <Badge variant="primary">Tú</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{u.fullName}</td>
                  <td className="px-4 py-3"><Badge variant={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={u.active ? 'success' : 'danger'}>{u.active ? 'Activo' : 'Inactivo'}</Badge></td>
                  <td className="px-4 py-3 text-xs opacity-50">{formatDateTime(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-indigo-900/40 text-indigo-400' : 'hover:bg-indigo-50 text-indigo-600'}`}><Edit size={15} /></button>
                      {u.id !== currentUser?.id && <button onClick={() => setDeleteId(u.id)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-50 text-red-500'}`}><Trash2 size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Usuario' : 'Nuevo Usuario'} size="md">
        <div className="space-y-4">
          <Input label="Nombre de usuario *" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} error={errors.username} placeholder="usuario123" />
          <Input label="Nombre completo *" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} error={errors.fullName} />
          <Select label="Rol" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}>
            <option value="admin">Administrador</option>
            <option value="cajero">Cajero</option>
            <option value="almacen">Almacén</option>
          </Select>
          <Input label={editingId ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña *'} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} error={errors.password} placeholder="••••••••" />
          <Input label="Confirmar contraseña" type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} error={errors.confirmPassword} placeholder="••••••••" />
          {editingId && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
              Usuario activo
            </label>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowModal(false)} className={`px-4 py-2 rounded-xl text-sm border ${isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}>Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">{editingId ? 'Guardar' : 'Crear'}</button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && handleDelete(deleteId)} title="Eliminar Usuario" message="¿Eliminar este usuario? Esta acción no se puede deshacer." confirmText="Eliminar" danger />
    </div>
  );
};
