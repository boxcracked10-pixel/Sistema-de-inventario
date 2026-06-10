import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { formatCurrency, generateId, generateInvoiceNumber, formatDateTime } from '../../utils/format';
import { Search, Plus, Minus, Trash2, ShoppingCart, Printer, X, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Sale, SaleItem, PaymentMethod } from '../../types';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo_usd: 'Efectivo USD',
  efectivo_bs: 'Efectivo Bs',
  transferencia: 'Transferencia',
  pago_movil: 'Pago Móvil',
  tarjeta: 'Tarjeta',
  zelle: 'Zelle',
  mixto: 'Pago Mixto',
};

export const Sales: React.FC = () => {
  const { products, clients, addSale, bcvRates, theme, companySettings, currentUser } = useStore();
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [clientId, setClientId] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const [applyIVA, setApplyIVA] = useState(false);
  const [applyIGTF, setApplyIGTF] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo_usd');
  const [notes, setNotes] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const activeProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p =>
      p.active && p.stock > 0 &&
      (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.barcode || '').includes(q))
    );
  }, [products, search]);

  const getPriceUSD = (p: { priceSell: number; currency: 'USD' | 'BS' | 'EUR' }) => {
    if (p.currency === 'USD') return p.priceSell;
    if (p.currency === 'BS') return p.priceSell / bcvRates.USD;
    return p.priceSell * (bcvRates.EUR / bcvRates.USD);
  };

  const addToCart = (product: typeof products[0]) => {
    const priceUSD = getPriceUSD(product);
    const existing = cart.find(i => i.productId === product.id);
    const currentQty = existing?.quantity ?? 0;
    if (currentQty >= product.stock) {
      toast.error(`Stock insuficiente (${product.stock} disponibles)`);
      return;
    }
    if (existing) {
      setCart(c => c.map(i => i.productId === product.id
        ? { ...i, quantity: i.quantity + 1, subtotalUSD: (i.quantity + 1) * priceUSD }
        : i
      ));
    } else {
      setCart(c => [...c, {
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        quantity: 1,
        priceSell: product.priceSell,
        currency: product.currency,
        priceUSD,
        subtotalUSD: priceUSD,
      }]);
    }
  };

  const changeQty = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    setCart(c => c
      .map(i => {
        if (i.productId !== productId) return i;
        const newQty = i.quantity + delta;
        if (newQty <= 0) return null;
        if (product && newQty > product.stock) {
          toast.error(`Stock máximo disponible: ${product.stock}`);
          return i;
        }
        return { ...i, quantity: newQty, subtotalUSD: newQty * i.priceUSD };
      })
      .filter(Boolean) as SaleItem[]
    );
  };

  const removeItem = (productId: string) => setCart(c => c.filter(i => i.productId !== productId));
  const clearCart = () => { setCart([]); setDiscountPct(0); setApplyIVA(false); setApplyIGTF(false); setNotes(''); setClientId(''); };

  const totals = useMemo(() => {
    const subtotalUSD = cart.reduce((s, i) => s + i.subtotalUSD, 0);
    const discountUSD = subtotalUSD * (discountPct / 100);
    const afterDiscount = subtotalUSD - discountUSD;
    const ivaAmount = applyIVA ? afterDiscount * 0.16 : 0;
    const igtfAmount = applyIGTF ? (afterDiscount + ivaAmount) * 0.03 : 0;
    const totalUSD = afterDiscount + ivaAmount + igtfAmount;
    const totalBS = totalUSD * bcvRates.USD;
    return { subtotalUSD, discountUSD, afterDiscount, ivaAmount, igtfAmount, totalUSD, totalBS };
  }, [cart, discountPct, applyIVA, applyIGTF, bcvRates]);

  const handleCheckout = () => {
    if (cart.length === 0) { toast.error('El carrito está vacío'); return; }
    const client = clients.find(c => c.id === clientId);
    const invoiceNumber = generateInvoiceNumber(companySettings.invoicePrefix, companySettings.invoiceCounter);
    const sale: Sale = {
      id: generateId(),
      invoiceNumber,
      clientId: clientId || undefined,
      clientName: client?.name,
      items: cart,
      subtotalUSD: totals.subtotalUSD,
      discountPct,
      discountUSD: totals.discountUSD,
      taxIVA: applyIVA,
      taxIVAAmount: totals.ivaAmount,
      taxIGTF: applyIGTF,
      taxIGTFAmount: totals.igtfAmount,
      totalUSD: totals.totalUSD,
      totalBS: totals.totalBS,
      paymentMethod,
      rateUSD: bcvRates.USD,
      cashierId: currentUser!.id,
      cashierName: currentUser!.fullName,
      notes,
      createdAt: new Date().toISOString(),
    };
    addSale(sale);
    setLastSale(sale);
    clearCart();
    setShowReceipt(true);
    toast.success(`Venta ${invoiceNumber} registrada`);
  };

  const printReceipt = () => window.print();

  const cardBg = isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200';

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Product Search Panel */}
      <div className="flex-1 space-y-3">
        <div>
          <h1 className="text-2xl font-bold">Punto de Venta</h1>
          <p className="text-sm opacity-50">Selecciona productos para agregar al carrito</p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto por nombre, código o barcode..."
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border-2 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-400'
            }`}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
          {activeProducts.map(p => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className={`text-left p-3 rounded-xl border-2 transition-all hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 ${cardBg}`}
            >
              <p className="font-semibold text-sm truncate">{p.name}</p>
              <p className="text-xs opacity-40 mb-2">{p.code}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-indigo-500">{formatCurrency(p.priceSell, p.currency)}</span>
                <Badge variant={p.stock <= p.minStock ? 'warning' : 'success'} className="text-xs">{p.stock}</Badge>
              </div>
            </button>
          ))}
          {activeProducts.length === 0 && (
            <div className="col-span-full text-center py-12 opacity-40">
              <ShoppingCart size={40} className="mx-auto mb-2" />
              <p className="text-sm">Sin productos disponibles</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className={`w-full lg:w-96 rounded-2xl border flex flex-col ${cardBg}`}>
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-indigo-500" />
            <h2 className="font-bold">Carrito ({cart.length})</h2>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1">
              <X size={12} /> Vaciar
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-8 opacity-40">
              <ShoppingCart size={32} className="mx-auto mb-2" />
              <p className="text-sm">Carrito vacío</p>
            </div>
          ) : cart.map(item => (
            <div key={item.productId} className={`flex items-center gap-2 p-2 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{item.productName}</p>
                <p className="text-xs opacity-40">{formatCurrency(item.priceUSD)} c/u</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => changeQty(item.productId, -1)} className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-200 hover:bg-slate-300'} transition-colors`}>
                  <Minus size={10} />
                </button>
                <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                <button onClick={() => changeQty(item.productId, 1)} className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-200 hover:bg-slate-300'} transition-colors`}>
                  <Plus size={10} />
                </button>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-indigo-500">{formatCurrency(item.subtotalUSD)}</p>
              </div>
              <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-500 ml-1">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Cart footer */}
        <div className={`p-4 border-t space-y-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          {/* Client */}
          <select
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            className={`w-full rounded-xl border-2 px-3 py-2 text-xs outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-400'}`}
          >
            <option value="">Cliente: Consumidor Final</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Discount */}
          <div className="flex items-center gap-2">
            <label className="text-xs opacity-60 w-20 flex-shrink-0">Descuento %</label>
            <input
              type="number" min="0" max="100" value={discountPct}
              onChange={e => setDiscountPct(Math.min(100, Math.max(0, Number(e.target.value))))}
              className={`w-full rounded-xl border-2 px-3 py-1.5 text-xs outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-400'}`}
            />
          </div>

          {/* Taxes */}
          <div className="flex gap-3">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={applyIVA} onChange={e => setApplyIVA(e.target.checked)} className="rounded" />
              <span>IVA 16%</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={applyIGTF} onChange={e => setApplyIGTF(e.target.checked)} className="rounded" />
              <span>IGTF 3%</span>
            </label>
          </div>

          {/* Payment */}
          <select
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
            className={`w-full rounded-xl border-2 px-3 py-2 text-xs outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-400'}`}
          >
            {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          {/* Totals */}
          <div className={`rounded-xl p-3 space-y-1.5 text-xs ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
            <div className="flex justify-between opacity-60"><span>Subtotal</span><span>{formatCurrency(totals.subtotalUSD)}</span></div>
            {totals.discountUSD > 0 && <div className="flex justify-between text-red-400"><span>Descuento ({discountPct}%)</span><span>-{formatCurrency(totals.discountUSD)}</span></div>}
            {applyIVA && <div className="flex justify-between opacity-60"><span>IVA 16%</span><span>{formatCurrency(totals.ivaAmount)}</span></div>}
            {applyIGTF && <div className="flex justify-between opacity-60"><span>IGTF 3%</span><span>{formatCurrency(totals.igtfAmount)}</span></div>}
            <div className={`flex justify-between font-bold text-sm pt-1 border-t ${isDark ? 'border-slate-600' : 'border-slate-200'}`}>
              <span>TOTAL</span>
              <div className="text-right">
                <p className="text-indigo-500">{formatCurrency(totals.totalUSD)}</p>
                <p className="text-xs opacity-60 font-normal">{formatCurrency(totals.totalBS, 'BS')}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            <Receipt size={16} /> Cobrar {formatCurrency(totals.totalUSD)}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {lastSale && (
        <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)} title="Recibo de Venta" size="md">
          <div ref={receiptRef} className="font-mono text-sm space-y-3">
            <div className="text-center border-b pb-3">
              <p className="font-bold text-base">{companySettings.name}</p>
              <p className="text-xs opacity-60">RIF: {companySettings.rif}</p>
              {companySettings.address && <p className="text-xs opacity-60">{companySettings.address}</p>}
              <p className="font-bold mt-2">{lastSale.invoiceNumber}</p>
              <p className="text-xs opacity-60">{formatDateTime(lastSale.createdAt)}</p>
            </div>
            {lastSale.clientName && <p className="text-xs"><strong>Cliente:</strong> {lastSale.clientName}</p>}
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Producto</th>
                  <th className="text-center">Cant</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {lastSale.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-0.5 truncate max-w-[140px]">{item.productName}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">{formatCurrency(item.subtotalUSD)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t pt-2 space-y-1 text-xs">
              {lastSale.discountUSD > 0 && <div className="flex justify-between"><span>Descuento</span><span>-{formatCurrency(lastSale.discountUSD)}</span></div>}
              {lastSale.taxIVA && <div className="flex justify-between"><span>IVA 16%</span><span>{formatCurrency(lastSale.taxIVAAmount)}</span></div>}
              {lastSale.taxIGTF && <div className="flex justify-between"><span>IGTF 3%</span><span>{formatCurrency(lastSale.taxIGTFAmount)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>TOTAL</span>
                <span>{formatCurrency(lastSale.totalUSD)}</span>
              </div>
              <div className="flex justify-between opacity-60">
                <span>En Bolívares</span>
                <span>{formatCurrency(lastSale.totalBS, 'BS')}</span>
              </div>
              <div className="flex justify-between opacity-60">
                <span>Forma de pago</span>
                <span>{PAYMENT_LABELS[lastSale.paymentMethod]}</span>
              </div>
            </div>
            <p className="text-center text-xs opacity-60 border-t pt-2">{companySettings.receiptHeader}</p>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowReceipt(false)} className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'}`}>Cerrar</button>
            <button onClick={printReceipt} className="flex-1 py-2 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2">
              <Printer size={14} /> Imprimir
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
