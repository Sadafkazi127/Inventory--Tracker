import React from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface MenuItem {
  icon: FeatherIconName;
  label: string;
  description: string;
  route: string;
  color?: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    icon: 'layers',
    label: 'Inventory',
    description: 'Manage stock levels & logs',
    route: '/inventory',
  },
  {
    icon: 'file-text',
    label: 'Sales History',
    description: 'View past bills & invoices',
    route: '/sales',
  },
  {
    icon: 'bar-chart-2',
    label: 'Reports',
    description: 'Sales & revenue analytics',
    route: '/reports',
  },
  {
    icon: 'settings',
    label: 'Settings',
    description: 'Shop info & preferences',
    route: '/settings',
  },
];

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  function navigate(route: string) {
    Haptics.selectionAsync();
    router.push(route as any);
  }

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }

  const webPad = Platform.OS === 'web' ? 67 : 0;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: webPad + 8,
        paddingBottom: insets.bottom + 180,
        paddingLeft: 16,
        paddingRight: 16,
        gap: 12,
      }}
      showsVerticalScrollIndicator={true}
    >
      {/* User card */}
      <View style={[styles.userCard, { backgroundColor: colors.primary }]}>
        <View style={styles.avatar}>
          <Feather name="user" size={24} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.userName}>{user?.username ?? 'Admin'}</Text>
          <Text style={styles.userRole}>Shop Administrator</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {MENU_ITEMS.map((item, idx) => (
          <React.Fragment key={item.route}>
            <Pressable
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => navigate(item.route)}
            >
              <View style={[styles.rowIcon, { backgroundColor: (item.color ?? colors.primary) + '18' }]}>
                <Feather name={item.icon} size={18} color={item.color ?? colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                  {item.description}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
            {idx < MENU_ITEMS.length - 1 && (
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Logout */}
      <Pressable
        style={({ pressed }) => [
          styles.logoutBtn,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
      </Pressable>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>
        ShopMaster v1.0 • Inventory & Billing
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    textTransform: 'capitalize',
  },
  userRole: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  rowDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    height: 1,
    marginLeft: 64,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
