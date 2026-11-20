import type {SupabaseClient} from '@supabase/supabase-js';

// The caller supplies the authenticated user's ID, never a submitted ID.
export async function saveFirstHandle(db: SupabaseClient, userId: string, value: string): Promise<string | null> {
  const handle = value.trim();
  if (!handle || handle.length > 80) return 'Enter a handle of 1 to 80 characters.';
  try {
    const {data, error} = await db.from('profiles').select('id').eq('id', userId).maybeSingle();
    if (error) throw error;
    if (data) return null; // This step cannot edit an already-created profile.
    const {error: insertError} = await db.from('profiles').insert({id: userId, handle});
    if (insertError?.code === '23505') return 'That handle is taken. Choose another.';
    if (insertError) throw insertError;
    return null;
  } catch {
    return 'Your handle could not be saved. Try again.';
  }
}
