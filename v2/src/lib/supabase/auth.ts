import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Could not read auth session. ${error.message}`);
  }

  return data.session?.user ?? null;
}

export async function signInWithEmail(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Please enter your email address.');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
  });

  if (error) {
    throw new Error(`Could not send sign-in email. ${error.message}`);
  }
}

export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Could not sign out. ${error.message}`);
  }
}

export function subscribeToAuthChanges(callback: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return data.subscription;
}
