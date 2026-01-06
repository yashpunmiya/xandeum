'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Node } from '@/types';
import { X, Star, ExternalLink, Trash2, Cpu, Activity, Zap, Shield, Globe } from 'lucide-react';
import Link from 'next/link';
import { getCountryCode, getFlagUrl } from '@/lib/country-utils';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface WatchlistSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    watchedNodeIds: string[];
    nodes: Node[];
    onToggleWatchlist: (pubkey: string) => void;
}

export default function WatchlistSidebar({ isOpen, onClose, watchedNodeIds, nodes, onToggleWatchlist }: WatchlistSidebarProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // derive watched nodes
    const watchedNodes = nodes.filter(n => watchedNodeIds.includes(n.pubkey));

    // Calculate aggregate stats
    const totalScore = watchedNodes.reduce((acc, curr) => acc + (curr.stats?.total_score || 0), 0);
    const avgUptime = watchedNodes.length > 0
        ? watchedNodes.reduce((acc, curr) => acc + (curr.stats?.uptime_seconds || 0), 0) / watchedNodes.length
        : 0;

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        return days > 0 ? `${days}d` : `${Math.floor(seconds / 3600)}h`;
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed top-0 right-0 bottom-0 w-full max-w-[450px] bg-[#050505] border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] z-[9999] flex flex-col"
                    >
                        {/* Header */}
                        <div className="relative p-6 pt-8 pb-4 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500/0 via-yellow-500/50 to-yellow-500/0 opacity-50" />
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-yellow-500/10 rounded-xl text-yellow-500 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                                        <Star size={22} fill="currentColor" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white tracking-tight uppercase">Wa<span className="text-yellow-500">tchlist</span></h2>
                                        <p className="text-xs font-mono text-muted-foreground">{watchedNodes.length} Nodes Tracked</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-full text-muted-foreground hover:text-white transition-all hover:rotate-90 duration-300"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Mini Stats Banner */}
                            {watchedNodes.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Total Score</span>
                                        <span className="text-sm font-mono font-bold text-primary">{totalScore.toLocaleString()}</span>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Avg Uptime</span>
                                        <span className="text-sm font-mono font-bold text-white">{formatUptime(avgUptime)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 content-start">
                            {watchedNodes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                                    <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                                        <Star size={40} className="opacity-20 text-yellow-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">No nodes watched yet</h3>
                                    <p className="text-sm opacity-60 max-w-[200px]">
                                        Click the star icon on any node card to add it to your personal watchlist.
                                    </p>
                                    <button
                                        onClick={onClose}
                                        className="mt-8 px-6 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-bold hover:bg-primary hover:text-black transition-all"
                                    >
                                        Browse Nodes
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3 pb-8">
                                    {watchedNodes.map((node) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            key={node.pubkey}
                                            className="group relative bg-[#0a0a0a] border border-white/5 hover:border-yellow-500/30 rounded-xl p-4 transition-all hover:bg-[#0f0f0f] shadow-lg hover:shadow-[0_0_20px_rgba(234,179,8,0.05)]"
                                        >
                                            {/* Glow Accent */}
                                            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-yellow-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-l-xl" />

                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    {(() => {
                                                        const code = getCountryCode(node.country || '');
                                                        const flag = getFlagUrl(code);
                                                        return flag ? <img src={flag} alt={node.country} className="w-5 h-3.5 rounded-[2px] shadow-sm" /> : <Globe size={16} className="text-muted-foreground" />;
                                                    })()}
                                                    <div>
                                                        <Link href={`/node/${node.pubkey}`} className="font-mono text-sm font-bold text-white hover:text-primary transition-colors hover:underline underline-offset-2 decoration-primary/50 flex items-center gap-2">
                                                            {node.pubkey.substring(0, 8)}...{node.pubkey.substring(node.pubkey.length - 4)}
                                                        </Link>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{node.city || 'Unknown Region'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => onToggleWatchlist(node.pubkey)}
                                                    className="text-muted-foreground/30 hover:text-red-500 p-1.5 hover:bg-red-500/10 rounded-lg transition-all"
                                                    title="Remove from watchlist"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col items-center justify-center gap-1 group-hover:bg-white/10 transition-colors">
                                                    <div className="text-[9px] text-muted-foreground uppercase flex items-center gap-1">
                                                        <Cpu size={10} /> CPU
                                                    </div>
                                                    <div className="text-xs font-mono font-bold text-white">
                                                        {node.stats?.cpu_percent?.toFixed(0)}%
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col items-center justify-center gap-1 group-hover:bg-white/10 transition-colors">
                                                    <div className="text-[9px] text-muted-foreground uppercase flex items-center gap-1">
                                                        <Activity size={10} /> Score
                                                    </div>
                                                    <div className="text-xs font-mono font-bold text-yellow-500">
                                                        {node.stats?.total_score?.toFixed(0)}
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col items-center justify-center gap-1 group-hover:bg-white/10 transition-colors">
                                                    <div className="text-[9px] text-muted-foreground uppercase flex items-center gap-1">
                                                        <Shield size={10} /> Ver
                                                    </div>
                                                    <div className="text-xs font-mono font-bold text-muted-foreground">
                                                        {node.stats?.version || 'v1.0'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
                                                <Link
                                                    href={`/node/${node.pubkey}`}
                                                    className="text-[10px] flex items-center gap-1 font-bold text-white/40 hover:text-primary transition-colors group-hover:translate-x-1 duration-200"
                                                >
                                                    FULL DETAILS <ExternalLink size={10} />
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {watchedNodes.length > 0 && (
                            <div className="p-4 border-t border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
                                <p className="text-[10px] text-muted-foreground text-center mb-3">
                                    Watchlist stored locally on your device.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
