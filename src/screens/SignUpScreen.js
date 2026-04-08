import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { signUp, signIn } from '../services/api';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme/theme';

export default function SignUpScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUp(email, password, fullName);
      
      
      try {
        await signIn(email, password);
        return; 
      } catch (signInErr) {
        if (signInErr.message.includes('Email not confirmed')) {
          setSuccess(true); 
        }
      }
    } catch (err) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#8B5CF6', '#4C1D95']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.content}>
          <View style={[styles.successIcon, Shadow.lg]}>
            <Ionicons name="mail-open" size={64} color="#FFF" />
          </View>
          <Text style={styles.successTitle}>Check Your Email!</Text>
          <Text style={styles.successSubtitle}>
            We've sent a confirmation link to {email}. Please verify your account.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
            style={{ width: '100%', paddingHorizontal: Spacing.xl }}
          >
            <View style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Go to Sign In</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start taking control of your money</Text>
        </View>

        <View style={[styles.formCard, isDark ? styles.formCardDark : styles.formCardLight]}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#F87171" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={[styles.inputContainer, isDark ? styles.inputDark : styles.inputLight]}>
            <Ionicons name="person-outline" size={20} color={isDark ? '#D1D5DB' : '#6B7280'} />
            <TextInput
              style={[styles.input, { color: isDark ? '#FFF' : '#111827' }]}
              placeholder="John Doe"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

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
              placeholder="Min. 6 characters"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity onPress={handleSignUp} disabled={loading} activeOpacity={0.8}>
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl },
  
  successIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: Spacing.xl,
  },
  successTitle: { fontSize: 32, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: Spacing.md },
  successSubtitle: { fontSize: FontSize.lg, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: Spacing.xxl, paddingHorizontal: Spacing.lg },
  secondaryButton: {
    height: 56, borderRadius: BorderRadius.lg, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  secondaryButtonText: { color: '#7C3AED', fontSize: FontSize.lg, fontWeight: '700' },

  backButton: { position: 'absolute', top: 60, left: Spacing.xl, zIndex: 10 },
  header: { alignItems: 'flex-start', marginBottom: Spacing.xl, marginTop: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  subtitle: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.8)', marginTop: Spacing.xs },
  
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
  inputLight: { backgroundColor: '#F3F4F6' },
  inputDark: { backgroundColor: 'rgba(0,0,0,0.3)' },
  input: { flex: 1, fontSize: FontSize.md, fontWeight: '500' },
  
  button: {
    height: 56, borderRadius: BorderRadius.lg, alignItems: 'center',
    justifyContent: 'center', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginTop: Spacing.md,
  },
  buttonText: { color: '#FFF', fontSize: FontSize.lg, fontWeight: '700', letterSpacing: 0.5 },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl + 10 },
  footerText: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.7)' },
  footerLink: { fontSize: FontSize.md, fontWeight: '700', color: '#A78BFA' },
});
