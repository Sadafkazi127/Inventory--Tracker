import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { formatCurrency, formatDateTime } from '@/constants/storage';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { stats, sales, products, settings, isLoading } = useApp();

  const recentSales = sales.slice(0, 5);
  const lowStockProducts = products
    .filter((p) => p.stock <= settings.lowStockThreshold)
    .slice(0, 5);

  const webPad = Platform.OS === 'web' ? 67 : 0;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: webPad + 12,
        paddingBottom: insets.bottom + 180,
        paddingLeft: 16,
        paddingRight: 16,
        gap: 20,
      }}
      showsVerticalScrollIndicator={true}
    >
      {/* Welcome */}
      <View style={styles.welcomeRow}>
        <View>
          <Text style={[styles.welcomeText, { color: colors.mutedForeground }]}>
            Good morning
          </Text>
          <Text style={[styles.shopName, { color: colors.text }]}>
            {settings.name}
          </Text>
        </View>
        <View style={[styles.dateBadge, { backgroundColor: colors.primary + '18' }]}>
          <Text style={[styles.dateText, { color: colors.primary }]}>
            {new Date().toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
            })}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.grid}>
        <View style={styles.gridRow}>
          <View style={styles.gridCell}>
            <StatCard
              title="Total Products"
              value={String(stats.totalProducts)}
              icon="package"
              color={colors.primary}
            />
          </View>
          <View style={styles.gridCell}>
            <StatCard
              title="Categories"
              value={String(stats.totalCategories)}
              icon="tag"
              color="#8B5CF6"
            />
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.gridCell}>
            <StatCard
              title="Today's Sales"
              value={formatCurrency(stats.todaysSales, settings.currency)}
              icon="trending-up"
              color="#10B981"
            />
          </View>
          <View style={styles.gridCell}>
            <StatCard
              title="Monthly Sales"
              value={formatCurrency(stats.monthlySales, settings.currency)}
              icon="calendar"
              color="#F59E0B"
            />
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.gridCell}>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue, settings.currency)}
              icon="dollar-sign"
              color="#2563EB"
            />
          </View>
          <View style={styles.gridCell}>
            <StatCard
              title="Low Stock"
              value={String(stats.lowStockCount)}
              icon="alert-triangle"
              color={stats.lowStockCount > 0 ? '#EF4444' : '#10B981'}
              subtitle={stats.lowStockCount > 0 ? 'Needs restock' : 'All good'}
            />
          </View>
        </View>
      </View>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <View style={[styles.card, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Feather name="alert-triangle" size={16} color="#EF4444" />
              <Text style={[styles.cardTitle, { color: '#DC2626' }]}>
                Low Stock Alert
              </Text>
            </View>
            <Pressable onPress={() => router.push('/inventory')}>
              <Text style={[styles.seeAll, { color: '#DC2626' }]}>Manage</Text>
            </Pressable>
          </View>
          {lowStockProducts.map((p) => (
            <View key={p.id} style={[styles.alertRow, { borderTopColor: '#FCA5A5' }]}>
              <Text style={[styles.alertName, { color: '#7F1D1D' }]}>{p.name}</Text>
              <Text style={[styles.alertStock, { color: '#DC2626' }]}>
                {p.stock} {p.unit} left
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Sales */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Feather name="file-text" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Recent Sales
            </Text>
          </View>
          <Pressable onPress={() => router.push('/sales')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </Pressable>
        </View>
        {recentSales.length === 0 ? (
          <Text style={[styles.emptyMsg, { color: colors.mutedForeground }]}>
            No sales yet. Start billing!
          </Text>
        ) : (
          recentSales.map((sale, idx) => (
            <Pressable
              key={sale.id}
              style={({ pressed }) => [
                styles.saleRow,
                {
                  borderTopColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                  borderTopWidth: idx === 0 ? 0 : 1,
                },
              ]}
              onPress={() => router.push(`/sales/${sale.id}` as any)}
            >
              <View>
                <Text style={[styles.invoiceNum, { color: colors.text }]}>
                  {sale.invoiceNumber}
                </Text>
                <Text style={[styles.saleDate, { color: colors.mutedForeground }]}>
                  {formatDateTime(sale.createdAt)}
                </Text>
              </View>
              <View style={styles.saleRight}>
                <Text style={[styles.saleAmount, { color: colors.primary }]}>
                  {formatCurrency(sale.grandTotal, settings.currency)}
                </Text>
                <Badge
                  label={sale.paymentMethod.toUpperCase()}
                  variant={
                    sale.paymentMethod === 'cash'
                      ? 'success'
                      : sale.paymentMethod === 'upi'
                      ? 'primary'
                      : 'warning'
                  }
                />
              </View>
            </Pressable>
          ))
        )}
      </View>

      {/* Inventory Summary */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Feather name="layers" size={16} color="#8B5CF6" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Inventory Value
            </Text>
          </View>
        </View>
        <Text style={[styles.bigValue, { color: '#8B5CF6' }]}>
          {formatCurrency(stats.totalInventoryValue, settings.currency)}
        </Text>
        <Text style={[styles.bigValueSub, { color: colors.mutedForeground }]}>
          Across {stats.totalProducts} products
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  shopName: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  dateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dateText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  grid: { gap: 10 },
  gridRow: { flexDirection: 'row', gap: 10 },
  gridCell: { flex: 1 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  seeAll: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1 },
  alertName: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  alertStock: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  invoiceNum: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  saleDate: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  saleRight: { alignItems: 'flex-end', gap: 4 },
  saleAmount: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  emptyMsg: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 12 },
  bigValue: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  bigValueSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: -4 },
});
