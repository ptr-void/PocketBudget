import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  StatusBar, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchGroupLog } from '../services/api';
import { Spacing, FontSize, Shadow } from '../theme/theme';
import { formatDate } from '../utils/helpers';

const ACTION_META = {
  expense_added:  { icon: 'add-circle',   color: '#10B981' },
  expense_deleted:{ icon: 'trash',         color: '#EF4444' },
  payment_marked: { icon: 'checkmark-circle', color: '#8B5CF6' },
  member_joined:  { icon: 'person-add',    color: '#3B82F6' },
  member_invited: { icon: 'mail',          color: '#F59E0B' },
};

export default function GroupLogScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const group = route.params?.group;
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchGroupLog(group?.id);
      const grouped = data.reduce((acc, entry) => {
        const key = entry.created_at?.split('T')[0] || 'Unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(entry);
        return acc;
      }, {});
      const sections = Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map((date) => ({ title: date, data: grouped[date] }));
      setLog(sections);
    } catch {}
    setLoading(false);
  };

  const renderItem = ({ item }) => {
    const meta = ACTION_META[item.action] || { icon: 'ellipse', color: '#6B7280' };
    return (
      <View style={[styles.row, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
        <View style={[styles.iconWrap, { backgroundColor: meta.color + '18' }]}>
          <Ionicons name={meta.icon} size={18} color={meta.color} />
        </View>
        <View style={styles.rowInfo}>
          <Text style={[styles.rowDesc, { color: isDark ? '#E5E7EB' : '#111827' }]}>{item.description || item.action}</Text>
          <Text style={[styles.rowUser, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
            {item.profiles?.full_name || 'Someone'} · {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={[styles.sectionHead, { backgroundColor: isDark ? '#0F0A1A' : '#F9FAFB' }]}>
      <Text style={[styles.sectionDate, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{formatDate(section.title)}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F0A1A' : '#F9FAFB' }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[isDark ? '#4C1D95' : '#8B5CF6', isDark ? '#0F0A1A' : '#F9FAFB']} locations={[0, 0.3]} style={StyleSheet.absoluteFillObject} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <View style={styles.glassIcon}><Ionicons name="arrow-back" size={24} color="#FFF" /></View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{group?.name} · Log</Text>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#8B5CF6" size="large" /></View>
      ) : log.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={48} color={isDark ? '#4B5563' : '#D1D5DB'} />
          <Text style={[styles.emptyText, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>No activity yet</Text>
        </View>
      ) : (
        <SectionList
          sections={log}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: Spacing.xl },
  backBtn: { borderRadius: 24 },
  glassIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', flex: 1, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  sectionHead: { paddingHorizontal: Spacing.xl, paddingVertical: 8 },
  sectionDate: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: Spacing.xl, gap: 14, borderBottomWidth: 1 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowDesc: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  rowUser: { fontSize: 12, fontWeight: '500' },
});
