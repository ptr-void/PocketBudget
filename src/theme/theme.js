

export const Colors = {
  light: {
    primary: '#7C3AED',
    primaryLight: '#A78BFA',
    primaryDark: '#6D28D9',
    accent: '#8B5CF6',
    background: '#F5F3FF',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    info: '#3B82F6',
    gradient: ['#7C3AED', '#A78BFA'],
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    inputBg: '#F9FAFB',
    shadow: 'rgba(124, 58, 237, 0.1)',
  },
  dark: {
    primary: '#A78BFA',
    primaryLight: '#C4B5FD',
    primaryDark: '#7C3AED',
    accent: '#C4B5FD',
    background: '#0F0A1A',
    surface: '#1A1128',
    card: '#1F1735',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textMuted: '#9CA3AF',
    border: '#2D2640',
    danger: '#F87171',
    dangerLight: '#451A1A',
    success: '#34D399',
    successLight: '#0D3326',
    warning: '#FBBF24',
    warningLight: '#3D2E0A',
    info: '#60A5FA',
    gradient: ['#7C3AED', '#4C1D95'],
    tabBar: '#1A1128',
    tabBarBorder: '#2D2640',
    inputBg: '#1F1735',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
};

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const Shadow = {
  sm: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: 'cash-outline' },
  { id: 'credit', label: 'Credit Card', icon: 'card-outline' },
  { id: 'debit', label: 'Debit Card', icon: 'card-outline' },
  { id: 'ewallet', label: 'E-Wallet', icon: 'phone-portrait-outline' },
  { id: 'bank', label: 'Bank Transfer', icon: 'business-outline' },
];

export const DEFAULT_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: 'fast-food', color: '#F59E0B' },
  { id: 'transport', name: 'Transport', icon: 'car', color: '#3B82F6' },
  { id: 'bills', name: 'Bills & Utilities', icon: 'flash', color: '#EF4444' },
  { id: 'shopping', name: 'Shopping', icon: 'bag-handle', color: '#EC4899' },
  { id: 'entertainment', name: 'Entertainment', icon: 'game-controller', color: '#8B5CF6' },
  { id: 'health', name: 'Health', icon: 'medkit', color: '#10B981' },
  { id: 'education', name: 'Education', icon: 'school', color: '#6366F1' },
  { id: 'groceries', name: 'Groceries', icon: 'cart', color: '#14B8A6' },
  { id: 'personal', name: 'Personal Care', icon: 'body', color: '#F472B6' },
  { id: 'travel', name: 'Travel', icon: 'airplane', color: '#0EA5E9' },
  { id: 'subscriptions', name: 'Subscriptions', icon: 'repeat', color: '#A855F7' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
];
