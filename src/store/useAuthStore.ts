import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase, type Profile } from '../lib/supabase';

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  init: () => Promise<() => void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<Profile | null>;
  approveUser: (userId: string, approve: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await get().fetchProfile(session.user.id);
      set({ user: session.user, profile, loading: false });
    } else {
      set({ loading: false });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await get().fetchProfile(session.user.id);
        set({ user: session.user, profile });
      } else {
        set({ user: null, profile: null });
      }
    });

    return () => subscription.unsubscribe();
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    return null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    const profile = data as Profile;
    set({ profile });
    return profile;
  },

  approveUser: async (userId, approve) => {
    await supabase
      .from('profiles')
      .update({ is_approved: approve })
      .eq('id', userId);
  },
}));
