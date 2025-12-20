import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  // Total Nodes
  const { count: totalNodes, error: countError } = await supabase
    .from('nodes')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  // Active RPC Count (from latest snapshots)
  // Since cron may run daily (Hobby plan), fetch snapshots from last 25 hours
  const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  const { data: recentSnapshots } = await supabase
    .from('snapshots')
    .select('rpc_active, storage_used, node_pubkey')
    .gt('created_at', twentyFiveHoursAgo)
    .order('created_at', { ascending: false });

  // Deduplicate to get latest per node
  const latestSnapshotsMap = new Map();
  recentSnapshots?.forEach(s => {
    // Since we didn't order by created_at in the query, we might overwrite with older.
    // But we only fetched last 15 mins.
    // Let's assume the last one in the list is the latest or just take any from the last 15 mins window.
    // Better to order by created_at desc in query.
    latestSnapshotsMap.set(s.node_pubkey, s);
  });

  const activeRpcCount = Array.from(latestSnapshotsMap.values()).filter(s => s.rpc_active).length;
  const totalStorage = Array.from(latestSnapshotsMap.values()).reduce((acc, s) => acc + (s.storage_used || 0), 0);

  // Top Country
  const { data: nodes } = await supabase.from('nodes').select('country');
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
