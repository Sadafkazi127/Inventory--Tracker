import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type Variant = 'success' | 'warning' | 'destructive' | 'default' | 'primary';

interface BadgeProps {
  label: string;
  variant?: Variant;
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const colors = useColors();

  const palette: Record<Variant, { bg: string; text: string }> = {
    success: { bg: '#10B98120', text: '#059669' },
    warning: { bg: '#F59E0B20', text: '#D97706' },
    destructive: { bg: colors.destructive + '20', text: colors.destructive },
    primary: { bg: colors.primary + '20', text: colors.primary },
    default: { bg: colors.muted, text: colors.mutedForeground },
  };

  const { bg, text } = palette[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
