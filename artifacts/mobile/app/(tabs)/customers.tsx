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
import { formatCurrency, formatDate } from '@/constants/storage';
import type { Customer } from '@/constants/types';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type FormData = { name: string; phone: string; email: string };
const EMPTY: FormData = { name: '', phone: '', email: '' };

function CustomerModal({
  visible,
  customer,
  onClose,
  onSave,
}: {
  visible: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSave: (data: FormData) => void;
}) {
  const colors = useColors();
  const [form, setForm] = useState<FormData>(EMPTY);

  React.useEffect(() => {
    if (visible) {
      setForm(customer ? { name: customer.name, phone: customer.phone, email: customer.email ?? '' } : EMPTY);
    }
  }, [visible, customer]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose}>
            <Text style={[styles.cancelBtn, { color: colors.destructive }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {customer ? 'Edit Customer' : 'Add Customer'}
          </Text>
          <Pressable
            onPress={() => {
              if (!form.name.trim() || !form.phone.trim()) {
                Alert.alert('Required', 'Name and phone are required.');
                return;
              }
              onSave(form);
            }}
          >
            <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
          </Pressable>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 60 }}>
            {(['name', 'phone', 'email'] as (keyof FormData)[]).map((key) => (
              <View key={key} style={{ gap: 6 }}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}{key !== 'email' ? ' *' : ' (optional)'}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
                  value={form[key]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  placeholder={key === 'phone' ? '+91 9876543210' : key === 'email' ? 'email@example.com' : 'Customer Name'}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType={key === 'phone' ? 'phone-pad' : key === 'email' ? 'email-address' : 'default'}
                  autoCapitalize={key === 'email' ? 'none' : 'words'}
                />
              </View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function CustomersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { customers, sales, settings, addCustomer, updateCustomer, deleteCustomer } = useApp();
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const getCustomerSales = useCallback(
    (customerId: string) =>
      sales.filter((s) => s.customerId === customerId),
    [sales]
  );

  const handleSave = useCallback(
    async (form: FormData) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const data = { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || undefined };
      if (editing) {
        await updateCustomer(editing.id, data);
      } else {
        await addCustomer(data);
      }
      setModalVisible(false);
    },
    [editing, addCustomer, updateCustomer]
  );

  const handleDelete = useCallback(
    (c: Customer) => {
      Alert.alert('Delete Customer', `Delete "${c.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteCustomer(c.id);
            if (selected?.id === c.id) setSelected(null);
          },
        },
      ]);
    },
    [deleteCustomer, selected]
  );

  const webPad = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: webPad + 12, paddingHorizontal: 16, paddingBottom: 10 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search customers…" />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="users" title="No customers" description="Tap + to add your first customer" />
        }
        renderItem={({ item: c }) => {
          const custSales = getCustomerSales(c.id);
          const totalSpent = custSales.reduce((sum, s) => sum + s.grandTotal, 0);
          const isSelected = selected?.id === c.id;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.customerCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={() => setSelected(isSelected ? null : c)}
            >
              <View style={styles.cardMain}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>{c.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.text }]}>{c.name}</Text>
                  <Text style={[styles.phone, { color: colors.mutedForeground }]}>{c.phone}</Text>
                  {c.email ? (
                    <Text style={[styles.email, { color: colors.mutedForeground }]}>{c.email}</Text>
                  ) : null}
                </View>
                <View style={styles.actions}>
                  <Pressable onPress={() => { setEditing(c); setModalVisible(true); }} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                    <Feather name="edit-2" size={16} color={colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(c)} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                    <Feather name="trash-2" size={16} color={colors.destructive} />
                  </Pressable>
                </View>
              </View>

              {/* Purchase summary */}
              <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{custSales.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Orders</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: '#10B981' }]}>{formatCurrency(totalSpent, settings.currency)}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Spent</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {custSales[0] ? formatDate(custSales[0].createdAt) : '-'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Last Visit</Text>
                </View>
              </View>

              {/* Purchase history */}
              {isSelected && custSales.length > 0 && (
                <View style={[styles.historyBox, { borderTopColor: colors.border }]}>
                  <Text style={[styles.historyTitle, { color: colors.text }]}>Purchase History</Text>
                  {custSales.slice(0, 5).map((sale) => (
                    <View key={sale.id} style={styles.historyRow}>
                      <Text style={[styles.historyInv, { color: colors.mutedForeground }]}>{sale.invoiceNumber}</Text>
                      <Text style={[styles.historyDate, { color: colors.mutedForeground }]}>{formatDate(sale.createdAt)}</Text>
                      <Text style={[styles.historyAmt, { color: colors.primary }]}>{formatCurrency(sale.grandTotal, settings.currency)}</Text>
                    </View>
                  ))}
                </View>
              )}
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
        onPress={() => { setEditing(null); setModalVisible(true); }}
      >
        <Feather name="user-plus" size={22} color="#fff" />
      </Pressable>

      <CustomerModal
        visible={modalVisible}
        customer={editing}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  customerCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  cardMain: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  name: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  phone: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  email: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  actions: { gap: 12 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 10, paddingHorizontal: 14 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  historyBox: { borderTopWidth: 1, padding: 14, gap: 8 },
  historyTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  historyInv: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  historyDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  historyAmt: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
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
  label: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular' },
});
