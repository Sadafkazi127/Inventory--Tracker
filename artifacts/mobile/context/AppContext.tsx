import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import type {
  AppStats,
  CartItem,
  Category,
  Customer,
  InventoryLog,
  Product,
  Sale,
  ShopSettings,
} from '@/constants/types';

const DEFAULT_SETTINGS: ShopSettings = {
  name: 'My Shop',
  address: '',
  phone: '',
  email: '',
  gstNumber: '',
  currency: '₹',
  gstEnabled: false,
  gstPercent: 18,
  lowStockThreshold: 10,
};

const DEFAULT_STATS: AppStats = {
  totalProducts: 0,
  totalCategories: 0,
  totalInventoryValue: 0,
  todaysSales: 0,
  monthlySales: 0,
  totalRevenue: 0,
  lowStockCount: 0,
};

interface AppContextValue {
  // Data
  products: Product[];
  categories: Category[];
  customers: Customer[];
  sales: Sale[];
  inventoryLogs: InventoryLog[];
  settings: ShopSettings;
  stats: AppStats;
  isLoading: boolean;
  refresh: () => Promise<void>;

  // Products
  addProduct: (p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, changes: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Categories
  addCategory: (name: string) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;

  // Customers
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (id: string, changes: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Sales
  completeSale: (cart: CartItem[], opts: {
    customerId?: string;
    customerName?: string;
    discount: number;
    discountType: 'percent' | 'amount';
    gstEnabled: boolean;
    gstPercent: number;
    paymentMethod: 'cash' | 'upi' | 'card';
  }) => Promise<Sale>;

  // Inventory
  adjustStock: (productId: string, quantity: number, type: 'in' | 'adjustment', note: string) => Promise<void>;

  // Settings
  updateSettings: (s: ShopSettings) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<AppStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [p, c, cu, s, il, st, stat] = await Promise.all([
      api.get<Product[]>('/products'),
      api.get<Category[]>('/categories'),
      api.get<Customer[]>('/customers'),
      api.get<Sale[]>('/sales'),
      api.get<InventoryLog[]>('/inventory/logs'),
      api.get<ShopSettings>('/settings'),
      api.get<AppStats>('/reports/stats'),
    ]);
    setProducts(p);
    setCategories(c);
    setCustomers(cu);
    setSales(s);
    setInventoryLogs(il);
    setSettings(st);
    setStats(stat);
  }, []);

  // Load all data once logged in; clear it on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setProducts([]);
      setCategories([]);
      setCustomers([]);
      setSales([]);
      setInventoryLogs([]);
      setSettings(DEFAULT_SETTINGS);
      setStats(DEFAULT_STATS);
      setIsLoading(false);
      return;
    }
    (async () => {
      setIsLoading(true);
      try {
        await refresh();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isAuthenticated, refresh]);

  // Products CRUD
  const addProduct = useCallback(
    async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
      const product = await api.post<Product>('/products', data);
      setProducts((prev) => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)));
      return product;
    },
    []
  );

  const updateProduct = useCallback(async (id: string, changes: Partial<Product>) => {
    const updated = await api.put<Product>(`/products/${id}`, changes);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await api.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Categories CRUD
  const addCategory = useCallback(async (name: string): Promise<Category> => {
    const category = await api.post<Category>('/categories', { name });
    setCategories((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)));
    return category;
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await api.delete(`/categories/${id}`);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Customers CRUD
  const addCustomer = useCallback(
    async (data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
      const customer = await api.post<Customer>('/customers', data);
      setCustomers((prev) => [...prev, customer].sort((a, b) => a.name.localeCompare(b.name)));
      return customer;
    },
    []
  );

  const updateCustomer = useCallback(async (id: string, changes: Partial<Customer>) => {
    const updated = await api.put<Customer>(`/customers/${id}`, changes);
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    await api.delete(`/customers/${id}`);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Complete a sale — server handles stock deduction, logging and totals atomically
  const completeSale = useCallback(
    async (
      cart: CartItem[],
      opts: {
        customerId?: string;
        customerName?: string;
        discount: number;
        discountType: 'percent' | 'amount';
        gstEnabled: boolean;
        gstPercent: number;
        paymentMethod: 'cash' | 'upi' | 'card';
      }
    ): Promise<Sale> => {
      const sale = await api.post<Sale>('/sales', {
        customerId: opts.customerId,
        customerName: opts.customerName,
        items: cart.map((ci) => ({ productId: ci.product.id, quantity: ci.quantity })),
        discount: opts.discount,
        discountType: opts.discountType,
        gstEnabled: opts.gstEnabled,
        gstPercent: opts.gstPercent,
        paymentMethod: opts.paymentMethod,
      });

      setSales((prev) => [sale, ...prev]);
      // Stock changed server-side — refresh products and inventory logs to match
      const [freshProducts, freshLogs, freshStats] = await Promise.all([
        api.get<Product[]>('/products'),
        api.get<InventoryLog[]>('/inventory/logs'),
        api.get<AppStats>('/reports/stats'),
      ]);
      setProducts(freshProducts);
      setInventoryLogs(freshLogs);
      setStats(freshStats);

      return sale;
    },
    []
  );

  // Manual stock adjustment
  const adjustStock = useCallback(
    async (productId: string, quantity: number, type: 'in' | 'adjustment', note: string) => {
      const log = await api.post<InventoryLog>('/inventory/adjust', { productId, quantity, type, note });
      setInventoryLogs((prev) => [log, ...prev]);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: log.newStock, updatedAt: log.createdAt } : p))
      );
    },
    []
  );

  const updateSettings = useCallback(async (s: ShopSettings) => {
    const updated = await api.put<ShopSettings>('/settings', s);
    setSettings(updated);
  }, []);

  return (
    <AppContext.Provider
      value={{
        products,
        categories,
        customers,
        sales,
        inventoryLogs,
        settings,
        stats,
        isLoading,
        refresh,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        deleteCategory,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        completeSale,
        adjustStock,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
