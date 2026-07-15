import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useExpenseStore, useBudgetStore } from '../store/stores';
import { getAIInsights } from '../services/groq';
import { Spacing, Shadow } from '../theme/theme';

export default function AIInsightsScreen({ navigation }) {
  const { isDark } = useTheme();
  const { user, offlineMode } = useAuth();
  const { expenses } = useExpenseStore();
  const { budgets } = useBudgetStore();
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    if (offlineMode) {
      setError('AI Insights require an internet connection.');
      return;
    }
    setLoading(true);
    setError('');
    setInsights('');
    try {
      const result = await getAIInsights(expenses, budgets);
      setInsights(result);
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

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
        <Text style={styles.headerTitle}>AI Insights</Text>
        <TouchableOpacity onPress={fetchInsights} disabled={loading} style={styles.backBtn}>
          <View style={styles.glassIcon}>
            <Ionicons name="refresh" size={22} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.aiCard, isDark ? styles.cardDark : styles.cardLight, Shadow.lg]}>
          <LinearGradient
            colors={['#A78BFA', '#7C3AED']}
            style={styles.aiBadge}
          >
            <Ionicons name="sparkles" size={28} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.aiTitle, isDark && { color: '#FFF' }]}>
            Powered by AI
          </Text>
          <Text style={[styles.aiSubtitle, isDark && { color: '#9CA3AF' }]}>
            Personalized financial advice based on your spending habits
          </Text>
        </View>

        <View style={[styles.resultCard, isDark ? styles.cardDark : styles.cardLight, Shadow.md]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={[styles.loadingText, isDark && { color: '#9CA3AF' }]}>
                Analyzing your spending...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <View style={styles.errorIconWrap}>
                <Ionicons name="cloud-offline" size={32} color="#F87171" />
              </View>
              <Text style={[styles.errorText, isDark && { color: '#F87171' }]}>{error}</Text>
              <TouchableOpacity onPress={fetchInsights} style={styles.retryBtn}>
                <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.retryGradient}>
                  <Text style={styles.retryText}>Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.resultHeader}>
                <Ionicons name="bulb" size={22} color="#F59E0B" />
                <Text style={[styles.resultTitle, isDark && { color: '#FFF' }]}>Your Insights</Text>
              </View>
              <Text style={[styles.resultText, isDark && { color: '#D1D5DB' }]}>
                {insights}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statMini, isDark ? styles.cardDark : styles.cardLight, Shadow.sm]}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.statIcon}>
              <Ionicons name="receipt" size={18} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.statValue, isDark && { color: '#FFF' }]}>{expenses.length}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.statMiniLabel, isDark && { color: '#9CA3AF' }]}>Tracked</Text>
          </View>
          <View style={[styles.statMini, isDark ? styles.cardDark : styles.cardLight, Shadow.sm]}>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.statIcon}>
              <Ionicons name="trending-up" size={18} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.statValue, isDark && { color: '#FFF' }]}>
              {Object.keys(expenses.reduce((acc, e) => {
                acc[e.categories?.name || e.category_name || 'Other'] = true;
                return acc;
              }, {})).length}
            </Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.statMiniLabel, isDark && { color: '#9CA3AF' }]}>Categories</Text>
          </View>
          <View style={[styles.statMini, isDark ? styles.cardDark : styles.cardLight, Shadow.sm]}>
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.statIcon}>
              <Ionicons name="calendar" size={18} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.statValue, isDark && { color: '#FFF' }]}>
              {new Set(expenses.map(e => e.date)).size}
            </Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.statMiniLabel, isDark && { color: '#9CA3AF' }]}>Active Days</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: Spacing.xl,
  },
  backBtn: { borderRadius: 24 },
  glassIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },

  body: { flex: 1, paddingHorizontal: Spacing.xl },

  cardLight: { backgroundColor: '#FFF' },
  cardDark: { backgroundColor: 'rgba(31, 23, 53, 0.90)' },

  aiCard: {
    padding: Spacing.xl, borderRadius: 24, alignItems: 'center', marginBottom: Spacing.xl,
  },
  aiBadge: {
    width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  aiTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  aiSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },

  resultCard: { padding: Spacing.xl, borderRadius: 24, marginBottom: Spacing.xl, minHeight: 200 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  resultTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  resultText: { fontSize: 15, color: '#374151', lineHeight: 24 },

  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: Spacing.md, fontSize: 15, color: '#6B7280', fontWeight: '600' },

  errorContainer: { alignItems: 'center', paddingVertical: 20 },
  errorIconWrap: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(248,113,113,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  errorText: { fontSize: 15, color: '#F87171', textAlign: 'center', marginBottom: Spacing.lg, fontWeight: '500' },
  retryBtn: { borderRadius: 20, overflow: 'hidden' },
  retryGradient: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  statsRow: { flexDirection: 'row', gap: Spacing.md },
  statMini: {
    flex: 1, padding: Spacing.md, borderRadius: 20, alignItems: 'center',
  },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statMiniLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
});
