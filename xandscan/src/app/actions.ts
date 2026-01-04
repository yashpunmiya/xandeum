'use server';

import { updateNodes } from '@/lib/indexer';

import { supabase } from '@/lib/supabase';

export async function triggerUpdate(network: 'mainnet' | 'devnet' = 'devnet') {
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

  // Run for both networks to ensure complete view
  const r1 = await updateNodes('devnet');
  const r2 = await updateNodes('mainnet');

  return {
    success: r1.success || r2.success,
    message: `Devnet: ${r1.processed || 0}, Mainnet: ${r2.processed || 0}`
  };
}
