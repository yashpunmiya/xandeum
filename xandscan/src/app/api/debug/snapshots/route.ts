import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // Check recent snapshots
  const { data: snapshots, error } = await supabase
    .from('snapshots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also get count with cpu/ram data
  const { data: withCpu } = await supabase
    .from('snapshots')
    .select('cpu_percent, ram_used, ram_total, node_pubkey, created_at')
    .not('cpu_percent', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json({
    recentSnapshots: snapshots,
    snapshotsWithCpu: withCpu,
    summary: {
      totalRecent: snapshots?.length || 0,
      withCpuData: withCpu?.length || 0,
      sampleSnapshot: snapshots?.[0] || null
    }
  });
}
