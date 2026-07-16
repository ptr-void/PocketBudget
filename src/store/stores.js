import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CATEGORIES } from '../theme/theme';
import * as api from '../services/api';

export const useExpenseStore = create(
  persist(
    (set, get) => ({
      expenses: [],
      addQueue: [], 
      loading: false,
      error: null,

      fetchExpenses: async (userId) => {
        set({ loading: true, error: null });
        try {
          
          const data = await api.fetchExpenses(userId);
          
          
          const state = get();
          let finalData = data;
          set({ expenses: finalData, loading: false });
        } catch (error) {
          
          set({ error: error.message, loading: false });
        }
      },

      addExpense: async (expense) => {
        try {
          const data = await api.addExpense(expense);
          set((state) => ({ expenses: [data, ...state.expenses] }));
          
          return data;
        } catch (error) {
          
          const localExpense = { ...expense, id: `local_${Date.now()}`, _offline: true };
          set((state) => ({ 
            expenses: [localExpense, ...state.expenses],
            addQueue: [...(state.addQueue || []), localExpense]
          }));
          return localExpense;
        }
      },

      syncOfflineExpenses: async (userId) => {
        const queue = get().addQueue || [];
        if (queue.length === 0) return;
        
        const newQueue = [];
        for (const item of queue) {
          try {
            const { id, _offline, ...dbPayload } = item;
            if (dbPayload.user_id === 'offline') {
              dbPayload.user_id = userId;
            }
            await api.addExpense(dbPayload);
          } catch (err) {
            newQueue.push(item);
          }
        }
        
        
        set({ addQueue: newQueue });
        
        
        
      },

      updateExpense: async (id, updates) => {
        try {
          const data = await api.updateExpense(id, updates);
          set((state) => ({
            expenses: state.expenses.map((e) => (e.id === id ? data : e)),
          }));
        } catch (error) {
          
          set((state) => ({
            expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
          }));
        }
      },

      deleteExpense: async (id) => {
        try {
          await api.deleteExpense(id);
        } catch {}
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        }));
      },

      getTotal: (period = 'monthly') => {
        const expenses = get().expenses;
        const now = new Date();
        return expenses
          .filter((e) => {
            const d = new Date(e.date);
            if (period === 'daily') return d.toDateString() === now.toDateString();
            if (period === 'weekly') {
              const weekAgo = new Date(now);
              weekAgo.setDate(weekAgo.getDate() - 7);
              return d >= weekAgo;
            }
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          })
          .reduce((sum, e) => sum + (e.amount || 0), 0);
      },
    }),
    {
      name: 'pocketbudget-expenses',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useBudgetStore = create(
  persist(
    (set, get) => ({
      budgets: { daily: 0, weekly: 0, monthly: 0 },
      addQueue: [],
      loading: false,

      fetchBudgets: async (userId) => {
        set({ loading: true });
        try {
          const data = await api.fetchBudgets(userId);
          const budgets = { daily: 0, weekly: 0, monthly: 0 };
          data.forEach((b) => { budgets[b.period] = b.amount; });
          set({ budgets, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      setBudget: async (userId, period, amount) => {
        set((state) => ({
          budgets: { ...state.budgets, [period]: amount },
        }));
        try {
          await api.upsertBudget({ user_id: userId, period, amount });
        } catch {
          set((state) => ({
            addQueue: [...(state.addQueue || []), { user_id: userId, period, amount, _type: 'budget' }],
          }));
        }
      },

      syncOfflineBudgets: async (userId) => {
        const queue = get().addQueue || [];
        if (queue.length === 0) return;
        const newQueue = [];
        for (const item of queue) {
          try {
            await api.upsertBudget({ user_id: userId, period: item.period, amount: item.amount });
          } catch {
            newQueue.push(item);
          }
        }
        set({ addQueue: newQueue });
      },
    }),
    {
      name: 'pocketbudget-budgets',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useCategoryStore = create(
  persist(
    (set, get) => ({
      categories: DEFAULT_CATEGORIES,
      addQueue: [],
      loading: false,

      fetchCategories: async (userId) => {
        set({ loading: true });
        try {
          const data = await api.fetchCategories(userId);
          if (data.length > 0) {
            const dbIds = new Set(data.map(d => d.id));
            const merged = [...DEFAULT_CATEGORIES.filter(c => !dbIds.has(c.id)), ...data];
            set({ categories: merged, loading: false });
          } else {
            set({ loading: false });
          }
        } catch {
          set({ loading: false });
        }
      },

      addCategory: async (category) => {
        try {
          const data = await api.addCategory(category);
          set((state) => ({ categories: [...state.categories, data] }));
        } catch {
          const local = { ...category, id: `local_${Date.now()}`, _offline: true };
          set((state) => ({
            categories: [...state.categories, local],
            addQueue: [...(state.addQueue || []), local],
          }));
        }
      },

      deleteCategory: async (id) => {
        try {
          await api.deleteCategory(id);
        } catch {}
        set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
      },

      syncOfflineCategories: async (userId) => {
        const queue = get().addQueue || [];
        if (queue.length === 0) return;
        const newQueue = [];
        for (const item of queue) {
          try {
            const { id, _offline, ...payload } = item;
            if (payload.user_id === 'offline') payload.user_id = userId;
            await api.addCategory(payload);
          } catch {
            newQueue.push(item);
          }
        }
        set({ addQueue: newQueue });
      },
    }),
    {
      name: 'pocketbudget-categories',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useGroupStore = create(
  persist(
    (set, get) => ({
      groups: [],
      invites: [],
      loading: false,

      fetchGroups: async (userId) => {
        set({ loading: true });
        try {
          const data = await api.fetchGroups(userId);
          set({ groups: data, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      createGroup: async (group, userId) => {
        try {
          const data = await api.createGroup(group);
          await api.addGroupMember(data.id, userId);
          set((state) => ({ groups: [...state.groups, data] }));
          return data;
        } catch (error) {
          throw error;
        }
      },

      fetchInvites: async (email) => {
        try {
          const data = await api.fetchPendingInvites(email);
          set({ invites: data });
        } catch (error) {
          console.error('Error fetching invites:', error);
        }
      },

      respondInvite: async (inviteId, groupId, userId, accept) => {
        try {
          await api.respondToInvite(inviteId, groupId, userId, accept);
          set((state) => ({
            invites: state.invites.filter((i) => i.id !== inviteId),
          }));
          if (accept) {
            await get().fetchGroups(userId);
          }
        } catch (error) {
          throw error;
        }
      },
    }),
    {
      name: 'pocketbudget-groups',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useProfileStore = create(
  persist(
    (set, get) => ({
      profile: { wallet_balance: 0, avatar_url: null },
      addQueue: [],
      loading: false,

      fetchProfile: async (userId) => {
        set({ loading: true });
        try {
          const data = await api.fetchProfile(userId);
          set({ profile: data || { wallet_balance: 0, avatar_url: null }, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      updateWalletBalance: async (userId, balance) => {
        set((state) => ({ profile: { ...state.profile, wallet_balance: balance } }));
        try {
          await api.updateWalletBalance(userId, balance);
        } catch {
          set((state) => ({
            addQueue: [...(state.addQueue || []), { user_id: userId, balance, _type: 'wallet' }],
          }));
        }
      },

      syncOfflineProfile: async (userId) => {
        const queue = get().addQueue || [];
        if (queue.length === 0) return;
        const last = queue[queue.length - 1];
        try {
          await api.updateWalletBalance(userId, last.balance);
          set({ addQueue: [] });
        } catch {}
      },
    }),
    {
      name: 'pocketbudget-profile',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
