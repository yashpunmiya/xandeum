import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: Promise<{ pubkey: string }> }) {
  const { pubkey } = await params;

  // Get ALL snapshots for this node (no time filter)
  const { data, error } = await supabase
    .from('snapshots')
    .select('*')
    .eq('node_pubkey', pubkey)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return data with metadata about the history span
  const response = {
    snapshots: data,
    count: data?.length || 0,
    oldest: data?.[0]?.created_at || null,
    latest: data?.[data.length - 1]?.created_at || null
  };

  return NextResponse.json(response);
}
