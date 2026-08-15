import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export function BackButton({ showText = true }: { showText?: boolean }) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <Pressable
      onPress={() => router.back()}
      style={({ pressed }) => [
        styles.container,
        { paddingTop: Math.max(8, insets.top ? insets.top - 2 : 8), opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View style={styles.inner}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        {showText ? <Text style={[styles.text, { color: colors.primary }]}>Back</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, justifyContent: 'center' },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontFamily: 'Inter_500Medium', fontSize: 15 },
});

export default BackButton;
