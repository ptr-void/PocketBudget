import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, StatusBar, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useExpenseStore, useBudgetStore, useCategoryStore, useProfileStore } from '../store/stores';
import { formatCurrency, formatDate, getLast7DaysSpending, getSpendingByCategory } from '../utils/helpers';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme/theme';
import QuickAddModal from '../components/QuickAddModal';
import AITipCard from '../components/AITipCard';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { expenses, fetchExpenses, getTotal, loading } = useExpenseStore();
  const { budgets, fetchBudgets } = useBudgetStore();
  const { profile, fetchProfile, updateWalletBalance } = useProfileStore();
  const { categories } = useCategoryStore();

  const getCat = (expense) => {
    if (!categories) return null;
    return categories.find((c) =>
      c.id === expense.category_id ||
      c.name === expense.category_name
    );
  };
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('monthly');
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [editWallet, setEditWallet] = useState(false);
  const [walletInput, setWalletInput] = useState('');

  useEffect(() => {
    if (user) {
      fetchExpenses(user.id);
      fetchBudgets(user.id);
      fetchProfile(user.id);
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user) {
      await Promise.all([fetchExpenses(user.id), fetchBudgets(user.id), fetchProfile(user.id)]);
    }
    setRefreshing(false);
  }, [user]);

  const handleSaveWallet = async () => {
    const val = parseFloat(walletInput);
    if (!isNaN(val)) await updateWalletBalance(user?.id, val);
    setEditWallet(false);
  };

  const totalSpent = period === 'all-time' ? expenses.reduce((s, e) => s + (e.amount || 0), 0) : getTotal(period);
  const budget = budgets[period] || 0;
  const remaining = budget - totalSpent;
  const progress = budget > 0 ? Math.min(totalSpent / budget, 1) : 0;
  const isOverBudget = remaining < 0;
  const isNearBudget = progress > 0.8 && !isOverBudget;

  const last7Days = getLast7DaysSpending(expenses);
  const chartData = {
    labels: last7Days.map((d) => d.label.substring(0, 3)),
    datasets: [{ data: last7Days.map((d) => d.total || 0.01), strokeWidth: 4 }],
  };

  const topCategories = getSpendingByCategory(expenses).slice(0, 4);
  const recentExpenses = expenses.slice(0, 5);

  const periods = ['daily', 'weekly', 'monthly', 'all-time'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[isDark ? '#4C1D95' : '#8B5CF6', isDark ? '#0F0A1A' : '#F9FAFB']}
        locations={[0, 0.4]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" progressViewOffset={20} />
          }
        >
        <View style={styles.headerBg}>
          <View style={styles.headerContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.logoContainer, Shadow.md]}>
                <LinearGradient colors={['#A78BFA', '#7C3AED']} style={styles.logoGradient}>
                  <Ionicons name="wallet" size={24} color="#FFF" />
                </LinearGradient>
              </View>
              <View>
                <Text style={styles.greeting}>Go get 'em,</Text>
                <Text style={styles.userName}>{user?.user_metadata?.full_name?.split(' ')[0] || 'User'}!</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={styles.budgetButton}
                onPress={() => navigation.navigate('Calendar')}
              >
                <View style={styles.glassButton}>
                  <Ionicons name="calendar-outline" size={22} color="#FFF" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.budgetButton}
                onPress={() => navigation.navigate('AIInsights')}
              >
                <View style={styles.glassButton}>
                  <Ionicons name="sparkles" size={22} color="#FFF" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.budgetButton}
                onPress={() => navigation.navigate('Budget')}
              >
                <View style={styles.glassButton}>
                  <Ionicons name="settings-outline" size={24} color="#FFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.periodRow}
            contentContainerStyle={{ gap: Spacing.sm, paddingRight: Spacing.xl }}
          >
            {periods.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodChip, period === p && styles.periodChipActive, Shadow.sm]}
                onPress={() => setPeriod(p)}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                  {p === 'all-time' ? 'All-Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={[styles.totalCard, isDark ? styles.glassDark : styles.glassLight, Shadow.xl]}>
            <View style={styles.totalCardHeader}>
              <Text style={[styles.totalLabel, isDark && { color: '#E5E7EB' }]}>Total Spent</Text>
              <View style={[styles.trendBadge, isOverBudget && { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <Ionicons name={isOverBudget ? "trending-up" : "trending-down"} size={14} color={isOverBudget ? "#EF4444" : "#10B981"} />
                <Text style={[styles.trendText, isOverBudget && { color: '#EF4444' }]}>
                  {isOverBudget ? 'Over' : 'On Track'}
                </Text>
              </View>
            </View>
            <Text style={[styles.totalAmount, isDark && { color: '#FFF' }]}>{formatCurrency(totalSpent)}</Text>

            {budget > 0 ? (
              <>
                <View style={styles.budgetRow}>
                  <Text style={[styles.budgetLabel, isDark && { color: '#9CA3AF' }]}>
                    Budget: {formatCurrency(budget)}
                  </Text>
                  <Text style={[
                    styles.budgetRemaining,
                    { color: isOverBudget ? '#F87171' : isNearBudget ? '#FBBF24' : '#10B981' },
                  ]}>
                    {isOverBudget ? 'Over by ' : 'Left: '}
                    {formatCurrency(Math.abs(remaining))}
                  </Text>
                </View>
                <View style={[styles.progressBar, isDark ? { backgroundColor: 'rgba(255,255,255,0.1)' } : { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
                  <View style={{ width: '100%' }}>
                    <LinearGradient
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      colors={
                        isOverBudget ? ['#F87171', '#EF4444'] :
                          isNearBudget ? ['#FBBF24', '#F59E0B'] :
                            ['#34D399', '#10B981']
                      }
                      style={[styles.progressFill, { width: `${progress * 100}%` }]}
                    />
                  </View>
                </View>
              </>
            ) : (
              <TouchableOpacity onPress={() => navigation.navigate('Budget')} style={{ marginTop: 10 }}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Tap to set a {period} budget</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.section, isDark ? styles.glassDarkPanel : styles.glassLightPanel, Shadow.md]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#9CA3AF' : '#6B7280' }}>My Wallet</Text>
              {!editWallet && (
                <TouchableOpacity onPress={() => { setWalletInput(String(profile.wallet_balance || '')); setEditWallet(true); }}>
                  <Ionicons name="create-outline" size={18} color="#8B5CF6" />
                </TouchableOpacity>
              )}
            </View>
            {editWallet ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#8B5CF6' }}>₱</Text>
                <TextInput
                  value={walletInput}
                  onChangeText={setWalletInput}
                  keyboardType="decimal-pad"
                  autoFocus
                  style={{ flex: 1, fontSize: 28, fontWeight: '800', color: isDark ? '#FFF' : '#111827', borderBottomWidth: 2, borderBottomColor: '#8B5CF6' }}
                  onSubmitEditing={handleSaveWallet}
                />
                <TouchableOpacity onPress={() => setEditWallet(false)} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6', borderRadius: 12, padding: 8 }}>
                  <Ionicons name="close" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveWallet} style={{ backgroundColor: '#8B5CF6', borderRadius: 12, padding: 8 }}>
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ fontSize: 32, fontWeight: '800', color: isDark ? '#FFF' : '#111827', letterSpacing: -0.5 }}>{formatCurrency(profile.wallet_balance || 0)}</Text>
            )}
          </View>
          <View style={[styles.section, isDark ? styles.glassDarkPanel : styles.glassLightPanel, Shadow.md]}>
            <Text style={[styles.sectionTitle, isDark && { color: '#FFF' }]}>Analytics</Text>

            <View style={{ alignItems: 'center', marginTop: 10, marginLeft: -15 }}>
              <LineChart
                data={chartData}
                width={screenWidth - 40}
                height={200}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFromOpacity: 0,
                  backgroundGradientToOpacity: 0,
                  decimalPlaces: 0,
                  color: (opacity = 1) => isDark ? `rgba(167, 139, 250, ${opacity})` : `rgba(124, 58, 237, ${opacity})`,
                  labelColor: () => isDark ? '#9CA3AF' : '#6B7280',
                  propsForDots: { r: '6', strokeWidth: '3', stroke: isDark ? '#FFF' : '#7C3AED' },
                  propsForBackgroundLines: { stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', strokeDasharray: '' },
                }}
                bezier
                style={{ borderRadius: 16 }}
                withInnerLines={true}
                withOuterLines={false}
              />
            </View>
          </View>

          <AITipCard onViewAll={() => navigation.navigate('AIInsights')} />

          {topCategories.length > 0 && (
            <View style={[styles.section, isDark ? styles.glassDarkPanel : styles.glassLightPanel, Shadow.md]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, isDark && { color: '#FFF' }]}>Top Categories</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              {topCategories.map((cat, i) => {
                const catColor = ['#F59E0B', '#3B82F6', '#EF4444', '#EC4899'][i] || colors.primary;
                return (
                  <View key={i} style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <View style={[styles.categoryIconWrap, { backgroundColor: catColor + '15' }]}>
                        <Ionicons name="pie-chart" size={18} color={catColor} />
                      </View>
                      <Text style={[styles.categoryName, isDark && { color: '#E5E7EB' }]}>{cat.name}</Text>
                    </View>
                    <Text style={[styles.categoryAmount, isDark && { color: '#FFF' }]}>{formatCurrency(cat.amount)}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={[styles.section, isDark ? styles.glassDarkPanel : styles.glassLightPanel, Shadow.md]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDark && { color: '#FFF' }]}>Recent</Text>
            </View>
            {recentExpenses.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }]}>
                  <Ionicons name="receipt" size={36} color={isDark ? '#A78BFA' : '#8B5CF6'} />
                </View>
                <Text style={[styles.emptyText, isDark && { color: '#9CA3AF' }]}>
                  It's so quiet here. Add your first expense!
                </Text>
              </View>
            ) : (
              recentExpenses.map((expense, i) => (
                <TouchableOpacity
                  key={expense.id || i}
                  style={[styles.transactionRow, i < recentExpenses.length - 1 && [styles.transactionBorder, isDark && { borderBottomColor: 'rgba(255,255,255,0.05)' }]]}
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

          <View style={{ height: 24 }} />
        </View>
        </ScrollView>
      </SafeAreaView>

      <View style={styles.fabContainer}>
        <TouchableOpacity style={Shadow.lg} activeOpacity={0.8} onPress={() => setQuickAddVisible(true)}>
          <LinearGradient
            colors={['#8B5CF6', '#6D28D9']}
            style={styles.fab}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="flash" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <QuickAddModal
        visible={quickAddVisible}
        onClose={() => setQuickAddVisible(false)}
        onSuccess={() => fetchExpenses(user?.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBg: {
    paddingTop: Spacing.md, paddingBottom: 24, paddingHorizontal: Spacing.xl,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoContainer: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden' },
  logoGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.md, fontWeight: '500' },
  userName: { color: '#FFF', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },

  budgetButton: { borderRadius: 24, overflow: 'hidden' },
  glassButton: {
    width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  periodRow: { marginTop: Spacing.xl },
  periodChip: {
    paddingHorizontal: Spacing.lg, paddingVertical: 8,
    borderRadius: BorderRadius.full, backgroundColor: 'rgba(255,255,255,0.15)',
  },
  periodChipActive: { backgroundColor: '#FFF' },
  periodText: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, fontWeight: '600' },
  periodTextActive: { color: '#7C3AED', fontWeight: '800' },

  totalCard: {
    marginTop: Spacing.xl, padding: Spacing.xl, borderRadius: 24,
    marginBottom: -20, zIndex: 10,
  },
  glassLight: { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
  glassDark: { backgroundColor: 'rgba(31, 23, 53, 0.95)' },
  walletCard: {
    marginTop: Spacing.md, padding: Spacing.xl, borderRadius: 24,
    marginHorizontal: Spacing.xl, marginBottom: 4,
  },

  totalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: FontSize.sm, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  trendText: { color: '#10B981', fontSize: 12, fontWeight: '700' },

  totalAmount: { fontSize: 40, fontWeight: '800', marginVertical: Spacing.sm, color: '#111827', letterSpacing: -1 },

  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm, marginTop: Spacing.sm },
  budgetLabel: { fontSize: FontSize.sm, color: '#6B7280', fontWeight: '500' },
  budgetRemaining: { fontSize: FontSize.sm, fontWeight: '700' },
  progressBar: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },

  body: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  section: { marginBottom: Spacing.xl, borderRadius: 24, padding: Spacing.xl },
  glassLightPanel: { backgroundColor: '#FFF' },
  glassDarkPanel: { backgroundColor: 'rgba(31, 23, 53, 0.6)' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  seeAll: { fontSize: FontSize.sm, fontWeight: '700', color: '#8B5CF6' },

  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, marginBottom: 4 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  categoryIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryName: { fontSize: FontSize.md, fontWeight: '600', color: '#374151' },
  categoryAmount: { fontSize: FontSize.md, fontWeight: '700', color: '#111827' },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyIconWrap: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  emptyText: { fontSize: 15, color: '#6B7280', textAlign: 'center', fontWeight: '500' },

  transactionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  transactionBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  transactionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  transactionInfo: { flex: 1 },
  transactionCategory: { fontSize: FontSize.md, fontWeight: '700', color: '#111827', marginBottom: 2 },
  transactionDate: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  transactionAmount: { fontSize: FontSize.md, fontWeight: '800' },

  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 100,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
