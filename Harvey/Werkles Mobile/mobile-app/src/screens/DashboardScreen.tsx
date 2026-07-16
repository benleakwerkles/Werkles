import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '../components/Card';
import { MetricTile } from '../components/MetricTile';
import { dispatchEvents } from '../data/werkles';
import { colors } from '../theme';

export function DashboardScreen() {
  return (
    <View style={styles.stack}>
      <View style={styles.metrics}>
        <MetricTile label="Live routes" tone="accent" value="3" />
        <MetricTile label="Queued" tone="route" value="11" />
        <MetricTile label="Needs eyes" tone="warning" value="1" />
      </View>

      <Card>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.sectionTitle}>Dispatch history</Text>
            <Text style={styles.sectionCaption}>Latest bridge events</Text>
          </View>
          <MaterialCommunityIcons color={colors.accentBright} name="timeline-clock" size={24} />
        </View>

        <View style={styles.eventList}>
          {dispatchEvents.map((event) => (
            <View key={event.id} style={styles.eventRow}>
              <View style={styles.eventMarker} />
              <View style={styles.eventBody}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventMeta}>
                  {event.route} · {event.time}
                </Text>
              </View>
              <Text style={styles.eventState}>{event.state}</Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 16
  },
  metrics: {
    flexDirection: 'row',
    gap: 10
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800'
  },
  sectionCaption: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2
  },
  eventList: {
    gap: 12
  },
  eventRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12
  },
  eventMarker: {
    backgroundColor: colors.accentBright,
    borderRadius: 999,
    height: 10,
    width: 10
  },
  eventBody: {
    flex: 1
  },
  eventTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700'
  },
  eventMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2
  },
  eventState: {
    color: colors.accentBright,
    fontSize: 13,
    fontWeight: '800'
  }
});

