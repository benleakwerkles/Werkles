import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { DuckScreen } from './src/screens/DuckScreen';
import { RoutesScreen } from './src/screens/RoutesScreen';
import { colors } from './src/theme';

type TabKey = 'dashboard' | 'duck' | 'routes';

const tabs: Array<{
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}> = [
  { key: 'dashboard', label: 'Ops', icon: 'view-dashboard-outline' },
  { key: 'duck', label: 'Duck', icon: 'duck' },
  { key: 'routes', label: 'Routes', icon: 'source-branch' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const CurrentScreen = useMemo(() => {
    if (activeTab === 'duck') {
      return <DuckScreen />;
    }

    if (activeTab === 'routes') {
      return <RoutesScreen />;
    }

    return <DashboardScreen />;
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Harvey Mobile</Text>
            <Text style={styles.title}>Bridge command</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Sandbox</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>{CurrentScreen}</ScrollView>

        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const selected = tab.key === activeTab;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabButton, selected && styles.tabButtonActive]}
              >
                <MaterialCommunityIcons
                  color={selected ? colors.ink : colors.muted}
                  name={tab.icon}
                  size={22}
                />
                <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.canvas
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14
  },
  kicker: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 2
  },
  statusPill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  statusDot: {
    backgroundColor: colors.success,
    borderRadius: 999,
    height: 8,
    width: 8
  },
  statusText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700'
  },
  content: {
    padding: 20,
    paddingBottom: 104
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    bottom: 18,
    flexDirection: 'row',
    gap: 8,
    left: 20,
    padding: 8,
    position: 'absolute',
    right: 20
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    gap: 4,
    minHeight: 56,
    justifyContent: 'center'
  },
  tabButtonActive: {
    backgroundColor: colors.accentSoft
  },
  tabLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  tabLabelActive: {
    color: colors.ink
  }
});
