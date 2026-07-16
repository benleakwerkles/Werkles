import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Dispatch, SetStateAction } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { Card } from '../components/Card';
import { createLocalDuckDraftReceipt } from '../data/duckDraft';
import type { LocalDuckDraftReceipt } from '../data/duckDraft';
import { colors } from '../theme';

type DuckScreenProps = Readonly<{
  payload: string;
  setPayload: Dispatch<SetStateAction<string>>;
  draftReceipt: LocalDuckDraftReceipt | null;
  setDraftReceipt: Dispatch<SetStateAction<LocalDuckDraftReceipt | null>>;
  validationError: string | null;
  setValidationError: Dispatch<SetStateAction<string | null>>;
}>;

export function DuckScreen({
  payload,
  setPayload,
  draftReceipt,
  setDraftReceipt,
  validationError,
  setValidationError
}: DuckScreenProps) {

  const canStage = payload.trim().length > 0 && draftReceipt === null;

  function stageLocalDraft() {
    if (!canStage) {
      return;
    }

    try {
      setDraftReceipt(createLocalDuckDraftReceipt(payload, new Date()));
      setValidationError(null);
      AccessibilityInfo.announceForAccessibility(
        'Local Duck draft created. It has not been dispatched.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payload is not valid JSON.';
      setValidationError(message);
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  function clearLocalDraft() {
    setDraftReceipt(null);
    setValidationError(null);
    AccessibilityInfo.announceForAccessibility('Local Duck draft cleared.');
  }

  return (
    <View style={styles.stack}>
      <View style={styles.boundaryBanner}>
        <MaterialCommunityIcons color={colors.warning} name="access-point-off" size={22} />
        <View style={styles.boundaryCopy}>
          <Text style={styles.boundaryTitle}>Bridge not connected</Text>
          <Text style={styles.boundaryText}>
            Harvey can validate and save one in-memory draft. It cannot queue, send, or deliver it.
          </Text>
        </View>
      </View>

      <Card>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.sectionTitle}>Duck intake</Text>
            <Text style={styles.sectionCaption}>Prepare a local JSON draft</Text>
          </View>
          <MaterialCommunityIcons color={colors.warning} name="file-code-outline" size={24} />
        </View>

        <TextInput
          accessibilityHint="Enter one JSON object for a local draft."
          accessibilityLabel="Duck JSON payload"
          editable={draftReceipt === null}
          multiline
          onChangeText={setPayload}
          spellCheck={false}
          style={[styles.input, draftReceipt !== null && styles.inputLocked]}
          value={payload}
        />

        {validationError ? (
          <Text accessibilityLiveRegion="assertive" style={styles.validationError}>
            {validationError}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityHint="Validates JSON and creates an in-memory receipt only."
            accessibilityLabel="Create local Duck draft"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canStage }}
            disabled={!canStage}
            onPress={stageLocalDraft}
            style={[styles.secondaryButton, !canStage && styles.buttonDisabled]}
          >
            <MaterialCommunityIcons color={colors.actionText} name="content-save-outline" size={20} />
            <Text style={styles.secondaryButtonText}>Create local draft</Text>
          </Pressable>
          <Pressable
            accessibilityHint="Dispatch is unavailable because no bridge transport is connected."
            accessibilityLabel="Dispatch unavailable"
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            disabled
            style={[styles.primaryButton, styles.buttonDisabled]}
          >
            <MaterialCommunityIcons color={colors.actionText} name="send-lock-outline" size={20} />
            <Text style={styles.primaryButtonText}>Dispatch unavailable</Text>
          </Pressable>
        </View>

        {draftReceipt ? (
          <View accessibilityLiveRegion="polite" style={styles.receipt}>
            <Text style={styles.receiptTitle}>Local draft — not dispatched</Text>
            <Text selectable style={styles.receiptValue}>
              {draftReceipt.requestId}
            </Text>
            <Text selectable style={styles.receiptValue}>
              {draftReceipt.createdAt}
            </Text>
            <Text style={styles.receiptLabel}>Top-level keys</Text>
            <Text selectable style={styles.receiptValue}>
              {draftReceipt.payloadSummary.topLevelKeys.join(', ') || '(none)'}
            </Text>
            <Text style={styles.receiptLabel}>Payload characters</Text>
            <Text selectable style={styles.receiptValue}>
              {draftReceipt.payloadSummary.characterCount}
            </Text>
            <Text style={styles.receiptState}>{draftReceipt.proofState.replace(/_/g, ' ')}</Text>
            <Text style={styles.receiptBoundary}>{draftReceipt.proofBoundary}</Text>
            <Pressable
              accessibilityLabel="Clear local Duck draft"
              accessibilityRole="button"
              onPress={clearLocalDraft}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear local draft</Text>
            </Pressable>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Envelope boundary</Text>
        <Text style={styles.bodyText}>
          A future dispatch requires destination, timestamp, bridge receipt, and origin-return
          proof. None are fabricated by this prototype.
        </Text>
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
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12
  },
  cardHeaderCopy: { flex: 1 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  sectionCaption: { color: colors.muted, fontSize: 13, marginTop: 2 },
  input: {
    backgroundColor: colors.elevated,
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
  inputLocked: { color: colors.muted },
  validationError: { color: colors.warning, fontSize: 13, fontWeight: '800', marginTop: 8 },
  actions: { gap: 10, marginTop: 14 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48
  },
  primaryButtonText: { color: colors.actionText, fontSize: 15, fontWeight: '800' },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48
  },
  secondaryButtonText: { color: colors.actionText, fontSize: 15, fontWeight: '800' },
  buttonDisabled: { opacity: 0.45 },
  receipt: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
    marginTop: 14,
    padding: 12
  },
  receiptTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  receiptLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', marginTop: 3 },
  receiptValue: { color: colors.ink, fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  receiptState: { color: colors.warning, fontSize: 11, fontWeight: '800' },
  receiptBoundary: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  clearButton: { alignItems: 'center', justifyContent: 'center', marginTop: 4, minHeight: 44 },
  clearButtonText: { color: colors.secondaryBright, fontSize: 14, fontWeight: '800' },
  bodyText: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 }
});
