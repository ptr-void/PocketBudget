import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useExpenseStore, useCategoryStore, useBudgetStore } from '../store/stores';
import { triggerBudgetAlert } from '../services/notifications';
import { DEFAULT_CATEGORIES, PAYMENT_METHODS, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme/theme';
import { format } from 'date-fns';

export default function AddExpenseScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { addExpense, updateExpense, deleteExpense, getTotal } = useExpenseStore();
  const { budgets } = useBudgetStore();
  const { categories } = useCategoryStore();
  const editingExpense = route?.params?.expense;

  const [amount, setAmount] = useState(editingExpense ? String(editingExpense.amount) : '');
  const [selectedCategory, setSelectedCategory] = useState(
    editingExpense?.category_id || DEFAULT_CATEGORIES[0].id
  );
  const [note, setNote] = useState(editingExpense?.note || '');
  const [date, setDate] = useState(editingExpense?.date || format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState(editingExpense?.payment_method || '');
  const [saving, setSaving] = useState(false);

  const cats = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      const selectedCat = cats.find((c) => c.id === selectedCategory);
      const expenseData = {
        user_id: user?.id,
        amount: parseFloat(amount),
        category_id: selectedCategory,
        category_name: selectedCat?.name || 'Other',
        note,
        date,
        payment_method: paymentMethod || null,
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
      } else {
        await addExpense(expenseData);
      }

      // Check budget alerts
      const amountFloat = parseFloat(amount);
      if (budgets.monthly > 0) {
        const spentMonthly = getTotal('monthly') + (editingExpense ? amountFloat - editingExpense.amount : amountFloat);
        const remaining = budgets.monthly - spentMonthly;
        if (spentMonthly >= budgets.monthly * 0.85) triggerBudgetAlert(remaining, 'monthly');
      } else if (budgets.weekly > 0) {
        const spentWeekly = getTotal('weekly') + (editingExpense ? amountFloat - editingExpense.amount : amountFloat);
        const remaining = budgets.weekly - spentWeekly;
        if (spentWeekly >= budgets.weekly * 0.85) triggerBudgetAlert(remaining, 'weekly');
      }

      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(editingExpense.id);
          navigation.goBack();
        },
      },
    ]);
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
            <Ionicons name="close" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {editingExpense ? 'Edit Expense' : 'New Expense'}
        </Text>
        {editingExpense ? (
          <TouchableOpacity onPress={handleDelete} style={styles.backBtn}>
            <View style={[styles.glassIcon, { backgroundColor: 'rgba(248,113,113,0.2)' }]}>
              <Ionicons name="trash-outline" size={22} color="#FFF" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          
          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight, Shadow.lg]}>
            <View style={styles.amountSection}>
              <Text style={[styles.currencySymbol, isDark && { color: '#E5E7EB' }]}>₱</Text>
              <TextInput
                style={[styles.amountInput, isDark && { color: '#FFF' }]}
                placeholder="0.00"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                autoFocus={!editingExpense}
              />
            </View>

            <View style={[styles.inputContainer, isDark ? styles.inputDark : styles.inputLight]}>
              <Ionicons name="document-text-outline" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <TextInput
                style={[styles.input, isDark && { color: '#FFF' }]}
                placeholder="What was this for?"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={note}
                onChangeText={setNote}
              />
            </View>

            <View style={[styles.inputContainer, isDark ? styles.inputDark : styles.inputLight]}>
              <Ionicons name="calendar-outline" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <TextInput
                style={[styles.input, isDark && { color: '#FFF' }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={date}
                onChangeText={setDate}
              />
            </View>
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#9CA3AF' }]}>Category</Text>
          <View style={styles.chipGrid}>
            {cats.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const catColor = cat.color || '#8B5CF6';
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    isSelected 
                      ? { backgroundColor: catColor, borderColor: catColor }
                      : [isDark ? styles.chipUnselectedDark : styles.chipUnselectedLight, isDark && { borderColor: 'rgba(255,255,255,0.1)' }]
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={cat.icon || 'ellipsis-horizontal'}
                    size={18}
                    color={isSelected ? '#FFF' : (isDark ? '#D1D5DB' : '#6B7280')}
                  />
                  <Text style={[
                    styles.chipText,
                    { color: isSelected ? '#FFF' : (isDark ? '#D1D5DB' : '#374151') }
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, isDark && { color: '#9CA3AF' }]}>Payment Type</Text>
          <View style={[styles.chipGrid, { marginBottom: 40 }]}>
            {PAYMENT_METHODS.map((pm) => {
              const isSelected = paymentMethod === pm.id;
              return (
                <TouchableOpacity
                  key={pm.id}
                  style={[
                    styles.chip,
                    isSelected 
                      ? { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }
                      : [isDark ? styles.chipUnselectedDark : styles.chipUnselectedLight, isDark && { borderColor: 'rgba(255,255,255,0.1)' }]
                  ]}
                  onPress={() => setPaymentMethod(isSelected ? '' : pm.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={pm.icon}
                    size={16}
                    color={isSelected ? '#FFF' : (isDark ? '#D1D5DB' : '#6B7280')}
                  />
                  <Text style={[
                    styles.chipText,
                    { color: isSelected ? '#FFF' : (isDark ? '#D1D5DB' : '#374151') }
                  ]}>
                    {pm.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

        </ScrollView>

        <View style={[styles.footer, isDark ? { backgroundColor: '#0F0A1A' } : { backgroundColor: '#F9FAFB' }]}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Expense'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  
  card: { borderRadius: 24, padding: Spacing.xl, marginBottom: Spacing.xl },
  cardLight: { backgroundColor: '#FFF' },
  cardDark: { backgroundColor: 'rgba(31, 23, 53, 0.95)' },
  
  amountSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, borderBottomWidth: 1, borderBottomColor: 'rgba(156, 163, 175, 0.2)', paddingBottom: Spacing.lg },
  currencySymbol: { fontSize: 36, fontWeight: '800', color: '#374151', marginRight: 8 },
  amountInput: {
    fontSize: 56, fontWeight: '800', color: '#111827', minWidth: 120, textAlign: 'center',
  },
  
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md,
    height: 56, marginBottom: Spacing.md, gap: Spacing.sm,
  },
  inputLight: { backgroundColor: '#F3F4F6' },
  inputDark: { backgroundColor: 'rgba(0,0,0,0.3)' },
  input: { flex: 1, fontSize: FontSize.md, fontWeight: '500' },
  
  sectionLabel: { fontSize: FontSize.md, fontWeight: '700', color: '#374151', marginBottom: Spacing.md, marginLeft: 4 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  chip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md,
    height: 44, borderRadius: BorderRadius.full, borderWidth: 1,
    gap: Spacing.xs,
  },
  chipUnselectedLight: { backgroundColor: '#FFF', borderColor: '#E5E7EB' },
  chipUnselectedDark: { backgroundColor: 'rgba(31, 23, 53, 0.6)', borderColor: 'rgba(255,255,255,0.1)' },
  chipText: { fontSize: FontSize.sm, fontWeight: '600' },
  
  footer: { padding: Spacing.xl, paddingBottom: 40 },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 60, borderRadius: 24, gap: Spacing.sm,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  saveText: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
});
