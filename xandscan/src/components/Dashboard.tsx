'use client';

import dynamic from 'next/dynamic';
import NodesExplorer from './NodesExplorer';
import NetworkBackground from './NetworkBackground';
import useSWR from 'swr';
import { Loader2, RefreshCw, Server, Globe, HardDrive, Zap, BookOpen, Info, Wrench } from 'lucide-react';
import Link from 'next/link';
import { triggerUpdate } from '@/app/actions';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import InfoModal from './InfoModal';


const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl bg-white/5 animate-pulse" />
});

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function StatCard({ label, value, icon: Icon, color, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card relative overflow-hidden rounded-2xl p-6 border border-white/5 bg-black/40 backdrop-blur-xl"
    >
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${color} opacity-10 blur-2xl`} />
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} bg-opacity-20 text-white ring-1 ring-white/10`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{label}</h3>
          <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: nodes, error, isLoading, mutate: mutateNodes } = useSWR(`/api/nodes`, fetcher);
  const { data: stats, mutate: mutateStats } = useSWR(`/api/network-stats`, fetcher);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  useEffect(() => {
    // Auto-refresh on mount
    handleRefresh();
  }, []);

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

  if (error) return <div className="p-8 text-center text-red-500 glass-card rounded-xl">Failed to load network data.</div>;
  if (isLoading) return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-black text-white">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground animate-pulse">Establishing Uplink...</p>
    </div>
  );

  return (
    <div className="relative min-h-screen selection:bg-primary/30">
      <NetworkBackground />

      <div className="container mx-auto space-y-8 p-6 lg:p-10">

        {/* Header Section */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end border-b border-white/5 pb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl font-black tracking-tighter text-white lg:text-7xl"
            >
              XAND<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-300">SCAN</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-lg text-muted-foreground max-w-lg"
            >
              Advanced Decentralized Network Intelligence & Node Explorer
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4"
          >
            <div className="text-right hidden md:block">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">System Status</div>
              <div className="text-sm font-bold text-green-500 flex items-center justify-end gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                ONLINE
              </div>
            </div>

            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/20"
            >
              <Info className="h-4 w-4 text-primary" />
              LEARN
            </button>

            <Link
              href="/tools"
              className="group relative flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-left transition-all hover:bg-white/10 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 group-hover:scale-110 transition-transform">
                <Zap className="h-4 w-4 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-emerald-400">Utilities</span>
                <span className="text-sm font-bold text-white leading-none">NEXUS</span>
              </div>
            </Link>

            <a
              href="https://docs.xandeum.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/20"
            >
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              DOCS
            </a>
            <button
              onClick={handleRefresh}
              disabled={isUpdating}
              className="group flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-6 py-3 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-black disabled:opacity-50 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
            >
              <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              {isUpdating ? 'SYNCING...' : 'REFRESH DATA'}
            </button>
          </motion.div>
        </div>

        {/* Main Content Layout - Grid with Map on side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Stats & Map (Takes 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Total Nodes"
                value={stats?.totalNodes || 0}
                icon={Server}
                color="bg-blue-500"
                delay={0.1}
              />
              <StatCard
                label="Active RPC"
                value={stats?.activeRpcCount || 0}
                icon={Zap}
                color="bg-yellow-500"
                delay={0.2}
              />
              <StatCard
                label="Top Region"
                value={stats?.topCountry || '-'}
                icon={Globe}
                color="bg-green-500"
                delay={0.3}
              />
              <StatCard
                label="Storage"
                value={stats?.totalStorage ? formatBytes(stats.totalStorage) : '0 B'}
                icon={HardDrive}
                color="bg-purple-500"
                delay={0.4}
              />
            </div>

            {/* Map Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card overflow-hidden rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl h-[300px] lg:h-[400px] relative group"
            >
              <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/60 backdrop-blur rounded-full text-xs font-bold text-white border border-white/10 flex items-center gap-2">
                <Globe size={12} className="text-primary" /> GLOBAL DISTRIBUTION
              </div>
              <div className="h-full w-full grayscale-[30%] group-hover:grayscale-0 transition-all duration-700">
                <Map nodes={nodes || []} />
              </div>
            </motion.div>
          </div>

          {/* Right Column: Node Explorer (Takes 8 cols) */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="h-full"
            >
              <NodesExplorer nodes={nodes || []} />
            </motion.div>
          </div>

        </div>

      </div>

      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </div>
  );
}
