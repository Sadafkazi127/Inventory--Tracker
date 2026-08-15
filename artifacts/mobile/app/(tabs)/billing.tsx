// artifacts/mobile/app/(tabs)/billing.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { ApiError } from '@/lib/apiClient';
import { formatCurrency } from '@/constants/storage';
import type { CartItem, Customer } from '@/constants/types';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

type PaymentMethod = 'cash' | 'upi' | 'card';
type DiscountType = 'percent' | 'amount';

export default function BillingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, customers, settings, completeSale } = useApp();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState('0');
  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerModal, setCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [completing, setCompleting] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.stock > 0 &&
        (p.name.toLowerCase().includes(q) || p.barcode?.includes(q))
    ).slice(0, 8);
  }, [products, productSearch]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, customerSearch]);

  const addToCart = useCallback((productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => {
      const existing = prev.find((ci) => ci.product.id === productId);
      if (existing) {
        if (existing.quantity >= product.stock) {
          Alert.alert('Stock Limit', `Only ${product.stock} units available.`);
          return prev;
        }
        return prev.map((ci) =>
          ci.product.id === productId ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setProductSearch('');
  }, [products]);

  const changeQty = useCallback((productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((ci) => {
          if (ci.product.id !== productId) return ci;
          const newQty = ci.quantity + delta;
          if (newQty <= 0) return null as unknown as CartItem;
          if (newQty > ci.product.stock) {
            Alert.alert('Stock Limit', `Only ${ci.product.stock} units available.`);
            return ci;
          }
          return { ...ci, quantity: newQty };
        })
        .filter(Boolean);
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCart((prev) => prev.filter((ci) => ci.product.id !== productId));
  }, []);

  const subtotal = cart.reduce((sum, ci) => sum + ci.product.sellingPrice * ci.quantity, 0);
  const discountNum = parseFloat(discount) || 0;
  const discountAmount =
    discountType === 'percent' ? (subtotal * discountNum) / 100 : discountNum;
  const afterDiscount = subtotal - discountAmount;
  const gstAmount = settings.gstEnabled ? (afterDiscount * settings.gstPercent) / 100 : 0;
  const grandTotal = afterDiscount + gstAmount;

  async function handleCompleteSale() {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add products to continue.');
      return;
    }
    if (discountAmount > subtotal) {
      Alert.alert('Invalid Discount', 'Discount cannot exceed subtotal.');
      return;
    }
    setCompleting(true);
    try {
      const sale = await completeSale(cart, {
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        discount: discountNum,
        discountType,
        gstEnabled: settings.gstEnabled,
        gstPercent: settings.gstPercent,
        paymentMethod,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCart([]);
      setDiscount('0');
      setSelectedCustomer(null);
      router.push(`/sales/${sale.id}` as any);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Failed to complete sale. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setCompleting(false);
    }
  }

  const webPad = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: webPad + 12,
          paddingBottom: insets.bottom + 100,
          padding: 16,
          gap: 14,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Product Search */}
        <View>
          <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={productSearch}
              onChangeText={setProductSearch}
              placeholder="Search product by name or barcode…"
              placeholderTextColor={colors.mutedForeground}
            />
            {productSearch.length > 0 && (
              <Pressable onPress={() => setProductSearch('')}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          {filteredProducts.length > 0 && (
            <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {filteredProducts.map((p) => (
                <Pressable
                  key={p.id}
                  style={({ pressed }) => [styles.dropdownItem, { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => addToCart(p.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dropdownName, { color: colors.text }]}>{p.name}</Text>
                    <Text style={[styles.dropdownSub, { color: colors.mutedForeground }]}>
                      Stock: {p.stock} {p.unit}
                    </Text>
                  </View>
                  <Text style={[styles.dropdownPrice, { color: colors.primary }]}>
                    {formatCurrency(p.sellingPrice, settings.currency)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Cart */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})
            </Text>
            {cart.length > 0 && (
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setCart([]); }}>
                <Text style={[styles.clearText, { color: colors.destructive }]}>Clear</Text>
              </Pressable>
            )}
          </View>
          {cart.length === 0 ? (
            <Text style={[styles.emptyCart, { color: colors.mutedForeground }]}>
              Search and add products above
            </Text>
          ) : (
            cart.map((ci) => (
              <View key={ci.product.id} style={[styles.cartItem, { borderTopColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cartName, { color: colors.text }]} numberOfLines={1}>
                    {ci.product.name}
                  </Text>
                  <Text style={[styles.cartUnit, { color: colors.mutedForeground }]}>
                    {formatCurrency(ci.product.sellingPrice, settings.currency)} × {ci.quantity}
                  </Text>
                </View>
                <View style={styles.qtyRow}>
                  <Pressable
                    style={[styles.qtyBtn, { borderColor: colors.border }]}
                    onPress={() => changeQty(ci.product.id, -1)}
                  >
                    <Feather name="minus" size={14} color={colors.text} />
                  </Pressable>
                  <Text style={[styles.qtyText, { color: colors.text }]}>{ci.quantity}</Text>
                  <Pressable
                    style={[styles.qtyBtn, { borderColor: colors.border }]}
                    onPress={() => changeQty(ci.product.id, 1)}
                  >
                    <Feather name="plus" size={14} color={colors.text} />
                  </Pressable>
                </View>
                <Text style={[styles.cartTotal, { color: colors.primary }]}>
                  {formatCurrency(ci.product.sellingPrice * ci.quantity, settings.currency)}
                </Text>
                <Pressable onPress={() => removeFromCart(ci.product.id)} hitSlop={8}>
                  <Feather name="x" size={16} color={colors.destructive} />
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Customer */}
        <Pressable
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setCustomerModal(true)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.row}>
              <Feather name="user" size={16} color={colors.mutedForeground} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Customer</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.customerName, { color: selectedCustomer ? colors.primary : colors.mutedForeground }]}>
            {selectedCustomer ? selectedCustomer.name : 'Walk-in customer (optional)'}
          </Text>
        </Pressable>

        {/* Discount */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Discount</Text>
          <View style={styles.discountRow}>
            <View style={[styles.discountInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                style={[styles.discountValue, { color: colors.text }]}
                value={discount}
                onChangeText={setDiscount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <Pressable
              style={[styles.discountType, { backgroundColor: discountType === 'percent' ? colors.primary : colors.muted, borderColor: colors.border }]}
              onPress={() => setDiscountType((t) => t === 'percent' ? 'amount' : 'percent')}
            >
              <Text style={{ color: discountType === 'percent' ? '#fff' : colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                {discountType === 'percent' ? '%' : settings.currency}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Payment Method */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Method</Text>
          <View style={styles.paymentRow}>
            {(['cash', 'upi', 'card'] as PaymentMethod[]).map((m) => {
              const icons: Record<PaymentMethod, React.ComponentProps<typeof Feather>['name']> = {
                cash: 'dollar-sign',
                upi: 'smartphone',
                card: 'credit-card',
              };
              return (
                <Pressable
                  key={m}
                  style={[
                    styles.payBtn,
                    {
                      backgroundColor: paymentMethod === m ? colors.primary : colors.background,
                      borderColor: paymentMethod === m ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setPaymentMethod(m); }}
                >
                  <Feather name={icons[m]} size={16} color={paymentMethod === m ? '#fff' : colors.mutedForeground} />
                  <Text style={{ color: paymentMethod === m ? '#fff' : colors.text, fontFamily: 'Inter_500Medium', fontSize: 13 }}>
                    {m.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Summary */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Bill Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(subtotal, settings.currency)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>-{formatCurrency(discountAmount, settings.currency)}</Text>
            </View>
          )}
          {settings.gstEnabled && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>GST ({settings.gstPercent}%)</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(gstAmount, settings.currency)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 }]}>
            <Text style={[styles.grandLabel, { color: colors.text }]}>Grand Total</Text>
            <Text style={[styles.grandValue, { color: colors.primary }]}>{formatCurrency(grandTotal, settings.currency)}</Text>
          </View>
        </View>

        {/* Complete Sale */}
        <Pressable
          style={({ pressed }) => [
            styles.completeBtn,
            { backgroundColor: cart.length === 0 ? colors.muted : colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleCompleteSale}
          disabled={completing || cart.length === 0}
        >
          <Feather name="check-circle" size={20} color={cart.length === 0 ? colors.mutedForeground : '#fff'} />
          <Text style={[styles.completeBtnText, { color: cart.length === 0 ? colors.mutedForeground : '#fff' }]}>
            {completing ? 'Processing…' : `Complete Sale · ${formatCurrency(grandTotal, settings.currency)}`}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Customer Selection Modal */}
      <Modal visible={customerModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setCustomerModal(false)}>
              <Text style={[styles.cancelBtn, { color: colors.primary }]}>Done</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Customer</Text>
            <Pressable onPress={() => { setSelectedCustomer(null); setCustomerModal(false); }}>
              <Text style={[styles.cancelBtn, { color: colors.destructive }]}>Clear</Text>
            </Pressable>
          </View>
          <View style={{ padding: 16 }}>
            <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={customerSearch}
                onChangeText={setCustomerSearch}
                placeholder="Search customers…"
                placeholderTextColor={colors.mutedForeground}
                autoFocus
              />
            </View>
          </View>
          <FlatList
            data={filteredCustomers}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            ListEmptyComponent={
              <Text style={[styles.emptyCart, { color: colors.mutedForeground, textAlign: 'center', marginTop: 32 }]}>
                No customers found
              </Text>
            }
            renderItem={({ item: c }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.customerItem,
                  {
                    backgroundColor: selectedCustomer?.id === c.id ? colors.primary + '18' : colors.card,
                    borderColor: selectedCustomer?.id === c.id ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => { setSelectedCustomer(c); setCustomerModal(false); }}
              >
                <View style={[styles.customerAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 }}>
                    {c.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.customerItemName, { color: colors.text }]}>{c.name}</Text>
                  <Text style={[styles.customerItemPhone, { color: colors.mutedForeground }]}>{c.phone}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', padding: 0 },
  dropdown: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  dropdownName: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  dropdownSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  dropdownPrice: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  clearText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  emptyCart: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 12 },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  cartName: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  cartUnit: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', minWidth: 24, textAlign: 'center' },
  cartTotal: { fontSize: 14, fontFamily: 'Inter_700Bold', minWidth: 60, textAlign: 'right' },
  customerName: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  discountRow: { flexDirection: 'row', gap: 10 },
  discountInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  discountValue: { fontSize: 16, fontFamily: 'Inter_600SemiBold', padding: 0 },
  discountType: {
    width: 56,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentRow: { flexDirection: 'row', gap: 8 },
  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  summaryValue: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  grandLabel: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  grandValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 10,
  },
  completeBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  // Modal
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    paddingTop: 56,
  },
  modalTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  cancelBtn: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerItemName: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  customerItemPhone: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});