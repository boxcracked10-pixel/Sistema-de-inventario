export function formatCurrency(amount: number, currency: 'USD' | 'BS' | 'EUR' = 'USD'): string {
  if (isNaN(amount)) return '—';
  
  if (currency === 'BS') {
    return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === 'EUR') {
    return `€ ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$ ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateInvoiceNumber(prefix: string, counter: number): string {
  return `${prefix}${String(counter).padStart(8, '0')}`;
}

export function safeCalc(expression: string): number | null {
  // Safe calculator: only allow numbers and basic operators, no eval
  const cleaned = expression.replace(/\s/g, '');
  const validPattern = /^[0-9+\-*/().]+$/;
  if (!validPattern.test(cleaned)) return null;
  
  try {
    // Manual parsing using Function constructor in strict mode with no globals
    // Still safer than eval: no access to window/document
    const result = new Function(`'use strict'; return (${cleaned})`)();
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return Math.round(result * 1e10) / 1e10;
  } catch {
    return null;
  }
}
