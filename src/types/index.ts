export type UserRole = 'admin' | 'cajero' | 'almacen';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  stock: number;
  minStock: number;
  maxStock?: number;
  priceBuy: number;
  priceSell: number;
  currency: 'USD' | 'BS' | 'EUR';
  unit: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  rif?: string;
  cedula?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  rif?: string;
  phone?: string;
  email?: string;
  address?: string;
  contactName?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  priceSell: number;
  currency: 'USD' | 'BS' | 'EUR';
  priceUSD: number;
  subtotalUSD: number;
}

export type PaymentMethod = 'efectivo_usd' | 'efectivo_bs' | 'transferencia' | 'pago_movil' | 'tarjeta' | 'zelle' | 'mixto';

export interface Sale {
  id: string;
  invoiceNumber: string;
  clientId?: string;
  clientName?: string;
  items: SaleItem[];
  subtotalUSD: number;
  discountPct: number;
  discountUSD: number;
  taxIVA: boolean;
  taxIVAAmount: number;
  taxIGTF: boolean;
  taxIGTFAmount: number;
  totalUSD: number;
  totalBS: number;
  paymentMethod: PaymentMethod;
  rateUSD: number;
  cashierId: string;
  cashierName: string;
  notes?: string;
  createdAt: string;
}

export interface KardexEntry {
  id: string;
  productId: string;
  productName: string;
  type: 'entrada' | 'salida' | 'ajuste' | 'venta';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  referenceId?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface BCVRates {
  USD: number;
  EUR: number;
  lastUpdate: string | null;
}

export interface BCVHistoryEntry {
  date: string;
  usd: number;
  eur: number;
}

export interface CompanySettings {
  name: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  receiptHeader: string;
  receiptFooter: string;
  invoicePrefix: string;
  invoiceCounter: number;
}

export interface AuditLog {
  id: string;
  date: string;
  userId: string | null;
  userName: string;
  action: string;
  details?: string;
}

export interface CashRegister {
  id: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  openingAmount: number;
  closingAmount?: number;
  totalSales: number;
  totalSalesUSD: number;
  status: 'open' | 'closed';
}

export type Theme = 'light' | 'dark';
export type ActiveModule = 
  | 'dashboard' 
  | 'products' 
  | 'sales' 
  | 'clients' 
  | 'suppliers' 
  | 'inventory' 
  | 'reports' 
  | 'rates' 
  | 'settings' 
  | 'users'
  | 'audit';
