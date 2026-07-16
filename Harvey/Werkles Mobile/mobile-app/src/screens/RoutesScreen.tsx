import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '../components/Card';
import { bridgeRoutes, fixtureMetadata } from '../data/werkles';
import { colors } from '../theme';

export function RoutesScreen() {
  return (
    <View style={styles.stack}>
      <View style={styles.boundaryBanner}>
        <MaterialCommunityIcons color={colors.warning} name="access-point-off" size={22} />
        <View style={styles.boundaryCopy}>
          <Text style={styles.boundaryTitle}>No live route probe</Text>
          <Text style={styles.boundaryText}>{fixtureMetadata.proofBoundary}</Text>
        </View>
      </View>

      {bridgeRoutes.map((route) => (
        <Card key={route.id}>
          <View style={styles.routeHeader}>
            <View style={styles.routeTitleGroup}>
              <Text style={styles.routeTitle}>{route.label}</Text>
              <Text selectable style={styles.routeDestination}>
                {route.destination}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <MaterialCommunityIcons color={colors.warning} name="flask-outline" size={18} />
              <Text style={styles.statusLabel}>Sample</Text>
            </View>
          </View>

          <View style={styles.routeStats}>
            <View>
              <Text style={styles.statValue}>{route.sampleLatency}</Text>
              <Text style={styles.statLabel}>Sample latency</Text>
            </View>
            <View>
              <Text style={styles.statValue}>{route.sampleQueued}</Text>
              <Text style={styles.statLabel}>Sample queued</Text>
            </View>
          </View>
          <Text style={styles.proofState}>{route.proofState.replace(/_/g, ' ')}</Text>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  boundaryBanner: {
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12
  },
  boundaryCopy: { flex: 1 },
  boundaryTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  boundaryText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 2 },
  routeHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  routeTitleGroup: { flex: 1 },
  routeTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  routeDestination: {
    color: colors.muted,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4
  },
  statusBadge: {
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  statusLabel: { color: colors.warning, fontSize: 13, fontWeight: '800' },
  routeStats: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 28,
    marginTop: 16,
    paddingTop: 14
  },
  statValue: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 13, marginTop: 2 },
  proofState: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 12
  }
});
