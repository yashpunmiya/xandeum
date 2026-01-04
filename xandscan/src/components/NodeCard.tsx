'use client';

import { motion } from 'framer-motion';
import { Node } from '@/types';
import { Cpu, HardDrive, Zap, MapPin, Globe, Server, Activity, Coins, Eye, Trophy, MemoryStick, Clock, Check } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { cn } from '../lib/utils';
import { getCountryCode, getFlagUrl } from '@/lib/country-utils';

export default function NodeCard({ node, index, isSelected, isSelectionMode, onToggleSelect }: { node: Node; index: number; isSelected?: boolean; isSelectionMode?: boolean; onToggleSelect?: () => void }) {
    const stats = node.stats || {};

    // Formatters
    const formatBytes = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds: number) => {
        if (!seconds) return '0s';
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);

        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        return parts.length > 0 ? parts.join(' ') : `${seconds}s`;
    };

    const formatTimeAgo = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    // Hash pubkey to get a consistent gradient/color accent
    const accentColor = useMemo(() => {
        const sum = node.pubkey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colors = ['from-emerald-500', 'from-blue-500', 'from-violet-500', 'from-amber-500', 'from-cyan-500'];
        return colors[sum % colors.length];
    }, [node.pubkey]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`group relative overflow-hidden rounded-md border text-left transition-all ${isSelected ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'border-white/5 bg-[#0a0a0a] hover:bg-[#0f0f0f]'}`}
        >
            {/* Top Accent Line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentColor} to-transparent opacity-70 group-hover:opacity-100 transition-opacity`} />

            {/* Selection Checkbox (Visible on hover or selected or in selection mode) */}
            {onToggleSelect && (
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect(); }}
                    className={`absolute top-2 right-2 z-40 h-5 w-5 rounded border flex items-center justify-center transition-all ${isSelected || isSelectionMode ? 'bg-primary border-primary opacity-100' : 'bg-black/50 border-white/20 opacity-0 group-hover:opacity-100'}`}
                >
                    {isSelected && <Check size={12} className="text-black font-bold" strokeWidth={4} />}
                </button>
            )}

            <div className="p-4 flex flex-col gap-4">

                {/* Header: Identity */}
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                        <Link href={`/node/${node.pubkey}`} className="flex items-center gap-2 group-hover:text-primary transition-colors">
                            <span className="font-mono text-sm font-bold text-white truncate cursor-pointer hover:underline underline-offset-4 decoration-primary/50">
                                {node.pubkey.substring(0, 16)}...
                            </span>
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse shrink-0" />
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5 min-w-0">
                                {(() => {
                                    const code = getCountryCode(node.country || '');
                                    const flag = getFlagUrl(code);
                                    return flag ? (
                                        <img src={flag} alt={node.country} className="w-4 h-3 rounded-[2px]" />
                                    ) : (
                                        <MapPin size={10} className="shrink-0" />
                                    );
                                })()}
                                <span className="truncate">{node.city || 'Unknown'}, {node.country}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className="px-2 py-0.5 rounded-sm bg-white/5 border border-white/5 text-[10px] font-mono text-primary/80">
                            v{stats.version || '0.0'}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock size={10} />
                            <span>{formatUptime(stats.uptime_seconds || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Data Grid - Professional Tech Look */}
                <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5 rounded-sm overflow-hidden">
                    {/* CPU */}
                    <div className="bg-[#0c0c0c] p-2 flex items-center justify-between group-hover:bg-[#111] transition-colors">
                        <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1"><Cpu size={10} /> CPU</div>
                        <div className="text-xs font-mono font-bold text-white">{stats.cpu_percent?.toFixed(0)}%</div>
                    </div>

                    {/* RAM */}
                    <div className="bg-[#0c0c0c] p-2 flex items-center justify-between group-hover:bg-[#111] transition-colors">
                        <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1"><MemoryStick size={10} /> RAM</div>
                        <div className="text-xs font-mono font-bold text-white">{formatBytes(stats.ram_used || 0)}</div>
                    </div>

                    {/* Storage */}
                    <div className="bg-[#0c0c0c] p-2 flex items-center justify-between group-hover:bg-[#111] transition-colors">
                        <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1"><HardDrive size={10} /> Stor</div>
                        <div className="text-xs font-mono font-bold text-white">{formatBytes(stats.storage_used || 0)}</div>
                    </div>

                    {/* Credits */}
                    <div className="bg-[#0c0c0c] p-2 flex items-center justify-between group-hover:bg-[#111] transition-colors">
                        <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1"><Coins size={10} /> Cred</div>
                        <div className="text-xs font-mono font-bold text-yellow-500">{stats.credits ? (stats.credits > 1000 ? (stats.credits / 1000).toFixed(1) + 'k' : stats.credits) : '0'}</div>
                    </div>
                </div>

                {/* Footer: Last Seen & Score */}
                <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-auto">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Eye size={10} />
                        <span>Seen {formatTimeAgo(node.last_seen_at)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded text-primary border border-primary/20">
                        <Trophy size={10} />
                        <span className="text-xs font-bold font-mono">{stats.total_score?.toFixed(0)}</span>
                    </div>
                </div>

            </div>

            {/* Hover Reveal Button */}
            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-[2px] pointer-events-none">
                <div className="px-4 py-2 bg-primary text-black font-bold text-xs rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                    VIEW DETAILS
                </div>
            </div>

            {/* Click to details - lowered Z to be below checkbox but above content */}
            <Link href={`/node/${node.pubkey}`} className="absolute inset-0 z-10 focus:outline-none" />
        </motion.div>
    );
}
