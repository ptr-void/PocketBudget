import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useExpenseStore, useBudgetStore } from '../store/stores';
import { getQuickTip } from '../services/groq';
import { fetchAITipCache, saveAITipCache } from '../services/api';
import { Spacing, Shadow } from '../theme/theme';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export default function AITipCard({ onViewAll }) {
  const { isDark } = useTheme();
  const { user, offlineMode } = useAuth();
  const { expenses } = useExpenseStore();
  const { budgets } = useBudgetStore();
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchTips = async (forceRefresh = false) => {
    if (offlineMode) {
      setTips(['📴 Connect to the internet for AI tips']);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      if (!forceRefresh && user?.id) {
        const cached = await fetchAITipCache(user.id);
        if (cached && cached.tip_content && cached.updated_at) {
          const age = Date.now() - new Date(cached.updated_at).getTime();
          if (age < CACHE_TTL_MS) {
            const lines = cached.tip_content.split('\n').filter((l) => l.trim().length > 0);
            setTips(lines.length > 0 ? lines : ['✨ Add some expenses to get personalized tips!']);
            setLoading(false);
            return;
          }
        }
      }
      const result = await getQuickTip(expenses, budgets);
      const lines = result.split('\n').filter((l) => l.trim().length > 0);
      setTips(lines.length > 0 ? lines : ['✨ Add some expenses to get personalized tips!']);
      if (user?.id) await saveAITipCache(user.id, result);
    } catch {
      setError(true);
      setTips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTips(); }, [expenses.length]);

  return (
    <View style={[styles.container, isDark ? styles.cardDark : styles.cardLight, Shadow.md]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={['#A78BFA', '#7C3AED']} style={styles.iconBadge}>
            <Ionicons name="sparkles" size={16} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.title, isDark && { color: '#FFF' }]}>AI Recommendations</Text>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#8B5CF6" />
          <Text style={[styles.loadingText, isDark && { color: '#9CA3AF' }]}>Thinking...</Text>
        </View>
      ) : error ? (
        <TouchableOpacity onPress={() => fetchTips(true)} style={styles.errorRow}>
          <Ionicons name="cloud-offline" size={18} color="#F87171" />
          <Text style={[styles.errorText, isDark && { color: '#F87171' }]}>Couldn't load tips. Tap to retry.</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.tipsContainer}>
          {tips.map((tip, i) => (
            <View key={i} style={[styles.tipRow, i < tips.length - 1 && styles.tipBorder, isDark && i < tips.length - 1 && { borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={[styles.tipText, isDark && { color: '#D1D5DB' }]}>{tip}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 24, padding: Spacing.xl, marginBottom: Spacing.xl },
  cardLight: { backgroundColor: '#FFF' },
  cardDark: { backgroundColor: 'rgba(31, 23, 53, 0.6)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBadge: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: '#111827' },
  viewAll: { fontSize: 13, fontWeight: '700', color: '#8B5CF6', marginLeft: 8 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: Spacing.md },
  loadingText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: Spacing.sm },
  errorText: { fontSize: 14, color: '#F87171', fontWeight: '500' },
  tipsContainer: {},
  tipRow: { paddingVertical: 10 },
  tipBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tipText: { fontSize: 14, color: '#374151', lineHeight: 20, fontWeight: '500' },
});
