'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Node } from '@/types';
import { X, Cpu, HardDrive, MemoryStick, Coins, Trophy, Zap, Globe, Clock, Server, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

interface CompareModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodes: Node[];
}

export default function CompareModal({ isOpen, onClose, nodes }: CompareModalProps) {
    if (!isOpen) return null;

    // Helper to find best values for highlighting
    const bestScore = Math.max(...nodes.map(n => n.stats?.total_score || 0));
    const bestCredits = Math.max(...nodes.map(n => n.stats?.credits || 0));
    const minLoad = Math.min(...nodes.map(n => n.stats?.cpu_percent || 100));

    // Comparison Metrics Config
    const metrics = [
        {
            label: 'Identity',
            icon: Server,
            render: (n: Node) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white truncate max-w-[120px]" title={n.pubkey}>
                            {n.pubkey.substring(0, 8)}...
                        </span>
                        {n.stats?.total_score === bestScore && <Trophy size={14} className="text-yellow-500" />}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono bg-white/5 rounded px-1.5 py-0.5 w-fit">
                        {n.ip_address}
                    </span>
                </div>
            )
        },
        {
            label: 'Location',
            icon: Globe,
            render: (n: Node) => (
                <div className="flex items-center gap-2">
                    <img
                        src={`https://flagcdn.com/w40/${n.country?.toLowerCase()}.png`}
                        alt={n.country}
                        className="h-4 w-6 rounded-sm object-cover opacity-80"
                    />
                    <div className="flex flex-col text-xs">
                        <span className="text-white font-medium">{n.country}</span>
                        <span className="text-muted-foreground">{n.city}</span>
                    </div>
                </div>
            )
        },
        {
            label: 'Stack',
            icon: Zap,
            render: (n: Node) => (
                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-xs font-mono">
                        v{n.stats?.version || '0.0'}
                    </span>
                    <span className="text-xs text-white font-mono flex items-center gap-1">
                        <Clock size={12} className="text-muted-foreground" />
                        {formatUptime(n.stats?.uptime_seconds || 0)}
                    </span>
                </div>
            )
        },
        {
            type: 'separator',
            label: 'Performance'
        },
        {
            label: 'CPU Load',
            icon: Cpu,
            render: (n: Node) => {
                const val = n.stats?.cpu_percent || 0;
                const isBest = val === minLoad;
                return (
                    <div className="w-full space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className={cn("font-bold font-mono", isBest ? "text-green-500" : "text-white")}>{val.toFixed(1)}%</span>
                            {isBest && <CheckCircle2 size={12} className="text-green-500" />}
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", val > 80 ? "bg-red-500" : val > 50 ? "bg-yellow-500" : "bg-green-500")} style={{ width: `${val}%` }} />
                        </div>
                    </div>
                )
            }
        },
        {
            label: 'RAM',
            icon: MemoryStick,
            render: (n: Node) => {
                const used = n.stats?.ram_used || 0;
                const total = n.stats?.ram_total || 1;
                const pct = (used / total) * 100;
                return (
                    <div className="w-full space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-white font-mono">{formatBytes(used)}</span>
                            <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                )
            }
        },
        {
            label: 'Storage',
            icon: HardDrive,
            render: (n: Node) => (
                <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-white font-mono">{formatBytes(n.stats?.storage_used || 0)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: '40%' }} />
                    </div>
                </div>
            )
        },
        {
            type: 'separator',
            label: 'Economics'
        },
        {
            label: 'Credits',
            icon: Coins,
            render: (n: Node) => {
                const isTop = (n.stats?.credits || 0) === bestCredits;
                return (
                    <div className={cn("text-sm font-bold flex items-center gap-2", isTop ? "text-yellow-400" : "text-white")}>
                        {(n.stats?.credits || 0).toLocaleString()}
                        {isTop && <Trophy size={12} />}
                    </div>
                )
            }
        },
        {
            label: 'Total Score',
            icon: Trophy,
            render: (n: Node) => {
                const isTop = (n.stats?.total_score || 0) === bestScore;
                return (
                    <div className={cn("text-xl font-black flex items-center gap-2", isTop ? "text-primary text-shadow-glow" : "text-white")}>
                        {(n.stats?.total_score || 0).toFixed(0)}
                        {isTop && <span className="text-[10px] bg-primary text-black px-1.5 rounded uppercase tracking-wider font-bold">#1</span>}
                    </div>
                )
            }
        }
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-7xl h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 bg-[#0a0a0a] px-8 py-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                <Trophy size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Compare Nodes</h2>
                                <p className="text-xs text-muted-foreground">{nodes.length} nodes selected for analysis</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-full bg-white/5 p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white hover:rotate-90 duration-200"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Table Container */}
                    <div className="1-0 overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <div className="min-w-fit inline-block">
                            {/* Comparison Table */}
                            <div className="grid border-collapse" style={{ gridTemplateColumns: `200px repeat(${nodes.length}, minmax(240px, 1fr))` }}>

                                {/* Column Headers (Ghost row for sizing) */}
                                <div className="sticky top-0 z-20 bg-[#0a0a0a] border-b border-white/10 p-4 font-bold text-muted-foreground uppercase text-xs tracking-wider flex items-end pb-2">
                                    Metric
                                </div>
                                {nodes.map(node => (
                                    <div key={'header-' + node.pubkey} className="sticky top-0 z-20 bg-[#0a0a0a] border-b border-white/10 p-4 flex flex-col gap-2 border-l border-white/5">
                                        <div className="h-1.5 w-12 rounded-full bg-primary/50" />
                                        <div className="text-sm font-bold text-white truncate w-32">{node.pubkey}</div>
                                    </div>
                                ))}

                                {/* Rows */}
                                {metrics.map((metric: any, i) => {
                                    if (metric.type === 'separator') {
                                        return (
                                            <div key={i} className="col-span-full bg-white/5 border-y border-white/5 px-6 py-2">
                                                <span className="text-xs font-bold text-white uppercase tracking-wider">{metric.label}</span>
                                            </div>
                                        );
                                    }

                                    const Icon = metric.icon;

                                    return (
                                        <>
                                            {/* Label Column (Sticky Left) */}
                                            <div className="sticky left-0 z-10 bg-[#0a0a0a] border-b border-white/5 border-r border-white/10 p-4 flex items-center gap-3 group">
                                                {Icon && <Icon size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />}
                                                <span className="text-sm font-medium text-muted-foreground group-hover:text-white transition-colors">{metric.label}</span>
                                            </div>

                                            {/* Node Value Columns */}
                                            {nodes.map(node => (
                                                <div key={`${metric.label}-${node.pubkey}`} className="border-b border-white/5 border-l border-white/5 p-4 flex items-center bg-[#0a0a0a]/50 hover:bg-white/[0.02] transition-colors">
                                                    {metric.render(node)}
                                                </div>
                                            ))}
                                        </>
                                    );
                                })}

                            </div>
                        </div>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function formatBytes(bytes: number) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds: number) {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    return `${d}d ${h}h`;
}
