'use client';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NodeDetails() {
  const params = useParams();
  const pubkey = params.pubkey as string;
  
  const { data: nodes } = useSWR('/api/nodes', fetcher);
  const { data: history, isLoading: historyLoading } = useSWR(pubkey ? `/api/nodes/${pubkey}/history` : null, fetcher);

  const node = nodes?.find((n: any) => n.pubkey === pubkey);

  if (!node && !historyLoading) return <div className="p-8">Node not found</div>;
  if (!node || historyLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const stats = node.stats;

  return (
    <main className="min-h-screen p-8 space-y-8">
      <Link href="/" className="flex items-center text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Score Gauge */}
        <div className="w-full md:w-1/3 bg-card border border-border rounded-lg p-8 flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-4">Node Score</h2>
          <div className="relative h-40 w-40 flex items-center justify-center rounded-full border-8 border-muted">
             {/* Simple CSS gauge representation */}
             <div className="absolute inset-0 rounded-full border-8 border-primary" style={{ clipPath: `inset(${100 - (stats?.total_score || 0)}% 0 0 0)` }}></div>
             <span className="text-4xl font-bold text-primary">{stats?.total_score?.toFixed(0) || 0}</span>
          </div>
          <div className="mt-4 text-center">
            <div className="text-sm text-muted-foreground">IP Address</div>
            <div className="font-mono">{node.ip_address}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="w-full md:w-2/3 grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground">CPU Usage</div>
            <div className="text-2xl font-bold">{stats?.cpu_percent ? stats.cpu_percent.toFixed(1) + '%' : 'N/A'}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground">RAM Usage</div>
            <div className="text-2xl font-bold">{stats?.ram_used ? (stats.ram_used / 1024 / 1024 / 1024).toFixed(1) + ' GB' : 'N/A'}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground">Storage Used</div>
            <div className="text-2xl font-bold">{stats?.storage_used ? (stats.storage_used / 1024 / 1024 / 1024).toFixed(1) + ' GB' : 'N/A'}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground">Uptime</div>
            <div className="text-2xl font-bold">{stats?.uptime_seconds ? (stats.uptime_seconds / 3600).toFixed(1) + 'h' : 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-lg p-6 h-[300px]">
          <h3 className="text-lg font-semibold mb-4">Performance History (CPU)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="created_at" tickFormatter={(t) => new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
              <Line type="monotone" dataKey="cpu_percent" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 h-[300px]">
          <h3 className="text-lg font-semibold mb-4">Reliability (Uptime)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="created_at" tickFormatter={(t) => new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
              <Bar dataKey="uptime_seconds" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
}
