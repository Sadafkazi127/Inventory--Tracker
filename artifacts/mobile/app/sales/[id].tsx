import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { formatCurrency, formatDateTime } from '@/constants/storage';
import type { Sale } from '@/constants/types';
import { api } from '@/lib/apiClient';
import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';

function buildInvoiceHTML(sale: Sale, settings: ReturnType<typeof useApp>['settings']): string {
  const rows = sale.items
    .map(
      (item) => `
      <tr>
        <td>${item.productName}</td>
        <td style="text-align:center">${item.quantity} ${item.unit}</td>
        <td style="text-align:right">{formatCurrency(item.unitPrice, settings.currency)}</td>
        <td style="text-align:right">{formatCurrency(item.total, settings.currency)}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; padding: 30px; color: #1a1a1a; font-size: 13px; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563EB; padding-bottom: 16px; }
  .shop-name { font-size: 24px; font-weight: bold; color: #2563EB; }
  .shop-info { color: #555; margin-top: 4px; line-height: 1.5; }
  .invoice-meta { display: flex; justify-content: space-between; margin: 16px 0; background: #F1F5F9; border-radius: 8px; padding: 12px 16px; }
  .meta-block { }
  .meta-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta-value { font-size: 14px; font-weight: bold; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #2563EB; color: white; padding: 10px 12px; text-align: left; font-size: 12px; }
  th:not(:first-child) { text-align: right; }
  th:nth-child(2) { text-align: center; }
  td { padding: 9px 12px; border-bottom: 1px solid #E2E8F0; }
  .totals { margin-top: 20px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
  .totals-row.grand { border-top: 2px solid #2563EB; margin-top: 8px; padding-top: 12px; border-bottom: none; }
  .totals-row.grand .label { font-size: 16px; font-weight: bold; color: #2563EB; }
  .totals-row.grand .amount { font-size: 20px; font-weight: bold; color: #2563EB; }
  .payment-badge { display: inline-block; background: #EFF6FF; color: #2563EB; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
  .footer { text-align: center; margin-top: 28px; color: #888; font-size: 13px; border-top: 1px dashed #ccc; padding-top: 16px; }
</style>
</head>
<body>
  <div class="header">
    <div class="shop-name">${settings.name}</div>
    <div class="shop-info">
      ${settings.address}<br>
      📞 ${settings.phone}${settings.email ? ` &nbsp;|&nbsp; ✉ ${settings.email}` : ''}
      ${settings.gstNumber ? `<br>GST No: ${settings.gstNumber}` : ''}
    </div>
  </div>

  <div class="invoice-meta">
    <div class="meta-block">
      <div class="meta-label">Invoice No</div>
      <div class="meta-value">${sale.invoiceNumber}</div>
    </div>
    <div class="meta-block">
      <div class="meta-label">Date & Time</div>
      <div class="meta-value">${formatDateTime(sale.createdAt)}</div>
    </div>
    <div class="meta-block">
      <div class="meta-label">Customer</div>
      <div class="meta-value">${sale.customerName ?? 'Walk-in'}</div>
    </div>
    <div class="meta-block">
      <div class="meta-label">Payment</div>
      <div class="meta-value"><span class="payment-badge">${sale.paymentMethod}</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals" style="max-width: 280px; margin-left: auto; margin-top: 20px;">
    <div class="totals-row">
      <span class="label">Subtotal</span>
      <span class="amount">{formatCurrency(sale.subtotal, settings.currency)}</span>
    </div>
    ${sale.discount > 0 ? `<div class="totals-row"><span class="label">Discount</span><span class="amount" style="color:#10B981">-{formatCurrency(sale.discount, settings.currency)}</span></div>` : ''}
    ${sale.gst > 0 ? `<div class="totals-row"><span class="label">GST (${sale.gstPercent}%)</span><span class="amount">{formatCurrency(sale.gst, settings.currency)}</span></div>` : ''}
    <div class="totals-row grand">
      <span class="label">Grand Total</span>
      <span class="amount">{formatCurrency(sale.grandTotal, settings.currency)}</span>
    </div>
  </div>

  <div class="footer">
    🙏 Thank You! Visit Again.<br>
    <small>${settings.name} • Powered by ShopMaster</small>
  </div>
</body>
</html>`;
}

export default function InvoiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sales, settings } = useApp();
  const [printing, setPrinting] = useState(false);
  const [saleState, setSaleState] = useState<Sale | null | undefined>(() =>
    sales.find((s) => s.id === id)
  );
  const [isLoadingSale, setIsLoadingSale] = useState(false);

  const sale = saleState ?? sales.find((s) => s.id === id);
  const webPad = Platform.OS === 'web' ? 67 : 0;

  useEffect(() => {
    const currentSale = sales.find((s) => s.id === id);
    if (currentSale) {
      setSaleState(currentSale);
      return;
    }

    if (!id) return;

    setIsLoadingSale(true);
    api
      .get<Sale>(`/sales/${id}`)
      .then((fetchedSale) => setSaleState(fetchedSale))
      .catch(() => setSaleState(null))
      .finally(() => setIsLoadingSale(false));
  }, [id, sales]);

  async function handleDownload() {
    if (!sale) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPrinting(true);
    try {
      const html = buildInvoiceHTML(sale, settings);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Invoice ${sale.invoiceNumber}` });
      } else {
        Alert.alert('Saved', `Invoice saved to: ${uri}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not generate PDF. Please try again.');
    } finally {
      setPrinting(false);
    }
  }

  async function handlePrint() {
    if (!sale) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPrinting(true);
    try {
      const html = buildInvoiceHTML(sale, settings);
      await Print.printAsync({ html });
    } catch (e) {
      Alert.alert('Error', 'Printing failed.');
    } finally {
      setPrinting(false);
    }
  }

  if (!sale) {
    return (
      <>
        <Stack.Screen options={{ title: 'Invoice' }} />
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Invoice not found</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: sale.invoiceNumber }} />
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: webPad + 16,
            paddingBottom: insets.bottom + 120,
            padding: 16,
            gap: 14,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Invoice header card */}
          <View style={[styles.invoiceHeader, { backgroundColor: colors.primary }]}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.shopName}>{settings.name}</Text>
                <Text style={styles.shopAddress}>{settings.address}</Text>
              </View>
              <View style={[styles.invBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Feather name="file-text" size={20} color="#fff" />
              </View>
            </View>
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Invoice</Text>
                <Text style={styles.metaValue}>{sale.invoiceNumber}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>{new Date(sale.createdAt).toLocaleDateString('en-IN')}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Payment</Text>
                <Text style={styles.metaValue}>{sale.paymentMethod.toUpperCase()}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Customer</Text>
                <Text style={styles.metaValue}>{sale.customerName ?? 'Walk-in'}</Text>
              </View>
            </View>
          </View>

          {/* Items */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Items</Text>
            <View style={[styles.tableHeader, { backgroundColor: colors.muted }]}>
              <Text style={[styles.colProduct, { color: colors.mutedForeground }]}>Product</Text>
              <Text style={[styles.colQty, { color: colors.mutedForeground }]}>Qty</Text>
              <Text style={[styles.colPrice, { color: colors.mutedForeground }]}>Price</Text>
              <Text style={[styles.colTotal, { color: colors.mutedForeground }]}>Total</Text>
            </View>
            {sale.items.map((item, idx) => (
              <View
                key={idx}
                style={[styles.tableRow, { borderTopColor: colors.border, borderTopWidth: idx === 0 ? 0 : 1 }]}
              >
                <Text style={[styles.colProduct, { color: colors.text }]} numberOfLines={2}>{item.productName}</Text>
                <Text style={[styles.colQty, { color: colors.mutedForeground }]}>{item.quantity} {item.unit}</Text>
                <Text style={[styles.colPrice, { color: colors.mutedForeground }]}>{formatCurrency(item.unitPrice, settings.currency)}</Text>
                <Text style={[styles.colTotal, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>{formatCurrency(item.total, settings.currency)}</Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Summary</Text>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Subtotal</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(sale.subtotal, settings.currency)}</Text>
            </View>
            {sale.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Discount</Text>
                <Text style={[styles.totalValue, { color: '#10B981' }]}>-{formatCurrency(sale.discount, settings.currency)}</Text>
              </View>
            )}
            {sale.gst > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>GST ({sale.gstPercent}%)</Text>
                <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(sale.gst, settings.currency)}</Text>
              </View>
            )}
            <View style={[styles.grandRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.grandLabel, { color: colors.text }]}>Grand Total</Text>
              <Text style={[styles.grandValue, { color: colors.primary }]}>{formatCurrency(sale.grandTotal, settings.currency)}</Text>
            </View>
          </View>

          <Text style={[styles.thankYou, { color: colors.mutedForeground }]}>
            🙏 Thank You! Visit Again.
          </Text>
        </ScrollView>

        {/* Action buttons */}
        <View
          style={[
            styles.actions,
            { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <Pressable
            style={({ pressed }) => [styles.actionBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            onPress={handlePrint}
            disabled={printing}
          >
            {printing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather name="printer" size={20} color={colors.primary} />
            )}
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Print</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionBtnPrimary, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            onPress={handleDownload}
            disabled={printing}
          >
            {printing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="download" size={20} color="#fff" />
            )}
            <Text style={styles.actionBtnPrimaryText}>Download PDF</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  invoiceHeader: { borderRadius: 16, padding: 16, gap: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  shopName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  shopAddress: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  invBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flex: 1, minWidth: '40%', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 8 },
  metaLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' },
  metaValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff', marginTop: 2 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  tableHeader: { flexDirection: 'row', padding: 8, borderRadius: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 10 },
  colProduct: { flex: 2, fontSize: 13, fontFamily: 'Inter_400Regular' },
  colQty: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  colPrice: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  colTotal: { flex: 1, fontSize: 13, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  totalValue: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
  grandLabel: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  grandValue: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  thankYou: { textAlign: 'center', fontSize: 16, fontFamily: 'Inter_500Medium' },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  actionBtnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnPrimaryText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
