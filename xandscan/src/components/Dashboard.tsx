'use client';

import dynamic from 'next/dynamic';
import NodesExplorer from './NodesExplorer';
import NetworkBackground from './NetworkBackground';
import useSWR from 'swr';
import { Loader2, RefreshCw, Server, Globe, HardDrive, Zap } from 'lucide-react';
import { triggerUpdate } from '@/app/actions';
import { useState } from 'react';
import { motion } from 'framer-motion';

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl bg-white/5 animate-pulse" />
});

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function StatCard({ label, value, icon: Icon, color, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card relative overflow-hidden rounded-2xl p-6"
    >
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${color} opacity-10 blur-2xl`} />
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} bg-opacity-20 text-white`}>
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

  if (error) return <div className="p-8 text-center text-red-500 glass-card rounded-xl">Failed to load network data.</div>;
  if (isLoading) return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-black text-white">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground animate-pulse">Establishing Uplink...</p>
    </div>
  );

  return (
    <div className="relative min-h-screen">
      <NetworkBackground />

      <div className="container mx-auto space-y-8 p-6 lg:p-10">

        {/* Helper Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-black tracking-tighter text-white lg:text-5xl"
            >
              XAND<span className="text-primary">SCAN</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-muted-foreground"
            >
              Real-time Decentralized Network Explorer
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={handleRefresh}
              disabled={isUpdating}
              className="group flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-6 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-black disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              {isUpdating ? 'SYNCING...' : 'REFRESH DATA'}
            </button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            label="Total Storage"
            value={stats?.totalStorage ? (stats.totalStorage / 1024 / 1024 / 1024).toFixed(2) + ' GB' : '0 GB'}
            icon={HardDrive}
            color="bg-purple-500"
            delay={0.4}
          />
        </div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card overflow-hidden rounded-2xl border border-white/5 p-1"
        >
          <div className="h-[400px] w-full rounded-xl overflow-hidden grayscale-[50%] hover:grayscale-0 transition-all duration-700">
            <Map nodes={nodes || []} />
          </div>
        </motion.div>

        {/* Nodes Explorer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <NodesExplorer nodes={nodes || []} />
        </motion.div>
      </div>
    </div>
  );
}
