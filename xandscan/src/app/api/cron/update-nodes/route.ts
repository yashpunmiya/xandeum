import { NextResponse } from 'next/server';
import { updateNodes } from '@/lib/indexer';

export const maxDuration = 300; // Allow longer execution for cron jobs

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const result = await updateNodes();
  
  if (!result.success) {
    return NextResponse.json({ error: result.error || result.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, processed: result.processed });
}
