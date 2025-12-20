'use server';

import { updateNodes } from '@/lib/indexer';

import { supabase } from '@/lib/supabase';

export async function triggerUpdate() {
  // Check last update time to prevent abuse/overloading
  try {
    const { data: latestSnapshot } = await supabase
      .from('snapshots')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestSnapshot) {
      const lastUpdate = new Date(latestSnapshot.created_at).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - lastUpdate) / 1000 / 60;

      if (diffMinutes < 5) {
        return { success: true, message: 'Data is already fresh (updated < 5m ago)', skipped: true };
      }
    }
  } catch (e) {
    console.error('Error checking last update:', e);
    // Proceed if check fails (safeguard)
  }

  const result = await updateNodes();
  return result;
}
