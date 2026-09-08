import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TeacherAbsence {
  id: string;
  pronoun: 'Mr.' | 'Ms.' | 'Mrs.' | 'Dr.';
  firstName: string;
  lastName: string;
  department: string;
  periods: string[];
  isAllDay: boolean;
}

const DEFAULT_ABSENCES: TeacherAbsence[] = [
  {
    id: '1',
    pronoun: 'Dr.',
    firstName: 'Robert',
    lastName: 'Degan',
    department: 'Mathematics',
    periods: ['1', 'IGS', '2', '3', '4', '5', '6', '7', '8', '9'],
    isAllDay: true,
  },
  {
    id: '2',
    pronoun: 'Mr.',
    firstName: 'Scott',
    lastName: 'Langan',
    department: 'Science',
    periods: ['3', '4', '5'],
    isAllDay: false,
  },
  {
    id: '3',
    pronoun: 'Ms.',
    firstName: 'Danielle',
    lastName: 'Esposito',
    department: 'Humanities',
    periods: ['4', '5', '6'],
    isAllDay: false,
  },
  {
    id: '4',
    pronoun: 'Mrs.',
    firstName: 'Kathleen',
    lastName: 'Giel',
    department: 'World Languages',
    periods: ['1', 'IGS', '2', '3', '4', '5', '6', '7', '8', '9'],
    isAllDay: true,
  },
  {
    id: '5',
    pronoun: 'Mr.',
    firstName: 'David',
    lastName: 'Zhang',
    department: 'Computer Science',
    periods: ['7', '8', '9'],
    isAllDay: false,
  },
];

const PERIOD_PILLS = ['All', '1', 'IGS', '2', '3', '4', '5', '6', '7', '8', '9'];

interface ScheduleStatus {
  hasSchool: boolean;
  status: 'no_school' | 'not_started' | 'in_session' | 'ended';
  period: string | null;
  message: string;
  date: string;
  time: string;
}

function calculateScheduleStatus(now: Date = new Date()): ScheduleStatus {
  const day = now.getDay();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()}`;
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const currentSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  if (day === 0 || day === 6) {
    return {
      hasSchool: false,
      status: 'no_school',
      period: null,
      message: 'No school scheduled today (weekend).',
      date: dateStr,
      time: timeStr,
    };
  }

  const schoolStart = 8 * 3600; // 08:00
  const schoolEnd = 15 * 3600 + 46 * 60; // 15:46

  if (currentSec < schoolStart) {
    return {
      hasSchool: true,
      status: 'not_started',
      period: null,
      message: 'School has not started yet today. Period 1 begins at 8:00 AM.',
      date: dateStr,
      time: timeStr,
    };
  }

  if (currentSec > schoolEnd) {
    return {
      hasSchool: true,
      status: 'ended',
      period: null,
      message: 'School has concluded for today.',
      date: dateStr,
      time: timeStr,
    };
  }

  // Periods: 1 (08:00-08:43), IGS (08:47-09:30), 2 (09:34-10:17), 3 (10:21-11:04), 4 (11:08-11:51),
  // 5 (11:55-12:38), 6 (12:42-13:25), 7 (13:29-14:12), 8 (14:16-14:59), 9 (15:03-15:46)
  const periods = [
    { p: '1', start: 8 * 3600, end: 8 * 3600 + 43 * 60 },
    { p: 'IGS', start: 8 * 3600 + 47 * 60, end: 9 * 3600 + 30 * 60 },
    { p: '2', start: 9 * 3600 + 34 * 60, end: 10 * 3600 + 17 * 60 },
    { p: '3', start: 10 * 3600 + 21 * 60, end: 11 * 3600 + 4 * 60 },
    { p: '4', start: 11 * 3600 + 8 * 60, end: 11 * 3600 + 51 * 60 },
    { p: '5', start: 11 * 3600 + 55 * 60, end: 12 * 3600 + 38 * 60 },
    { p: '6', start: 12 * 3600 + 42 * 60, end: 13 * 3600 + 25 * 60 },
    { p: '7', start: 13 * 3600 + 29 * 60, end: 14 * 3600 + 12 * 60 },
    { p: '8', start: 14 * 3600 + 16 * 60, end: 14 * 3600 + 59 * 60 },
    { p: '9', start: 15 * 3600 + 3 * 60, end: 15 * 3600 + 46 * 60 },
  ];

  for (const item of periods) {
    if (currentSec >= item.start && currentSec <= item.end) {
      return {
        hasSchool: true,
        status: 'in_session',
        period: item.p,
        message: `Currently Period ${item.p}`,
        date: dateStr,
        time: timeStr,
      };
    }
  }

  return {
    hasSchool: true,
    status: 'in_session',
    period: 'Passing',
    message: 'Passing Period',
    date: dateStr,
    time: timeStr,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'settings'>('attendance');
  const [absences, setAbsences] = useState<TeacherAbsence[]>(DEFAULT_ABSENCES);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus>(() => calculateScheduleStatus());

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setScheduleStatus(calculateScheduleStatus());
    setTimeout(() => {
      setRefreshing(false);
    }, 400);
  }, []);

  const filteredAbsences = useMemo(() => {
    return absences.filter((t) => {
      const fullName = `${t.pronoun} ${t.firstName} ${t.lastName}`.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || fullName.includes(q);
      if (!matchesSearch) return false;

      if (selectedPeriod === 'All') return true;
      if (t.isAllDay) return true;

      return t.periods.includes(selectedPeriod) || t.periods.includes('ALL_DAY');
    });
  }, [absences, selectedPeriod, searchQuery]);

  const currentYear = new Date().getFullYear();
  const yearDisplay = currentYear === 2026 ? '2026' : `2026 - ${currentYear}`;

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {activeTab === 'attendance' ? (
        /* ========================================================================= */
        /* TAB 1: TEACHER ATTENDANCE (Identical to Web Teacher Attendance Page)       */
        /* ========================================================================= */
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Teacher Attendance</Text>
            <Text style={styles.headerSubtitle}>
              {scheduleStatus.status === 'in_session' && scheduleStatus.period
                ? `Currently Period ${scheduleStatus.period} · Live list of absent teachers.`
                : 'Live list of absent teachers.'}
            </Text>
          </View>

          {scheduleStatus.status !== 'in_session' ? (
            /* Out of session: replace content entirely, no status badges or clutter */
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.outOfSessionContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#111111"
                />
              }
            >
              <Text style={styles.outOfSessionTitle}>School is not currently in session</Text>
              <Text style={styles.outOfSessionSubtitle}>{scheduleStatus.message}</Text>
              <Text style={styles.outOfSessionFootnote}>
                Teacher attendance updates resume during regular school hours.
              </Text>
            </ScrollView>
          ) : (
            <>
              {/* Search Bar matching web app */}
              <View style={styles.searchContainer}>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search teachers..."
                  placeholderTextColor="#999999"
                  style={styles.searchInput}
                  clearButtonMode="while-editing"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Period Filter Tabs (Underline indicator matching web app) */}
              <View style={styles.tabsStrip}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tabsScroll}
                >
                  {PERIOD_PILLS.map((p) => {
                    const isSelected = selectedPeriod === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setSelectedPeriod(p)}
                        activeOpacity={0.7}
                        style={[
                          styles.periodTab,
                          isSelected && styles.periodTabSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.periodTabText,
                            isSelected && styles.periodTabTextSelected,
                          ]}
                        >
                          {p === 'All' ? 'All' : p === 'IGS' ? 'IGS' : `P${p}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Teacher List matching web app rows */}
              <ScrollView
                style={styles.list}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#111111"
                  />
                }
              >
                {filteredAbsences.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No absent teachers reported.</Text>
                  </View>
                ) : (
                  filteredAbsences.map((t) => {
                    const fullName = `${t.pronoun} ${t.firstName} ${t.lastName}`;
                    const badgeText = t.isAllDay ? 'All Day' : `P${t.periods.join(', ')}`;

                    return (
                      <View key={t.id} style={styles.teacherRow}>
                        <View style={styles.teacherInfo}>
                          <Text style={styles.teacherName}>{fullName}</Text>
                        </View>

                        <Text style={styles.periodText}>{badgeText}</Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </>
          )}
        </View>
      ) : (
        /* ========================================================================= */
        /* TAB 2: SETTINGS & LEGAL SCREEN                                            */
        /* ========================================================================= */
        <ScrollView style={styles.settingsContainer} contentContainerStyle={styles.settingsContent}>
          <View style={styles.settingsHeader}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>App information and policies.</Text>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionHeader}>APPLICATION</Text>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Name</Text>
              <Text style={styles.settingsValue}>bcaupper.cafe</Text>
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Version</Text>
              <Text style={styles.settingsValue}>1.0.0</Text>
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionHeader}>PRIVACY</Text>
            <View style={styles.settingsBlock}>
              <Text style={styles.settingsBody}>
                bcaupper.cafe is designed with a strict privacy-first architecture. It collects no personal data, requires no account, and tracks no user telemetry.
              </Text>
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionHeader}>LEGAL POLICIES</Text>
            <TouchableOpacity
              onPress={() => openUrl('https://bcaupper.cafe/terms')}
              style={styles.settingsClickableRow}
            >
              <Text style={styles.settingsClickableText}>Terms of Service</Text>
              <Ionicons name="open-outline" size={16} color="#666666" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openUrl('https://bcaupper.cafe/privacy')}
              style={styles.settingsClickableRow}
            >
              <Text style={styles.settingsClickableText}>Privacy Policy</Text>
              <Ionicons name="open-outline" size={16} color="#666666" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openUrl('mailto:kabsek30@bergen.org')}
              style={styles.settingsClickableRow}
            >
              <Text style={styles.settingsClickableText}>Contact &amp; Support</Text>
              <Ionicons name="mail-outline" size={16} color="#666666" />
            </TouchableOpacity>
          </View>

          {/* Credits & Publisher strictly in Settings */}
          <View style={styles.settingsFooter}>
            <Text style={styles.creditsText}>
              Built and maintained by Kabir Sekhon (ATCS &apos;30).
            </Text>
            <Text style={styles.copyrightText}>
              &copy; {yearDisplay} Kabir Sekhon. All rights reserved.
            </Text>
            <Text style={styles.publisherText}>
              Published by SAVERA CONTINENTAL LIMITED.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM TAB BAR: 2 TABS, ICONS ONLY (NO TEXT)                              */}
      {/* ========================================================================= */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('attendance')}
          style={styles.tabItem}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'attendance' ? 'list' : 'list-outline'}
            size={24}
            color={activeTab === 'attendance' ? '#111111' : '#8E8E93'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('settings')}
          style={styles.tabItem}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
            size={24}
            color={activeTab === 'settings' ? '#111111' : '#8E8E93'}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  outOfSessionContainer: {
    paddingVertical: 80,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  outOfSessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 8,
  },
  outOfSessionSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  outOfSessionFootnote: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#111111',
  },
  tabsStrip: {
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  tabsScroll: {
    paddingHorizontal: 20,
    gap: 4,
  },
  periodTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  periodTabSelected: {
    borderBottomColor: '#111111',
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
  periodTabTextSelected: {
    color: '#111111',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAEAEA',
    backgroundColor: '#FFFFFF',
  },
  teacherInfo: {
    flex: 1,
    paddingRight: 12,
  },
  teacherName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
  },
  teacherDept: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  // Tab Bar Styles (Icons only, no text)
  tabBar: {
    flexDirection: 'row',
    height: 52,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Settings Screen Styles
  settingsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  settingsContent: {
    paddingBottom: 30,
  },
  settingsHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  settingsSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAEAEA',
  },
  settingsClickableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAEAEA',
  },
  settingsLabel: {
    fontSize: 14,
    color: '#111111',
  },
  settingsValue: {
    fontSize: 14,
    color: '#666666',
  },
  settingsClickableText: {
    fontSize: 14,
    color: '#111111',
    textDecorationLine: 'underline',
  },
  settingsBlock: {
    paddingVertical: 6,
  },
  settingsBody: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  settingsFooter: {
    marginTop: 36,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 4,
  },
  creditsText: {
    fontSize: 12,
    color: '#666666',
  },
  copyrightText: {
    fontSize: 11,
    color: '#888888',
  },
  publisherText: {
    fontSize: 10,
    color: '#AAAAAA',
    marginTop: 2,
  },
});
