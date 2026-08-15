import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import BackButton from '@/components/BackButton';

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  icon?: React.ComponentProps<typeof Feather>['name'];
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
        {icon && <Feather name={icon} size={15} color={colors.mutedForeground} />}
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useApp();
  const { changePassword } = useAuth();

  const [form, setForm] = useState({ ...settings });
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  async function save() {
    setSaving(true);
    await updateSettings(form);
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Settings updated successfully.');
  }

  async function handleChangePassword() {
    if (!currentPwd || !newPwd) {
      Alert.alert('Error', 'Please fill both password fields.');
      return;
    }
    if (newPwd.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }
    const ok = await changePassword(currentPwd, newPwd);
    if (ok) {
      setCurrentPwd('');
      setNewPwd('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Password changed successfully.');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Current password is incorrect.');
    }
  }

  const webPad = Platform.OS === 'web' ? 67 : 0;

  return (
    <>
      <Stack.Screen options={{ title: 'Settings', headerBackTitle: 'More', headerLeft: () => <BackButton /> }} />
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: webPad + 16,
            paddingBottom: insets.bottom + 180,
            padding: 16,
            gap: 20,
          }}
          showsVerticalScrollIndicator={true}
        >
          {/* Shop Info */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Shop Information</Text>
            <Field label="Shop Name" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="My Shop" icon="shopping-bag" />
            <Field label="Address" value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} placeholder="123 Main Street, City" icon="map-pin" />
            <Field label="Phone" value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+91 9876543210" keyboardType="phone-pad" icon="phone" />
            <Field label="Email" value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="shop@email.com" keyboardType="email-address" icon="mail" />
            <Field label="GST Number" value={form.gstNumber} onChangeText={(v) => setForm((f) => ({ ...f, gstNumber: v }))} placeholder="22AAAAA0000A1Z5" icon="hash" />
          </View>

          {/* Billing Settings */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Billing Settings</Text>

            {/* GST Toggle */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.label, { color: colors.text }]}>Enable GST</Text>
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>Apply GST to invoices</Text>
              </View>
              <Pressable
                style={[styles.toggle, { backgroundColor: form.gstEnabled ? colors.primary : colors.muted }]}
                onPress={() => setForm((f) => ({ ...f, gstEnabled: !f.gstEnabled }))}
              >
                <View style={[styles.toggleDot, { transform: [{ translateX: form.gstEnabled ? 16 : 0 }] }]} />
              </Pressable>
            </View>

            {form.gstEnabled && (
              <Field
                label="GST %"
                value={String(form.gstPercent)}
                onChangeText={(v) => setForm((f) => ({ ...f, gstPercent: Number(v) || 0 }))}
                placeholder="18"
                keyboardType="numeric"
                icon="percent"
              />
            )}

            <Field
              label="Low Stock Alert (units)"
              value={String(form.lowStockThreshold)}
              onChangeText={(v) => setForm((f) => ({ ...f, lowStockThreshold: Number(v) || 10 }))}
              placeholder="10"
              keyboardType="numeric"
              icon="alert-triangle"
            />
            <Field
              label="Currency Symbol"
              value={form.currency}
              onChangeText={(v) => setForm((f) => ({ ...f, currency: v }))}
              placeholder="₹"
              icon="dollar-sign"
            />
          </View>

          {/* Save button */}
          <Pressable
            style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            onPress={save}
            disabled={saving}
          >
            <Feather name="save" size={16} color="#fff" />
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Settings'}</Text>
          </Pressable>

          {/* Change Password */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Change Password</Text>
            <Field label="Current Password" value={currentPwd} onChangeText={setCurrentPwd} placeholder="••••••••" icon="lock" />
            <Field label="New Password" value={newPwd} onChangeText={setNewPwd} placeholder="••••••••" icon="lock" />
            <Pressable
              style={({ pressed }) => [styles.saveBtn, { backgroundColor: '#374151', opacity: pressed ? 0.85 : 1 }]}
              onPress={handleChangePassword}
            >
              <Feather name="key" size={16} color="#fff" />
              <Text style={styles.saveBtnText}>Change Password</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    padding: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
