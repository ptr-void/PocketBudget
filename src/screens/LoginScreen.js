import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { signIn } from '../services/api';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme/theme';

export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { enterOfflineMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err) {
      if (err.message.includes('Email not confirmed')) {
        setError('Email not confirmed. Try signing up again if you disabled confirmations recently.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[isDark ? '#4C1D95' : '#8B5CF6', isDark ? '#0F0A1A' : '#1F1735']}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <View style={[styles.logoContainer, Shadow.lg]}>
            <LinearGradient
              colors={['#A78BFA', '#7C3AED']}
              style={styles.logoGradient}
            >
              <Ionicons name="wallet" size={42} color="#FFF" />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>PocketBudget</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Enter your details to sign in</Text>
        </View>

        <View style={[styles.formCard, isDark ? styles.formCardDark : styles.formCardLight]}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#F87171" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={[styles.inputContainer, isDark ? styles.inputDark : styles.inputLight]}>
            <Ionicons name="mail-outline" size={20} color={isDark ? '#D1D5DB' : '#6B7280'} />
            <TextInput
              style={[styles.input, { color: isDark ? '#FFF' : '#111827' }]}
              placeholder="hello@pocketbudget.com"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.inputLabel}>Password</Text>
          <View style={[styles.inputContainer, isDark ? styles.inputDark : styles.inputLight]}>
            <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#D1D5DB' : '#6B7280'} />
            <TextInput
              style={[styles.input, { color: isDark ? '#FFF' : '#111827' }]}
              placeholder="••••••••"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={isDark ? '#D1D5DB' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.offlineBtn} onPress={enterOfflineMode} activeOpacity={0.7}>
          <Ionicons name="cloud-offline-outline" size={18} color="rgba(255,255,255,0.6)" />
          <Text style={styles.offlineBtnText}>Continue Offline</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logoContainer: {
    width: 80, height: 80, borderRadius: 24,
    marginBottom: Spacing.lg, overflow: 'hidden',
  },
  logoGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  subtitle: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.8)', marginTop: Spacing.xs },
  appName: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: Spacing.lg, letterSpacing: 2, textTransform: 'uppercase' },
  
  formCard: {
    borderRadius: 24, padding: Spacing.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  formCardLight: { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
  formCardDark: { backgroundColor: 'rgba(31, 23, 53, 0.90)' },
  
  errorBox: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.sm,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: BorderRadius.md, marginBottom: Spacing.lg, gap: Spacing.xs,
  },
  errorText: { fontSize: FontSize.sm, color: '#F87171', flex: 1, fontWeight: '500' },
  
  inputLabel: { fontSize: FontSize.sm, fontWeight: '600', color: '#9CA3AF', marginBottom: Spacing.xs, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md,
    height: 56, marginBottom: Spacing.lg, gap: Spacing.sm,
  },
  inputLight: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  inputDark: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  input: { flex: 1, fontSize: FontSize.md, fontWeight: '500' },
  
  forgotPassword: { alignSelf: 'flex-end', color: '#8B5CF6', fontWeight: '600', marginBottom: Spacing.xl },
  
  button: {
    height: 56, borderRadius: BorderRadius.lg, alignItems: 'center',
    justifyContent: 'center', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  buttonText: { color: '#FFF', fontSize: FontSize.lg, fontWeight: '700', letterSpacing: 0.5 },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl + 10 },
  footerText: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.7)' },
  footerLink: { fontSize: FontSize.md, fontWeight: '700', color: '#A78BFA' },
  
  offlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg, gap: 6, paddingVertical: Spacing.md },
  offlineBtnText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
});
