import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView,
  TextInput, Alert, Modal, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCategoryStore } from '../store/stores';
import { DEFAULT_CATEGORIES, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme/theme';

const ICON_OPTIONS = [
  'fast-food', 'car', 'flash', 'bag-handle', 'game-controller', 'medkit',
  'school', 'cart', 'body', 'airplane', 'repeat', 'home', 'paw', 'gift',
  'cafe', 'fitness', 'musical-notes', 'construct', 'book', 'globe',
];

const COLOR_OPTIONS = [
  '#F59E0B', '#3B82F6', '#EF4444', '#EC4899', '#8B5CF6', '#10B981',
  '#6366F1', '#14B8A6', '#F472B6', '#0EA5E9', '#A855F7', '#6B7280',
];

export default function CategoriesScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { categories, addCategory, fetchCategories, deleteCategory } = useCategoryStore();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('fast-food');
  const [newColor, setNewColor] = useState('#8B5CF6');

  useEffect(() => {
    if (user) fetchCategories(user.id);
  }, [user]);

  const handleAdd = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    await addCategory({
      name: newName.trim(),
      icon: newIcon,
      color: newColor,
      user_id: user?.id,
      is_default: false,
    });
    setShowModal(false);
    setNewName('');
  };

  const handleDelete = (item) => {
    Alert.alert('Delete Category', `Are you sure you want to delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(item.id) },
    ]);
  };

  const renderCategory = ({ item }) => {
    const isDefault = item.is_default || DEFAULT_CATEGORIES.some(c => c.id === item.id);
    const catColor = item.color || colors.primary;
    
    return (
      <View style={[styles.categoryCard, isDark ? styles.cardDark : styles.cardLight, Shadow.md]}>
        {!isDefault && (
          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash" size={16} color="#EF4444" />
          </TouchableOpacity>
        )}
        <View style={[styles.iconBox, { backgroundColor: catColor + '15' }]}>
          <Ionicons name={item.icon || 'ellipsis-horizontal'} size={28} color={catColor} />
        </View>
        <Text style={[styles.categoryName, isDark && { color: '#FFF' }]} numberOfLines={1}>
          {item.name}
        </Text>
        {isDefault && (
          <View style={[styles.badge, { backgroundColor: catColor + '15' }]}>
            <Text style={[styles.badgeText, { color: catColor }]}>Default</Text>
          </View>
        )}
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.backBtn}>
          <View style={styles.glassIcon}>
            <Ionicons name="add" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={showModal} transparent animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, isDark ? styles.modalDark : styles.modalLight]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && { color: '#FFF' }]}>New Category</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.inputContainer, isDark ? styles.inputDark : styles.inputLight]}>
                <TextInput
                  style={[styles.input, isDark && { color: '#FFF' }]}
                  placeholder="Category Name"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              <Text style={[styles.label, isDark && { color: '#9CA3AF' }]}>Pick an Icon</Text>
              <View style={styles.optionsGrid}>
                {ICON_OPTIONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      newIcon === icon ? { backgroundColor: newColor, borderColor: newColor } : [isDark ? styles.iconOptionDark : styles.iconOptionLight],
                    ]}
                    onPress={() => setNewIcon(icon)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={icon} 
                      size={24} 
                      color={newIcon === icon ? '#FFF' : (isDark ? '#9CA3AF' : '#6B7280')} 
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, isDark && { color: '#9CA3AF' }]}>Pick a Color</Text>
              <View style={[styles.optionsGrid, { marginBottom: 30 }]}>
                {COLOR_OPTIONS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewColor(color)}
                    activeOpacity={0.8}
                  >
                    {newColor === color && <Ionicons name="checkmark" size={16} color="#FFF" />}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleAdd}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[newColor, newColor + 'CC']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.addBtn, { shadowColor: newColor }]}
                >
                  <Text style={styles.addBtnText}>Create Category</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  
  list: { padding: Spacing.xl, paddingBottom: 24 },
  row: { justifyContent: 'space-between', marginBottom: Spacing.lg },
  
  categoryCard: {
    width: '47%', padding: Spacing.lg, borderRadius: 24,
    alignItems: 'center', gap: Spacing.md,
  },
  cardLight: { backgroundColor: '#FFF' },
  cardDark: { backgroundColor: 'rgba(31, 23, 53, 0.90)' },
  
  iconBox: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  categoryName: { fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: -4 },
  badgeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  deleteBtn: { position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(239, 68, 68, 0.1)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: Spacing.xl, maxHeight: '90%' },
  modalLight: { backgroundColor: '#FFF' },
  modalDark: { backgroundColor: '#1F1735' },
  
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  modalCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(156, 163, 175, 0.1)', alignItems: 'center', justifyContent: 'center' },
  
  inputContainer: { borderRadius: 16, paddingHorizontal: Spacing.lg, height: 56, justifyContent: 'center', marginBottom: Spacing.xl },
  inputLight: { backgroundColor: '#F3F4F6' },
  inputDark: { backgroundColor: 'rgba(0,0,0,0.3)' },
  input: { fontSize: 18, fontWeight: '600' },
  
  label: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: Spacing.md, marginLeft: 4 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  
  iconOption: {
    width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  iconOptionLight: { backgroundColor: '#FFF', borderColor: '#E5E7EB' },
  iconOptionDark: { backgroundColor: 'rgba(31, 23, 53, 0.6)', borderColor: 'rgba(255,255,255,0.05)' },
  
  colorOption: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  colorOptionSelected: { borderWidth: 4, borderColor: 'rgba(255,255,255,0.7)' },
  
  addBtn: { 
    height: 60, borderRadius: 24, alignItems: 'center', justifyContent: 'center', 
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  addBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
});
