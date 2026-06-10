import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

type ReportType = 'inventory' | 'sales' | 'kardex';
const PAYMENT_LABELS: Record<string, string> = {
  efectivo_usd: 'Efectivo USD', efectivo_bs: 'Efectivo Bs', transferencia: 'Transferencia',
  pago_movil: 'Pago Móvil', tarjeta: 'Tarjeta', zelle: 'Zelle', mixto: 'Mixto',
};

export const Reports: React.FC = () => {
  const { products, sales, kardex, categories, bcvRates, theme } = useStore();
  const isDark = theme === 'dark';
  const [reportType, setReportType] = useState<ReportType>('inventory');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const getPriceUSD = (priceSell: number, currency: string) => {
    if (currency === 'USD') return priceSell;
    if (currency === 'BS') return priceSell / bcvRates.USD;
    return priceSell * (bcvRates.EUR / bcvRates.USD);
  };

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const d = s.createdAt.split('T')[0];
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [sales, dateFrom, dateTo]);

  const filteredKardex = useMemo(() => {
    return kardex.filter(k => {
      const d = k.createdAt.split('T')[0];
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [kardex, dateFrom, dateTo]);

  const inventoryStats = useMemo(() => {
    const totalUSD = products.reduce((sum, p) => sum + getPriceUSD(p.priceSell, p.currency) * p.stock, 0);
    const lowStock = products.filter(p => p.active && p.stock <= p.minStock);
    return { totalUSD, totalBS: totalUSD * bcvRates.USD, lowStock };
  }, [products, bcvRates]);

  const salesStats = useMemo(() => {
    const total = filteredSales.reduce((sum, s) => sum + s.totalUSD, 0);
    const totalBS = filteredSales.reduce((sum, s) => sum + s.totalBS, 0);
    const avgTicket = filteredSales.length > 0 ? total / filteredSales.length : 0;
    return { total, totalBS, avgTicket };
  }, [filteredSales]);

  const exportInventoryExcel = () => {
    const data = products.filter(p => p.active).map(p => {
      const cat = categories.find(c => c.id === p.categoryId);
      const priceUSD = getPriceUSD(p.priceSell, p.currency);
      return {
        'Código': p.code, 'Producto': p.name, 'Categoría': cat?.name || '', 'Stock': p.stock,
        'Unidad': p.unit, 'Precio Venta': p.priceSell, 'Moneda': p.currency,
        'Precio USD': priceUSD.toFixed(2), 'Valor USD': (priceUSD * p.stock).toFixed(2),
        'Valor Bs': (priceUSD * p.stock * bcvRates.USD).toFixed(2), 'Stock Mín': p.minStock,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, `Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportSalesExcel = () => {
    const data = filteredSales.map(s => ({
      'Nro Factura': s.invoiceNumber, 'Fecha': formatDateTime(s.createdAt),
      'Cliente': s.clientName || 'Consumidor Final', 'Subtotal USD': s.subtotalUSD.toFixed(2),
      'Descuento': s.discountUSD.toFixed(2), 'IVA': s.taxIVAAmount.toFixed(2),
      'IGTF': s.taxIGTFAmount.toFixed(2), 'Total USD': s.totalUSD.toFixed(2),
      'Total Bs': s.totalBS.toFixed(2), 'Forma de Pago': PAYMENT_LABELS[s.paymentMethod] || s.paymentMethod,
      'Cajero': s.cashierName,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    XLSX.writeFile(wb, `Ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const cardBg = isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200';

  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">Reportes</h1><p className="text-sm opacity-50">Análisis y exportación de datos</p></div>

      {/* Report type selector */}
      <div className={`flex gap-2 p-1 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'} w-fit`}>
        {([['inventory', 'Inventario'], ['sales', 'Ventas'], ['kardex', 'Kardex']] as [ReportType, string][]).map(([type, label]) => (
          <button key={type} onClick={() => setReportType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${reportType === type ? 'bg-indigo-600 text-white shadow' : 'opacity-60 hover:opacity-100'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Date range */}
      {reportType !== 'inventory' && (
        <div className={`flex flex-wrap gap-3 p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex flex-col gap-1">
            <label className="text-xs opacity-60">Desde</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className={`rounded-xl border-2 px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-400'}`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs opacity-60">Hasta</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className={`rounded-xl border-2 px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-400'}`} />
          </div>
          <button onClick={() => { setDateFrom(''); setDateTo(''); }} className={`self-end px-3 py-2 rounded-xl text-xs border ${isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}>
            Limpiar
          </button>
        </div>
      )}

      {/* Inventory Report */}
      {reportType === 'inventory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`rounded-2xl p-4 border ${cardBg}`}>
              <p className="text-xs opacity-50">Total productos activos</p>
              <p className="text-2xl font-bold text-indigo-500">{products.filter(p => p.active).length}</p>
            </div>
            <div className={`rounded-2xl p-4 border ${cardBg}`}>
              <p className="text-xs opacity-50">Valor inventario (USD)</p>
              <p className="text-2xl font-bold text-emerald-500">{formatCurrency(inventoryStats.totalUSD)}</p>
            </div>
            <div className={`rounded-2xl p-4 border ${cardBg}`}>
              <p className="text-xs opacity-50">Valor inventario (Bs)</p>
              <p className="text-2xl font-bold text-blue-500">{formatCurrency(inventoryStats.totalBS, 'BS')}</p>
            </div>
            <div className={`rounded-2xl p-4 border ${cardBg}`}>
              <p className="text-xs opacity-50">Productos bajo mínimo</p>
              <p className="text-2xl font-bold text-amber-500">{inventoryStats.lowStock.length}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={exportInventoryExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold">
              <FileSpreadsheet size={16} /> Exportar Excel
            </button>
          </div>

          <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? 'bg-slate-700/60' : 'bg-slate-50'}>
                    {['Código', 'Producto', 'Categoría', 'Stock', 'Precio Venta', 'Valor USD', 'Valor Bs', 'Estado'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold opacity-60 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {products.filter(p => p.active).map(p => {
                    const cat = categories.find(c => c.id === p.categoryId);
                    const priceUSD = getPriceUSD(p.priceSell, p.currency);
                    const isLow = p.stock <= p.minStock;
                    return (
                      <tr key={p.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}`}>
                        <td className="px-4 py-2 font-mono text-xs">{p.code}</td>
                        <td className="px-4 py-2 font-semibold">{p.name}</td>
                        <td className="px-4 py-2 opacity-60">{cat?.name || '—'}</td>
                        <td className="px-4 py-2 font-bold">{p.stock}</td>
                        <td className="px-4 py-2">{formatCurrency(p.priceSell, p.currency)}</td>
                        <td className="px-4 py-2 font-semibold text-emerald-500">{formatCurrency(priceUSD * p.stock)}</td>
                        <td className="px-4 py-2 text-blue-500">{formatCurrency(priceUSD * p.stock * bcvRates.USD, 'BS')}</td>
                        <td className="px-4 py-2">
                          <Badge variant={p.stock === 0 ? 'danger' : isLow ? 'warning' : 'success'}>
                            {p.stock === 0 ? 'Agotado' : isLow ? 'Stock Bajo' : 'Normal'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className={isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'}>
                    <td colSpan={5} className="px-4 py-3 font-bold text-sm">TOTAL INVENTARIO</td>
                    <td className="px-4 py-3 font-bold text-emerald-500">{formatCurrency(inventoryStats.totalUSD)}</td>
                    <td className="px-4 py-3 font-bold text-blue-500">{formatCurrency(inventoryStats.totalBS, 'BS')}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sales Report */}
      {reportType === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div className={`rounded-2xl p-4 border ${cardBg}`}>
              <p className="text-xs opacity-50">Total ventas</p>
              <p className="text-2xl font-bold text-indigo-500">{filteredSales.length}</p>
            </div>
            <div className={`rounded-2xl p-4 border ${cardBg}`}>
              <p className="text-xs opacity-50">Total USD</p>
              <p className="text-2xl font-bold text-emerald-500">{formatCurrency(salesStats.total)}</p>
            </div>
            <div className={`rounded-2xl p-4 border ${cardBg}`}>
              <p className="text-xs opacity-50">Ticket promedio</p>
              <p className="text-2xl font-bold text-amber-500">{formatCurrency(salesStats.avgTicket)}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={exportSalesExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold">
              <FileSpreadsheet size={16} /> Exportar Excel
            </button>
          </div>

          <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? 'bg-slate-700/60' : 'bg-slate-50'}>
                    {['Factura', 'Fecha', 'Cliente', 'Items', 'Descuento', 'Total USD', 'Total Bs', 'Pago', 'Cajero'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold opacity-60 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {filteredSales.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 opacity-40">Sin ventas en el período seleccionado</td></tr>
                  ) : filteredSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(s => (
                    <tr key={s.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-2 font-mono text-xs font-semibold">{s.invoiceNumber}</td>
                      <td className="px-4 py-2 text-xs opacity-60 whitespace-nowrap">{formatDateTime(s.createdAt)}</td>
                      <td className="px-4 py-2 text-xs">{s.clientName || 'Consumidor Final'}</td>
                      <td className="px-4 py-2 text-center">{s.items.length}</td>
                      <td className="px-4 py-2 text-red-400">{s.discountPct > 0 ? `${s.discountPct}%` : '—'}</td>
                      <td className="px-4 py-2 font-bold text-emerald-500">{formatCurrency(s.totalUSD)}</td>
                      <td className="px-4 py-2 text-blue-500">{formatCurrency(s.totalBS, 'BS')}</td>
                      <td className="px-4 py-2 text-xs">{PAYMENT_LABELS[s.paymentMethod]}</td>
                      <td className="px-4 py-2 text-xs opacity-60">{s.cashierName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Kardex Report */}
      {reportType === 'kardex' && (
        <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? 'bg-slate-700/60' : 'bg-slate-50'}>
                  {['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock Antes', 'Stock Después', 'Motivo', 'Usuario'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold opacity-60 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredKardex.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 opacity-40">Sin movimientos en el período</td></tr>
                ) : [...filteredKardex].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(k => (
                  <tr key={k.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-2 text-xs opacity-60 whitespace-nowrap">{formatDateTime(k.createdAt)}</td>
                    <td className="px-4 py-2 text-xs font-semibold">{k.productName}</td>
                    <td className="px-4 py-2">
                      <Badge variant={k.type === 'entrada' ? 'success' : k.type === 'venta' ? 'info' : k.type === 'salida' ? 'danger' : 'warning'}>
                        {k.type}
                      </Badge>
                    </td>
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
      )}
    </div>
  );
};
