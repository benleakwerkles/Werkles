import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '../components/Card';
import { MetricTile } from '../components/MetricTile';
import { getCommittedFlockEvidence } from '../data/flockRelay';
import { bridgeRoutes, dispatchEvents, fixtureMetadata } from '../data/werkles';
import { colors } from '../theme';

const sampleQueued = bridgeRoutes.reduce((total, route) => total + route.sampleQueued, 0);
const flockEvidence = getCommittedFlockEvidence(new Date());

export function DashboardScreen() {
  return (
    <View style={styles.stack}>
      <View style={styles.boundaryBanner}>
        <MaterialCommunityIcons color={colors.warning} name="flask-outline" size={22} />
        <View style={styles.boundaryCopy}>
          <Text style={styles.boundaryTitle}>{fixtureMetadata.label}</Text>
          <Text style={styles.boundaryText}>{fixtureMetadata.proofBoundary}</Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <MetricTile label="Sample routes" tone="accent" value={String(bridgeRoutes.length)} />
        <MetricTile label="Sample queue" tone="route" value={String(sampleQueued)} />
        <MetricTile label="Live proof" tone="warning" value="0" />
      </View>

      <Card>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.sectionTitle}>Flock committed evidence</Text>
            <Text style={styles.sectionCaption}>Dated repository snapshots — never live health</Text>
          </View>
          <MaterialCommunityIcons color={colors.warning} name="database-clock-outline" size={24} />
        </View>

        <View style={styles.evidenceList}>
          {flockEvidence.map((record) => (
            <View key={record.id} style={styles.evidenceRow}>
              <View style={styles.evidenceHeader}>
                <Text style={styles.eventTitle}>{record.title}</Text>
                <Text style={styles.evidenceTruth}>SNAPSHOT · NOT LIVE</Text>
              </View>
              <Text style={styles.evidenceSummary}>{record.summary}</Text>
              <Text selectable style={styles.evidenceSource}>
                {record.sourcePath} @ {record.sourceBlob}
              </Text>
              {record.supportingSource ? (
                <Text selectable style={styles.evidenceSource}>
                  Supports: {record.supportingSource.path} @ {record.supportingSource.blob}
                </Text>
              ) : null}
              <Text style={styles.evidenceAge}>
                Observed {record.observedAt} · {record.ageDays} days old · {record.freshness}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.sectionTitle}>Sample dispatch timeline</Text>
            <Text style={styles.sectionCaption}>Static layout fixtures — not receiver evidence</Text>
          </View>
          <MaterialCommunityIcons color={colors.warning} name="timeline-clock-outline" size={24} />
        </View>

        <View style={styles.eventList}>
          {dispatchEvents.map((event) => (
            <View key={event.id} style={styles.eventRow}>
              <View style={styles.eventMarker} />
              <View style={styles.eventBody}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventMeta}>
                  {event.route} · {event.timeLabel}
                </Text>
              </View>
              <Text style={styles.eventState}>SAMPLE</Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
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
  metrics: { flexDirection: 'row', gap: 10 },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12
  },
  cardHeaderCopy: { flex: 1 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  sectionCaption: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 2 },
  evidenceList: { gap: 12 },
  evidenceRow: {
    backgroundColor: colors.elevated,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 12
  },
  evidenceHeader: { alignItems: 'flex-start', gap: 6 },
  evidenceTruth: { color: colors.warning, fontSize: 11, fontWeight: '800' },
  evidenceSummary: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  evidenceSource: { color: colors.muted, fontFamily: 'monospace', fontSize: 10, lineHeight: 15 },
  evidenceAge: { color: colors.warning, fontSize: 11, fontWeight: '800' },
  eventList: { gap: 12 },
  eventRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  eventMarker: {
    backgroundColor: colors.warning,
    borderRadius: 999,
    height: 10,
    width: 10
  },
  eventBody: { flex: 1 },
  eventTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  eventMeta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  eventState: { color: colors.warning, fontSize: 12, fontWeight: '800' }
});
