import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase, type Profile } from '../lib/supabase';
import { useFinanceStore } from './useFinanceStore';

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  init: () => Promise<() => void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, fullName?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<Profile | null>;
  approveUser: (userId: string, approve: boolean) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<string | null>;
  updatePassword: (newPassword: string) => Promise<string | null>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await get().fetchProfile(session.user.id);
      set({ user: session.user, profile });
      if (profile?.is_approved) {
        await useFinanceStore.getState().loadFromCloud(session.user.id);
      }
    }
    set({ loading: false });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only reload data on actual sign-in, not on token refreshes (which happen every ~60 min)
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await get().fetchProfile(session.user.id);
        set({ user: session.user, profile });
        if (profile?.is_approved) {
          await useFinanceStore.getState().loadFromCloud(session.user.id);
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Just refresh the session reference without reloading data
        set({ user: session.user });
      } else if (!session?.user) {
        set({ user: null, profile: null });
        useFinanceStore.getState().resetStore();
      }
    });

    return () => subscription.unsubscribe();
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  },

  signUp: async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: fullName ? { data: { full_name: fullName } } : undefined,
    });
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

  requestPasswordReset: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return error.message;
    return null;
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return error.message;
    return null;
  },
}));
