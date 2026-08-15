import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { SearchBar } from '@/components/SearchBar';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { formatCurrency, formatDateTime } from '@/constants/storage';
import { Feather } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';

type DateFilter = 'all' | 'today' | 'week' | 'month';

export default function SalesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sales, settings } = useApp();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filtered = useMemo(() => {
    let list = [...sales];

    // Date filter
    const now = new Date();
    if (dateFilter === 'today') {
      list = list.filter((s) => {
        const d = new Date(s.createdAt);
        return d.toDateString() === now.toDateString();
      });
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      list = list.filter((s) => new Date(s.createdAt) >= weekAgo);
    } else if (dateFilter === 'month') {
      list = list.filter((s) => {
        const d = new Date(s.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.invoiceNumber.toLowerCase().includes(q) ||
          s.customerName?.toLowerCase().includes(q) ||
          s.paymentMethod.includes(q)
      );
    }

    return list;
  }, [sales, search, dateFilter]);

  const totalFiltered = filtered.reduce((sum, s) => sum + s.grandTotal, 0);
  const webPad = Platform.OS === 'web' ? 67 : 0;

  const DATE_FILTERS: { value: DateFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'Sales History', headerBackTitle: 'More' }} />
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={{ paddingTop: webPad + 12, paddingHorizontal: 16, gap: 10, paddingBottom: 8 }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search invoice, customer…" />

          {/* Date filter chips */}
          <View style={styles.filterRow}>
            {DATE_FILTERS.map((f) => (
              <Pressable
                key={f.value}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: dateFilter === f.value ? colors.primary : colors.card,
                    borderColor: dateFilter === f.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setDateFilter(f.value)}
              >
                <Text style={{ color: dateFilter === f.value ? '#fff' : colors.text, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
                  {f.label}
                </Text>
              </Pressable>
            ))}

            <View style={{ flex: 1 }} />
            <View style={[styles.totalBadge, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[styles.totalText, { color: colors.primary }]}>
                {formatCurrency(totalFiltered, settings.currency)}
              </Text>
            </View>
          </View>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: insets.bottom + 100, gap: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="file-text"
              title="No sales found"
              description={search ? 'Try a different search' : 'Complete a billing to see sales here'}
            />
          }
          renderItem={({ item: sale }) => (
            <Pressable
              style={({ pressed }) => [
                styles.saleCard,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push(`/sales/${sale.id}` as any)}
            >
              <View style={styles.saleHeader}>
                <View>
                  <Text style={[styles.invoiceNum, { color: colors.text }]}>{sale.invoiceNumber}</Text>
                  <Text style={[styles.saleDate, { color: colors.mutedForeground }]}>{formatDateTime(sale.createdAt)}</Text>
                </View>
                <View style={styles.saleRight}>
                  <Text style={[styles.saleAmount, { color: colors.primary }]}>
                    {formatCurrency(sale.grandTotal, settings.currency)}
                  </Text>
                  <Badge
                    label={sale.paymentMethod.toUpperCase()}
                    variant={sale.paymentMethod === 'cash' ? 'success' : sale.paymentMethod === 'upi' ? 'primary' : 'warning'}
                  />
                </View>
              </View>

              <View style={[styles.saleFooter, { borderTopColor: colors.border }]}>
                <View style={styles.footerRow}>
                  <Feather name="user" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                    {sale.customerName ?? 'Walk-in customer'}
                  </Text>
                </View>
                <View style={styles.footerRow}>
                  <Feather name="shopping-bag" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                    {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
              </View>
            </Pressable>
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  totalBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  totalText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  saleCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  saleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14 },
  invoiceNum: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  saleDate: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  saleRight: { alignItems: 'flex-end', gap: 4 },
  saleAmount: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  saleFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
