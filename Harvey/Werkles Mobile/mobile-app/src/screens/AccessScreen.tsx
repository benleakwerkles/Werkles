import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '../components/Card';
import {
  canonicalSshTarget,
  createSshOnboardingReceipt,
  proofStatePresentation,
  sshOnboardingSteps
} from '../data/sshOnboarding';
import type { SshOnboardingReceipt } from '../data/sshOnboarding';
import { colors } from '../theme';

export function AccessScreen() {
  const [machineName, setMachineName] = useState('Doss');
  const [receipt, setReceipt] = useState<SshOnboardingReceipt | null>(null);

  const normalizedMachineName = machineName.trim();
  const proofState = receipt?.proofState ?? 'DRAFT';
  const proofPresentation = proofStatePresentation[proofState];
  const canStage = normalizedMachineName.length > 0 && receipt === null;
  const keyTitle = `Harvey · ${normalizedMachineName || 'Machine'} · <date>`;

  function stageRequest() {
    if (canStage) {
      setReceipt(createSshOnboardingReceipt(normalizedMachineName, new Date()));
    }
  }

  function resetRequest() {
    setReceipt(null);
  }

  return (
    <View style={styles.stack}>
      <View style={styles.prototypeBanner}>
        <MaterialCommunityIcons color={colors.warning} name="shield-outline" size={22} />
        <View style={styles.prototypeCopy}>
          <Text style={styles.prototypeTitle}>Safe prototype</Text>
          <Text style={styles.prototypeText}>
            This screen creates a local request receipt only. It does not create keys, change
            GitHub, dispatch to a machine, or touch a repo remote.
          </Text>
        </View>
      </View>

      <Card>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.sectionTitle}>Machine access</Text>
            <Text style={styles.sectionCaption}>Connect one machine to Ben's Werkles repo</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusLabel}>{proofPresentation.label}</Text>
          </View>
        </View>

        <Text style={styles.inputLabel}>Machine name</Text>
        <TextInput
          accessibilityLabel="Machine name"
          autoCapitalize="words"
          editable={receipt === null}
          onChangeText={setMachineName}
          placeholder="Example: Doss"
          placeholderTextColor={colors.subtle}
          style={[styles.input, receipt !== null && styles.inputLocked]}
          value={machineName}
        />

        <View style={styles.targetList}>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>GitHub account</Text>
            <Text style={styles.targetValue}>{canonicalSshTarget.account}</Text>
          </View>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>Repository</Text>
            <Text style={styles.targetValue}>{canonicalSshTarget.repository}</Text>
          </View>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>SSH alias</Text>
            <Text style={styles.targetValue}>{canonicalSshTarget.hostAlias}</Text>
          </View>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>Git remote</Text>
            <Text style={styles.targetValue}>{canonicalSshTarget.remote}</Text>
          </View>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>Key title</Text>
            <Text style={styles.targetValue}>{keyTitle}</Text>
          </View>
        </View>

        {receipt ? (
          <View style={styles.createdNotice}>
            <MaterialCommunityIcons color={colors.warning} name="progress-clock" size={22} />
            <View style={styles.createdNoticeCopy}>
              <Text style={styles.createdNoticeTitle}>
                Created locally for {receipt.machineName} — not dispatched
              </Text>
              <Text style={styles.createdNoticeText}>{proofPresentation.detail}</Text>
            </View>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canStage }}
          disabled={!canStage}
          onPress={stageRequest}
          style={[styles.primaryButton, !canStage && styles.primaryButtonDisabled]}
        >
          <MaterialCommunityIcons color={colors.actionText} name="shield-key-outline" size={21} />
          <Text style={styles.primaryButtonText}>Create local request</Text>
        </Pressable>

        {receipt ? (
          <Pressable accessibilityRole="button" onPress={resetRequest} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Clear local receipt</Text>
          </Pressable>
        ) : null}
      </Card>

      {receipt ? (
        <Card>
          <View style={styles.boundaryHeader}>
            <MaterialCommunityIcons
              color={colors.secondaryBright}
              name="receipt-text-outline"
              size={24}
            />
            <Text style={styles.sectionTitle}>Local request receipt</Text>
          </View>
          <View style={styles.receiptList}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Request ID</Text>
              <Text selectable style={styles.receiptValue}>
                {receipt.requestId}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Created</Text>
              <Text selectable style={styles.receiptValue}>
                {receipt.createdAt}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Machine</Text>
              <Text selectable style={styles.receiptValue}>
                {receipt.machineName}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>GitHub account</Text>
              <Text selectable style={styles.receiptValue}>
                {receipt.githubAccount}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Repository</Text>
              <Text selectable style={styles.receiptValue}>
                {receipt.repository}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>SSH alias</Text>
              <Text selectable style={styles.receiptValue}>
                {receipt.hostAlias}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Remote</Text>
              <Text selectable style={styles.receiptValue}>
                {receipt.remote}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Proof state</Text>
              <Text selectable style={styles.receiptValue}>
                {receipt.proofState}
              </Text>
            </View>
          </View>
          <Text style={styles.proofBoundary}>{receipt.proofBoundary}</Text>
        </Card>
      ) : null}

      {receipt ? (
        <Card>
          <Text style={styles.gateKicker}>One next move</Text>
          <Text style={styles.gateState}>CREATED — NOT DISPATCHED</Text>
          <View style={styles.gateRail}>
            <View style={styles.gateRow}>
              <Text style={styles.gateLabel}>Current owner</Text>
              <Text style={styles.gateValue}>Harvey</Text>
            </View>
            <View style={styles.gateRow}>
              <Text style={styles.gateLabel}>Next machine action</Text>
              <Text style={styles.gateValue}>
                Generate a dedicated machine key on {receipt.machineName} when a machine bridge
                exists.
              </Text>
            </View>
            <View style={styles.gateRow}>
              <Text style={styles.gateLabel}>Human gate</Text>
              <Text style={styles.gateValue}>None yet</Text>
            </View>
            <View style={styles.gateRow}>
              <Text style={styles.gateLabel}>Blocker</Text>
              <Text style={styles.gateBlocker}>Machine-agent bridge not connected</Text>
            </View>
          </View>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>Planned handoff</Text>
        <Text style={styles.sectionCaption}>
          Harvey prepares the mechanics and stops at human gates
        </Text>

        <View style={styles.stepList}>
          {sshOnboardingSteps.map((step, index) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepIndex}>
                <Text style={styles.stepIndexText}>{index + 1}</Text>
              </View>
              <View style={styles.stepBody}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepTitle}>{step.label}</Text>
                  <Text style={styles.stepOwner}>{step.owner}</Text>
                </View>
                <Text style={styles.stepDetail}>{step.detail}</Text>
                <Text style={styles.stepStatus}>{step.status.replace(/_/g, ' ')}</Text>
                <Text style={styles.stepProof}>Proof required: {step.proofRequired}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.boundaryHeader}>
          <MaterialCommunityIcons
            color={colors.secondaryBright}
            name="cloud-lock-outline"
            size={24}
          />
          <Text style={styles.sectionTitle}>Private-key boundary</Text>
        </View>
        <Text style={styles.boundaryText}>
          One machine gets one key. Private keys stay off GitHub, out of Harvey Mobile, and out of
          every cloud-synced folder.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  prototypeBanner: {
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14
  },
  prototypeCopy: { flex: 1 },
  prototypeTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  prototypeText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 16
  },
  cardHeaderCopy: { flex: 1 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  sectionCaption: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  statusBadge: {
    backgroundColor: colors.elevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  statusLabel: { color: colors.secondaryBright, fontSize: 12, fontWeight: '800' },
  inputLabel: { color: colors.ink, fontSize: 13, fontWeight: '800', marginBottom: 7 },
  input: {
    backgroundColor: colors.elevated,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12
  },
  inputLocked: { color: colors.muted },
  targetList: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 10,
    marginTop: 16,
    paddingTop: 14
  },
  targetRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  targetLabel: { color: colors.muted, fontSize: 13 },
  targetValue: {
    color: colors.ink,
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right'
  },
  createdNotice: {
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    padding: 12
  },
  createdNoticeCopy: { flex: 1 },
  createdNoticeTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  createdNoticeText: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 50,
    paddingHorizontal: 14
  },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: { color: colors.actionText, fontSize: 15, fontWeight: '800' },
  resetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 6
  },
  resetButtonText: { color: colors.secondaryBright, fontSize: 14, fontWeight: '800' },
  receiptList: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 10,
    marginTop: 14,
    paddingTop: 14
  },
  receiptRow: { gap: 4 },
  receiptLabel: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  receiptValue: {
    color: colors.ink,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18
  },
  proofBoundary: {
    backgroundColor: colors.elevated,
    borderRadius: 6,
    color: colors.warning,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 14,
    padding: 10
  },
  gateKicker: {
    color: colors.secondaryBright,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  gateState: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 4 },
  gateRail: {
    borderLeftColor: colors.secondary,
    borderLeftWidth: 3,
    gap: 13,
    marginTop: 16,
    paddingLeft: 14
  },
  gateRow: { gap: 3 },
  gateLabel: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  gateValue: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  gateBlocker: { color: colors.warning, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  stepList: { gap: 16, marginTop: 16 },
  stepRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  stepIndex: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    width: 30
  },
  stepIndexText: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  stepBody: { flex: 1 },
  stepTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between'
  },
  stepTitle: { color: colors.ink, flex: 1, fontSize: 15, fontWeight: '800' },
  stepOwner: {
    color: colors.secondaryBright,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  stepDetail: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  stepStatus: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 7
  },
  stepProof: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  boundaryHeader: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  boundaryText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8 }
});
