import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

type MetricTileProps = {
  label: string;
  value: string;
  tone?: 'accent' | 'route' | 'warning';
};

export function MetricTile({ label, value, tone = 'accent' }: MetricTileProps) {
  return (
    <View style={[styles.tile, styles[tone]]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 8,
    flex: 1,
    minHeight: 92,
    justifyContent: 'space-between',
    padding: 14
  },
  accent: {
    backgroundColor: colors.accentSoft
  },
  route: {
    backgroundColor: colors.routeSoft
  },
  warning: {
    backgroundColor: colors.warningSoft
  },
  value: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800'
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  }
});

