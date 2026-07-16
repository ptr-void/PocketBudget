import { supabase } from './supabase';


export const signUp = async (email, password, fullName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const updateProfile = async (updates) => {
  
  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });
  if (error) throw error;
  
  
  const { error: dbError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', data.user.id);
    
  if (dbError) throw dbError;
  return data.user;
};


export const fetchExpenses = async (userId) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, categories(name, icon, color)')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
};

export const addExpense = async (expense) => {
  const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
  
  const dbPayload = { ...expense };
  if (dbPayload.category_id && !isUUID(dbPayload.category_id)) {
    dbPayload.category_id = null;
  }
  delete dbPayload._offline;
  delete dbPayload.categories;

  const { data, error } = await supabase.from('expenses').insert(dbPayload).select().single();
  if (error) throw error;
  return data;
};

export const updateExpense = async (id, updates) => {
  const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
  
  const dbPayload = { ...updates };
  if (dbPayload.category_id !== undefined && !isUUID(dbPayload.category_id)) {
    dbPayload.category_id = null;
  }
  delete dbPayload.categories;
  delete dbPayload._offline;

  const { data, error } = await supabase.from('expenses').update(dbPayload).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteExpense = async (id) => {
  const { data, error } = await supabase.from('expenses').delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Permission denied or expense not found');
};


export const fetchCategories = async (userId) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.eq.${userId},is_default.eq.true`)
    .order('name');
  if (error) throw error;
  return data;
};

export const addCategory = async (category) => {
  const { data, error } = await supabase.from('categories').insert(category).select().single();
  if (error) throw error;
  return data;
};

export const deleteCategory = async (id) => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
};


export const fetchBudgets = async (userId) => {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
};

export const upsertBudget = async (budget) => {
  const { data, error } = await supabase
    .from('budgets')
    .upsert(budget, { onConflict: 'user_id,period' })
    .select()
    .single();
  if (error) throw error;
  return data;
};


export const fetchGroups = async (userId) => {
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, groups(*, group_type, total_budget, created_by, group_members(user_id, profiles(full_name, email, avatar_url)))')
    .eq('user_id', userId);
  if (error) throw error;
  return data?.map((gm) => gm.groups) || [];
};

export const createGroup = async (group) => {
  const { data, error } = await supabase.from('groups').insert(group).select().single();
  if (error) throw error;
  return data;
};

export const addGroupMember = async (groupId, userId) => {
  const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: userId });
  if (error) throw error;
};

export const fetchGroupExpenses = async (groupId) => {
  const { data, error } = await supabase
    .from('group_expenses')
    .select('*, expense_splits(*), profiles:paid_by(full_name)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const addGroupExpense = async (expense, splits) => {
  const { data, error } = await supabase.from('group_expenses').insert(expense).select().single();
  if (error) throw error;

  const splitsWithExpenseId = splits.map((s) => ({ ...s, group_expense_id: data.id }));
  const { error: splitError } = await supabase.from('expense_splits').insert(splitsWithExpenseId);
  if (splitError) throw splitError;

  await addGroupLog(expense.group_id, expense.paid_by, 'expense_added',
    `Added "${expense.description || 'expense'}" for ${expense.amount}`);

  return data;
};

export const deleteGroupExpense = async (id, groupId, userId, description) => {
  const { data, error } = await supabase.from('group_expenses').delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Permission denied or expense not found');
  await addGroupLog(groupId, userId, 'expense_deleted', `Deleted "${description || 'expense'}"`);
};

export const sendGroupInvite = async (groupId, inviterId, inviteeEmail) => {
  const { data, error } = await supabase.from('group_invitations').insert({
    group_id: groupId,
    inviter_id: inviterId,
    invitee_email: inviteeEmail.toLowerCase().trim(),
  }).select().single();
  
  if (error) throw error;
  return data;
};

export const fetchPendingInvites = async (email) => {
  if (!email) return [];
  const { data, error } = await supabase
    .from('group_invitations')
    .select('id, group_id, inviter_id, status, created_at, groups(name, description), profiles(full_name)')
    .eq('invitee_email', email.toLowerCase().trim())
    .eq('status', 'pending');
    
  if (error) throw error;
  return data || [];
};

export const respondToInvite = async (inviteId, groupId, userId, accept) => {
  const status = accept ? 'accepted' : 'rejected';
  
  const { error: updateError } = await supabase
    .from('group_invitations')
    .update({ status })
    .eq('id', inviteId);
    
  if (updateError) throw updateError;
  
  if (accept) {
    const { error: insertError } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId });
      
    if (insertError) throw insertError;
  }
};
export const fetchProfile = async (userId) => {
  if (!userId) return null;
  const { data, error } = await supabase.from('profiles').select('wallet_balance, avatar_url').eq('id', userId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || { wallet_balance: 0, avatar_url: null };
};

export const updateWalletBalance = async (userId, balance) => {
  if (!userId) return null;
  const { data, error } = await supabase.from('profiles').update({ wallet_balance: balance }).eq('id', userId).select().single();
  if (error) throw error;
  return data;
};

export const fetchAITipCache = async (userId) => {
  if (!userId) return null;
  const { data, error } = await supabase.from('user_ai_tips').select('*').eq('user_id', userId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const saveAITipCache = async (userId, tipContent) => {
  if (!userId || !tipContent) return;
  const { data, error } = await supabase
    .from('user_ai_tips')
    .upsert({ user_id: userId, tip_content: tipContent, updated_at: new Date().toISOString() })
    .select().single();
  if (error) throw error;
  return data;
};

export const deleteGroup = async (groupId) => {
  const { data, error } = await supabase.from('groups').delete().eq('id', groupId).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Permission denied or group not found');
};

export const markSplitPaid = async (splitId, isPaid) => {
  const { error } = await supabase
    .from('expense_splits')
    .update({ is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : null })
    .eq('id', splitId);
  if (error) throw error;
};

export const fetchGroupLog = async (groupId) => {
  const { data, error } = await supabase
    .from('group_activity_log')
    .select('*, profiles:user_id(full_name, avatar_url)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
};

export const addGroupLog = async (groupId, userId, action, description) => {
  if (!groupId) return;
  const { error } = await supabase.from('group_activity_log').insert({
    group_id: groupId, user_id: userId, action, description,
  });
  if (error) console.warn('Log error:', error.message);
};

export const fetchGroupContributions = async (groupId) => {
  const { data, error } = await supabase
    .from('group_budget_contributions')
    .select('*')
    .eq('group_id', groupId);
  if (error) throw error;
  return data || [];
};

export const upsertContribution = async (groupId, userId, amount) => {
  const { data, error } = await supabase
    .from('group_budget_contributions')
    .upsert({ group_id: groupId, user_id: userId, amount }, { onConflict: 'group_id,user_id' })
    .select().single();
  if (error) throw error;
  return data;
};
