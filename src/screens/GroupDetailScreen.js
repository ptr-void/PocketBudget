import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, StatusBar, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, computeBalances } from '../utils/helpers';
import {
  addGroupExpense, fetchGroupExpenses, addGroupMember, sendGroupInvite,
  deleteGroupExpense, markSplitPaid, deleteGroup, fetchGroupContributions, upsertContribution, addGroupLog,
} from '../services/api';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme/theme';

export default function GroupDetailScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const group = route.params?.group;
  const isBudgetPool = group?.group_type === 'budget_pool';
  const isCreator = group?.created_by === user?.id;

  const [expenses, setExpenses] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [splitType, setSplitType] = useState('equal'); // 'equal' | 'custom'
  const [customSplits, setCustomSplits] = useState({});
  const [customSelected, setCustomSelected] = useState({});
  const [contributionInput, setContributionInput] = useState('');
  const [showContribModal, setShowContribModal] = useState(false);

  const members = group?.group_members?.map((gm) => ({
    user_id: gm.user_id,
    full_name: gm.profiles?.full_name || gm.profiles?.email || 'User',
    email: gm.profiles?.email || '',
    avatar_url: gm.profiles?.avatar_url || null,
  })) || [{ user_id: user?.id, full_name: user?.user_metadata?.full_name || 'You', avatar_url: null }];

  useEffect(() => {
    loadExpenses();
    if (isBudgetPool) loadContributions();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await fetchGroupExpenses(group?.id);
      setExpenses(data || []);
    } catch {}
  };

  const loadContributions = async () => {
    try {
      const data = await fetchGroupContributions(group?.id);
      console.log('Contributions fetched:', data?.length, JSON.stringify(data));
      setContributions(data || []);
      return data || [];
    } catch (err) {
      console.error('loadContributions error:', err?.message);
      return [];
    }
  };

  // --- computed values ---
  const totalContributions = contributions.reduce((s, c) => s + (c.amount || 0), 0);
  const totalGroupSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const poolBalance = totalContributions - totalGroupSpent;

  // Custom splits helpers
  const initCustomSplits = (amt) => {
    const splits = {};
    members.forEach((m) => { splits[m.user_id] = ''; });
    return splits;
  };
  const initCustomSelected = () => {
    const sel = {};
    members.forEach((m) => { sel[m.user_id] = true; });
    return sel;
  };

  const customTotal = members
    .filter(m => customSelected[m.user_id] !== false)
    .reduce((s, m) => s + (parseFloat(customSplits[m.user_id]) || 0), 0);
  const customRemaining = (parseFloat(amount) || 0) - customTotal;

  const handleAddExpense = async () => {
    const total = parseFloat(amount);
    if (!total || total <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }

    let splits;
    if (splitType === 'equal') {
      const share = total / members.length;
      splits = members.map((m) => ({ user_id: m.user_id, amount: parseFloat(share.toFixed(2)) }));
    } else {
      const selectedIds = members.filter(m => customSelected[m.user_id] !== false).map(m => m.user_id);
      if (selectedIds.length < 2) {
        Alert.alert('Error', 'Select at least 2 members for custom split');
        return;
      }
      const diff = Math.abs(customRemaining);
      if (diff > 0.02) {
        Alert.alert('Split mismatch', `Amounts must add up to ${formatCurrency(total)}. Currently ${formatCurrency(customTotal)}.`);
        return;
      }
      splits = selectedIds
        .filter((id) => (parseFloat(customSplits[id]) || 0) > 0)
        .map((id) => ({ user_id: id, amount: parseFloat(customSplits[id]) }));
        
      if (splits.length < 2) {
        Alert.alert('Error', 'At least 2 members must have a valid amount');
        return;
      }
    }

    try {
      await addGroupExpense(
        { group_id: group?.id, description: description || 'Group expense', amount: total, paid_by: user?.id, split_type: splitType },
        splits,
      );
      setShowAddModal(false);
      setAmount('');
      setDescription('');
      setSplitType('equal');
      setCustomSplits({});
      loadExpenses();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDeleteExpense = (exp) => {
    Alert.alert('Delete Expense', `Delete "${exp.description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroupExpense(exp.id, group?.id, user?.id, exp.description);
            loadExpenses();
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete expense');
          }
        },
      },
    ]);
  };

  const handleMarkPaid = (split) => {
    const splitMemberName = members.find(m => m.user_id === split.user_id)?.full_name || 'Someone';
    const msg = split.is_paid ? `Mark ${splitMemberName}'s share as unpaid?` : `Mark ${splitMemberName}'s share as paid?`;
    Alert.alert(msg, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await markSplitPaid(split.id, !split.is_paid);
            if (!split.is_paid) {
              const myName = user?.user_metadata?.full_name || 'Someone';
              const logMsg = split.user_id === user?.id 
                ? `${myName} marked their share as paid`
                : `${myName} marked ${splitMemberName}'s share as paid`;
              await addGroupLog(group?.id, user?.id, 'payment_marked', logMsg);
            }
            loadExpenses();
          } catch (err) { Alert.alert('Error', err.message); }
        },
      },
    ]);
  };

  const handleDeleteGroup = () => {
    Alert.alert('Delete Group', `Delete "${group?.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroup(group?.id);
            navigation.goBack();
          } catch (err) { Alert.alert('Error', err.message); }
        },
      },
    ]);
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim()) return;
    try {
      await sendGroupInvite(group?.id, user?.id, memberEmail.trim());
      await addGroupLog(group?.id, user?.id, 'member_invited', `Invited ${memberEmail.trim()}`);
      Alert.alert('Invite Sent', `An invitation has been sent to ${memberEmail}. They'll appear once they accept.`);
      setShowMemberModal(false);
      setMemberEmail('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send invite');
    }
  };

  const handleSaveContribution = async () => {
    const val = parseFloat(contributionInput);
    if (!val || val <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    try {
      await upsertContribution(group?.id, user?.id, val);
      await addGroupLog(group?.id, user?.id, 'member_joined', `${user?.user_metadata?.full_name || 'Someone'} contributed ${formatCurrency(val)} to the budget`);
      setShowContribModal(false);
      setContributionInput('');
      await loadContributions();
    } catch (err) {
      console.error('Contribute error:', err);
      Alert.alert('Error', err.message || 'Failed to save contribution');
    }
  };

  const balances = computeBalances(expenses, members);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[isDark ? '#4C1D95' : '#8B5CF6', isDark ? '#0F0A1A' : '#F9FAFB']} locations={[0, 0.35]} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <View style={styles.glassIcon}><Ionicons name="arrow-back" size={24} color="#FFF" /></View>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{group?.name || 'Group'}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {isCreator && (
            <TouchableOpacity onPress={handleDeleteGroup} style={styles.backBtn}>
              <View style={[styles.glassIcon, { backgroundColor: 'rgba(239,68,68,0.25)' }]}><Ionicons name="trash" size={20} color="#FCA5A5" /></View>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('GroupLog', { group })} style={styles.backBtn}>
            <View style={styles.glassIcon}><Ionicons name="time-outline" size={22} color="#FFF" /></View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMemberModal(true)} style={styles.backBtn}>
            <View style={styles.glassIcon}><Ionicons name="person-add" size={22} color="#FFF" /></View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {/* Budget Pool Balance Card */}
        {isBudgetPool && (
          <View style={[styles.section, isDark ? styles.cardDark : styles.cardLight, Shadow.md]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDark && { color: '#FFF' }, { marginBottom: 0 }]}>Pool Balance</Text>
              <TouchableOpacity onPress={() => setShowContribModal(true)} style={styles.addExpenseBtn}>
                <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.addExpenseBtnGrad}>
                  <Ionicons name="add" size={16} color="#FFF" />
                  <Text style={styles.addExpenseBtnText}>Contribute</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: Spacing.md, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#9CA3AF' : '#6B7280' }}>Contributed</Text>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#10B981' }}>{formatCurrency(totalContributions)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#9CA3AF' : '#6B7280' }}>Spent</Text>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#F87171' }}>{formatCurrency(totalGroupSpent)}</Text>
              </View>
              <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFF' : '#111827' }}>Remaining</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: poolBalance >= 0 ? '#8B5CF6' : '#F87171' }}>{formatCurrency(poolBalance)}</Text>
              </View>
            </View>
            {contributions.length > 0 && (
              <View style={{ marginTop: Spacing.md }}>
                {contributions.map((c) => {
                  const m = members.find((x) => x.user_id === c.user_id);
                  return (
                    <View key={c.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#E5E7EB' : '#374151' }}>{m?.full_name || 'Member'}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#10B981' }}>{formatCurrency(c.amount)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Members */}
        <View style={[styles.section, isDark ? styles.cardDark : styles.cardLight, Shadow.md]}>
          <Text style={[styles.sectionTitle, isDark && { color: '#FFF' }]}>Members</Text>
          {members.map((m, i) => {
            const memberContrib = contributions.find((c) => c.user_id === m.user_id);
            return (
            <View key={i} style={[styles.memberRow, i < members.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
              {m.avatar_url ? (
                <Image source={{ uri: m.avatar_url }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.avatar}>
                  <Text style={styles.avatarText}>{(m.full_name || 'U').charAt(0).toUpperCase()}</Text>
                </LinearGradient>
              )}
              <View style={styles.memberInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.memberName, isDark && { color: '#E5E7EB' }]}>{m.full_name}{m.user_id === user?.id ? ' (You)' : ''}</Text>
                  {m.user_id === group?.created_by && <Ionicons name="shield-checkmark" size={16} color="#F59E0B" />}
                </View>
                {m.email ? <Text style={[styles.memberEmail, isDark && { color: '#9CA3AF' }]} numberOfLines={1} ellipsizeMode="tail">{m.email}</Text> : null}
              </View>
              {isBudgetPool && memberContrib && (
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#10B981' }}>{formatCurrency(memberContrib.amount)}</Text>
              )}
            </View>
            );
          })}
        </View>

        {/* Balances */}
        {!isBudgetPool && (
          <View style={[styles.section, isDark ? styles.cardDark : styles.cardLight, Shadow.md]}>
            <Text style={[styles.sectionTitle, isDark && { color: '#FFF' }]}>Balances</Text>
            {balances.length === 0 ? (
              <Text style={[styles.emptyText, isDark && { color: '#9CA3AF' }]}>No expenses yet</Text>
            ) : (
              balances.map((b, i) => (
                <View key={i} style={[styles.balanceRow, i < balances.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                  <Text style={[styles.balanceName, isDark && { color: '#E5E7EB' }]}>{b.name}</Text>
                  <View style={styles.balanceRight}>
                    <Text style={[styles.balanceStatus, { color: b.balance >= 0 ? (isDark ? '#34D399' : '#10B981') : (isDark ? '#F87171' : '#EF4444') }]}>
                      {b.balance >= 0 ? 'gets back' : 'owes'}
                    </Text>
                    <Text style={[styles.balanceAmount, { color: b.balance >= 0 ? (isDark ? '#34D399' : '#10B981') : (isDark ? '#F87171' : '#EF4444') }]}>
                      {formatCurrency(Math.abs(b.balance))}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Expenses */}
        <View style={[styles.section, isDark ? styles.cardDark : styles.cardLight, Shadow.md]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && { color: '#FFF' }, { marginBottom: 0 }]}>Expenses</Text>
            <TouchableOpacity onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
              <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.addExpenseBtnGrad}>
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.addExpenseBtnText}>Add</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {expenses.length === 0 ? (
            <Text style={[styles.emptyText, isDark && { color: '#9CA3AF' }]}>No group expenses yet</Text>
          ) : (
            <View style={{ marginTop: Spacing.md }}>
              {expenses.map((exp, i) => {
                const splits = exp.expense_splits || [];
                return (
                  <View key={i} style={[{ paddingVertical: Spacing.md }, i < expenses.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                    <View style={styles.expenseRow}>
                      <View style={[styles.expenseIcon, isDark ? { backgroundColor: 'rgba(139,92,246,0.2)' } : { backgroundColor: '#F3F4F6' }]}>
                        <Ionicons name="receipt" size={20} color={isDark ? '#A78BFA' : '#8B5CF6'} />
                      </View>
                      <View style={styles.expenseInfo}>
                        <Text style={[styles.expenseDesc, isDark && { color: '#E5E7EB' }]} numberOfLines={1}>{exp.description}</Text>
                        <Text style={[styles.expensePaidBy, isDark && { color: '#9CA3AF' }]}>Paid by {exp.profiles?.full_name || 'someone'}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={[styles.expenseAmount, isDark && { color: '#FFF' }]}>{formatCurrency(exp.amount)}</Text>
                        {exp.paid_by === user?.id && (
                          <TouchableOpacity onPress={() => handleDeleteExpense(exp)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    {/* Per-member split rows */}
                    {splits.length > 0 && (
                      <View style={{ marginLeft: 56, marginTop: 4, gap: 4 }}>
                        {splits.map((split, j) => {
                          const member = members.find((m) => m.user_id === split.user_id);
                          const isPaid = !!split.is_paid;
                          const isPayer = exp.paid_by === user?.id; // Only payer can mark as paid
                          const isDebt = split.user_id !== exp.paid_by;
                          if (!isDebt) return null; // Ensure the payer themselves doesn't get a debt row here

                          return (
                            <TouchableOpacity
                              key={j}
                              onPress={() => isPayer ? handleMarkPaid(split) : null}
                              activeOpacity={isPayer ? 0.2 : 1}
                              style={[styles.splitRow, isDark ? { backgroundColor: 'rgba(255,255,255,0.04)' } : { backgroundColor: '#F9FAFB' }]}
                            >
                              <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#D1D5DB' : '#374151', flex: 1 }} numberOfLines={1}>
                                {member?.full_name || 'Member'}
                              </Text>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#A78BFA' : '#8B5CF6' }}>{formatCurrency(split.amount)}</Text>
                              {isPaid ? (
                                <View style={styles.paidBadge}><Ionicons name="checkmark-circle" size={14} color="#10B981" /><Text style={styles.paidText}>Paid</Text></View>
                              ) : isPayer ? (
                                <View style={styles.myDebtBadge}><Text style={styles.myDebtText}>Mark paid</Text></View>
                              ) : (
                                <View style={[styles.myDebtBadge, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2' }]}><Text style={[styles.myDebtText, { color: isDark ? '#FCA5A5' : '#EF4444' }]}>Unpaid</Text></View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <ScrollView style={[styles.modalContent, isDark ? styles.modalDark : styles.modalLight]} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && { color: '#FFF' }]}>Add Group Expense</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputBox, isDark ? styles.inputDark : styles.inputLight]}>
              <Text style={[styles.currency, isDark && { color: '#A78BFA' }]}>₱</Text>
              <TextInput style={[styles.input, isDark && { color: '#FFF' }]} placeholder="0.00" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} value={amount} onChangeText={(v) => { setAmount(v); setCustomSplits(initCustomSplits(v)); }} keyboardType="decimal-pad" autoFocus />
            </View>
            <View style={[styles.inputBox, isDark ? styles.inputDark : styles.inputLight]}>
              <TextInput style={[styles.input, isDark && { color: '#FFF' }]} placeholder="What was this for?" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} value={description} onChangeText={setDescription} />
            </View>

            {/* Split type toggle */}
            <View style={styles.splitToggleRow}>
              {['equal', 'custom'].map((t) => (
                <TouchableOpacity key={t} style={[styles.splitToggleBtn, splitType === t && styles.splitToggleActive]} onPress={() => { 
                    setSplitType(t); 
                    if (t === 'custom') {
                      setCustomSplits(initCustomSplits(amount));
                      setCustomSelected(initCustomSelected());
                    }
                  }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: splitType === t ? '#FFF' : (isDark ? '#9CA3AF' : '#6B7280') }}>
                    {t === 'equal' ? 'Equal Split' : 'Custom Split'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {splitType === 'equal' ? (
              <View style={[styles.splitInfoBox, isDark ? { backgroundColor: 'rgba(139,92,246,0.1)' } : { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="pie-chart" size={18} color={isDark ? '#A78BFA' : '#8B5CF6'} />
                <Text style={[{ fontSize: 14, fontWeight: '700', color: isDark ? '#A78BFA' : '#8B5CF6' }]}>
                  {formatCurrency((parseFloat(amount) || 0) / Math.max(members.length, 1))} each
                </Text>
              </View>
            ) : (
              <View style={{ marginBottom: Spacing.md }}>
                <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 8 }}>Select who is involved</Text>
                {members.map((m) => {
                  const isSel = customSelected[m.user_id] !== false;
                  return (
                    <View key={m.user_id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 }}>
                      <TouchableOpacity onPress={() => setCustomSelected(p => ({ ...p, [m.user_id]: !isSel }))} style={{ padding: 4 }}>
                        <Ionicons name={isSel ? 'checkbox' : 'square-outline'} size={24} color={isSel ? '#8B5CF6' : (isDark ? '#6B7280' : '#9CA3AF')} />
                      </TouchableOpacity>
                      <View style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderRadius: 16 }, isDark ? styles.inputDark : styles.inputLight, !isSel && { opacity: 0.4 }]} pointerEvents={isSel ? 'auto' : 'none'}>
                        <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: isDark ? '#E5E7EB' : '#111827' }} numberOfLines={1}>{m.full_name}</Text>
                        {isSel && (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: '#8B5CF6', marginRight: 6 }}>₱</Text>
                            <TextInput
                              style={{ width: 80, fontSize: 16, fontWeight: '700', color: isDark ? '#FFF' : '#111827', textAlign: 'right' }}
                              keyboardType="decimal-pad"
                              placeholder="0"
                              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                              value={customSplits[m.user_id] || ''}
                              onChangeText={(v) => setCustomSplits((prev) => ({ ...prev, [m.user_id]: v }))}
                            />
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#9CA3AF' : '#6B7280' }}>Total entered</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: Math.abs(customRemaining) < 0.02 ? '#10B981' : '#F87171' }}>
                    {formatCurrency(customTotal)} / {formatCurrency(parseFloat(amount) || 0)}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity onPress={handleAddExpense} activeOpacity={0.8} style={{ marginBottom: 20 }}>
              <LinearGradient colors={['#8B5CF6', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Add {splitType === 'equal' ? '& Split' : 'Expense'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Member Modal */}
      <Modal visible={showMemberModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark ? styles.modalDark : styles.modalLight]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && { color: '#FFF' }]}>Add Member</Text>
              <TouchableOpacity onPress={() => setShowMemberModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputBox, isDark ? styles.inputDark : styles.inputLight]}>
              <Ionicons name="mail" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <TextInput style={[styles.input, isDark && { color: '#FFF' }]} placeholder="Member's email address" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} value={memberEmail} onChangeText={setMemberEmail} autoCapitalize="none" keyboardType="email-address" autoFocus />
            </View>
            <TouchableOpacity onPress={handleAddMember} activeOpacity={0.8}>
              <LinearGradient colors={['#8B5CF6', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtn}>
                <Ionicons name="paper-plane" size={20} color="#FFF" />
                <Text style={styles.modalBtnText}>Send Invite</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Budget Contribution Modal */}
      <Modal visible={showContribModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark ? styles.modalDark : styles.modalLight]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && { color: '#FFF' }]}>My Contribution</Text>
              <TouchableOpacity onPress={() => setShowContribModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 14, color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: Spacing.lg, fontWeight: '500' }}>
              Enter how much you're contributing to the group budget.
            </Text>
            <View style={[styles.inputBox, isDark ? styles.inputDark : styles.inputLight]}>
              <Text style={[styles.currency, isDark && { color: '#A78BFA' }]}>₱</Text>
              <TextInput style={[styles.input, isDark && { color: '#FFF' }]} placeholder="0.00" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} value={contributionInput} onChangeText={setContributionInput} keyboardType="decimal-pad" autoFocus />
            </View>
            <TouchableOpacity onPress={handleSaveContribution} activeOpacity={0.8}>
              <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Save Contribution</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: Spacing.xl },
  backBtn: { borderRadius: 24 },
  glassIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', letterSpacing: 0.5, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  body: { flex: 1, paddingHorizontal: Spacing.xl },
  section: { padding: Spacing.xl, borderRadius: 24, marginBottom: Spacing.xl },
  cardLight: { backgroundColor: '#FFF' },
  cardDark: { backgroundColor: 'rgba(31, 23, 53, 0.90)' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: Spacing.md },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  memberEmail: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md },
  balanceName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  balanceRight: { alignItems: 'flex-end' },
  balanceStatus: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  balanceAmount: { fontSize: 17, fontWeight: '800' },
  emptyText: { fontSize: 14, textAlign: 'center', color: '#6B7280', paddingVertical: Spacing.lg, fontWeight: '500' },
  addExpenseBtn: { borderRadius: 20, overflow: 'hidden' },
  addExpenseBtnGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, gap: 5 },
  addExpenseBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  expenseIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  expenseInfo: { flex: 1 },
  expenseDesc: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  expensePaidBy: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  expenseAmount: { fontSize: 17, fontWeight: '800', color: '#111827' },
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, marginBottom: 3 },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  paidText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  myDebtBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  myDebtText: { fontSize: 11, fontWeight: '700', color: '#7C3AED' },
  owedBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  owedText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  splitToggleRow: { flexDirection: 'row', borderRadius: 16, overflow: 'hidden', marginBottom: Spacing.md, backgroundColor: 'rgba(139,92,246,0.1)' },
  splitToggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14 },
  splitToggleActive: { backgroundColor: '#8B5CF6' },
  splitInfoBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.md, borderRadius: 16, marginBottom: Spacing.xl, gap: Spacing.sm },
  customSplitRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 12, marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: Spacing.xl, paddingBottom: 40, maxHeight: '90%' },
  modalLight: { backgroundColor: '#FFF' },
  modalDark: { backgroundColor: '#1F1735' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  modalCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(156,163,175,0.1)', alignItems: 'center', justifyContent: 'center' },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: Spacing.lg, height: 56, marginBottom: Spacing.md },
  inputLight: { backgroundColor: '#F3F4F6' },
  inputDark: { backgroundColor: 'rgba(0,0,0,0.3)' },
  input: { flex: 1, fontSize: 18, fontWeight: '600', color: '#111827' },
  currency: { fontSize: 20, fontWeight: '800', color: '#8B5CF6', marginRight: 8 },
  modalBtn: { flexDirection: 'row', height: 58, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  modalBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
});
