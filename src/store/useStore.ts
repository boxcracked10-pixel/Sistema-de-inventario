import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User, Product, Category, Client, Supplier,
  Sale, KardexEntry, BCVRates, BCVHistoryEntry,
  CompanySettings, AuditLog, Theme, ActiveModule, CashRegister
} from '../types';
import { generateId } from '../utils/format';
import { hashPassword } from '../utils/crypto';

interface AppState {
  // Auth
  currentUser: User | null;
  users: User[];
  
  // Theme
  theme: Theme;
  
  // Navigation
  activeModule: ActiveModule;
  sidebarExpanded: boolean;
  
  // Data
  products: Product[];
  categories: Category[];
  clients: Client[];
  suppliers: Supplier[];
  sales: Sale[];
  kardex: KardexEntry[];
  cashRegisters: CashRegister[];
  auditLog: AuditLog[];
  
  // Rates
  bcvRates: BCVRates;
  bcvHistory: BCVHistoryEntry[];
  
  // Company
  companySettings: CompanySettings;

  // Actions - Auth
  login: (user: User) => void;
  logout: () => void;
  
  // Actions - Theme
  toggleTheme: () => void;
  
  // Actions - Navigation
  setActiveModule: (module: ActiveModule) => void;
  toggleSidebar: () => void;
  
  // Actions - Users
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Actions - Products
  addProduct: (product: Product) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, quantity: number, type: KardexEntry['type'], reason: string, refId?: string) => void;
  
  // Actions - Categories
  addCategory: (category: Category) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // Actions - Clients
  addClient: (client: Client) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  // Actions - Suppliers
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  // Actions - Sales
  addSale: (sale: Sale) => void;
  
  // Actions - Cash Register
  openCashRegister: (amount: number) => void;
  closeCashRegister: (amount: number) => void;
  getCurrentCashRegister: () => CashRegister | null;
  
  // Actions - Rates
  setBcvRates: (rates: BCVRates) => void;
  addBcvHistory: (entry: BCVHistoryEntry) => void;
  
  // Actions - Company
  setCompanySettings: (settings: CompanySettings) => void;
  
  // Actions - Audit
  logAction: (action: string, details?: string) => void;
  
  // Actions - Init
  initializeDefaultData: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      theme: 'dark',
      activeModule: 'dashboard',
      sidebarExpanded: false,
      products: [],
      categories: [],
      clients: [],
      suppliers: [],
      sales: [],
      kardex: [],
      cashRegisters: [],
      auditLog: [],
      bcvRates: { USD: 36.50, EUR: 40.00, lastUpdate: null },
      bcvHistory: [],
      companySettings: {
        name: 'Mi Empresa C.A.',
        rif: 'J-00000000-0',
        address: '',
        phone: '',
        email: '',
        receiptHeader: '¡Gracias por su compra!',
        receiptFooter: 'Vuelva pronto',
        invoicePrefix: 'FAC-',
        invoiceCounter: 1,
      },

      login: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),

      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      setActiveModule: (module) => set({ activeModule: module }),
      toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),

      addUser: (user) => set((s) => ({ users: [...s.users, user] })),
      updateUser: (id, data) => set((s) => ({
        users: s.users.map(u => u.id === id ? { ...u, ...data } : u)
      })),
      deleteUser: (id) => set((s) => ({ users: s.users.filter(u => u.id !== id) })),

      addProduct: (product) => {
        set((s) => ({ products: [...s.products, product] }));
        get().logAction('Producto creado', `${product.code} - ${product.name}`);
      },
      updateProduct: (id, data) => {
        set((s) => ({
          products: s.products.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)
        }));
        get().logAction('Producto actualizado', `ID: ${id}`);
      },
      deleteProduct: (id) => {
        const product = get().products.find(p => p.id === id);
        set((s) => ({ products: s.products.filter(p => p.id !== id) }));
        get().logAction('Producto eliminado', `${product?.code} - ${product?.name}`);
      },

      adjustStock: (productId, quantity, type, reason, refId) => {
        const product = get().products.find(p => p.id === productId);
        if (!product) return;
        const stockBefore = product.stock;
        const stockAfter = type === 'salida' || type === 'venta'
          ? stockBefore - quantity
          : stockBefore + quantity;

        set((s) => ({
          products: s.products.map(p => p.id === productId
            ? { ...p, stock: stockAfter, updatedAt: new Date().toISOString() }
            : p
          ),
          kardex: [...s.kardex, {
            id: generateId(),
            productId,
            productName: product.name,
            type,
            quantity,
            stockBefore,
            stockAfter,
            reason,
            referenceId: refId,
            userId: s.currentUser?.id ?? 'system',
            userName: s.currentUser?.fullName ?? 'Sistema',
            createdAt: new Date().toISOString(),
          }]
        }));
      },

      addCategory: (cat) => set((s) => ({ categories: [...s.categories, cat] })),
      updateCategory: (id, data) => set((s) => ({
        categories: s.categories.map(c => c.id === id ? { ...c, ...data } : c)
      })),
      deleteCategory: (id) => set((s) => ({ categories: s.categories.filter(c => c.id !== id) })),

      addClient: (client) => set((s) => ({ clients: [...s.clients, client] })),
      updateClient: (id, data) => set((s) => ({
        clients: s.clients.map(c => c.id === id ? { ...c, ...data } : c)
      })),
      deleteClient: (id) => set((s) => ({ clients: s.clients.filter(c => c.id !== id) })),

      addSupplier: (sup) => set((s) => ({ suppliers: [...s.suppliers, sup] })),
      updateSupplier: (id, data) => set((s) => ({
        suppliers: s.suppliers.map(s2 => s2.id === id ? { ...s2, ...data } : s2)
      })),
      deleteSupplier: (id) => set((s) => ({ suppliers: s.suppliers.filter(s2 => s2.id !== id) })),

      addSale: (sale) => {
        set((s) => ({
          sales: [...s.sales, sale],
          companySettings: {
            ...s.companySettings,
            invoiceCounter: s.companySettings.invoiceCounter + 1,
          }
        }));
        // Deduct stock for each item
        sale.items.forEach(item => {
          get().adjustStock(item.productId, item.quantity, 'venta', `Venta ${sale.invoiceNumber}`, sale.id);
        });
        get().logAction('Venta registrada', `${sale.invoiceNumber} - Total: $${sale.totalUSD.toFixed(2)}`);
      },

      openCashRegister: (amount) => {
        const { currentUser } = get();
        if (!currentUser) return;
        const register: CashRegister = {
          id: generateId(),
          openedAt: new Date().toISOString(),
          openedBy: currentUser.fullName,
          openingAmount: amount,
          totalSales: 0,
          totalSalesUSD: 0,
          status: 'open',
        };
        set((s) => ({ cashRegisters: [...s.cashRegisters, register] }));
        get().logAction('Caja abierta', `Monto inicial: $${amount}`);
      },

      closeCashRegister: (amount) => {
        const { currentUser, cashRegisters, sales } = get();
        if (!currentUser) return;
        const openRegister = cashRegisters.find(r => r.status === 'open');
        if (!openRegister) return;

        const openDate = new Date(openRegister.openedAt);
        const registerSales = sales.filter(s => new Date(s.createdAt) >= openDate);
        const totalSalesUSD = registerSales.reduce((sum, s) => sum + s.totalUSD, 0);

        set((s) => ({
          cashRegisters: s.cashRegisters.map(r => r.id === openRegister.id ? {
            ...r,
            closedAt: new Date().toISOString(),
            closedBy: currentUser.fullName,
            closingAmount: amount,
            totalSales: registerSales.length,
            totalSalesUSD,
            status: 'closed',
          } : r)
        }));
        get().logAction('Caja cerrada', `Monto final: $${amount}`);
      },

      getCurrentCashRegister: () => {
        return get().cashRegisters.find(r => r.status === 'open') ?? null;
      },

      setBcvRates: (rates) => {
        set({ bcvRates: rates });
        // Auto-save to history
        const today = new Date().toISOString().split('T')[0];
        const history = get().bcvHistory;
        const exists = history.find(h => h.date === today);
        if (!exists) {
          set((s) => ({
            bcvHistory: [...s.bcvHistory, { date: today, usd: rates.USD, eur: rates.EUR }]
          }));
        } else {
          // Update today's entry if rate changed
          set((s) => ({
            bcvHistory: s.bcvHistory.map(h =>
              h.date === today ? { ...h, usd: rates.USD, eur: rates.EUR } : h
            )
          }));
        }
      },
      addBcvHistory: (entry) => set((s) => ({ bcvHistory: [...s.bcvHistory, entry] })),

      setCompanySettings: (settings) => set({ companySettings: settings }),

      logAction: (action, details) => {
        const { currentUser } = get();
        set((s) => ({
          auditLog: [
            ...s.auditLog.slice(-999),
            {
              id: generateId(),
              date: new Date().toISOString(),
              userId: currentUser?.id ?? null,
              userName: currentUser?.fullName ?? 'Sistema',
              action,
              details,
            }
          ]
        }));
      },

      initializeDefaultData: async () => {
        const { users } = get();
        if (users.length === 0) {
          const passwordHash = await hashPassword('admin123');
          const adminUser: User = {
            id: generateId(),
            username: 'admin',
            passwordHash,
            fullName: 'Administrador',
            role: 'admin',
            active: true,
            createdAt: new Date().toISOString(),
          };
          set({ users: [adminUser] });

          // Default categories
          const defaultCategories: Category[] = [
            { id: generateId(), name: 'General', description: 'Categoría general', createdAt: new Date().toISOString() },
            { id: generateId(), name: 'Alimentos', description: 'Productos alimenticios', createdAt: new Date().toISOString() },
            { id: generateId(), name: 'Bebidas', description: 'Bebidas y refrescos', createdAt: new Date().toISOString() },
          ];
          set({ categories: defaultCategories });
        }
      },
    }),
    {
      name: 'pos-storage',
      partialize: (state) => ({
        users: state.users,
        theme: state.theme,
        products: state.products,
        categories: state.categories,
        clients: state.clients,
        suppliers: state.suppliers,
        sales: state.sales,
        kardex: state.kardex,
        cashRegisters: state.cashRegisters,
        auditLog: state.auditLog,
        bcvRates: state.bcvRates,
        bcvHistory: state.bcvHistory,
        companySettings: state.companySettings,
      }),
    }
  )
);
