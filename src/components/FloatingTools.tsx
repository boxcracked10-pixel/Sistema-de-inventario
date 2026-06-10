import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { safeCalc, formatCurrency } from '../utils/format';
import { Calculator, X, ArrowLeftRight } from 'lucide-react';

export const FloatingTools: React.FC = () => {
  const { theme, bcvRates } = useStore();
  const isDark = theme === 'dark';

  const [showCalc, setShowCalc] = useState(false);
  const [showConv, setShowConv] = useState(false);
  const [display, setDisplay] = useState('0');
  const [hasError, setHasError] = useState(false);

  // Converter state
  const [amount, setAmount] = useState('1');
  const [from, setFrom] = useState<'USD' | 'BS' | 'EUR'>('USD');

  const calcPress = (val: string) => {
    setHasError(false);
    setDisplay(prev => {
      if (prev === '0' && !isNaN(Number(val))) return val;
      if (prev === 'Error') return val;
      return prev + val;
    });
  };

  const calcEqual = () => {
    const result = safeCalc(display);
    if (result === null) {
      setDisplay('Error');
      setHasError(true);
    } else {
      setDisplay(String(result));
    }
  };

  const calcClear = () => { setDisplay('0'); setHasError(false); };
  const calcDel = () => setDisplay(prev => prev.length <= 1 ? '0' : prev.slice(0, -1));

  const convResult = () => {
    const a = parseFloat(amount) || 0;
    if (from === 'USD') return { usd: a, bs: a * bcvRates.USD, eur: a * (bcvRates.USD / bcvRates.EUR) };
    if (from === 'BS') return { bs: a, usd: a / bcvRates.USD, eur: a / bcvRates.EUR };
    return { eur: a, usd: a * (bcvRates.EUR / bcvRates.USD), bs: a * bcvRates.EUR };
  };

  const r = convResult();

  const panelBg = isDark ? 'bg-slate-800 border border-slate-700 text-slate-100' : 'bg-white border border-slate-200 text-slate-800';
  const btnBg = isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      {/* Converter panel */}
      {showConv && (
        <div className={`rounded-2xl shadow-2xl p-4 w-72 ${panelBg} animate-slideUp`}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-sm">Conversor</span>
            <button onClick={() => setShowConv(false)} className="opacity-40 hover:opacity-100"><X size={16} /></button>
          </div>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            className={`w-full rounded-xl border-2 px-3 py-2 text-sm outline-none mb-2 ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`} />
          <select value={from} onChange={e => setFrom(e.target.value as any)}
            className={`w-full rounded-xl border-2 px-3 py-2 text-sm outline-none mb-3 ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <option value="USD">Dólares USD</option>
            <option value="BS">Bolívares Bs</option>
            <option value="EUR">Euros EUR</option>
          </select>
          <div className={`rounded-xl p-3 space-y-2 text-sm ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
            <div className="flex justify-between"><span className="opacity-50">USD</span><span className="font-bold text-emerald-500">{formatCurrency(r.usd || 0)}</span></div>
            <div className="flex justify-between"><span className="opacity-50">Bs</span><span className="font-bold text-indigo-500">{formatCurrency(r.bs || 0, 'BS')}</span></div>
            <div className="flex justify-between"><span className="opacity-50">EUR</span><span className="font-bold text-blue-500">{formatCurrency(r.eur || 0, 'EUR')}</span></div>
          </div>
        </div>
      )}

      {/* Calculator panel */}
      {showCalc && (
        <div className={`rounded-2xl shadow-2xl overflow-hidden w-72 ${panelBg} animate-slideUp`}>
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="font-bold text-sm">Calculadora</span>
            <button onClick={() => setShowCalc(false)} className="opacity-40 hover:opacity-100"><X size={16} /></button>
          </div>
          <div className={`px-4 py-3 text-right text-2xl font-mono font-bold min-h-14 flex items-center justify-end ${hasError ? 'text-red-400' : ''} ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
            <span className="truncate">{display}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 p-3">
            {[
              ['C', 'op'], ['⌫', 'op'], ['%', 'op'], ['÷', 'op2'],
              ['7', ''], ['8', ''], ['9', ''], ['×', 'op2'],
              ['4', ''], ['5', ''], ['6', ''], ['-', 'op2'],
              ['1', ''], ['2', ''], ['3', ''], ['+', 'op2'],
              ['0', 'zero'], ['.', ''], ['=', 'eq'],
            ].map(([key, type]) => (
              <button
                key={key}
                onClick={() => {
                  if (key === 'C') calcClear();
                  else if (key === '⌫') calcDel();
                  else if (key === '=') calcEqual();
                  else if (key === '×') calcPress('*');
                  else if (key === '÷') calcPress('/');
                  else calcPress(key);
                }}
                className={`py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                  type === 'eq' ? 'bg-emerald-600 text-white col-span-2 hover:bg-emerald-700' :
                  type === 'op2' ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
                  type === 'op' ? 'bg-red-500/80 text-white hover:bg-red-600' :
                  type === 'zero' ? `col-span-2 ${btnBg}` :
                  btnBg
                }`}
              >{key}</button>
            ))}
          </div>
        </div>
      )}

      {/* Toggle buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => { setShowConv(!showConv); setShowCalc(false); }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all hover:scale-110 ${
            showConv ? 'bg-emerald-600 text-white' : isDark ? 'bg-slate-800 border border-slate-700 text-emerald-400' : 'bg-white border border-slate-200 text-emerald-600'
          }`}
          title="Conversor de divisas"
        >
          <ArrowLeftRight size={20} />
        </button>
        <button
          onClick={() => { setShowCalc(!showCalc); setShowConv(false); }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all hover:scale-110 ${
            showCalc ? 'bg-indigo-600 text-white' : isDark ? 'bg-slate-800 border border-slate-700 text-indigo-400' : 'bg-white border border-slate-200 text-indigo-600'
          }`}
          title="Calculadora"
        >
          <Calculator size={20} />
        </button>
      </div>
    </div>
  );
};
