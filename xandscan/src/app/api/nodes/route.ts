import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic'; // Ensure no caching

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get('sort_by') || 'total_score';
  const order = searchParams.get('order') || 'desc';
  const search = searchParams.get('search') || '';
  const network = searchParams.get('network') || 'devnet';

  // 1. Fetch latest snapshots first (Active Window: 15 mins)
  // Filter by network by checking timestamps - recent data for selected network
  // 1. Fetch latest snapshots (Limit to last 500 to ensure we get data even if cron stopped)
  // We prioritize recent data by ordering, but don't hard-filter by time anymore.

  const { data: snapshots, error: snapError } = await supabase
    .from('snapshots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (snapError) {
    return NextResponse.json({ error: snapError.message }, { status: 500 });
  }

  // Get unique pubkeys from active snapshots
  const activePubkeys = Array.from(new Set(snapshots?.map(s => s.node_pubkey) || []));

  if (activePubkeys.length === 0) {
    return NextResponse.json([]); // No active nodes found
  }

  // 2. Fetch Node Details for these Active Pubkeys
  let query = supabase.from('nodes').select('*').in('pubkey', activePubkeys);

  if (search) {
    query = query.or(`ip_address.ilike.%${search}%,country.ilike.%${search}%`);
  }

  const { data: nodes, error: nodeError } = await query;

  if (nodeError) {
    return NextResponse.json({ error: nodeError.message }, { status: 500 });
  }

  // 3. Map Snapshot to Node
  // Use a map for O(1) lookup
  // We prioritize the *latest* snapshot for each node (snapshots are already ordered desc)
  const snapshotMap = new Map();
  snapshots?.forEach(s => {
    if (!snapshotMap.has(s.node_pubkey)) {
      snapshotMap.set(s.node_pubkey, s);
    }
  });

  const nodesWithStats = nodes.map(node => {
    const latestSnapshot = snapshotMap.get(node.pubkey);
    return {
      ...node,
      stats: latestSnapshot || null
    };
  });

  // Debug: Log first node to see structure
  if (nodesWithStats.length > 0) {
    console.log('[API/nodes] Sample node with stats:', JSON.stringify(nodesWithStats[0], null, 2));
  }

  // 4. Sort
  nodesWithStats.sort((a, b) => {
    // Helper to extract value safely
    const getVal = (item: any) => {
      if (!item.stats) return -Infinity; // Push nodes without stats to bottom
      return item.stats[sortBy] ?? -Infinity;
    };

    const valA = getVal(a);
    const valB = getVal(b);

    if (valA === valB) return 0;

    // String comparison for version
    if (typeof valA === 'string' && typeof valB === 'string') {
      return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    // Numeric comparison
    const numA = Number(valA);
    const numB = Number(valB);

    if (order === 'asc') {
      return numA - numB;
    } else {
      return numB - numA;
    }
  });

  return NextResponse.json(nodesWithStats);
}
