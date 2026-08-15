import React, { useState, useMemo, useCallback } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
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
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/Badge';
import { formatCurrency } from '@/constants/storage';
import type { Product } from '@/constants/types';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'box', 'pack', 'dozen', 'bottle', 'strip', 'pair'];

type FormData = {
  name: string;
  category: string;
  barcode: string;
  purchasePrice: string;
  sellingPrice: string;
  stock: string;
  unit: string;
};

const EMPTY_FORM: FormData = {
  name: '',
  category: '',
  barcode: '',
  purchasePrice: '',
  sellingPrice: '',
  stock: '',
  unit: 'pcs',
};

function ProductModal({
  visible,
  product,
  categories,
  onClose,
  onSave,
}: {
  visible: boolean;
  product: Product | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: FormData) => void;
}) {
  const colors = useColors();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const insets = useSafeAreaInsets();
  const [newCat, setNewCat] = useState('');

  React.useEffect(() => {
    if (visible) {
      setForm(
        product
          ? {
              name: product.name,
              category: product.category,
              barcode: product.barcode ?? '',
              purchasePrice: String(product.purchasePrice),
              sellingPrice: String(product.sellingPrice),
              stock: String(product.stock),
              unit: product.unit,
            }
          : EMPTY_FORM
      );
      setNewCat('');
    }
  }, [visible, product]);

  function field(
    label: string,
    key: keyof FormData,
    opts?: {
      keyboard?: 'numeric' | 'default';
      placeholder?: string;
    }
  ) {
    return (
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
          value={form[key]}
          onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
          placeholder={opts?.placeholder ?? label}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={opts?.keyboard ?? 'default'}
        />
      </View>
    );
  }

  const catList = categories.map((c) => c.name);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose}>
            <Text style={[styles.cancelBtn, { color: colors.destructive }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {product ? 'Edit Product' : 'Add Product'}
          </Text>
          <Pressable
            onPress={() => {
              if (!form.name || !form.category || !form.sellingPrice) {
                Alert.alert('Required', 'Name, category and selling price are required.');
                return;
              }
              onSave(form);
            }}
          >
            <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
          </Pressable>
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingTop: 16, paddingLeft: 16, paddingRight: 16, gap: 14, paddingBottom: insets.bottom + 180 }}>
            {field('Product Name *', 'name')}
            {field('Barcode', 'barcode')}

            {/* Category */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {catList.map((c) => (
                  <Pressable
                    key={c}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: form.category === c ? colors.primary : colors.muted,
                        borderColor: form.category === c ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setForm((f) => ({ ...f, category: c }))}
                  >
                    <Text style={{ color: form.category === c ? '#fff' : colors.text, fontSize: 13, fontFamily: 'Inter_500Medium' }}>{c}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={[styles.newCatRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <TextInput
                  style={[styles.newCatInput, { color: colors.text }]}
                  value={newCat}
                  onChangeText={setNewCat}
                  placeholder="New category…"
                  placeholderTextColor={colors.mutedForeground}
                />
                <Pressable
                  style={[styles.addCatBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    if (newCat.trim()) {
                      setForm((f) => ({ ...f, category: newCat.trim() }));
                      setNewCat('');
                    }
                  }}
                >
                  <Feather name="plus" size={16} color="#fff" />
                </Pressable>
              </View>
            </View>

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>{field('Purchase Price', 'purchasePrice', { keyboard: 'numeric' })}</View>
              <View style={{ flex: 1 }}>{field('Selling Price *', 'sellingPrice', { keyboard: 'numeric' })}</View>
            </View>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>{field('Stock Qty', 'stock', { keyboard: 'numeric' })}</View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.text }]}>Unit</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {UNITS.map((u) => (
                    <Pressable
                      key={u}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: form.unit === u ? colors.primary : colors.muted,
                          borderColor: form.unit === u ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, unit: u }))}
                    >
                      <Text style={{ color: form.unit === u ? '#fff' : colors.text, fontSize: 12, fontFamily: 'Inter_500Medium' }}>{u}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function ProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, categories, settings, addProduct, updateProduct, deleteProduct, addCategory } = useApp();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const catNames = ['All', ...categories.map((c) => c.name)];

  const filtered = useMemo(() => {
    let list = products;
    if (filterCat !== 'All') list = list.filter((p) => p.category === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.barcode?.includes(q)
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [products, search, filterCat]);

  const openAdd = useCallback(() => {
    setEditingProduct(null);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((p: Product) => {
    setEditingProduct(p);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(
    async (form: FormData) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Make sure category exists
      const catExists = categories.some((c) => c.name === form.category);
      if (!catExists) {
        await addCategory(form.category);
      }
      const data = {
        name: form.name.trim(),
        category: form.category,
        barcode: form.barcode.trim() || undefined,
        purchasePrice: parseFloat(form.purchasePrice) || 0,
        sellingPrice: parseFloat(form.sellingPrice) || 0,
        stock: parseInt(form.stock) || 0,
        unit: form.unit,
      };
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await addProduct(data);
      }
      setModalVisible(false);
    },
    [editingProduct, categories, addCategory, addProduct, updateProduct]
  );

  const handleDelete = useCallback(
    (p: Product) => {
      Alert.alert('Delete Product', `Delete "${p.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteProduct(p.id);
          },
        },
      ]);
    },
    [deleteProduct]
  );

  const webPad = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: webPad + 12, paddingHorizontal: 16, gap: 10 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search products…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {catNames.map((c) => (
            <Pressable
              key={c}
              style={[styles.filterChip, {
                backgroundColor: filterCat === c ? colors.primary : colors.card,
                borderColor: filterCat === c ? colors.primary : colors.border,
              }]}
              onPress={() => setFilterCat(c)}
            >
              <Text style={{ color: filterCat === c ? '#fff' : colors.text, fontSize: 13, fontFamily: 'Inter_500Medium' }}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 16, paddingBottom: insets.bottom + 180, gap: 10 }}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          <EmptyState
            icon="package"
            title="No products found"
            description={search ? 'Try a different search term' : 'Tap + to add your first product'}
          />
        }
        renderItem={({ item: p }) => {
          const isLowStock = p.stock <= settings.lowStockThreshold;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.productCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isLowStock ? '#FCA5A5' : colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={() => openEdit(p)}
              onLongPress={() => handleDelete(p)}
            >
              <View style={styles.productMain}>
                <View style={[styles.productAvatar, { backgroundColor: colors.primary + '18' }]}>
                  <Text style={{ fontSize: 18 }}>📦</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
                  <Text style={[styles.productCat, { color: colors.mutedForeground }]}>{p.category}</Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: colors.primary }]}>
                      {formatCurrency(p.sellingPrice, settings.currency)}
                    </Text>
                    <Text style={[styles.pricePurchase, { color: colors.mutedForeground }]}>
                      CP: {formatCurrency(p.purchasePrice, settings.currency)}
                    </Text>
                  </View>
                </View>
                <View style={styles.productRight}>
                  <Badge
                    label={`${p.stock} ${p.unit}`}
                    variant={isLowStock ? 'destructive' : p.stock < 20 ? 'warning' : 'success'}
                  />
                  <View style={styles.actionRow}>
                    <Pressable onPress={() => openEdit(p)} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                      <Feather name="edit-2" size={16} color={colors.primary} />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(p)} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                      <Feather name="trash-2" size={16} color={colors.destructive} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary, bottom: insets.bottom + 88, opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={openAdd}
      >
        <Feather name="plus" size={24} color="#fff" />
      </Pressable>

      <ProductModal
        visible={modalVisible}
        product={editingProduct}
        categories={categories}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  productCard: { borderRadius: 12, borderWidth: 1, padding: 12 },
  productMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  productAvatar: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1, gap: 2 },
  productName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  productCat: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  price: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  pricePurchase: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  productRight: { alignItems: 'flex-end', gap: 8 },
  actionRow: { flexDirection: 'row', gap: 12 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  // Modal styles
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
  cancelBtn: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  saveBtn: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  modalBody: { padding: 16, gap: 14, paddingBottom: 60 },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular' },
  row2: { flexDirection: 'row', gap: 12 },
  chipRow: { flexGrow: 0, marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginRight: 6 },
  newCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 8,
    overflow: 'hidden',
  },
  newCatInput: { flex: 1, padding: 10, fontSize: 14, fontFamily: 'Inter_400Regular' },
  addCatBtn: { padding: 10, alignItems: 'center', justifyContent: 'center' },
});
