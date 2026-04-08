import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius, FontSize, Shadow } from '../theme/theme';

export default function IOSGuideScreen({ navigation }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
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
        <Text style={styles.headerTitle}>iOS Back Tap Guide</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight, Shadow.md]}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <Ionicons name="logo-apple" size={40} color="#3B82F6" />
          </View>
          <Text style={[styles.title, isDark && { color: '#FFF' }]}>Quick Add Expense via Back Tap</Text>
          <Text style={[styles.description, isDark && { color: '#9CA3AF' }]}>
            Did you know you can double-tap the back of your iPhone to instantly open the Quick Add Expense modal from anywhere on your phone?
          </Text>

          <View style={styles.stepContainer}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={[styles.stepTitle, isDark && { color: '#FFF' }]}>Open Shortcuts App</Text>
              <Text style={[styles.stepDesc, isDark && { color: '#9CA3AF' }]}>Create a new shortcut, add the "Open URLs" action, and set the URL to: <Text style={{ fontWeight: '700', color: '#8B5CF6' }}>pocketbudget://quick-add</Text></Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={[styles.stepTitle, isDark && { color: '#FFF' }]}>Go to iPhone Settings</Text>
              <Text style={[styles.stepDesc, isDark && { color: '#9CA3AF' }]}>Navigate to Settings → Accessibility → Touch → Back Tap.</Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={[styles.stepTitle, isDark && { color: '#FFF' }]}>Assign the Shortcut</Text>
              <Text style={[styles.stepDesc, isDark && { color: '#9CA3AF' }]}>Choose Double Tap or Triple Tap, scroll down to "Shortcuts", and select the shortcut you just created!</Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={[styles.stepBadge, { backgroundColor: '#10B981' }]}>
              <Ionicons name="checkmark" size={16} color="#FFF" />
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={[styles.stepTitle, isDark && { color: '#FFF' }]}>Try it out!</Text>
              <Text style={[styles.stepDesc, isDark && { color: '#9CA3AF' }]}>Now just tap the back of your phone twice to pop up the add expense screen instantly.</Text>
            </View>
          </View>

        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  
  body: { flex: 1, paddingHorizontal: Spacing.xl },
  card: { padding: Spacing.xl, borderRadius: 24, alignItems: 'center' },
  cardLight: { backgroundColor: '#FFF' },
  cardDark: { backgroundColor: 'rgba(31, 23, 53, 0.90)' },
  
  iconBox: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: Spacing.sm },
  description: { fontSize: 15, color: '#4B5563', textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
  
  stepContainer: { flexDirection: 'row', width: '100%', marginBottom: Spacing.xl, paddingRight: Spacing.md },
  stepBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, marginTop: 2 },
  stepNumber: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  stepTextContainer: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  stepDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
});
