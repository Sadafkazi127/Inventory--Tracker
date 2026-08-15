import React, { useMemo, useState } from 'react';
import {
  Alert,
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
import { BarChart } from '@/components/BarChart';
import { formatCurrency, isThisMonth, isThisWeek, isThisYear, isToday } from '@/constants/storage';
import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

type Period = 'today' | 'week' | 'month' | 'year';

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sales, products, settings } = useApp();
  const [period, setPeriod] = useState<Period>('month');

  const filteredSales = useMemo(() => {
    switch (period) {
      case 'today': return sales.filter((s) => isToday(s.createdAt));
      case 'week': return sales.filter((s) => isThisWeek(s.createdAt));
      case 'month': return sales.filter((s) => isThisMonth(s.createdAt));
      case 'year': return sales.filter((s) => isThisYear(s.createdAt));
    }
  }, [sales, period]);

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalDiscount = filteredSales.reduce((sum, s) => sum + s.discount, 0);
  const totalGST = filteredSales.reduce((sum, s) => sum + s.gst, 0);
  const avgOrder = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  // Payment breakdown
  const paymentBreakdown = useMemo(() => {
    const counts = { cash: 0, upi: 0, card: 0 };
    const amounts = { cash: 0, upi: 0, card: 0 };
    filteredSales.forEach((s) => {
      counts[s.paymentMethod]++;
      amounts[s.paymentMethod] += s.grandTotal;
    });
    return { counts, amounts };
  }, [filteredSales]);

  // Top selling products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        const existing = map.get(item.productId);
        if (existing) {
          existing.qty += item.quantity;
          existing.revenue += item.total;
        } else {
          map.set(item.productId, { name: item.productName, qty: item.quantity, revenue: item.total });
        }
      });
    });
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredSales]);

  // Chart data — daily for month, weekly for year, hourly for today
  const chartData = useMemo(() => {
    if (period === 'today') {
      const hours = Array.from({ length: 8 }, (_, i) => {
        const h = 8 + i * 2;
        const label = `${h}:00`;
        const value = filteredSales
          .filter((s) => {
            const hour = new Date(s.createdAt).getHours();
            return hour >= h && hour < h + 2;
          })
          .reduce((sum, s) => sum + s.grandTotal, 0);
        return { label, value };
      });
      return hours;
    }
    if (period === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days.map((label, dayIdx) => ({
        label,
        value: filteredSales
          .filter((s) => new Date(s.createdAt).getDay() === dayIdx)
          .reduce((sum, s) => sum + s.grandTotal, 0),
      }));
    }
    if (period === 'month') {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const weeks: { label: string; value: number }[] = [];
      for (let w = 1; w <= Math.ceil(daysInMonth / 7); w++) {
        const startDay = (w - 1) * 7 + 1;
        const endDay = Math.min(w * 7, daysInMonth);
        weeks.push({
          label: `W${w}`,
          value: filteredSales
            .filter((s) => {
              const d = new Date(s.createdAt).getDate();
              return d >= startDay && d <= endDay;
            })
            .reduce((sum, s) => sum + s.grandTotal, 0),
        });
      }
      return weeks;
    }
    // Year
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((label, idx) => ({
      label,
      value: filteredSales
        .filter((s) => new Date(s.createdAt).getMonth() === idx)
        .reduce((sum, s) => sum + s.grandTotal, 0),
    }));
  }, [filteredSales, period]);

  // Low stock report
  const lowStockProducts = products.filter((p) => p.stock <= settings.lowStockThreshold);

  async function exportCSV() {
    const header = 'Invoice,Date,Customer,Items,Subtotal,Discount,GST,Total,Payment\n';
    const rows = filteredSales
      .map(
        (s) =>
          `${s.invoiceNumber},${new Date(s.createdAt).toLocaleDateString()},${s.customerName ?? 'Walk-in'},${s.items.length},${s.subtotal.toFixed(2)},${s.discount.toFixed(2)},${s.gst.toFixed(2)},${s.grandTotal.toFixed(2)},${s.paymentMethod}`
      )
      .join('\n');
    const csv = header + rows;

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Not available', 'Sharing is not available on this device.');
      return;
    }

    // Write to temp file
    const path = `${FileSystem.cacheDirectory}sales_report.csv`;
    await FileSystem.writeAsStringAsync(path, csv, { encoding: 'utf8' });
    await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export Sales CSV' });
  }

  const PERIODS: { value: Period; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  const webPad = Platform.OS === 'web' ? 67 : 0;

  return (
    <>
      <Stack.Screen options={{ title: 'Reports', headerBackTitle: 'More' }} />
      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingTop: webPad + 12,
          paddingBottom: insets.bottom + 100,
          padding: 16,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <Pressable
              key={p.value}
              style={[
                styles.periodBtn,
                {
                  backgroundColor: period === p.value ? colors.primary : colors.card,
                  borderColor: period === p.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setPeriod(p.value)}
            >
              <Text style={{ color: period === p.value ? '#fff' : colors.text, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>
                {p.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.exportBtn, { backgroundColor: '#10B981' }]}
            onPress={exportCSV}
          >
            <Feather name="download" size={14} color="#fff" />
            <Text style={styles.exportText}>CSV</Text>
          </Pressable>
        </View>

        {/* Summary stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Revenue', value: formatCurrency(totalRevenue, settings.currency), color: colors.primary, icon: 'trending-up' as const },
            { label: 'Orders', value: String(filteredSales.length), color: '#8B5CF6', icon: 'file-text' as const },
            { label: 'Avg Order', value: formatCurrency(avgOrder, settings.currency), color: '#10B981', icon: 'bar-chart' as const },
            { label: 'Discount', value: formatCurrency(totalDiscount, settings.currency), color: '#F59E0B', icon: 'tag' as const },
          ].map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.statIcon, { backgroundColor: stat.color + '18' }]}>
                <Feather name={stat.icon} size={16} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: stat.color }]} numberOfLines={1}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Revenue Chart */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Revenue Chart</Text>
          <BarChart
            data={chartData}
            height={160}
            formatValue={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v))
            }
          />
        </View>

        {/* Payment Breakdown */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Breakdown</Text>
          {(['cash', 'upi', 'card'] as const).map((method) => {
            const total = paymentBreakdown.amounts[method];
            const count = paymentBreakdown.counts[method];
            const ratio = totalRevenue > 0 ? total / totalRevenue : 0;
            const methodColors = { cash: '#10B981', upi: colors.primary, card: '#8B5CF6' };
            return (
              <View key={method} style={styles.payRow}>
                <View style={[styles.payDot, { backgroundColor: methodColors[method] }]} />
                <Text style={[styles.payLabel, { color: colors.text }]}>{method.toUpperCase()}</Text>
                <View style={[styles.payBar, { backgroundColor: colors.muted }]}>
                  <View style={[styles.payBarFill, { width: `${ratio * 100}%`, backgroundColor: methodColors[method] }]} />
                </View>
                <Text style={[styles.payValue, { color: colors.mutedForeground }]}>
                  {count} sale{count !== 1 ? 's' : ''}
                </Text>
                <Text style={[styles.payAmount, { color: methodColors[method] }]}>
                  {formatCurrency(total, settings.currency)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Top Products */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Top Selling Products</Text>
          {topProducts.length === 0 ? (
            <Text style={[styles.emptyMsg, { color: colors.mutedForeground }]}>No sales data for this period</Text>
          ) : (
            topProducts.map((p, idx) => (
              <View key={p.name} style={[styles.topRow, { borderTopColor: colors.border, borderTopWidth: idx === 0 ? 0 : 1 }]}>
                <View style={[styles.topRank, { backgroundColor: idx === 0 ? '#F59E0B' : colors.muted }]}>
                  <Text style={[styles.topRankText, { color: idx === 0 ? '#fff' : colors.mutedForeground }]}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.topName, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
                  <Text style={[styles.topQty, { color: colors.mutedForeground }]}>{p.qty} units sold</Text>
                </View>
                <Text style={[styles.topRevenue, { color: colors.primary }]}>
                  {formatCurrency(p.revenue, settings.currency)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <View style={[styles.card, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
            <View style={styles.cardTitleRow}>
              <Feather name="alert-triangle" size={16} color="#EF4444" />
              <Text style={[styles.cardTitle, { color: '#DC2626' }]}>Low Stock Products ({lowStockProducts.length})</Text>
            </View>
            {lowStockProducts.map((p, idx) => (
              <View key={p.id} style={[styles.lowRow, { borderTopColor: '#FCA5A5', borderTopWidth: idx === 0 ? 0 : 1 }]}>
                <Text style={[styles.lowName, { color: '#7F1D1D' }]}>{p.name}</Text>
                <Text style={[styles.lowStock, { color: '#DC2626' }]}>{p.stock} {p.unit}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  periodRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  exportBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  exportText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payDot: { width: 10, height: 10, borderRadius: 5 },
  payLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', width: 36 },
  payBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  payBarFill: { height: '100%', borderRadius: 3 },
  payValue: { fontSize: 11, fontFamily: 'Inter_400Regular', width: 48, textAlign: 'right' },
  payAmount: { fontSize: 12, fontFamily: 'Inter_700Bold', width: 64, textAlign: 'right' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  topRank: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  topRankText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  topName: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  topQty: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  topRevenue: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  emptyMsg: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 8 },
  lowRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  lowName: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  lowStock: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
