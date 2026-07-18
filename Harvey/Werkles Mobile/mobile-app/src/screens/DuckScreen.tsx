import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';

import { Card } from '../components/Card';
import { colors } from '../theme';

export function DuckScreen() {
  const [payload, setPayload] = useState(
    '{"work":"sync","priority":"normal","source":"harvey-mobile"}'
  );

  return (
    <View style={styles.stack}>
      <Card>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.sectionTitle}>Duck intake</Text>
            <Text style={styles.sectionCaption}>Prepare payloads for bridge routing</Text>
          </View>
          <MaterialCommunityIcons color={colors.warning} name="file-code-outline" size={24} />
        </View>

        <TextInput
          multiline
          onChangeText={setPayload}
          spellCheck={false}
          style={styles.input}
          value={payload}
        />

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" style={styles.secondaryButton}>
            <MaterialCommunityIcons color={colors.accent} name="content-save-outline" size={20} />
            <Text style={styles.secondaryButtonText}>Stage</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.primaryButton}>
            <MaterialCommunityIcons color={colors.surface} name="send-check-outline" size={20} />
            <Text style={styles.primaryButtonText}>Dispatch</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Envelope</Text>
        <Text style={styles.bodyText}>
          Every dispatch carries destination, payload, timestamp, and sandbox boundary metadata.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 16
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
  input: {
    backgroundColor: '#F1EEE8',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: 'monospace',
    fontSize: 14,
    minHeight: 156,
    padding: 12,
    textAlignVertical: 'top'
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '800'
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48
  },
  secondaryButtonText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '800'
  },
  bodyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8
  }
});
