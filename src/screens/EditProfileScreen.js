import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import { Spacing, Shadow } from '../theme/theme';

export default function EditProfileScreen({ navigation }) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ full_name: fullName.trim() });
      Alert.alert('Success', 'Profile updated successfully.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.body}>
        <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight, Shadow.md]}>
          <Text style={[styles.label, isDark && { color: '#9CA3AF' }]}>Full Name</Text>
          <View style={[styles.inputBox, isDark ? styles.inputDark : styles.inputLight]}>
            <Ionicons name="person-outline" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <TextInput
              style={[styles.input, isDark && { color: '#FFF' }]}
              placeholder="Your Name"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
          
          <Text style={[styles.label, isDark && { color: '#9CA3AF'}, { marginTop: Spacing.lg }]}>Email Address</Text>
          <View style={[styles.inputBox, isDark ? styles.inputDark : styles.inputLight, { opacity: 0.6 }]}>
            <Ionicons name="mail-outline" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <TextInput
              style={[styles.input, isDark && { color: '#FFF' }]}
              value={user?.email}
              editable={false}
            />
          </View>
          <Text style={styles.helpText}>Email cannot be changed directly.</Text>

          <TouchableOpacity 
            style={styles.saveBtnContainer} 
            onPress={handleSave} 
            activeOpacity={0.8}
            disabled={loading}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 30, paddingHorizontal: Spacing.xl,
  },
  backBtn: { borderRadius: 24 },
  glassIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  
  body: { flex: 1, paddingHorizontal: Spacing.xl },
  card: { padding: Spacing.xl, borderRadius: 24 },
  cardLight: { backgroundColor: '#FFF' },
  cardDark: { backgroundColor: 'rgba(31, 23, 53, 0.90)' },
  
  label: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: Spacing.sm, marginLeft: 4 },
  
  inputBox: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: Spacing.lg, height: 56,
    gap: Spacing.md,
  },
  inputLight: { backgroundColor: '#F3F4F6' },
  inputDark: { backgroundColor: 'rgba(0,0,0,0.3)' },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' },
  
  helpText: { fontSize: 13, color: '#9CA3AF', marginTop: 8, marginLeft: 4 },
  
  saveBtnContainer: { marginTop: Spacing.xl, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  saveBtn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
});
