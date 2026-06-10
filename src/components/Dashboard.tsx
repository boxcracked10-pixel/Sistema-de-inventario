import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDateTime } from '../utils/format';
import { Package, ShoppingCart, Users, TrendingUp, AlertTriangle, DollarSign, BarChart3, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const Dashboard: React.FC = () => {
  const { products, sales, clients, bcvRates, theme } = useStore();
  const isDark = theme === 'dark';

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.createdAt.startsWith(today));
    const totalInventoryUSD = products.reduce((sum, p) => {
      const priceUSD = p.currency === 'USD' ? p.priceSell : p.currency === 'BS' ? p.priceSell / bcvRates.USD : p.priceSell * (bcvRates.EUR / bcvRates.USD);
      return sum + p.stock * priceUSD;
    }, 0);
    const lowStock = products.filter(p => p.active && p.stock <= p.minStock);
    const outOfStock = products.filter(p => p.active && p.stock === 0);

    return {
      totalProducts: products.filter(p => p.active).length,
      totalClients: clients.length,
      todaySalesCount: todaySales.length,
      todaySalesUSD: todaySales.reduce((sum, s) => sum + s.totalUSD, 0),
      totalSalesUSD: sales.reduce((sum, s) => sum + s.totalUSD, 0),
      totalInventoryUSD,
      totalInventoryBS: totalInventoryUSD * bcvRates.USD,
      lowStock,
      outOfStock,
    };
  }, [products, sales, clients, bcvRates]);

  // Last 7 days sales chart
  const salesChart = useMemo(() => {
    const data: { date: string; ventas: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('es-VE', { weekday: 'short' });
      const dayTotal = sales
        .filter(s => s.createdAt.startsWith(dateStr))
        .reduce((sum, s) => sum + s.totalUSD, 0);
      data.push({ date: dayLabel, ventas: Math.round(dayTotal * 100) / 100 });
    }
    return data;
  }, [sales]);

  // Top products by sales
  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; qty: number; total: number }> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName, qty: 0, total: 0 };
        }
        productSales[item.productId].qty += item.quantity;
        productSales[item.productId].total += item.subtotalUSD;
      });
    });
    return Object.values(productSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [sales]);

  const recentSales = [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const cardBg = isDark ? 'bg-slate-800 border border-slate-700/50' : 'bg-white border border-slate-200';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm opacity-50 mt-1">Resumen general del sistema</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/20">
          <div className="flex items-center justify-between mb-3">
            <Package size={24} className="opacity-80" />
            <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">Productos</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalProducts}</p>
          <p className="text-xs opacity-70 mt-1">{stats.lowStock.length} con stock bajo</p>
        </div>

        <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <ShoppingCart size={24} className="opacity-80" />
            <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">Hoy</span>
          </div>
          <p className="text-3xl font-bold">{stats.todaySalesCount}</p>
          <p className="text-xs opacity-70 mt-1">{formatCurrency(stats.todaySalesUSD)}</p>
        </div>

        <div className="rounded-2xl p-5 bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between mb-3">
            <DollarSign size={24} className="opacity-80" />
            <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">Inventario</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalInventoryUSD)}</p>
          <p className="text-xs opacity-70 mt-1">{formatCurrency(stats.totalInventoryBS, 'BS')}</p>
        </div>

        <div className="rounded-2xl p-5 bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <Users size={24} className="opacity-80" />
            <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">Clientes</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalClients}</p>
          <p className="text-xs opacity-70 mt-1">Total registrados</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales chart */}
        <div className={`${cardBg} rounded-2xl p-5 lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm">Ventas últimos 7 días (USD)</h2>
            <TrendingUp size={16} className="opacity-40" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salesChart}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
              <Tooltip
                contentStyle={{
                  background: isDark ? '#1e293b' : '#fff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  color: isDark ? '#f1f5f9' : '#1e293b',
                }}
                formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Ventas']}
              />
              <Bar dataKey="ventas" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts */}
        <div className={`${cardBg} rounded-2xl p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="font-bold text-sm">Alertas de Stock</h2>
          </div>
          {stats.lowStock.length === 0 ? (
            <div className="text-center py-8 opacity-40">
              <Package size={32} className="mx-auto mb-2" />
              <p className="text-sm">Sin alertas</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {stats.lowStock.map(p => (
                <div key={p.id} className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                  p.stock === 0
                    ? isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'
                    : isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700'
                }`}>
                  <span className="font-medium truncate flex-1">{p.name}</span>
                  <span className="font-bold ml-2">{p.stock === 0 ? 'AGOTADO' : `${p.stock} u.`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent sales */}
        <div className={`${cardBg} rounded-2xl p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="opacity-40" />
            <h2 className="font-bold text-sm">Ventas Recientes</h2>
          </div>
          {recentSales.length === 0 ? (
            <div className="text-center py-8 opacity-40">
              <ShoppingCart size={32} className="mx-auto mb-2" />
              <p className="text-sm">Sin ventas registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSales.map(sale => (
                <div key={sale.id} className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                  isDark ? 'bg-slate-700/50' : 'bg-slate-50'
                }`}>
                  <div>
                    <p className="font-semibold">{sale.invoiceNumber}</p>
                    <p className="opacity-50">{formatDateTime(sale.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-500">{formatCurrency(sale.totalUSD)}</p>
                    <p className="opacity-50">{sale.items.length} items</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className={`${cardBg} rounded-2xl p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="opacity-40" />
            <h2 className="font-bold text-sm">Productos más Vendidos</h2>
          </div>
          {topProducts.length === 0 ? (
            <div className="text-center py-8 opacity-40">
              <Package size={32} className="mx-auto mb-2" />
              <p className="text-sm">Sin datos de ventas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-500 text-white' : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{p.name}</p>
                    <p className="text-xs opacity-50">{p.qty} unidades</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-500">{formatCurrency(p.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
