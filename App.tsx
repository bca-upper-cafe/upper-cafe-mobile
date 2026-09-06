import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TeacherAbsence {
  id: string;
  teacherName: string;
  department: string;
  date: string;
  periods: number[];
  room?: string;
  notes?: string;
}

const FALLBACK_ABSENCES: TeacherAbsence[] = [
  {
    id: 'abs-1',
    teacherName: 'Dr. Robert DeFalco',
    department: 'Science & Physics',
    date: '2026-09-06',
    periods: [2, 3, 7],
    room: 'Room 234',
    notes: 'AP Physics C - Report to Upper Cafe for independent study hall. Practice problem sets posted on Schoology.',
  },
  {
    id: 'abs-2',
    teacherName: 'Ms. Elena Respass',
    department: 'Mathematics',
    date: '2026-09-06',
    periods: [4, 5],
    room: 'Room 118',
    notes: 'Pre-Calculus Honors - Upper Cafe study hall coverage. Review chapter 4 unit notes.',
  },
  {
    id: 'abs-3',
    teacherName: 'Mr. David Zhang',
    department: 'Computer Science & ATCS',
    date: '2026-09-06',
    periods: [1, 8, 9],
    room: 'Room 160',
    notes: 'Data Structures & Algorithms - Work on lab project repository in Upper Cafe.',
  },
  {
    id: 'abs-4',
    teacherName: 'Dr. Janice Kaplan',
    department: 'Humanities & History',
    date: '2026-09-06',
    periods: [6, 7],
    room: 'Room 205',
    notes: 'US History II - Upper Cafe study hall. Readings on primary source documents on Schoology.',
  },
  {
    id: 'abs-5',
    teacherName: 'Mr. John Pinyan',
    department: 'Mathematics',
    date: '2026-09-06',
    periods: [3, 4],
    room: 'Room 122',
    notes: 'Multivariable Calculus - Upper Cafe study hall. Work on problem set 3.',
  },
];

const GOLD = '#C5B358';
const GOLD_LIGHT = '#E5D68A';
const GOLD_DARK = '#7A6B25';
const DARK_BG = '#0B0E14';
const CARD_BG = '#151B23';
const CARD_BORDER = '#262F3D';
const TEXT_PRIMARY = '#F0F6FC';
const TEXT_MUTED = '#8B949E';

export default function App() {
  const [absences, setAbsences] = useState<TeacherAbsence[]>(FALLBACK_ABSENCES);
  const [selectedPeriod, setSelectedPeriod] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherAbsence | null>(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const fetchAbsencesData = useCallback(async () => {
    try {
      // In iOS simulator / emulator, localhost or 10.0.2.2 can be used
      const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`http://${host}:4000/api/absences`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setAbsences(json.data);
        }
      }
    } catch (_err) {
      // Offline fallback: keep fallback absences
    }
  }, []);

  useEffect(() => {
    fetchAbsencesData();
  }, [fetchAbsencesData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAbsencesData();
    setRefreshing(false);
  }, [fetchAbsencesData]);

  // Filter absences by period and search text
  const filtered = absences.filter((item) => {
    const matchesPeriod = selectedPeriod === 'ALL' || item.periods.includes(selectedPeriod);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      item.teacherName.toLowerCase().includes(q) ||
      item.department.toLowerCase().includes(q) ||
      (item.room && item.room.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q));
    return matchesPeriod && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />

      {/* Apple-style Navigation Bar */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>BCA</Text>
          </View>
          <View>
            <Text style={styles.navTitle}>Upper Cafe</Text>
            <Text style={styles.navSubtitle}>Teacher Absence Board</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setInfoModalVisible(true)}
          style={styles.infoButton}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle-outline" size={24} color={GOLD} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={GOLD}
            colors={[GOLD]}
          />
        }
      >
        {/* Notion / Google Doc style Callout Banner */}
        <View style={styles.notionCallout}>
          <Text style={styles.notionCalloutEmoji}>💡</Text>
          <View style={styles.notionCalloutContent}>
            <Text style={styles.notionCalloutTitle}>Daily Attendance Policy</Text>
            <Text style={styles.notionCalloutText}>
              Teacher absent? Report directly to Upper Cafe for study hall. Please note that mobile check-in is disabled — use{' '}
              <Text style={{ color: GOLD, fontWeight: '700' }}>app.bcaupper.cafe</Text> on your laptop or the kiosk terminal.
            </Text>
          </View>
        </View>

        {/* Search Bar with Apple Glass feel */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={17} color={TEXT_MUTED} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search teacher, subject, room..."
            placeholderTextColor={TEXT_MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && Platform.OS === 'android' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={TEXT_MUTED} />
            </TouchableOpacity>
          )}
        </View>

        {/* Period Filter Segmented Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.periodScroll}
          contentContainerStyle={styles.periodContent}
        >
          <TouchableOpacity
            style={[
              styles.periodPill,
              selectedPeriod === 'ALL' && styles.periodPillActive,
            ]}
            onPress={() => setSelectedPeriod('ALL')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.periodPillText,
                selectedPeriod === 'ALL' && styles.periodPillTextActive,
              ]}
            >
              All Periods
            </Text>
          </TouchableOpacity>

          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => {
            const isActive = selectedPeriod === p;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.periodPill, isActive && styles.periodPillActive]}
                onPress={() => setSelectedPeriod(p)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.periodPillText,
                    isActive && styles.periodPillTextActive,
                  ]}
                >
                  Period {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>
            {selectedPeriod === 'ALL' ? 'All Absences Today' : `Period ${selectedPeriod} Absences`}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filtered.length} Teachers</Text>
          </View>
        </View>

        {/* Absences List - Notion / Google Doc Card Format */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={TEXT_MUTED} />
            <Text style={styles.emptyStateTitle}>No Absences Listed</Text>
            <Text style={styles.emptyStateText}>
              All teachers are present or no classes are covered in Upper Cafe for this filter.
            </Text>
          </View>
        ) : (
          filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => setSelectedTeacher(item)}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teacherName}>{item.teacherName}</Text>
                  <Text style={styles.departmentName}>{item.department}</Text>
                </View>

                {item.room ? (
                  <View style={styles.roomBadge}>
                    <Ionicons name="location-outline" size={12} color={GOLD_LIGHT} />
                    <Text style={styles.roomText}>{item.room}</Text>
                  </View>
                ) : null}
              </View>

              {/* Period tags in Vegas Gold */}
              <View style={styles.periodBadgesRow}>
                {item.periods.map((p) => (
                  <View key={p} style={styles.periodTag}>
                    <Text style={styles.periodTagText}>Period {p}</Text>
                  </View>
                ))}
              </View>

              {/* Notes preview */}
              {item.notes ? (
                <View style={styles.cardNotesBox}>
                  <Text style={styles.cardNotesText} numberOfLines={2}>
                    {item.notes}
                  </Text>
                </View>
              ) : null}

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>Report to Upper Cafe</Text>
                <View style={styles.viewDetailsRow}>
                  <Text style={styles.viewDetailsText}>Details</Text>
                  <Ionicons name="chevron-forward" size={14} color={GOLD} />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Teacher Detail Sheet / Modal */}
      <Modal
        visible={!!selectedTeacher}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTeacher(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalDragHandle} />

            {selectedTeacher && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedTeacher.teacherName}</Text>
                  <Text style={styles.modalSubtitle}>{selectedTeacher.department}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>AFFECTED PERIODS</Text>
                  <View style={styles.periodBadgesRow}>
                    {selectedTeacher.periods.map((p) => (
                      <View key={p} style={styles.modalPeriodTag}>
                        <Text style={styles.modalPeriodTagText}>Period {p}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {selectedTeacher.room && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionLabel}>CLASSROOM</Text>
                    <Text style={styles.modalValueText}>{selectedTeacher.room}</Text>
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>COVERAGE & INSTRUCTIONS</Text>
                  <View style={styles.modalNotesBox}>
                    <Text style={styles.modalNotesText}>
                      {selectedTeacher.notes || 'Report to Upper Cafe for independent study hall.'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalFooterNotice}>
                  <Ionicons name="laptop-outline" size={16} color={GOLD} />
                  <Text style={styles.modalFooterNoticeText}>
                    Check in on your laptop via app.bcaupper.cafe upon entering Upper Cafe.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedTeacher(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCloseButtonText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Info & Policy Modal */}
      <Modal
        visible={infoModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: 420 }]}>
            <View style={styles.modalDragHandle} />
            <Text style={styles.modalTitle}>About Upper Cafe Mobile</Text>
            <Text style={[styles.notionCalloutText, { marginTop: 12, lineHeight: 22 }]}>
              This mobile application is built specifically for BCA students to view daily teacher absences with ease, eliminating confusing paper boards and messy Google Docs.
            </Text>

            <View style={[styles.notionCallout, { marginTop: 16 }]}>
              <Text style={styles.notionCalloutEmoji}>📌</Text>
              <View style={styles.notionCalloutContent}>
                <Text style={styles.notionCalloutTitle}>Why No Mobile Check-In?</Text>
                <Text style={styles.notionCalloutText}>
                  Per Bergen County Academies attendance rules, study hall check-ins require kiosk or in-room laptop verification via app.bcaupper.cafe.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalCloseButton, { marginTop: 24 }]}
              onPress={() => setInfoModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2633',
    backgroundColor: DARK_BG,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    backgroundColor: GOLD,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logoBadgeText: {
    color: DARK_BG,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },
  navSubtitle: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  infoButton: {
    padding: 6,
  },
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  notionCallout: {
    flexDirection: 'row',
    backgroundColor: '#12171F',
    borderWidth: 1,
    borderColor: '#262F3D',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  notionCalloutEmoji: {
    fontSize: 18,
    marginTop: 1,
  },
  notionCalloutContent: {
    flex: 1,
  },
  notionCalloutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  notionCalloutText: {
    fontSize: 11,
    color: TEXT_MUTED,
    lineHeight: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 13,
    paddingVertical: 0,
  },
  periodScroll: {
    marginBottom: 16,
  },
  periodContent: {
    gap: 8,
  },
  periodPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  periodPillActive: {
    backgroundColor: GOLD,
    borderColor: GOLD_DARK,
  },
  periodPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  periodPillTextActive: {
    color: DARK_BG,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  countBadge: {
    backgroundColor: '#1E2530',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD,
  },
  card: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.2,
  },
  departmentName: {
    fontSize: 12,
    color: GOLD,
    fontWeight: '600',
    marginTop: 2,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E131A',
    borderWidth: 1,
    borderColor: '#262F3D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  roomText: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  periodBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  periodTag: {
    backgroundColor: '#1F2633',
    borderWidth: 1,
    borderColor: '#364254',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  periodTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD_LIGHT,
  },
  cardNotesBox: {
    backgroundColor: '#0E131A',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  cardNotesText: {
    fontSize: 11,
    color: TEXT_MUTED,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1F2633',
  },
  cardFooterText: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 12,
    color: GOLD,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: '#10141C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2633',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#151B23',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#2C3442',
    padding: 20,
    paddingBottom: 36,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#30363D',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: GOLD,
    marginTop: 2,
  },
  modalSection: {
    marginBottom: 14,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: TEXT_MUTED,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalPeriodTag: {
    backgroundColor: GOLD,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  modalPeriodTagText: {
    color: DARK_BG,
    fontWeight: '800',
    fontSize: 12,
  },
  modalValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  modalNotesBox: {
    backgroundColor: '#0B0E14',
    borderWidth: 1,
    borderColor: '#262F3D',
    borderRadius: 12,
    padding: 12,
  },
  modalNotesText: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    lineHeight: 18,
  },
  modalFooterNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10151E',
    borderWidth: 1,
    borderColor: '#262F3D',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  modalFooterNoticeText: {
    fontSize: 11,
    color: TEXT_MUTED,
    flex: 1,
  },
  modalCloseButton: {
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: DARK_BG,
    fontWeight: '800',
    fontSize: 15,
  },
});
