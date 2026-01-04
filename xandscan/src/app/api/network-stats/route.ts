import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get('network') || 'devnet';
  
  // Total Nodes - use active window for current network
  const activeWindow = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  
  // Get recent snapshots to identify active nodes
  const { data: recentSnapshots } = await supabase
    .from('snapshots')
    .select('rpc_active, storage_used, node_pubkey')
    .gt('created_at', activeWindow)
    .order('created_at', { ascending: false });

  // Deduplicate to get unique nodes
  const uniquePubkeys = new Set(recentSnapshots?.map(s => s.node_pubkey) || []);
  const totalNodes = uniquePubkeys.size;

  // Deduplicate to get latest per node for stats
  const latestSnapshotsMap = new Map();
  recentSnapshots?.forEach(s => {
    if (!latestSnapshotsMap.has(s.node_pubkey)) {
      latestSnapshotsMap.set(s.node_pubkey, s);
    }
  });

  const activeRpcCount = Array.from(latestSnapshotsMap.values()).filter(s => s.rpc_active).length;
  const totalStorage = Array.from(latestSnapshotsMap.values()).reduce((acc, s) => acc + (s.storage_used || 0), 0);

  // Top Country - get from nodes table for active pubkeys
  const { data: nodes } = await supabase
    .from('nodes')
    .select('country')
    .in('pubkey', Array.from(uniquePubkeys));

  const countryCounts: Record<string, number> = {};
  nodes?.forEach(n => {
    const c = n.country || 'Unknown';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });

  // Filter out 'Unknown' for meaningful top country, unless no other data exists
  const knownCountries = Object.entries(countryCounts).filter(([c]) => c !== 'Unknown');
  const sortedCountries = knownCountries.length > 0
    ? knownCountries.sort((a, b) => b[1] - a[1])
    : Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);

  const topCountry = sortedCountries[0]?.[0] || 'Unknown';

  return NextResponse.json({
    totalNodes,
    activeRpcCount,
    topCountry,
    totalStorage
  });
}
