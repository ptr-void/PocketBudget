import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';


const SUPABASE_URL = 'https://uqanhymsmakccfhupddx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxYW5oeW1zbWFrY2NmaHVwZGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODM3MjUsImV4cCI6MjA5MDM1OTcyNX0.IWW4X8IvZYu_ZxDpx0wJU4V-kCspYMe2mtLfeMuKKeM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
