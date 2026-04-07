import { supabase } from '../supabase';
import type { CreateMemoryInput, Memory, Person } from '../utils/types';

type PersonRow = {
  id: string;
  room_no: string | null;
  full_name: string;
  photo_url: string | null;
  allowed_email?: string | null;
};

type MemoryRow = {
  id: string;
  recipient_id: string;
  author_id: string;
  author_name: string;
  message: string;
  created_at: string;
};

export async function fetchPeople(): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select('id, room_no, full_name, photo_url')
    .order('full_name', { ascending: true });

  if (error) {
    throw new Error(formatSupabaseError(error.message, 'load people', 'people'));
  }

  return (data ?? []).map(mapPersonRow);
}

export async function resolvePersonByAllowedEmail(email: string): Promise<Person | null> {
  const normalized = email.trim().toLowerCase();

  if (!normalized) return null;

  const { data, error } = await supabase
    .from('people')
    .select('id, room_no, full_name, photo_url, allowed_email')
    .ilike('allowed_email', normalized)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError(error.message, 'resolve roster person', 'people'));
  }

  if (!data) return null;
  return mapPersonRow(data);
}

export async function fetchMemoriesByRecipient(recipientId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('id, recipient_id, author_id, author_name, message, created_at')
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(formatSupabaseError(error.message, 'load memories', 'memories'));
  }

  return (data ?? []).map(mapMemoryRow);
}

export async function createMemory(input: CreateMemoryInput): Promise<void> {
  const { error } = await supabase.from('memories').insert({
    recipient_id: input.recipientId,
    author_id: input.authorId,
    author_name: input.authorName,
    message: input.message,
  });

  if (error) {
    throw new Error(formatSupabaseError(error.message, 'save memory', 'memories'));
  }
}

type EnsureProfileInput = {
  userId: string;
  personId: string;
  email: string;
};

export async function ensureProfileForUser(input: EnsureProfileInput): Promise<void> {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: input.userId,
      person_id: input.personId,
      email: input.email.toLowerCase(),
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw new Error(formatSupabaseError(error.message, 'sync profile', 'profiles'));
  }
}

function mapPersonRow(row: PersonRow): Person {
  return {
    id: row.id,
    fullName: row.full_name,
    roomNo: row.room_no ?? 'Unassigned',
    photoUrl: row.photo_url,
  };
}

function mapMemoryRow(row: MemoryRow): Memory {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    authorId: row.author_id,
    authorName: row.author_name,
    message: row.message,
    createdAt: row.created_at,
  };
}

function formatSupabaseError(rawMessage: string, action: string, tableName: string): string {
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes('relation') && normalized.includes(tableName)) {
    return `Could not ${action}. Table "${tableName}" was not found in Supabase.`;
  }

  if (normalized.includes('row-level security')) {
    return `Could not ${action}. Check RLS policies for table "${tableName}".`;
  }

  return `Could not ${action}. ${rawMessage}`;
}
