import { format, isToday, isYesterday, isThisWeek, isThisMonth, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

export const formatCurrency = (amount, currency = '₱') => {
  return `${currency}${Number(amount || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
};

export const formatDateShort = (dateString) => {
  return format(new Date(dateString), 'MMM d');
};

export const groupExpensesByDate = (expenses) => {
  const groups = {};
  expenses.forEach((expense) => {
    const key = format(new Date(expense.date), 'yyyy-MM-dd');
    if (!groups[key]) groups[key] = [];
    groups[key].push(expense);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => new Date(b) - new Date(a))
    .map(([date, items]) => ({ date, items, total: items.reduce((s, e) => s + e.amount, 0) }));
};

export const getSpendingByCategory = (expenses) => {
  const map = {};
  expenses.forEach((e) => {
    const cat = e.category_name || e.categories?.name || 'Other';
    map[cat] = (map[cat] || 0) + e.amount;
  });
  return Object.entries(map)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
};

export const getLast7DaysSpending = (expenses) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const label = format(date, 'EEE');
    const total = expenses
      .filter((e) => format(new Date(e.date), 'yyyy-MM-dd') === dateStr)
      .reduce((s, e) => s + e.amount, 0);
    days.push({ label, total });
  }
  return days;
};

export const computeSplits = (totalAmount, members) => {
  const perPerson = totalAmount / members.length;
  return members.map((m) => ({
    user_id: m.user_id || m.id,
    amount: Math.round(perPerson * 100) / 100,
  }));
};

export const computeBalances = (groupExpenses, members) => {
  const balances = {};
  members.forEach((m) => {
    const id = m.user_id || m.id;
    balances[id] = { name: m.full_name || m.name || m.email, balance: 0 };
  });

  groupExpenses.forEach((ge) => {
    const paidById = ge.paid_by;
    const splits = ge.expense_splits || [];
    splits.forEach((s) => {
      if (s.user_id !== paidById) {
        balances[s.user_id].balance -= s.amount; 
        balances[paidById].balance += s.amount; 
      }
    });
  });

  return Object.entries(balances).map(([id, data]) => ({ id, ...data }));
};
