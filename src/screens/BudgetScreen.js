import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useBudgetStore, useExpenseStore } from '../store/stores';
import { formatCurrency } from '../utils/helpers';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme/theme';

export default function BudgetScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { budgets, setBudget, fetchBudgets } = useBudgetStore();
  const { getTotal, expenses } = useExpenseStore();

  const [dailyBudget, setDailyBudget] = useState(String(budgets.daily || ''));
  const [weeklyBudget, setWeeklyBudget] = useState(String(budgets.weekly || ''));
  const [monthlyBudget, setMonthlyBudget] = useState(String(budgets.monthly || ''));
  const [allTimeBudget, setAllTimeBudget] = useState(String(budgets['all-time'] || ''));

  useEffect(() => {
    if (user) fetchBudgets(user.id);
  }, [user]);

  useEffect(() => {
    setDailyBudget(String(budgets.daily || ''));
    setWeeklyBudget(String(budgets.weekly || ''));
    setMonthlyBudget(String(budgets.monthly || ''));
    setAllTimeBudget(String(budgets['all-time'] || ''));
  }, [budgets]);

  const handleSave = async (period, value) => {
    const amount = parseFloat(value) || 0;
    await setBudget(user?.id, period, amount);
    Alert.alert('Saved', `${period.charAt(0).toUpperCase() + period.slice(1)} budget updated!`);
  };

  const renderBudgetCard = (period, value, setValue, icon, gradientColors) => {
    const spent = period === 'all-time' ? expenses.reduce((s, e) => s + (e.amount || 0), 0) : getTotal(period);
    const budget = parseFloat(value) || 0;
    const remaining = budget - spent;
    const progress = budget > 0 ? Math.min(spent / budget, 1) : 0;
    const isOver = remaining < 0;
    const isNear = progress > 0.8 && !isOver;

    return (
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight, Shadow.md]} key={period}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <LinearGradient
              colors={gradientColors}
              style={styles.iconGradient}
            >
              <Ionicons name={icon} size={24} color="#FFF" />
            </LinearGradient>
          </View>
          <Text style={[styles.cardTitle, isDark && { color: '#FFF' }]}>
            {period.charAt(0).toUpperCase() + period.slice(1)} Budget
          </Text>
        </View>

        <View style={[styles.inputRow, isDark ? styles.inputDark : styles.inputLight]}>
          <Text style={[styles.currencyLabel, isDark && { color: '#A78BFA' }]}>₱</Text>
          <TextInput
            style={[styles.budgetInput, isDark && { color: '#FFF' }]}
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          />
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => handleSave(period, value)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              <Text style={styles.saveBtnText}>Set</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {budget > 0 && (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, isDark && { color: '#9CA3AF' }]}>Spent</Text>
                <Text style={[styles.statValue, isDark && { color: '#E5E7EB' }]}>{formatCurrency(spent)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, isDark && { color: '#9CA3AF' }, { textAlign: 'right' }]}>Remaining</Text>
                <Text style={[styles.statValue, { textAlign: 'right', ...{
                  color: isOver ? '#F87171' : isNear ? '#FBBF24' : '#10B981',
                } }]}>
                  {formatCurrency(Math.abs(remaining))}
                  {isOver ? ' over' : ''}
                </Text>
              </View>
            </View>

            <View style={[styles.progressBar, isDark ? { backgroundColor: 'rgba(255,255,255,0.1)' } : { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
              <LinearGradient
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                colors={
                  isOver ? ['#F87171', '#EF4444'] : 
                  isNear ? ['#FBBF24', '#F59E0B'] : 
                  ['#34D399', '#10B981']
                }
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
          </>
        )}
      </View>
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

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <View style={styles.glassIcon}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budget Limits</Text>
        <View style={{ width: 48 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {renderBudgetCard('daily', dailyBudget, setDailyBudget, 'today', ['#F59E0B', '#D97706'])}
          {renderBudgetCard('weekly', weeklyBudget, setWeeklyBudget, 'calendar-outline', ['#3B82F6', '#2563EB'])}
          {renderBudgetCard('monthly', monthlyBudget, setMonthlyBudget, 'calendar', ['#8B5CF6', '#6D28D9'])}
          {renderBudgetCard('all-time', allTimeBudget, setAllTimeBudget, 'wallet', ['#EC4899', '#BE185D'])}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 30, paddingHorizontal: Spacing.xl,
  },
  backBtn: { borderRadius: 24 },
  glassIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  
  body: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  
  card: { padding: Spacing.xl, borderRadius: 24, marginBottom: Spacing.xl },
  cardLight: { backgroundColor: '#FFF' },
  cardDark: { backgroundColor: 'rgba(31, 23, 53, 0.90)' },
  
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  iconBox: { width: 48, height: 48, borderRadius: 16, overflow: 'hidden' },
  iconGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: 16, paddingLeft: Spacing.lg, height: 56, overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  inputLight: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  inputDark: { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' },
  
  currencyLabel: { fontSize: 20, fontWeight: '800', color: '#8B5CF6', marginRight: Spacing.xs },
  budgetInput: { flex: 1, fontSize: 20, fontWeight: '700', color: '#111827' },
  
  saveBtn: { height: '100%', width: 80 },
  saveBtnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: FontSize.md },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  statItem: { flex: 1 },
  statLabel: { fontSize: FontSize.sm, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: Spacing.xs },
  progressFill: { height: '100%', borderRadius: 4 },
});
