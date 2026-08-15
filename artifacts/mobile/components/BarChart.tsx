import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface DataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: DataPoint[];
  height?: number;
  formatValue?: (v: number) => string;
}

export function BarChart({ data, height = 160, formatValue }: BarChartProps) {
  const colors = useColors();
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.bars}>
        {data.map((point, i) => {
          const ratio = point.value / maxValue;
          const barHeight = Math.max(ratio * (height - 40), point.value > 0 ? 4 : 0);
          return (
            <View key={i} style={styles.barCol}>
              {point.value > 0 && (
                <Text style={[styles.valueLabel, { color: colors.primary }]}>
                  {formatValue ? formatValue(point.value) : point.value}
                </Text>
              )}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: colors.primary,
                      opacity: 0.8 + 0.2 * ratio,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.xLabel, { color: colors.mutedForeground }]}>
                {point.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 0,
  },
  valueLabel: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
  },
  xLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
