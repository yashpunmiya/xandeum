'use client';

import { motion } from 'framer-motion';
import { Node } from '@/types';
import { Cpu, HardDrive, MemoryStick, Activity, MapPin, Globe } from 'lucide-react';
import Link from 'next/link';

function StatBar({ label, value, max, icon: Icon, colorClass }: any) {
    const percent = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1"><Icon size={10} /> {label}</span>
                <span>{value ? Math.round(percent) + '%' : '-'}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full rounded-full ${colorClass}`}
                />
            </div>
        </div>
    );
}

export default function NodeCard({ node, index }: { node: Node; index: number }) {
    const stats = node.stats || {};

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="glass-card group relative overflow-hidden rounded-xl p-5 hover:border-primary/50 hover:shadow-[0_0_20px_-5px_var(--color-primary)] transition-all"
        >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity size={80} />
            </div>

            <div className="relative z-10 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                            {node.country !== 'Unknown' && node.country ? (
                                <img
                                    src={`https://flagcdn.com/w40/${node.country.toLowerCase()}.png`}
                                    alt={node.country}
                                    className="h-full w-full object-cover rounded-lg opacity-80"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                            ) : <Globe size={20} />}
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 ring-2 ring-black animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-mono text-sm font-bold text-foreground">
                                <Link href={`/node/${node.pubkey}`} className="hover:text-primary transition-colors">
                                    {node.pubkey.substring(0, 8)}...
                                </Link>
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin size={10} />
                                {node.country || 'Unknown'}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">v{stats.version || '0.0.0'}</div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <StatBar
                        label="CPU"
                        value={stats.cpu_percent || 0}
                        max={100}
                        icon={Cpu}
                        colorClass="bg-blue-500"
                    />
                    <StatBar
                        label="RAM"
                        value={stats.ram_used || 0}
                        max={stats.ram_total || 1}
                        icon={MemoryStick}
                        colorClass="bg-purple-500"
                    />
                    <StatBar
                        label="STOR"
                        value={stats.storage_used || 0}
                        max={stats.storage_total || 1000} // Assuming simplified max
                        icon={HardDrive}
                        colorClass="bg-orange-500"
                    />
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                            <span className="flex items-center gap-1"><Activity size={10} /> SCORE</span>
                        </div>
                        <div className="text-lg font-bold text-foreground">{stats.total_score?.toFixed(1) || '0.0'}</div>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-2 flex justify-between items-center text-[10px] text-muted-foreground border-t border-white/5 mt-2">
                    <span>Updated just now</span>
                    <span className="font-mono">{node.ip_address}</span>
                </div>
            </div>
        </motion.div>
    );
}
