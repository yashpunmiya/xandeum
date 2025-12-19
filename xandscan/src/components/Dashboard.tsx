'use client';
import dynamic from 'next/dynamic';
import NodesTable from './NodesTable';
import useSWR from 'swr';
import { Loader2, RefreshCw } from 'lucide-react';
import { triggerUpdate } from '@/app/actions';
import { useState } from 'react';

const Map = dynamic(() => import('./Map'), { ssr: false, loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-lg" /> });

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Dashboard() {
  const { data: nodes, error, isLoading, mutate: mutateNodes } = useSWR('/api/nodes', fetcher);
  const { data: stats, mutate: mutateStats } = useSWR('/api/network-stats', fetcher);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRefresh = async () => {
    setIsUpdating(true);
    try {
      await triggerUpdate();
      mutateNodes();
      mutateStats();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  if (error) return <div className="p-8 text-red-500">Failed to load data</div>;
  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={handleRefresh} 
          disabled={isUpdating}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Updating...' : 'Refresh Data'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Nodes</div>
          <div className="text-2xl font-bold">{stats?.totalNodes || 0}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Active RPC</div>
          <div className="text-2xl font-bold text-primary">{stats?.activeRpcCount || 0}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Top Country</div>
          <div className="text-2xl font-bold">{stats?.topCountry || '-'}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Network Storage</div>
          <div className="text-2xl font-bold">{stats?.totalStorage ? (stats.totalStorage / 1024 / 1024 / 1024).toFixed(2) + ' GB' : '0 GB'}</div>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <Map nodes={nodes || []} />
      </div>

      <NodesTable nodes={nodes || []} />
    </div>
  );
}
