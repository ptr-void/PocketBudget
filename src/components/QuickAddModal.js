import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useExpenseStore, useCategoryStore, useBudgetStore } from '../store/stores';
import { triggerBudgetAlert } from '../services/notifications';
import { DEFAULT_CATEGORIES, Spacing, BorderRadius, FontSize, FontWeight } from '../theme/theme';
import { format } from 'date-fns';

export default function QuickAddModal({ visible, onClose }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { addExpense, getTotal } = useExpenseStore();
  const { budgets } = useBudgetStore();
  const { categories } = useCategoryStore();
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORIES[0].id);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [saving, setSaving] = useState(false);

  const PAYMENT_METHODS = ['Cash', 'GCash', 'Card', 'Bank Transfer', 'PayMaya'];

  const cats = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const handleQuickSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setSaving(true);
    const selectedCat = cats.find((c) => c.id === selectedCategory);
    try {
      await addExpense({
        user_id: user?.id,
        amount: parseFloat(amount),
        category_id: selectedCategory,
        category_name: selectedCat?.name || 'Other',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: '',
        payment_method: paymentMethod || null,
      });

      // Check budget alerts
      const amountFloat = parseFloat(amount);
      if (budgets.monthly > 0) {
        const spentMonthly = getTotal('monthly') + amountFloat;
        const remaining = budgets.monthly - spentMonthly;
        if (spentMonthly >= budgets.monthly * 0.85) triggerBudgetAlert(remaining, 'monthly');
      } else if (budgets.weekly > 0) {
        const spentWeekly = getTotal('weekly') + amountFloat;
        const remaining = budgets.weekly - spentWeekly;
        if (spentWeekly >= budgets.weekly * 0.85) triggerBudgetAlert(remaining, 'weekly');
      }

      setAmount('');
      setPaymentMethod('');
      onClose();
    } catch {}
    setSaving(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <View style={styles.handle}>
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>⚡ Quick Add</Text>

          <View style={styles.amountRow}>
            <Text style={[styles.currency, { color: colors.primary }]}>₱</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.text, borderBottomColor: colors.primary }]}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {cats.slice(0, 8).map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isSelected ? (cat.color || colors.primary) : colors.inputBg,
                      borderColor: isSelected ? (cat.color || colors.primary) : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Ionicons
                    name={cat.icon || 'ellipsis-horizontal'}
                    size={16}
                    color={isSelected ? '#FFF' : colors.textSecondary}
                  />
                  <Text style={{ color: isSelected ? '#FFF' : colors.text, fontSize: FontSize.xs, fontWeight: FontWeight.medium }}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textMuted, marginBottom: 8 }}>Payment Method</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {PAYMENT_METHODS.map((pm) => {
              const isSelected = paymentMethod === pm;
              return (
                <TouchableOpacity
                  key={pm}
                  style={[styles.categoryChip, { backgroundColor: isSelected ? '#8B5CF6' : colors.inputBg, borderColor: isSelected ? '#8B5CF6' : colors.border, marginRight: 8 }]}
                  onPress={() => setPaymentMethod(isSelected ? '' : pm)}
                >
                  <Text style={{ color: isSelected ? '#FFF' : colors.text, fontSize: 13, fontWeight: '600' }}>{pm}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: amount ? 1 : 0.5 }]}
            onPress={handleQuickSave}
            disabled={saving || !amount}
          >
            <Ionicons name="checkmark" size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  content: {
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg, paddingBottom: 40,
  },
  handle: { alignItems: 'center', marginBottom: Spacing.md },
  handleBar: { width: 40, height: 4, borderRadius: 2 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center', marginBottom: Spacing.md },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: Spacing.lg },
  currency: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginRight: 4, marginBottom: 4 },
  amountInput: { fontSize: 42, fontWeight: FontWeight.bold, borderBottomWidth: 2, minWidth: 120, textAlign: 'center' },
  categoryScroll: { marginBottom: Spacing.lg },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1,
    marginRight: Spacing.sm, gap: 4,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: BorderRadius.md, gap: Spacing.sm,
  },
  saveBtnText: { color: '#FFF', fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
});
