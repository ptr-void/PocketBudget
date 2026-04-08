import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, StatusBar, Image, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useExpenseStore } from '../store/stores';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme/theme';

export default function ProfileScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, signOut, signingOut } = useAuth();
  const { expenses } = useExpenseStore();
  const [exporting, setExporting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const CLOUD_NAME = 'defkzzqcs';
  const UPLOAD_PRESET = 'pocketbudget_avatars';

  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photo library to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('Too large', 'Image must be under 5MB');
      return;
    }
    setUploadingAvatar(true);
    try {
      const fileName = asset.uri.split('/').pop();
      const formData = new FormData();
      formData.append('file', { uri: asset.uri, type: 'image/jpeg', name: fileName });
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'pocketbudget/avatars');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
      const { updateProfile } = await import('../services/api');
      await updateProfile({ avatar_url: data.secure_url });
      Alert.alert('Success', 'Profile picture updated! Restart the app to see changes everywhere.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to upload image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleExportCSV = async () => {
    if (expenses.length === 0) {
      Alert.alert('No Data', 'No expenses to export');
      return;
    }
    setExporting(true);
    try {
      let csv = 'Date,Category,Amount,Note,Payment Method\n';
      expenses.forEach((e) => {
        csv += `${e.date},"${e.category_name || e.categories?.name || 'Other'}",${e.amount},"${e.note || ''}","${e.payment_method || ''}"\n`;
      });

      const fileUri = FileSystem.documentDirectory + 'pocketbudget_expenses.csv';
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Exported', `File saved to: ${fileUri}`);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleSignOut = () => {
    if (signingOut) return;
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const totalExpenses = expenses.length;
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const menuItems = [
    {
      icon: 'person',
      label: 'Edit Profile',
      onPress: () => navigation.navigate('EditProfile'),
      gradient: ['#EC4899', '#BE185D'],
    },
    {
      icon: 'sparkles',
      label: 'AI Insights',
      onPress: () => navigation.navigate('AIInsights'),
      gradient: ['#A78BFA', '#7C3AED'],
    },
    {
      icon: 'wallet',
      label: 'Budget Settings',
      onPress: () => navigation.navigate('Budget'),
      gradient: ['#F59E0B', '#D97706'],
    },
    {
      icon: 'grid',
      label: 'Categories',
      onPress: () => navigation.navigate('Categories'),
      gradient: ['#3B82F6', '#2563EB'],
    },
    {
      icon: 'download',
      label: exporting ? 'Exporting...' : 'Export to CSV',
      onPress: handleExportCSV,
      gradient: ['#10B981', '#059669'],
    },
    {
      icon: 'phone-portrait-outline',
      label: 'iOS Back Tap Guide',
      onPress: () => navigation.navigate('IOSGuide'),
      gradient: ['#3B82F6', '#2563EB'],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[isDark ? '#4C1D95' : '#8B5CF6', isDark ? '#0F0A1A' : '#F9FAFB']}
        locations={[0, 0.4]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.userCard, isDark ? styles.cardDark : styles.cardLight, Shadow.lg]}>
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarWrap} activeOpacity={0.85}>
            {user?.user_metadata?.avatar_url ? (
              <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.avatarGradient}>
                <Text style={styles.avatarText}>
                  {(user?.user_metadata?.full_name || 'U').charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.cameraBtn}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Ionicons name="camera" size={14} color="#FFF" />}
            </View>
          </TouchableOpacity>
          
          <Text style={[styles.userName, isDark && { color: '#FFF' }]}>
            {user?.user_metadata?.full_name || 'User'}
          </Text>
          <Text style={[styles.userEmail, isDark && { color: '#9CA3AF' }]}>{user?.email}</Text>

          <View style={[styles.statsContainer, isDark ? { backgroundColor: 'rgba(0,0,0,0.2)' } : { backgroundColor: '#F3F4F6' }]}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalExpenses}</Text>
              <Text style={[styles.statLabel, isDark && { color: '#9CA3AF' }]}>Expenses</Text>
            </View>
            <View style={[styles.statDivider, isDark ? { backgroundColor: 'rgba(255,255,255,0.1)' } : { backgroundColor: '#E5E7EB' }]} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {formatCurrency(totalSpent)}
              </Text>
              <Text style={[styles.statLabel, isDark && { color: '#9CA3AF' }]}>Total Spent</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, isDark && { color: '#9CA3AF' }]}>Preferences</Text>
        
        <View style={[styles.menuGroup, isDark ? styles.cardDark : styles.cardLight, Shadow.md]}>
          <View style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
            <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.menuIconGradient}>
              <Ionicons name="moon" size={20} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.menuLabel, isDark && { color: '#E5E7EB' }]}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
              thumbColor={Platform.OS === 'ios' ? '#FFF' : isDark ? '#FFF' : '#F3F4F6'}
            />
          </View>

          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.menuItem,
                i < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <LinearGradient colors={item.gradient} style={styles.menuIconGradient}>
                <Ionicons name={item.icon} size={20} color="#FFF" />
              </LinearGradient>
              <Text style={[styles.menuLabel, isDark && { color: '#E5E7EB' }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.signOutBtn, signingOut && { opacity: 0.5 }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
          disabled={signingOut}
        >
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.1)', 'rgba(220, 38, 38, 0.1)']}
            style={styles.signOutGradient}
          >
            {signingOut ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center', paddingTop: 60, paddingBottom: 20,
  },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  
  body: { flex: 1, paddingHorizontal: Spacing.xl },
  
  cardLight: { backgroundColor: '#FFF' },
  cardDark: { backgroundColor: 'rgba(31, 23, 53, 0.90)' },
  
  userCard: {
    padding: Spacing.xl, borderRadius: 24, alignItems: 'center', marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  avatarGradient: {
    width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  avatarWrap: { position: 'relative', marginBottom: Spacing.lg },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#FFF',
  },
  avatarText: { fontSize: 40, fontWeight: '800', color: '#FFF' },
  userName: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  userEmail: { fontSize: FontSize.md, color: '#6B7280', fontWeight: '500', marginBottom: Spacing.xl },
  
  statsContainer: {
    flexDirection: 'row', width: '100%', borderRadius: 16, paddingVertical: Spacing.md,
  },
  statBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#8B5CF6', marginBottom: 2 },
  statLabel: { fontSize: FontSize.xs, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: '80%', alignSelf: 'center' },
  
  sectionTitle: { fontSize: FontSize.sm, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md, marginLeft: 8 },
  
  menuGroup: { borderRadius: 24, marginBottom: Spacing.xl, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md,
  },
  menuIconGradient: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 17, fontWeight: '600', color: '#111827' },
  
  signOutBtn: { borderRadius: 20, overflow: 'hidden', marginTop: Spacing.md },
  signOutGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: Spacing.lg, gap: Spacing.sm,
  },
  signOutText: { fontSize: 18, fontWeight: '700', color: '#EF4444' },
});
