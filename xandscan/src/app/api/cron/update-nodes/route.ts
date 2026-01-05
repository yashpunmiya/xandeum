import { NextResponse } from 'next/server';
import { updateNodes } from '@/lib/indexer';

export const maxDuration = 300; // Allow longer execution for cron jobs

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const key = searchParams.get('key');
  const secret = process.env.CRON_SECRET;

  // Allow Access if:
  // 1. Header matches 'Bearer SECRET'
  // 2. OR Query param 'key' matches SECRET (easier for external cron tools)
  const isHeaderValid = authHeader === `Bearer ${secret}`;
  const isKeyValid = secret && key === secret;

  if (!isHeaderValid && !isKeyValid) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const network = (searchParams.get('network') || 'devnet') as 'mainnet' | 'devnet';

  const result = await updateNodes(network);

  if (!result.success) {
    return NextResponse.json({ error: result.error || result.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, processed: result.processed, network });
}
