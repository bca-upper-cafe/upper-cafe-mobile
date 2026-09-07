import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

export interface MobileTeacherAbsence {
  id: string;
  pronoun: 'Mr.' | 'Ms.' | 'Mrs.' | 'Dr.';
  firstName: string;
  lastName: string;
  department: string;
  periods: string[];
  isAllDay: boolean;
  notes?: string;
  room?: string;
}

const DEFAULT_ABSENCES: MobileTeacherAbsence[] = [
  {
    id: 't-1',
    pronoun: 'Dr.',
    firstName: 'Robert',
    lastName: 'Degan',
    department: 'Mathematics',
    periods: ['1', 'IGS', '2', '3', '4', '5', '6', '7', '8', '9'],
    isAllDay: true,
    room: 'Room 214',
    notes: 'AP Calculus BC - Independent work in Upper Cafe.',
  },
  {
    id: 't-2',
    pronoun: 'Mr.',
    firstName: 'Scott',
    lastName: 'Langan',
    department: 'Science & Physics',
    periods: ['3', '4', '5'],
    isAllDay: false,
    room: 'Room 234',
    notes: 'Physics Honors - Practice problem sets on Schoology.',
  },
  {
    id: 't-3',
    pronoun: 'Ms.',
    firstName: 'Danielle',
    lastName: 'Esposito',
    department: 'Humanities & English',
    periods: ['4', '5', '6'],
    isAllDay: false,
    room: 'Room 118',
    notes: 'American Literature - Reading and thesis prep.',
  },
  {
    id: 't-4',
    pronoun: 'Mrs.',
    firstName: 'Kathleen',
    lastName: 'Giel',
    department: 'World Languages',
    periods: ['1', 'IGS', '2', '3', '4', '5', '6', '7', '8', '9'],
    isAllDay: true,
    room: 'Room 160',
    notes: 'Spanish III Honors - Upper Cafe study hall.',
  },
  {
    id: 't-5',
    pronoun: 'Mr.',
    firstName: 'David',
    lastName: 'Zhang',
    department: 'Computer Science',
    periods: ['7', '8', '9'],
    isAllDay: false,
    room: 'Room 170',
    notes: 'Data Structures - Continue project sprints in Upper Cafe.',
  },
];

const PERIOD_PILLS = ['All', '1', 'IGS', '2', '3', '4', '5', '6', '7', '8', '9'];

export default function App() {
  const [absences, setAbsences] = useState<MobileTeacherAbsence[]>(DEFAULT_ABSENCES);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentPeriod, setCurrentPeriod] = useState<string>('4');

  // Compute current period based on local device time
  useEffect(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Full day schedule rough period mapping
    if (totalMinutes >= 480 && totalMinutes < 523) setCurrentPeriod('1');
    else if (totalMinutes >= 527 && totalMinutes < 570) setCurrentPeriod('IGS');
    else if (totalMinutes >= 574 && totalMinutes < 617) setCurrentPeriod('2');
    else if (totalMinutes >= 621 && totalMinutes < 664) setCurrentPeriod('3');
    else if (totalMinutes >= 668 && totalMinutes < 711) setCurrentPeriod('4');
    else if (totalMinutes >= 715 && totalMinutes < 758) setCurrentPeriod('5');
    else if (totalMinutes >= 762 && totalMinutes < 805) setCurrentPeriod('6');
    else if (totalMinutes >= 809 && totalMinutes < 852) setCurrentPeriod('7');
    else if (totalMinutes >= 856 && totalMinutes < 899) setCurrentPeriod('8');
    else if (totalMinutes >= 903 && totalMinutes < 946) setCurrentPeriod('9');
    else setCurrentPeriod('4'); // Default school hours preview
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh or fetch from schedule server
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  // Filter teachers:
  // Teachers marked absent all day show under EVERY period!
  const filteredTeachers = useMemo(() => {
    return absences.filter((t) => {
      const fullName = `${t.pronoun} ${t.firstName} ${t.lastName}`.toLowerCase();
      const dept = t.department.toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch = fullName.includes(q) || dept.includes(q);
      if (!matchesSearch) return false;

      // Period filter
      if (selectedPeriod === 'All') return true;
      if (t.isAllDay) return true; // All-day teachers show under every period

      return t.periods.includes(selectedPeriod) || t.periods.includes('ALL_DAY');
    });
  }, [absences, selectedPeriod, searchQuery]);

  const currentYear = new Date().getFullYear();
  const yearDisplay = currentYear === 2026 ? '2026' : `2026 - ${currentYear}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brandTitle}>bcaupper.cafe</Text>
          <Text style={styles.brandSubtitle}>Teacher Attendance Directory</Text>
        </View>
        <View style={styles.currentPeriodBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.currentPeriodText}>Period {currentPeriod}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6355D8"
            colors={['#6355D8']}
          />
        }
      >
        {/* Period Filter Bar (Duolingo 3D Pills) */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionLabel}>FILTER BY PERIOD</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsContainer}
          >
            {PERIOD_PILLS.map((p) => {
              const isSelected = selectedPeriod === p;
              const isNow = currentPeriod === p;
              return (
                <TouchableOpacity
                  key={p}
                  activeOpacity={0.75}
                  onPress={() => setSelectedPeriod(p)}
                  style={[
                    styles.duoPill,
                    isSelected ? styles.duoPillActive : styles.duoPillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.duoPillText,
                      isSelected ? styles.duoPillTextActive : styles.duoPillTextInactive,
                    ]}
                  >
                    {p === 'All' ? 'All Day' : p === 'IGS' ? 'IGS' : `P${p}`}
                  </Text>
                  {isNow && p !== 'All' && (
                    <View style={styles.nowBadge}>
                      <Text style={styles.nowBadgeText}>NOW</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search teachers or departments..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Teacher Absence Count */}
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {selectedPeriod === 'All'
              ? `Showing all ${filteredTeachers.length} absent teachers today`
              : `Showing ${filteredTeachers.length} absent teachers for Period ${selectedPeriod}`}
          </Text>
        </View>

        {/* Absent Teachers List (Duolingo Cards) */}
        <View style={styles.cardList}>
          {filteredTeachers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="check-circle" size={36} color="#10B981" />
              <Text style={styles.emptyTitle}>No Teacher Absences</Text>
              <Text style={styles.emptySubtitle}>
                {selectedPeriod === 'All'
                  ? 'No teachers are logged as absent today.'
                  : `All teachers are present for Period ${selectedPeriod}.`}
              </Text>
            </View>
          ) : (
            filteredTeachers.map((t) => {
              const fullName = `${t.pronoun} ${t.firstName} ${t.lastName}`;
              return (
                <View key={t.id} style={styles.duoCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{t.lastName.charAt(0)}</Text>
                    </View>
                    <View style={styles.teacherInfo}>
                      <Text style={styles.teacherName}>{fullName}</Text>
                      <Text style={styles.teacherDept}>{t.department}</Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardFooter}>
                    <View style={styles.periodBadgeContainer}>
                      {t.isAllDay ? (
                        <View style={styles.allDayBadge}>
                          <Text style={styles.allDayText}>Absent All Day (P1–P9 + IGS)</Text>
                        </View>
                      ) : (
                        <View style={styles.periodBadge}>
                          <Text style={styles.periodBadgeText}>
                            Periods: {t.periods.join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>

                    {t.room ? (
                      <View style={styles.roomTag}>
                        <Feather name="map-pin" size={11} color="#6355D8" />
                        <Text style={styles.roomText}>{t.room}</Text>
                      </View>
                    ) : null}
                  </View>

                  {t.notes ? (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesText}>{t.notes}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built and maintained by Kabir Sekhon (ATCS &apos;30).
          </Text>
          <Text style={styles.footerSubtext}>
            &copy; {yearDisplay} Kabir Sekhon. All rights reserved.
          </Text>
          <Text style={styles.publisherText}>
            SAVERA CONTINENTAL LIMITED
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 1,
  },
  currentPeriodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  currentPeriodText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  filterSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666666',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  duoPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  duoPillActive: {
    backgroundColor: '#6355D8',
    borderColor: '#6355D8',
    borderBottomWidth: 4,
    borderBottomColor: '#4A36B8',
  },
  duoPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderBottomWidth: 4,
    borderBottomColor: '#D1D5DB',
  },
  duoPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  duoPillTextActive: {
    color: '#FFFFFF',
  },
  duoPillTextInactive: {
    color: '#4B5563',
  },
  nowBadge: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  nowBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111111',
    height: '100%',
  },
  summaryBar: {
    marginBottom: 14,
  },
  summaryText: {
    fontSize: 12,
    color: '#666666',
  },
  cardList: {
    gap: 12,
  },
  duoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderBottomWidth: 4,
    borderBottomColor: '#D1D5DB',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F4F2FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6355D8',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },
  teacherDept: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodBadgeContainer: {
    flex: 1,
  },
  allDayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  allDayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6355D8',
  },
  periodBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  periodBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  roomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roomText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6355D8',
  },
  notesContainer: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
  },
  notesText: {
    fontSize: 11,
    color: '#666666',
    lineHeight: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  footer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#666666',
  },
  footerSubtext: {
    fontSize: 10,
    color: '#888888',
  },
  publisherText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#AAAAAA',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
