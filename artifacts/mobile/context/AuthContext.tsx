import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export type Role = 'super_admin' | 'gym_owner' | 'trainer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  gym_id?: string;
  branch_id?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(msg)), ms)
  );
  return Promise.race([promise, timeout]);
}

async function loadProfile(session: Session): Promise<User> {
  try {
    const { data: profile, error } = await withTimeout(
      supabase
        .from('profiles')
        .select('id, name, email, role, gym_id, branch_id')
        .eq('id', session.user.id)
        .maybeSingle(),
      8000,
      'Profile load timed out'
    );

    if (error || !profile) {
      const email = session.user.email || '';
      return {
        id: session.user.id,
        name: session.user.user_metadata?.name || email.split('@')[0] || 'Admin',
        email,
        role: 'super_admin',
      };
    }

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role as Role,
      gym_id: profile.gym_id ?? undefined,
      branch_id: profile.branch_id ?? undefined,
    };
  } catch {
    return {
      id: session.user.id,
      name: session.user.email?.split('@')[0] || 'User',
      email: session.user.email || '',
      role: 'gym_owner',
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialise — give getSession a hard timeout so we never hang forever
    withTimeout(supabase.auth.getSession(), 10000, 'Session check timed out')
      .then(async ({ data: { session } }) => {
        setSession(session);
        if (session) {
          const profile = await loadProfile(session);
          setUser(profile);
        }
      })
      .catch((err) => {
        console.warn('Auth init error:', err.message);
      })
      .finally(() => {
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const profile = await loadProfile(session);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        12000,
        'Sign in timed out. Please check your connection and try again.'
      );
      if (error) return error.message;
      return null;
    } catch (err: any) {
      return err.message || 'An unexpected error occurred';
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
