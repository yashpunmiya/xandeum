import { NextResponse } from 'next/server';
import { updateNodes } from '@/lib/indexer';

export const maxDuration = 300; // Allow longer execution for cron jobs

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const network = (searchParams.get('network') || 'devnet') as 'mainnet' | 'devnet';

  const result = await updateNodes(network);
  
  if (!result.success) {
    return NextResponse.json({ error: result.error || result.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, processed: result.processed, network });
}
