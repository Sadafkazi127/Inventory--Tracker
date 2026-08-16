import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  PRODUCTS: '@inv_products',
  CATEGORIES: '@inv_categories',
  CUSTOMERS: '@inv_customers',
  SALES: '@inv_sales',
  INVENTORY_LOGS: '@inv_logs',
  SETTINGS: '@inv_settings',
  AUTH: '@inv_auth',
  INVOICE_COUNTER: '@inv_counter',
  SEEDED: '@inv_seeded',
};

export async function loadData<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveData<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage save error:', e);
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function sanitizeCurrencySymbol(currency: unknown): string {
  if (typeof currency !== 'string') return '\u20B9';
  const s = currency.trim();
  if (!s) return '\u20B9';
  try {
    // Accept a single Unicode currency symbol (Sc) or a short alphabetic code (e.g. INR, Rs)
    if (/^\p{Sc}$/u.test(s) || /^[A-Za-z]{1,3}$/.test(s)) return s;
  } catch {
    // If Unicode property escapes are unsupported, fall back to a simpler heuristic
    if (/^[^\x00-\x1F\x7F-\x9F]+$/.test(s)) return s.charAt(0);
  }
  // If the symbol looks corrupted (replacement char or question mark), fallback
  const first = s.charAt(0);
  if (first === '\uFFFD' || first === '?') return '\u20B9';
  return first || '\u20B9';
}

export function formatCurrency(amount: number | string | undefined, currency = '\u20B9'): string {
  const symbol = sanitizeCurrencySymbol(currency);
  const n = amount == null ? 0 : Number(amount);
  if (!Number.isFinite(n)) return `${symbol}0.00`;
  try {
    const fmt = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${symbol}${fmt.format(n)}`;
  } catch {
    return `${symbol}${n.toFixed(2)}`;
  }
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function isThisYear(dateStr: string): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === new Date().getFullYear();
}

export function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return d >= weekStart;
}
