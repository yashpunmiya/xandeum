import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // Check nodes count
  const { count: nodesCount, error: nodesError } = await supabase
    .from('nodes')
    .select('*', { count: 'exact', head: true });

  // Check snapshots count
  const { count: snapshotsCount, error: snapshotsError } = await supabase
    .from('snapshots')
    .select('*', { count: 'exact', head: true });

  // Get a sample node
  const { data: sampleNodes } = await supabase
    .from('nodes')
    .select('*')
    .limit(3);

  // Get a sample snapshot
  const { data: sampleSnapshots } = await supabase
    .from('snapshots')
    .select('*')
    .limit(3);

  return NextResponse.json({
    database: {
      nodes: {
        count: nodesCount,
        error: nodesError,
        samples: sampleNodes
      },
      snapshots: {
        count: snapshotsCount,
        error: snapshotsError,
        samples: sampleSnapshots
      }
    }
  });
}
