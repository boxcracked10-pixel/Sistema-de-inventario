import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { verifyPassword, isLegacyHash } from '../utils/crypto';
import { Eye, EyeOff, Package, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { users, login, logAction } = useStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.active);
      if (!user) {
        toast.error('Usuario no encontrado o inactivo');
        return;
      }

      let valid = false;
      if (isLegacyHash(user.passwordHash)) {
        // Legacy plain-text comparison (migration)
        valid = user.passwordHash === password;
      } else {
        valid = await verifyPassword(password, user.passwordHash);
      }

      if (!valid) {
        toast.error('Contraseña incorrecta');
        return;
      }

      login(user);
      logAction('Inicio de sesión', `Usuario: ${user.username}`);
      toast.success(`¡Bienvenido, ${user.fullName}!`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl animate-pulse delay-500" />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
              <Package size={40} className="text-white relative z-10" />
            </div>
            <h1 className="text-2xl font-bold text-white">Sistema POS Pro</h1>
            <p className="text-white/60 text-sm mt-1">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-white/80 text-sm font-medium mb-1.5 block">Usuario</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-white/80 text-sm font-medium mb-1.5 block">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-10 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="text-center text-white/30 text-xs mt-6">
            Usuario por defecto: <span className="text-white/60 font-mono">admin</span> / <span className="text-white/60 font-mono">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
};
