export interface Product {
  id: string;
  name: string;
  category: string;
  barcode?: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  discountType: 'percent' | 'amount';
  gst: number;
  gstPercent: number;
  grandTotal: number;
  paymentMethod: 'cash' | 'upi' | 'card';
  createdAt: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  note: string;
  createdAt: string;
}

export interface ShopSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  currency: string;
  gstEnabled: boolean;
  gstPercent: number;
  lowStockThreshold: number;
}

export interface AppStats {
  totalProducts: number;
  totalCategories: number;
  totalInventoryValue: number;
  todaysSales: number;
  monthlySales: number;
  totalRevenue: number;
  lowStockCount: number;
}
