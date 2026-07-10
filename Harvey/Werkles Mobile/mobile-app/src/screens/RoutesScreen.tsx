import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '../components/Card';
import { bridgeRoutes, RouteStatus } from '../data/werkles';
import { colors } from '../theme';

const statusTone: Record<
  RouteStatus,
  { label: string; color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }
> = {
  clear: { label: 'Clear', color: colors.success, icon: 'check-circle-outline' },
  watch: { label: 'Watch', color: colors.warning, icon: 'alert-circle-outline' },
  paused: { label: 'Paused', color: colors.muted, icon: 'pause-circle-outline' }
};

export function RoutesScreen() {
  return (
    <View style={styles.stack}>
      {bridgeRoutes.map((route) => {
        const tone = statusTone[route.status];

        return (
          <Card key={route.id}>
            <View style={styles.routeHeader}>
              <View style={styles.routeTitleGroup}>
                <Text style={styles.routeTitle}>{route.label}</Text>
                <Text style={styles.routeDestination}>{route.destination}</Text>
              </View>
              <View style={styles.statusBadge}>
                <MaterialCommunityIcons color={tone.color} name={tone.icon} size={18} />
                <Text style={[styles.statusLabel, { color: tone.color }]}>{tone.label}</Text>
              </View>
            </View>

            <View style={styles.routeStats}>
              <View>
                <Text style={styles.statValue}>{route.latency}</Text>
                <Text style={styles.statLabel}>Latency</Text>
              </View>
              <View>
                <Text style={styles.statValue}>{route.queued}</Text>
                <Text style={styles.statLabel}>Queued</Text>
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14
  },
  routeHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  routeTitleGroup: {
    flex: 1
  },
  routeTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '800'
  },
  routeDestination: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4
  },
  statusBadge: {
    alignItems: 'center',
    backgroundColor: colors.routeSoft,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '800'
  },
  routeStats: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 28,
    marginTop: 16,
    paddingTop: 14
  },
  statValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800'
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2
  }
});
