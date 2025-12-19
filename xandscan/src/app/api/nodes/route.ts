import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get('sort_by') || 'total_score';
  const order = searchParams.get('order') || 'desc';
  const search = searchParams.get('search') || '';

  // Fetch all nodes
  let query = supabase.from('nodes').select('*');

  if (search) {
    query = query.or(`ip_address.ilike.%${search}%,country.ilike.%${search}%`);
  }

  const { data: nodes, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch latest snapshots for these nodes
  // Optimization: We only need the latest snapshot for each node.
  // We can fetch snapshots created in the last 24 hours (or just last run window)
  // But to be safe, let's fetch the latest snapshot for each node.
  // Since we can't easily do "latest per group" in Supabase JS client without a view,
  // we will fetch the most recent snapshots globally and map them.
  // Assuming the cron runs every 10 mins, we can fetch snapshots from last 15 mins.
  
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: snapshots } = await supabase
    .from('snapshots')
    .select('*')
    .gt('created_at', fifteenMinutesAgo)
    .order('created_at', { ascending: false });

  // Map latest snapshot to node
  const nodesWithStats = nodes.map(node => {
    const latestSnapshot = snapshots?.find(s => s.node_pubkey === node.pubkey);
    return {
      ...node,
      stats: latestSnapshot || null
    };
  });

  // Sort
  nodesWithStats.sort((a, b) => {
    const valA = a.stats ? a.stats[sortBy] : (sortBy === 'total_score' ? 0 : 0);
    const valB = b.stats ? b.stats[sortBy] : (sortBy === 'total_score' ? 0 : 0);
    
    if (order === 'asc') {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });

  return NextResponse.json(nodesWithStats);
}
