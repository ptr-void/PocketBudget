import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import QuickAddModal from './src/components/QuickAddModal';

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'pocketbudget://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Add: 'add',
          Groups: 'groups',
          Profile: 'profile',
        },
      },
      AddExpense: 'add-expense',
      Budget: 'budget',
      Categories: 'categories',
      GroupDetail: 'group/:groupId',
    },
  },
};

export default function App() {
  const [showQuickAdd, setShowQuickAdd] = useState(false);


  const handleDeepLink = useCallback((event) => {
    const url = event.url || event;
    if (typeof url === 'string' && url.includes('quick-add')) {
      setShowQuickAdd(true);
    }
  }, []);

  useEffect(() => {

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });


    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription?.remove();
  }, [handleDeepLink]);

  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer linking={linking}>
          <AppNavigator />
          <QuickAddModal
            visible={showQuickAdd}
            onClose={() => setShowQuickAdd(false)}
          />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}
