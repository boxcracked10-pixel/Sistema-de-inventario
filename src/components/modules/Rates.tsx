import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { DollarSign, RefreshCw, Edit, History, ArrowLeftRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';

export const Rates: React.FC = () => {
  const { bcvRates, bcvHistory, setBcvRates, theme } = useStore();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualUSD, setManualUSD] = useState(bcvRates.USD.toString());
  const [manualEUR, setManualEUR] = useState(bcvRates.EUR.toString());

  // Converter state
  const [convertAmount, setConvertAmount] = useState('1');
  const [convertFrom, setConvertFrom] = useState<'USD' | 'BS' | 'EUR'>('USD');
  const [includeIVA, setIncludeIVA] = useState(false);
  const [includeIGTF, setIncludeIGTF] = useState(false);

  const fetchBCV = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://pydolarve.org/api/v1/dollar?monitor=bcv');
      const data = await res.json();
      if (data?.price) {
        let newUSD = data.price;
        let newEUR = bcvRates.EUR;
        try {
          const eurRes = await fetch('https://pydolarve.org/api/v1/dollar?monitor=bcv&currency=eur');
          const eurData = await eurRes.json();
          if (eurData?.price) newEUR = eurData.price;
        } catch { /* keep existing EUR */ }
        setBcvRates({ USD: newUSD, EUR: newEUR, lastUpdate: new Date().toISOString() });
        toast.success('Tasas actualizadas desde BCV');
        return;
      }
    } catch { /* try fallback */ }

    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares');
      const data = await res.json();
      const bcvData = data.find((d: any) => d.fuente === 'oficial');
      if (bcvData) {
        setBcvRates({ USD: bcvData.promedio, EUR: bcvRates.EUR, lastUpdate: new Date().toISOString() });
        toast.success('Tasas actualizadas (fuente alternativa)');
        return;
      }
    } catch { /* both failed */ }

    toast.error('No se pudo conectar con la API del BCV');
    setLoading(false);
  };

  const handleFetch = async () => {
    await fetchBCV();
    setLoading(false);
  };

  const saveManual = () => {
    const usd = parseFloat(manualUSD);
    const eur = parseFloat(manualEUR);
    if (isNaN(usd) || usd <= 0) { toast.error('Tasa USD inválida'); return; }
    if (isNaN(eur) || eur <= 0) { toast.error('Tasa EUR inválida'); return; }
    setBcvRates({ USD: usd, EUR: eur, lastUpdate: new Date().toISOString() });
    setShowManual(false);
    toast.success('Tasas actualizadas manualmente');
  };

  // Converter logic
  const convertResult = () => {
    const amount = parseFloat(convertAmount) || 0;
    let a = amount;
    if (includeIVA) a *= 1.16;
    if (includeIGTF) a *= 1.03;

    let usd: number, bs: number, eur: number;
    if (convertFrom === 'BS') {
      bs = a; usd = a / bcvRates.USD; eur = a / bcvRates.EUR;
    } else if (convertFrom === 'USD') {
      usd = a; bs = a * bcvRates.USD; eur = a * (bcvRates.USD / bcvRates.EUR);
    } else {
      eur = a; bs = a * bcvRates.EUR; usd = a * (bcvRates.EUR / bcvRates.USD);
    }
    return { usd: usd!, bs: bs!, eur: eur! };
  };

  const result = convertResult();
  const cardBg = isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200';
  const sortedHistory = [...bcvHistory].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);

  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">Tasas BCV</h1><p className="text-sm opacity-50">Gestión de tasas de cambio</p></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* USD card */}
        <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold opacity-80">Dólar USD</span>
            <DollarSign size={20} className="opacity-80" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(bcvRates.USD, 'BS').replace('Bs. ', '')} Bs</p>
          <p className="text-xs opacity-60 mt-1">por 1 USD</p>
        </div>

        {/* EUR card */}
        <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold opacity-80">Euro EUR</span>
            <span className="text-xl font-bold opacity-80">€</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(bcvRates.EUR, 'BS').replace('Bs. ', '')} Bs</p>
          <p className="text-xs opacity-60 mt-1">por 1 EUR</p>
        </div>

        {/* Actions card */}
        <div className={`rounded-2xl p-5 border ${cardBg}`}>
          <p className="text-sm font-semibold mb-1">Última actualización</p>
          <p className="text-xs opacity-50 mb-4">{bcvRates.lastUpdate ? formatDateTime(bcvRates.lastUpdate) : 'Nunca'}</p>
          <div className="flex flex-col gap-2">
            <button onClick={handleFetch} disabled={loading} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Actualizando...' : 'Actualizar desde BCV'}
            </button>
            <button onClick={() => { setManualUSD(bcvRates.USD.toString()); setManualEUR(bcvRates.EUR.toString()); setShowManual(true); }}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}>
              <Edit size={14} /> Ingresar manualmente
            </button>
          </div>
        </div>
      </div>

      {/* Converter */}
      <div className={`rounded-2xl border p-5 ${cardBg}`}>
        <div className="flex items-center gap-2 mb-4">
          <ArrowLeftRight size={18} className="text-indigo-500" />
          <h2 className="font-bold">Conversor de Divisas</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs opacity-60">Monto</label>
            <input type="number" min="0" step="0.01" value={convertAmount} onChange={e => setConvertAmount(e.target.value)}
              className={`rounded-xl border-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-400'}`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs opacity-60">Desde</label>
            <select value={convertFrom} onChange={e => setConvertFrom(e.target.value as any)}
              className={`rounded-xl border-2 px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-slate-200'}`}>
              <option value="USD">Dólar (USD)</option>
              <option value="BS">Bolívares (Bs)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 justify-end">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={includeIVA} onChange={e => setIncludeIVA(e.target.checked)} className="rounded" />
              IVA 16%
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={includeIGTF} onChange={e => setIncludeIGTF(e.target.checked)} className="rounded" />
              IGTF 3%
            </label>
          </div>
          <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'} space-y-2`}>
            <div><p className="text-xs opacity-50">USD</p><p className="font-bold text-emerald-500">{formatCurrency(result.usd)}</p></div>
            <div><p className="text-xs opacity-50">Bolívares</p><p className="font-bold text-indigo-500">{formatCurrency(result.bs, 'BS')}</p></div>
            <div><p className="text-xs opacity-50">EUR</p><p className="font-bold text-blue-500">{formatCurrency(result.eur, 'EUR')}</p></div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className={`rounded-2xl border ${cardBg}`}>
        <div className={`p-4 border-b flex items-center gap-2 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <History size={16} className="opacity-40" />
          <h2 className="font-bold">Historial de Tasas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-slate-700/40' : 'bg-slate-50'}>
                {['Fecha', 'USD (Bs)', 'EUR (Bs)'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold opacity-60 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {sortedHistory.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-8 opacity-40">Sin historial</td></tr>
              ) : sortedHistory.map((h, i) => (
                <tr key={i} className={`transition-colors ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 py-2">{new Date(h.date + 'T12:00:00').toLocaleDateString('es-VE')}</td>
                  <td className="px-4 py-2 font-semibold text-emerald-500">{h.usd.toFixed(2)} Bs</td>
                  <td className="px-4 py-2 font-semibold text-blue-500">{h.eur.toFixed(2)} Bs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual rate modal */}
      <Modal isOpen={showManual} onClose={() => setShowManual(false)} title="Establecer tasa manual" size="sm">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Dólar (Bs por 1 USD)</label>
            <input type="number" step="0.01" min="0" value={manualUSD} onChange={e => setManualUSD(e.target.value)}
              className={`rounded-xl border-2 px-4 py-2.5 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-400'}`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Euro (Bs por 1 EUR)</label>
            <input type="number" step="0.01" min="0" value={manualEUR} onChange={e => setManualEUR(e.target.value)}
              className={`rounded-xl border-2 px-4 py-2.5 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-400'}`} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowManual(false)} className={`px-4 py-2 rounded-xl text-sm border ${isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}>Cancelar</button>
          <button onClick={saveManual} className="px-4 py-2 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Guardar</button>
        </div>
      </Modal>
    </div>
  );
};
