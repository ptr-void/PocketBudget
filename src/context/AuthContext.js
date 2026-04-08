import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setSigningOut(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return; 
    setSigningOut(true);
    try {
      setOfflineMode(false);
      
      await AsyncStorage.multiRemove([
        'pocketbudget-expenses',
        'pocketbudget-budgets',
        'pocketbudget-categories',
        'pocketbudget-groups',
      ]);
      await supabase.auth.signOut();
    } catch {
      setSigningOut(false);
    }
  };

  const enterOfflineMode = () => {
    
    setOfflineMode(true);
    setUser({ id: 'offline', email: 'offline@local', user_metadata: { full_name: 'Offline User' } });
    setSession({ access_token: 'offline' });
    setLoading(false);
  };

  const value = {
    user,
    session,
    loading,
    signingOut,
    offlineMode,
    signOut: handleSignOut,
    enterOfflineMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
