import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, StatusBar, SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useExpenseStore, useCategoryStore } from '../store/stores';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Spacing, BorderRadius, FontSize, Shadow } from '../theme/theme';

export default function HistoryScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { expenses } = useExpenseStore();
  const { categories } = useCategoryStore();
  const [search, setSearch] = useState('');

  const getCat = (expense) => {
    if (!categories) return null;
    return categories.find((c) =>
      c.id === expense.category_id ||
      c.name === expense.category_name
    );
  };

  const filtered = expenses.filter((e) => {
    const q = search.toLowerCase();
    return (
      (e.categories?.name || e.category_name || '').toLowerCase().includes(q) ||
      (e.note || '').toLowerCase().includes(q) ||
      String(e.amount).includes(q)
    );
  });

  const grouped = filtered.reduce((acc, exp) => {
    const key = exp.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(exp);
    return acc;
  }, {});

  const sections = Object.keys(grouped)
    .sort((a, b) => new Date(b) - new Date(a))
    .map((date) => ({ title: date, data: grouped[date] }));

  const totalFiltered = filtered.reduce((s, e) => s + (e.amount || 0), 0);

  const renderItem = ({ item, index, section }) => {
    const isLast = index === section.data.length - 1;
    return (
      <TouchableOpacity
        style={[styles.row, !isLast && [styles.rowBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]]}
        onPress={() => navigation.navigate('AddExpense', { expense: item })}
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrap, { backgroundColor: (getCat(item)?.color || colors.primary) + '20' }]}>
          <Ionicons name={getCat(item)?.icon || 'receipt-outline'} size={20} color={getCat(item)?.color || colors.primary} />
        </View>
        <View style={styles.rowInfo}>
          <Text style={[styles.rowCategory, { color: isDark ? '#FFF' : '#111827' }]}>
            {item.categories?.name || item.category_name || 'Expense'}
          </Text>
          {item.note ? <Text style={[styles.rowNote, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{item.note}</Text> : null}
          {item.payment_method ? (
            <Text style={[styles.rowNote, { color: isDark ? '#7C3AED' : '#8B5CF6' }]}>{item.payment_method}</Text>
          ) : null}
        </View>
        <Text style={styles.rowAmount}>-{formatCurrency(item.amount)}</Text>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={[styles.sectionHead, { backgroundColor: isDark ? '#0F0A1A' : '#F9FAFB' }]}>
      <Text style={[styles.sectionDate, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{formatDate(section.title)}</Text>
      <Text style={[styles.sectionTotal, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
        {formatCurrency(section.data.reduce((s, e) => s + e.amount, 0))}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F0A1A' : '#F9FAFB' }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[isDark ? '#4C1D95' : '#8B5CF6', isDark ? '#0F0A1A' : '#F9FAFB']}
        locations={[0, 0.35]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSub}>{filtered.length} transactions · {formatCurrency(totalFiltered)}</Text>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: isDark ? 'rgba(31,23,53,0.9)' : '#FFF', ...Shadow.sm }]}>
        <Ionicons name="search" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
        <TextInput
          style={[styles.searchInput, { color: isDark ? '#FFF' : '#111827' }]}
          placeholder="Search expenses..."
          placeholderTextColor={isDark ? '#4B5563' : '#9CA3AF'}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
          </TouchableOpacity>
        )}
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={48} color={isDark ? '#4B5563' : '#D1D5DB'} />
          <Text style={[styles.emptyText, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
            {search ? 'No results found' : 'No expenses yet'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: Spacing.xl },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginTop: 4 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: Spacing.xl, borderRadius: 16, padding: 14, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: 8,
  },
  sectionDate: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTotal: { fontSize: 13, fontWeight: '700' },
  list: { paddingBottom: 24 },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: Spacing.xl, gap: 14,
  },
  rowBorder: { borderBottomWidth: 1 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowCategory: { fontSize: 15, fontWeight: '700' },
  rowNote: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: '800', color: '#F87171' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '500' },
});
