import React, { useMemo, useState } from 'react';
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
import { SearchBar } from '@/components/SearchBar';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { formatDateTime } from '@/constants/storage';
import type { Product } from '@/constants/types';
import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import BackButton from '@/components/BackButton';
import * as Haptics from 'expo-haptics';

type Tab = 'stock' | 'logs';

function StockModal({
  visible,
  product,
  onClose,
  onSave,
}: {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (qty: number, type: 'in' | 'adjustment', note: string) => void;
}) {
  const colors = useColors();
  const [qty, setQty] = useState('');
  const [type, setType] = useState<'in' | 'adjustment'>('in');
  const [note, setNote] = useState('');

  React.useEffect(() => {
    if (visible) { setQty(''); setNote(''); setType('in'); }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose}>
            <Text style={[styles.cancelBtn, { color: colors.destructive }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Update Stock</Text>
          <Pressable
            onPress={() => {
              const q = parseInt(qty);
              if (!q || q <= 0) { Alert.alert('Invalid', 'Enter a valid quantity.'); return; }
              onSave(q, type, note.trim() || (type === 'in' ? 'Stock added' : 'Stock adjusted'));
            }}
          >
            <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 60 }}>
          {product && (
            <View style={[styles.productInfo, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
              <Text style={[styles.currentStock, { color: colors.mutedForeground }]}>
                Current stock: {product.stock} {product.unit}
              </Text>
            </View>
          )}

          <View style={{ gap: 6 }}>
            <Text style={[styles.label, { color: colors.text }]}>Update Type</Text>
            <View style={styles.typeRow}>
              {([
                { val: 'in', label: 'Add Stock', icon: 'plus-circle' as const },
                { val: 'adjustment', label: 'Set Stock', icon: 'edit-3' as const },
              ] as const).map(({ val, label, icon }) => (
                <Pressable
                  key={val}
                  style={[styles.typeBtn, {
                    backgroundColor: type === val ? colors.primary : colors.background,
                    borderColor: type === val ? colors.primary : colors.border,
                  }]}
                  onPress={() => setType(val)}
                >
                  <Feather name={icon} size={16} color={type === val ? '#fff' : colors.mutedForeground} />
                  <Text style={{ color: type === val ? '#fff' : colors.text, fontFamily: 'Inter_500Medium', fontSize: 13 }}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={[styles.label, { color: colors.text }]}>
              {type === 'in' ? 'Quantity to Add' : 'New Stock Quantity'}
            </Text>
            <TextInput
              style={[styles.qtyInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
              value={qty}
              onChangeText={setQty}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={[styles.label, { color: colors.text }]}>Note (optional)</Text>
            <TextInput
              style={[styles.noteInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Received from supplier"
              placeholderTextColor={colors.mutedForeground}
              multiline
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, inventoryLogs, settings, adjustStock } = useApp();
  const [tab, setTab] = useState<Tab>('stock');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => a.stock - b.stock);
  }, [products, search]);

  const lowCount = products.filter((p) => p.stock <= settings.lowStockThreshold).length;
  const webPad = Platform.OS === 'web' ? 67 : 0;

  return (
    <>
      <Stack.Screen options={{ title: 'Inventory', headerBackTitle: 'More', headerLeft: () => <BackButton /> }} />
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Summary bar */}
        <View style={[styles.summaryBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.sumItem}>
            <Text style={[styles.sumValue, { color: colors.primary }]}>{products.length}</Text>
            <Text style={[styles.sumLabel, { color: colors.mutedForeground }]}>Products</Text>
          </View>
          <View style={[styles.sumDivider, { backgroundColor: colors.border }]} />
          <View style={styles.sumItem}>
            <Text style={[styles.sumValue, { color: lowCount > 0 ? '#EF4444' : '#10B981' }]}>{lowCount}</Text>
            <Text style={[styles.sumLabel, { color: colors.mutedForeground }]}>Low Stock</Text>
          </View>
          <View style={[styles.sumDivider, { backgroundColor: colors.border }]} />
          <View style={styles.sumItem}>
            <Text style={[styles.sumValue, { color: '#8B5CF6' }]}>{inventoryLogs.length}</Text>
            <Text style={[styles.sumLabel, { color: colors.mutedForeground }]}>Log Entries</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: colors.border, paddingTop: webPad }]}>
          {(['stock', 'logs'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, { borderBottomColor: tab === t ? colors.primary : 'transparent' }]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
                {t === 'stock' ? 'Stock Levels' : 'Movement Log'}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'stock' ? (
          <>
            <View style={{ padding: 16, paddingBottom: 8 }}>
              <SearchBar value={search} onChangeText={setSearch} placeholder="Search products…" />
            </View>
            <FlatList
              data={filteredProducts}
              keyExtractor={(p) => p.id}
              contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: insets.bottom + 120, gap: 8 }}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={<EmptyState icon="layers" title="No products" description="Add products to track inventory" />}
              renderItem={({ item: p }) => {
                const isLow = p.stock <= settings.lowStockThreshold;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.stockCard,
                      { backgroundColor: isLow ? '#FEF2F2' : colors.card, borderColor: isLow ? '#FCA5A5' : colors.border, opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={() => { setSelectedProduct(p); setModalVisible(true); }}
                  >
                    <View style={styles.stockMain}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.stockName, { color: isLow ? '#7F1D1D' : colors.text }]}>{p.name}</Text>
                        <Text style={[styles.stockCat, { color: colors.mutedForeground }]}>{p.category}</Text>
                      </View>
                      <View style={styles.stockRight}>
                        <Text style={[styles.stockQty, { color: isLow ? '#DC2626' : colors.text }]}>
                          {p.stock} <Text style={[styles.stockUnit, { color: colors.mutedForeground }]}>{p.unit}</Text>
                        </Text>
                        <Badge label={isLow ? 'LOW' : 'OK'} variant={isLow ? 'destructive' : 'success'} />
                      </View>
                    </View>
                    <View style={[styles.stockBar, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.stockBarFill,
                          {
                            width: `${Math.min(100, (p.stock / (settings.lowStockThreshold * 3)) * 100)}%`,
                            backgroundColor: isLow ? '#EF4444' : '#10B981',
                          },
                        ]}
                      />
                    </View>
                  </Pressable>
                );
              }}
            />
          </>
        ) : (
          <FlatList
            data={inventoryLogs}
            keyExtractor={(l) => l.id}
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100, gap: 8 }}
            showsVerticalScrollIndicator={true}
            ListEmptyComponent={<EmptyState icon="list" title="No logs yet" description="Stock changes appear here" />}
            renderItem={({ item: log }) => (
              <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.logIcon, {
                  backgroundColor: log.type === 'in' ? '#10B98120' : log.type === 'out' ? '#EF444420' : '#F59E0B20',
                }]}>
                  <Feather
                    name={log.type === 'in' ? 'arrow-down-circle' : log.type === 'out' ? 'arrow-up-circle' : 'edit-3'}
                    size={16}
                    color={log.type === 'in' ? '#10B981' : log.type === 'out' ? '#EF4444' : '#F59E0B'}
                  />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.logProduct, { color: colors.text }]}>{log.productName}</Text>
                  <Text style={[styles.logNote, { color: colors.mutedForeground }]}>{log.note}</Text>
                  <Text style={[styles.logDate, { color: colors.mutedForeground }]}>{formatDateTime(log.createdAt)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[styles.logQty, {
                    color: log.type === 'in' ? '#10B981' : log.type === 'out' ? '#EF4444' : '#F59E0B',
                  }]}>
                    {log.type === 'in' ? '+' : log.type === 'out' ? '-' : '='}{log.quantity}
                  </Text>
                  <Text style={[styles.logStock, { color: colors.mutedForeground }]}>
                    {log.previousStock} → {log.newStock}
                  </Text>
                </View>
              </View>
            )}
          />
        )}

        <StockModal
          visible={modalVisible}
          product={selectedProduct}
          onClose={() => setModalVisible(false)}
          onSave={async (qty, type, note) => {
            if (!selectedProduct) return;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await adjustStock(selectedProduct.id, qty, type, note);
            setModalVisible(false);
          }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  summaryBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  sumItem: { flex: 1, alignItems: 'center', gap: 2 },
  sumValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  sumLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  sumDivider: { width: 1, marginVertical: 4 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  stockCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  stockMain: { flexDirection: 'row', alignItems: 'center' },
  stockName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  stockCat: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  stockRight: { alignItems: 'flex-end', gap: 4 },
  stockQty: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  stockUnit: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  stockBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  stockBarFill: { height: '100%', borderRadius: 2 },
  logCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  logIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logProduct: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  logNote: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  logDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  logQty: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  logStock: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  // Modal
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, paddingTop: 56,
  },
  modalTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  cancelBtn: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  saveBtn: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  productInfo: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 4 },
  productName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  currentStock: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
  },
  qtyInput: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 24, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  noteInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 80 },
});
