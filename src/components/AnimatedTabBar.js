import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function AnimatedTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();
  
  const slideAnim = useRef(new Animated.Value(0)).current;

  const TAB_WIDTH = width / state.routes.length;
  const INDICATOR_WIDTH = 32;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index * TAB_WIDTH + (TAB_WIDTH / 2) - (INDICATOR_WIDTH / 2),
      useNativeDriver: true,
      tension: 70,
      friction: 10,
    }).start();
  }, [state.index]);

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder }]}>
      
      {/* Sliding Indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: colors.primary,
            transform: [{ translateX: slideAnim }],
          }
        ]}
      />

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        let iconName;
        switch (route.name) {
          case 'Home': iconName = isFocused ? 'home' : 'home-outline'; break;
          case 'Add': iconName = isFocused ? 'add-circle' : 'add-circle-outline'; break;
          case 'History': iconName = isFocused ? 'time' : 'time-outline'; break;
          case 'Groups': iconName = isFocused ? 'people' : 'people-outline'; break;
          case 'Profile': iconName = isFocused ? 'person' : 'person-outline'; break;
        }

        const iconColor = isFocused ? colors.primary : colors.textMuted;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            {route.name === 'Add' ? (
              <Ionicons name="add-circle" size={32} color={colors.primary} />
            ) : (
              <Ionicons name={iconName} size={24} color={iconColor} />
            )}
            <Text style={[styles.tabLabel, { color: iconColor }]}>
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 88,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    elevation: 0,
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  indicator: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 8,
    width: 32,
    height: 4,
    borderRadius: 2,
    zIndex: 1,
  },
});
