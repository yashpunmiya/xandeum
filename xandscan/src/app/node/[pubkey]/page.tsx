'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Loader2, ArrowLeft, Cpu, HardDrive, Clock, Activity, Shield, Globe, Server, Share2 } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import NetworkBackground from '@/components/NetworkBackground';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function DetailCard({ title, value, sub, icon: Icon, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-md"
    >
      <div className="absolute right-0 top-0 p-4 opacity-5">
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
          <Icon size={16} className="text-primary" /> {title}
        </div>
        <div className="text-3xl font-bold text-white text-shadow-sm">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground font-mono">{sub}</div>
      </div>
    </motion.div>
  )
}

export default function NodeDetails() {
  const params = useParams();
  const pubkey = params.pubkey as string;

  const { data: nodes } = useSWR('/api/nodes', fetcher);
  const { data: history, isLoading: historyLoading } = useSWR(pubkey ? `/api/nodes/${pubkey}/history` : null, fetcher);

  const node = nodes?.find((n: any) => n.pubkey === pubkey);
  const stats = node?.stats || {};

  if (!node && !historyLoading) return <div className="p-8 text-center text-red-500">Node not found</div>;
  if (!node || historyLoading) return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground tracking-widest uppercase">Acquiring Target Signal...</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen relative text-foreground overflow-x-hidden">
      <NetworkBackground />

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center border-b border-white/5 bg-black/50 backdrop-blur-md px-6 lg:px-10">
        <Link href="/" className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="hidden sm:inline">Back to Network</span>
        </Link>
        <div className="mx-auto font-mono text-xs opacity-50 hidden md:block">
          ID: {pubkey}
        </div>
        <button className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors">
          <Share2 size={12} /> SHARE
        </button>
      </nav>

      <div className="container mx-auto pt-24 pb-12 px-6">

        {/* Header Section */}
        <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-2xl">
              {node.country !== 'Unknown' && (
                <img
                  src={`https://flagcdn.com/h240/${node.country.toLowerCase()}.png`}
                  alt={node.country}
                  className="h-full w-full object-cover opacity-80"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 text-center text-xs font-bold uppercase tracking-widest text-white">
                {node.country}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Node Delta</h1>
                <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-500 border border-green-500/30">ONLINE</div>
              </div>
              <div className="font-mono text-sm text-muted-foreground flex items-center gap-6">
                <span className="flex items-center gap-2"><Server size={14} /> {node.ip_address}</span>
                <span className="flex items-center gap-2"><Globe size={14} /> {node.city || 'Unknown Region'}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-6 rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm"
          >
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Trust Score</div>
              <div className="text-3xl font-black text-primary text-shadow-glow">{stats.total_score?.toFixed(1) || '0.0'}</div>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Version</div>
              <div className="text-xl font-bold text-white font-mono">v{stats.version || '0.0.0'}</div>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <DetailCard
            title="CPU Load"
            value={(stats.cpu_percent?.toFixed(1) || 0) + '%'}
            sub="Core Utilization"
            icon={Cpu}
            delay={0.3}
          />
          <DetailCard
            title="Memory"
            value={(stats.ram_used ? (stats.ram_used / 1024 / 1024 / 1024).toFixed(1) : 0) + ' GB'}
            sub={`of ${(stats.ram_total / 1024 / 1024 / 1024).toFixed(0)} GB Total`}
            icon={Activity}
            delay={0.4}
          />
          <DetailCard
            title="Storage"
            value={(stats.storage_used ? (stats.storage_used / 1024 / 1024 / 1024).toFixed(0) : 0) + ' GB'}
            sub="Total Volume Used"
            icon={HardDrive}
            delay={0.5}
          />
          <DetailCard
            title="Uptime"
            value={(stats.uptime_seconds ? (stats.uptime_seconds / 3600).toFixed(1) : 0) + 'h'}
            sub="Continuous Operation"
            icon={Clock}
            delay={0.6}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="h-[400px] rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-md"
          >
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
              <Activity className="text-primary" size={20} /> Performance History
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="created_at"
                    tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    stroke="#52525b"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    stroke="#52525b"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu_percent"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCpu)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Uptime / Reliability Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="h-[400px] rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-md"
          >
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
              <Shield className="text-blue-500" size={20} /> Reliability Metric
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="created_at"
                    tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    stroke="#52525b"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    stroke="#52525b"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line
                    type="step"
                    dataKey="uptime_seconds"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
