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
    notes: 'AP Physics C - Report to Upper Cafe for study hall. Practice problem sets posted on Schoology.',
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
    notes: 'US History II - Upper Cafe study hall. Primary source readings on Schoology.',
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

const currentYear = new Date().getFullYear();
const copyrightNotice = currentYear === 2026 ? '© 2026 Kabir Sekhon' : `© 2026-${currentYear} Kabir Sekhon`;

export default function App() {
  const [absences, setAbsences] = useState<TeacherAbsence[]>(FALLBACK_ABSENCES);
  const [selectedPeriod, setSelectedPeriod] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherAbsence | null>(null);

  const fetchAbsencesData = useCallback(async () => {
    try {
      const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

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
      // offline fallback
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

  const filtered = absences.filter((item) => {
    const matchesPeriod = selectedPeriod === 'ALL' || item.periods.includes(selectedPeriod);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      item.teacherName.toLowerCase().includes(q) ||
      item.department.toLowerCase().includes(q) ||
      (item.room && item.room.toLowerCase().includes(q));
    return matchesPeriod && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Clean Light Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>BCA Upper Cafe</Text>
            <View style={styles.bcaTag}>
              <Text style={styles.bcaTagText}>Absences</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Daily Teacher Absence Directory</Text>
        </View>
      </View>

      {/* Notice Banner */}
      <View style={styles.noticeBanner}>
        <Text style={styles.noticeText}>
          Classes with absent teachers report to Upper Cafe. Note: check-in is done on laptops via{' '}
          <Text style={{ fontWeight: '700', color: '#0F172A' }}>app.bcaupper.cafe</Text>
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by teacher name or department..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Period Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.periodScroll}
        contentContainerStyle={styles.periodContent}
      >
        <TouchableOpacity
          style={[styles.periodPill, selectedPeriod === 'ALL' && styles.periodPillActive]}
          onPress={() => setSelectedPeriod('ALL')}
          activeOpacity={0.7}
        >
          <Text style={[styles.periodPillText, selectedPeriod === 'ALL' && styles.periodPillTextActive]}>
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
              <Text style={[styles.periodPillText, isActive && styles.periodPillTextActive]}>
                Period {p}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Absence Rows List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F172A" />
        }
      >
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderText}>
            {selectedPeriod === 'ALL' ? 'Today\'s Absences' : `Period ${selectedPeriod} Absences`}
          </Text>
          <Text style={styles.countText}>{filtered.length} Teachers</Text>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No absences found</Text>
            <Text style={styles.emptySubtitle}>No teachers matching this period or search.</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.rowCard}
              activeOpacity={0.7}
              onPress={() => setSelectedTeacher(item)}
            >
              <View style={styles.rowTop}>
                <Text style={styles.teacherName}>{item.teacherName}</Text>
                <View style={styles.periodBadge}>
                  <Text style={styles.periodBadgeText}>P{item.periods.join(', ')}</Text>
                </View>
              </View>

              <View style={styles.rowBottom}>
                <Text style={styles.departmentText}>{item.department}</Text>
                {item.room ? <Text style={styles.roomText}>{item.room}</Text> : null}
              </View>

              {item.notes ? (
                <Text style={styles.notesText} numberOfLines={1}>
                  {item.notes}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))
        )}

        <View style={styles.footerContainer}>
          <Text style={styles.copyrightText}>{copyrightNotice}</Text>
          <Text style={styles.schoolText}>Bergen County Academies</Text>
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedTeacher}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedTeacher(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTeacher && (
              <>
                <Text style={styles.modalTeacherName}>{selectedTeacher.teacherName}</Text>
                <Text style={styles.modalDepartment}>{selectedTeacher.department}</Text>

                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Periods Absent:</Text>
                  <Text style={styles.modalDetailValue}>
                    {selectedTeacher.periods.map((p) => `Period ${p}`).join(', ')}
                  </Text>
                </View>

                {selectedTeacher.room ? (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Classroom:</Text>
                    <Text style={styles.modalDetailValue}>{selectedTeacher.room}</Text>
                  </View>
                ) : null}

                <View style={styles.modalNotesBlock}>
                  <Text style={styles.modalNotesLabel}>Instructions</Text>
                  <Text style={styles.modalNotesValue}>
                    {selectedTeacher.notes || 'Report to Upper Cafe for independent study hall.'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedTeacher(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  bcaTag: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bcaTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  noticeBanner: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noticeText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchInput: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  periodScroll: {
    maxHeight: 44,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  periodContent: {
    gap: 6,
    paddingRight: 32,
  },
  periodPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  periodPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  periodPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  periodPillTextActive: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  countText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  rowCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teacherName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  periodBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  periodBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  departmentText: {
    fontSize: 12,
    color: '#64748B',
  },
  roomText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  notesText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  footerContainer: {
    marginTop: 24,
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  copyrightText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  schoolText: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTeacherName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalDepartment: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalDetailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  modalDetailValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  modalNotesBlock: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalNotesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  modalNotesValue: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  modalCloseBtn: {
    marginTop: 16,
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
