'use server';

import { updateNodes } from '@/lib/indexer';

export async function triggerUpdate() {
  // In a real app, you might want to protect this action with auth
  // For now, we allow it for demo purposes or check for a dev environment
  
  // if (process.env.NODE_ENV !== 'development') {
  //   throw new Error('Only available in development');
  // }

  const result = await updateNodes();
  return result;
}
