import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useExpenseStore, useCategoryStore } from '../store/stores';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme/theme';
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  addMonths, subMonths, eachDayOfInterval, isSameDay, isSameMonth,
  getDay, isToday,
} from 'date-fns';

const screenWidth = Dimensions.get('window').width;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { expenses, fetchExpenses, loading } = useExpenseStore();
  const { categories } = useCategoryStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const getCat = (expense) => {
    if (!categories) return null;
    return categories.find((c) =>
      c.id === expense.category_id ||
      c.name === expense.category_name
    );
  };

  useEffect(() => {
    if (user) fetchExpenses(user.id);
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user) await fetchExpenses(user.id);
    setRefreshing(false);
  }, [user]);

  // Build a set of date strings that have expenses for fast lookup
  const expenseDateSet = useMemo(() => {
    const set = new Set();
    expenses.forEach((e) => {
      set.add(format(new Date(e.date), 'yyyy-MM-dd'));
    });
    return set;
  }, [expenses]);

  // Calendar grid days (including leading days from previous month)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart); // Sunday
    const endDate = endOfWeek(monthEnd); // Saturday
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Expenses for the selected day
  const dayExpenses = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return expenses.filter(
      (e) => format(new Date(e.date), 'yyyy-MM-dd') === dateStr
    );
  }, [expenses, selectedDate]);

  // Week total for the week containing selectedDate
  const weekTotal = useMemo(() => {
    const ws = startOfWeek(selectedDate);
    const we = endOfWeek(selectedDate);
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d >= ws && d <= we;
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses, selectedDate]);

  // Month total for currentMonth
  const monthTotal = useMemo(() => {
    const ms = startOfMonth(currentMonth);
    const me = endOfMonth(currentMonth);
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d >= ms && d <= me;
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses, currentMonth]);

  const dayTotal = dayExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  const handlePrevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const handleNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));

  const handleDayPress = (day) => {
    setSelectedDate(day);
    if (!isSameMonth(day, currentMonth)) {
      setCurrentMonth(day);
    }
  };

  // ── Render helpers ────────────────────────────────────────────

  const renderDayCell = (day, index) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isSelected = isSameDay(day, selectedDate);
    const isTodayDate = isToday(day);
    const inMonth = isSameMonth(day, currentMonth);
    const hasExpense = expenseDateSet.has(dateStr);
    const cellSize = (screenWidth - Spacing.xl * 2 - Spacing.xl * 2) / 7;

    return (
      <TouchableOpacity
        key={index}
        style={[styles.dayCell, { width: cellSize, height: cellSize }]}
        onPress={() => handleDayPress(day)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.dayCellInner,
            isSelected && styles.dayCellSelected,
            isTodayDate && !isSelected && styles.dayCellToday,
          ]}
        >
          <Text
            style={[
              styles.dayText,
              !inMonth && styles.dayTextOutside,
              isDark && inMonth && { color: '#E5E7EB' },
              isDark && !inMonth && { color: 'rgba(255,255,255,0.25)' },
              isSelected && styles.dayTextSelected,
              isTodayDate && !isSelected && styles.dayTextToday,
            ]}
          >
            {format(day, 'd')}
          </Text>
          {hasExpense && !isSelected && (
            <View style={styles.expenseDot} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[isDark ? '#4C1D95' : '#8B5CF6', isDark ? '#0F0A1A' : '#F9FAFB']}
        locations={[0, 0.35]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <View style={styles.glassIcon}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={{ width: 48 }} />
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" progressViewOffset={60} />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Calendar Card */}
        <View style={styles.body}>
          <View style={[styles.section, isDark ? styles.glassDarkPanel : styles.glassLightPanel, Shadow.md]}>
            {/* Month Navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={handlePrevMonth} activeOpacity={0.7}>
                <View style={[styles.navButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(139,92,246,0.1)' }]}>
                  <Ionicons name="chevron-back" size={20} color={isDark ? '#A78BFA' : '#8B5CF6'} />
                </View>
              </TouchableOpacity>
              <Text style={[styles.monthLabel, isDark && { color: '#FFF' }]}>
                {format(currentMonth, 'MMMM yyyy')}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} activeOpacity={0.7}>
                <View style={[styles.navButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(139,92,246,0.1)' }]}>
                  <Ionicons name="chevron-forward" size={20} color={isDark ? '#A78BFA' : '#8B5CF6'} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Day-of-week headers */}
            <View style={styles.dayNamesRow}>
              {DAY_NAMES.map((name) => (
                <View key={name} style={styles.dayNameCell}>
                  <Text style={[styles.dayNameText, isDark && { color: '#9CA3AF' }]}>{name}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, i) => renderDayCell(day, i))}
            </View>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, isDark ? styles.glassDarkPanel : styles.glassLightPanel, Shadow.md]}>
              <View style={[styles.summaryIconWrap, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
              </View>
              <Text style={[styles.summaryLabel, isDark && { color: '#9CA3AF' }]}>Week Total</Text>
              <Text style={[styles.summaryAmount, isDark && { color: '#FFF' }]}>{formatCurrency(weekTotal)}</Text>
            </View>
            <View style={[styles.summaryCard, isDark ? styles.glassDarkPanel : styles.glassLightPanel, Shadow.md]}>
              <View style={[styles.summaryIconWrap, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
                <Ionicons name="calendar" size={20} color="#8B5CF6" />
              </View>
              <Text style={[styles.summaryLabel, isDark && { color: '#9CA3AF' }]}>Month Total</Text>
              <Text style={[styles.summaryAmount, isDark && { color: '#FFF' }]}>{formatCurrency(monthTotal)}</Text>
            </View>
          </View>

          {/* Daily Spend Section */}
          <View style={[styles.section, isDark ? styles.glassDarkPanel : styles.glassLightPanel, Shadow.md]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDark && { color: '#FFF' }]}>
                {format(selectedDate, 'MMMM d, yyyy')}
              </Text>
              {dayExpenses.length > 0 && (
                <View style={[styles.countBadge, { backgroundColor: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)' }]}>
                  <Text style={styles.countBadgeText}>{dayExpenses.length}</Text>
                </View>
              )}
            </View>

            {dayExpenses.length > 0 && (
              <View style={[styles.dayTotalRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                <Text style={[styles.dayTotalLabel, isDark && { color: '#9CA3AF' }]}>Day Total</Text>
                <Text style={[styles.dayTotalAmount, { color: '#F87171' }]}>-{formatCurrency(dayTotal)}</Text>
              </View>
            )}

            {dayExpenses.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }]}>
                  <Ionicons name="receipt" size={36} color={isDark ? '#A78BFA' : '#8B5CF6'} />
                </View>
                <Text style={[styles.emptyText, isDark && { color: '#9CA3AF' }]}>
                  No expenses on this day
                </Text>
              </View>
            ) : (
              dayExpenses.map((expense, i) => (
                <TouchableOpacity
                  key={expense.id || i}
                  style={[
                    styles.transactionRow,
                    i < dayExpenses.length - 1 && [
                      styles.transactionBorder,
                      isDark && { borderBottomColor: 'rgba(255,255,255,0.05)' },
                    ],
                  ]}
                  onPress={() => navigation.navigate('AddExpense', { expense })}
                >
                  <View style={[styles.transactionIcon, {
                    backgroundColor: (getCat(expense)?.color || colors.primary) + '20',
                  }]}>
                    <Ionicons
                      name={getCat(expense)?.icon || 'receipt-outline'}
                      size={20}
                      color={getCat(expense)?.color || colors.primary}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionCategory, isDark && { color: '#FFF' }]}>
                      {expense.categories?.name || expense.category_name || 'Expense'}
                    </Text>
                    <Text style={[styles.transactionDate, isDark && { color: '#9CA3AF' }]}>
                      {formatDate(expense.date)}{expense.note ? ` • ${expense.note}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.transactionAmount, { color: '#F87171' }]}>
                    -{formatCurrency(expense.amount)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header (matches BudgetScreen) ────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Spacing.md, paddingBottom: 30, paddingHorizontal: Spacing.xl,
  },
  backBtn: { borderRadius: 24 },
  glassIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },

  // ── Body ─────────────────────────────────────────────────────
  body: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },

  section: { marginBottom: Spacing.xl, borderRadius: 24, padding: Spacing.xl },
  glassLightPanel: { backgroundColor: '#FFF' },
  glassDarkPanel: { backgroundColor: 'rgba(31, 23, 53, 0.6)' },

  // ── Month navigation ────────────────────────────────────────
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  navButton: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 20, fontWeight: '800', color: '#111827',
  },

  // ── Day-of-week headers ─────────────────────────────────────
  dayNamesRow: {
    flexDirection: 'row', marginBottom: Spacing.xs,
  },
  dayNameCell: { flex: 1, alignItems: 'center' },
  dayNameText: {
    fontSize: FontSize.xs, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // ── Calendar grid ───────────────────────────────────────────
  calendarGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
  },
  dayCell: {
    alignItems: 'center', justifyContent: 'center',
  },
  dayCellInner: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: '#8B5CF6',
  },
  dayCellToday: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 2, borderColor: '#10B981',
  },
  dayText: {
    fontSize: FontSize.sm, fontWeight: '600', color: '#374151',
  },
  dayTextOutside: {
    color: '#D1D5DB',
  },
  dayTextSelected: {
    color: '#FFF', fontWeight: '800',
  },
  dayTextToday: {
    color: '#10B981', fontWeight: '800',
  },
  expenseDot: {
    position: 'absolute', bottom: 2,
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: '#EF4444',
  },

  // ── Summary cards ───────────────────────────────────────────
  summaryRow: {
    flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl,
  },
  summaryCard: {
    flex: 1, borderRadius: 24, padding: Spacing.lg, alignItems: 'center',
  },
  summaryIconWrap: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: FontSize.xs, fontWeight: '600', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20, fontWeight: '800', color: '#111827',
  },

  // ── Section header ──────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  countBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full,
  },
  countBadgeText: {
    fontSize: FontSize.xs, fontWeight: '800', color: '#8B5CF6',
  },

  // ── Day total row ───────────────────────────────────────────
  dayTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: Spacing.md, marginBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  dayTotalLabel: {
    fontSize: FontSize.sm, fontWeight: '600', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  dayTotalAmount: {
    fontSize: FontSize.lg, fontWeight: '800',
  },

  // ── Empty state ─────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyIconWrap: {
    width: 70, height: 70, borderRadius: 35,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  emptyText: { fontSize: 15, color: '#6B7280', textAlign: 'center', fontWeight: '500' },

  // ── Transaction rows (matches DashboardScreen) ──────────────
  transactionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, gap: Spacing.md,
  },
  transactionBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  transactionIcon: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  transactionInfo: { flex: 1 },
  transactionCategory: {
    fontSize: FontSize.md, fontWeight: '700', color: '#111827', marginBottom: 2,
  },
  transactionDate: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  transactionAmount: { fontSize: FontSize.md, fontWeight: '800' },
});
