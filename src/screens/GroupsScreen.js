import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Modal, Alert, StatusBar, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGroupStore } from '../store/stores';
import { formatCurrency } from '../utils/helpers';
import { deleteGroup } from '../services/api';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme/theme';

export default function GroupsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user, offlineMode } = useAuth();
  const { groups, fetchGroups, createGroup, invites, fetchInvites, respondInvite } = useGroupStore();

  // Wizard state
  const [showModal, setShowModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupType, setGroupType] = useState('split'); // 'split' | 'budget_pool'
  const [totalBudget, setTotalBudget] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user && !offlineMode) {
      fetchGroups(user.id);
      if (user.email) fetchInvites(user.email);
    }
  }, [user]);

  const resetWizard = () => {
    setWizardStep(1);
    setGroupName('');
    setGroupDescription('');
    setGroupType('split');
    setTotalBudget('');
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    if (offlineMode) {
      Alert.alert('Offline', 'Groups require an internet connection to create.');
      return;
    }
    if (creating) return;
    setCreating(true);
    try {
      await createGroup({
        name: groupName.trim(),
        description: groupDescription.trim(),
        created_by: user?.id,
        group_type: groupType,
        total_budget: groupType === 'budget_pool' ? parseFloat(totalBudget) || 0 : 0,
      }, user?.id);
      setShowModal(false);
      resetWizard();
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('Network') || msg.includes('fetch')) {
        Alert.alert('Network Error', 'Check your internet connection and try again.');
      } else {
        Alert.alert('Error', msg || 'Failed to create group');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGroup = (item) => {
    if (item.created_by !== user?.id) {
      Alert.alert('Not allowed', 'Only the group creator can delete this group.');
      return;
    }
    Alert.alert('Delete Group', `Delete "${item.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroup(item.id);
            fetchGroups(user.id);
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete group');
          }
        },
      },
    ]);
  };

  const renderGroup = ({ item }) => {
    const memberCount = item.group_members?.length || 1;
    const isBudgetPool = item.group_type === 'budget_pool';
    const isCreator = item.created_by === user?.id;
    return (
      <TouchableOpacity
        style={[styles.groupCard, isDark ? styles.cardDark : styles.cardLight, Shadow.md]}
        onPress={() => navigation.navigate('GroupDetail', { group: item })}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isBudgetPool ? ['#F59E0B', '#D97706'] : ['#8B5CF6', '#6D28D9']}
          style={styles.groupIcon}
        >
          <Ionicons name={isBudgetPool ? 'wallet' : 'people'} size={28} color="#FFF" />
        </LinearGradient>
        <View style={styles.groupInfo}>
          <Text style={[styles.groupName, isDark && { color: '#FFF' }]}>{item.name}</Text>
          {item.description ? (
            <Text style={[styles.groupDesc, isDark && { color: '#9CA3AF' }]} numberOfLines={1}>{item.description}</Text>
          ) : null}
          <View style={styles.groupMeta}>
            <View style={[styles.typeBadge, { backgroundColor: isBudgetPool ? '#FEF3C7' : '#EDE9FE' }]}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: isBudgetPool ? '#D97706' : '#7C3AED' }}>
                {isBudgetPool ? 'Budget Pool' : 'Split Bills'}
              </Text>
            </View>
            <Ionicons name="person" size={13} color={isDark ? '#6B7280' : '#9CA3AF'} />
            <Text style={[styles.groupMetaText, isDark && { color: '#6B7280' }]}>{memberCount} member{memberCount !== 1 ? 's' : ''}</Text>
          </View>
        </View>
        <View style={{ gap: 8, alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.iconBtn, isDark ? { backgroundColor: 'rgba(255,255,255,0.06)' } : { backgroundColor: '#F3F4F6' }]}
            onPress={() => navigation.navigate('GroupLog', { group: item })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="time-outline" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
          {isCreator && (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: 'rgba(239,68,68,0.08)' }]}
              onPress={() => handleDeleteGroup(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderInvites = () => {
    if (!invites || invites.length === 0) return null;
    return (
      <View style={{ marginBottom: Spacing.xl }}>
        <Text style={[styles.sectionTitle, isDark && { color: '#FFF' }]}>Pending Invites</Text>
        {invites.map((invite) => (
          <View key={invite.id} style={[styles.inviteCard, isDark ? styles.cardDark : styles.cardLight, Shadow.md]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inviteGroupName, isDark && { color: '#FFF' }]}>{invite.groups?.name}</Text>
              <Text style={[styles.inviteText, isDark && { color: '#9CA3AF' }]}>Invited by {invite.profiles?.full_name || 'Someone'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.inviteBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} onPress={() => respondInvite(invite.id, invite.group_id, user.id, false)}>
                <Ionicons name="close" size={20} color="#F87171" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.inviteBtn, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]} onPress={() => respondInvite(invite.id, invite.group_id, user.id, true)}>
                <Ionicons name="checkmark" size={20} color="#10B981" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // --- WIZARD STEPS ---
  const renderStep1 = () => (
    <>
      <Text style={[styles.stepHint, isDark && { color: '#9CA3AF' }]}>Step 1 of 2 · Details</Text>
      <View style={[styles.inputBox, isDark ? styles.inputDark : styles.inputLight]}>
        <Ionicons name="people-outline" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
        <TextInput
          style={[styles.input, isDark && { color: '#FFF' }]}
          placeholder="Group name"
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          value={groupName}
          onChangeText={setGroupName}
          autoFocus
        />
      </View>
      <View style={[styles.inputBox, isDark ? styles.inputDark : styles.inputLight]}>
        <Ionicons name="document-text-outline" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
        <TextInput
          style={[styles.input, isDark && { color: '#FFF' }]}
          placeholder="Description (optional)"
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          value={groupDescription}
          onChangeText={setGroupDescription}
        />
      </View>
      <TouchableOpacity onPress={() => { if (!groupName.trim()) { Alert.alert('Required', 'Enter a group name first'); return; } setWizardStep(2); }} activeOpacity={0.8}>
        <LinearGradient colors={['#8B5CF6', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtn}>
          <Text style={styles.modalBtnText}>Next →</Text>
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={[styles.stepHint, isDark && { color: '#9CA3AF' }]}>Step 2 of 2 · Group Type</Text>
      <Text style={[styles.typeLabel, isDark && { color: '#FFF' }]}>How will this group work?</Text>
      <View style={{ gap: 12, marginBottom: Spacing.lg }}>
        {[
          { value: 'split', icon: 'receipt', title: 'Split Bills', desc: 'Each expense is split between members (equal or custom amounts).' },
          { value: 'budget_pool', icon: 'wallet', title: 'Budget Pool', desc: 'Members contribute to a shared budget. Expenses deduct from the pool.' },
        ].map((t) => {
          const sel = groupType === t.value;
          return (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeCard, sel && styles.typeCardActive, isDark && !sel && styles.typeCardDark]}
              onPress={() => setGroupType(t.value)}
              activeOpacity={0.8}
            >
              <Ionicons name={t.icon} size={22} color={sel ? '#8B5CF6' : (isDark ? '#9CA3AF' : '#6B7280')} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.typeName, sel && { color: '#8B5CF6' }, isDark && !sel && { color: '#FFF' }]}>{t.title}</Text>
                <Text style={[styles.typeDesc, isDark && { color: '#9CA3AF' }]}>{t.desc}</Text>
              </View>
              {sel && <Ionicons name="checkmark-circle" size={22} color="#8B5CF6" />}
            </TouchableOpacity>
          );
        })}
      </View>
      {groupType === 'budget_pool' && (
        <View style={[styles.inputBox, isDark ? styles.inputDark : styles.inputLight]}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#8B5CF6', marginRight: 8 }}>₱</Text>
          <TextInput
            style={[styles.input, isDark && { color: '#FFF' }]}
            placeholder="Total starting budget (optional)"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={totalBudget}
            onChangeText={setTotalBudget}
            keyboardType="decimal-pad"
          />
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={() => setWizardStep(1)} style={styles.backBtnWizard}>
          <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280', fontWeight: '700' }}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCreate} activeOpacity={0.8} disabled={creating} style={{ flex: 1 }}>
          <LinearGradient colors={['#8B5CF6', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.modalBtn, creating && { opacity: 0.6 }]}>
            <Text style={styles.modalBtnText}>{creating ? 'Creating…' : 'Create Group'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[isDark ? '#4C1D95' : '#8B5CF6', isDark ? '#0F0A1A' : '#F9FAFB']}
        locations={[0, 0.35]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.header}>
        <View style={{ width: 48 }} />
        <Text style={styles.headerTitle}>Groups</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <View style={styles.glassIcon}><Ionicons name="add" size={24} color="#FFF" /></View>
        </TouchableOpacity>
      </View>

      {offlineMode ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, isDark ? { backgroundColor: 'rgba(124,58,237,0.2)' } : { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
            <Ionicons name="cloud-offline-outline" size={64} color={isDark ? '#A78BFA' : '#8B5CF6'} />
          </View>
          <Text style={[styles.emptyTitle, isDark && { color: '#FFF' }]}>Not Available Offline</Text>
          <Text style={[styles.emptyText, isDark && { color: '#9CA3AF' }]}>Groups require an internet connection. Please log in with your account to access groups.</Text>
        </View>
      ) : groups.length === 0 && invites.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, isDark ? { backgroundColor: 'rgba(124,58,237,0.2)' } : { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
            <Ionicons name="people-outline" size={64} color={isDark ? '#A78BFA' : '#8B5CF6'} />
          </View>
          <Text style={[styles.emptyTitle, isDark && { color: '#FFF' }]}>No Groups Yet</Text>
          <Text style={[styles.emptyText, isDark && { color: '#9CA3AF' }]}>Create a group to split expenses with friends</Text>
          <TouchableOpacity onPress={() => setShowModal(true)} activeOpacity={0.8}>
            <LinearGradient colors={['#8B5CF6', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtn}>
              <Text style={styles.createBtnText}>Create Group</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderInvites}
        />
      )}

      <Modal visible={showModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark ? styles.modalDark : styles.modalLight]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && { color: '#FFF' }]}>New Group</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); resetWizard(); }} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
            {wizardStep === 1 ? renderStep1() : renderStep2()}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 30, paddingHorizontal: Spacing.xl },
  addBtn: { borderRadius: 24 },
  glassIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },

  list: { padding: Spacing.xl, paddingBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: Spacing.md },

  inviteCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: 20, marginBottom: Spacing.md, gap: Spacing.md },
  inviteGroupName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  inviteText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  inviteBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  groupCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: 24, marginBottom: Spacing.lg, gap: Spacing.md },
  cardLight: { backgroundColor: '#FFF' },
  cardDark: { backgroundColor: 'rgba(31, 23, 53, 0.90)' },
  groupIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 3 },
  groupDesc: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginBottom: 4 },
  groupMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupMetaText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  emptyIcon: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: Spacing.sm },
  emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: Spacing.xl, fontWeight: '500' },
  createBtn: { paddingHorizontal: Spacing.xl, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  createBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: Spacing.xl, paddingBottom: 40 },
  modalLight: { backgroundColor: '#FFF' },
  modalDark: { backgroundColor: '#1F1735' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  modalCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(156,163,175,0.1)', alignItems: 'center', justifyContent: 'center' },

  stepHint: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md },

  inputBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: Spacing.lg, height: 56, marginBottom: Spacing.lg, gap: Spacing.md },
  inputLight: { backgroundColor: '#F3F4F6' },
  inputDark: { backgroundColor: 'rgba(0,0,0,0.3)' },
  input: { flex: 1, fontSize: 18, fontWeight: '600', color: '#111827' },

  typeLabel: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: Spacing.md },
  typeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#FAFAFA' },
  typeCardDark: { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
  typeCardActive: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.06)' },
  typeName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  typeDesc: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  modalBtn: { height: 60, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  modalBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  backBtnWizard: { height: 60, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 24, borderWidth: 1.5, borderColor: '#E5E7EB' },
});
