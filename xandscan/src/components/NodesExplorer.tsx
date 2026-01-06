'use client';


import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCountryCode, getFlagUrl } from '@/lib/country-utils';
import { MapPin } from 'lucide-react';
import {
    LayoutGrid,
    List,
    Search,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Check,
    Scale,
    X,
    Star
} from 'lucide-react';
import NodeCard from './NodeCard';
import CompareModal from './CompareModal';
import WatchlistSidebar from './WatchlistSidebar';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { Node } from '@/types';

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

// Reusable Sort Option Component
function SortOption({ label, active, onClick, direction }: { label: string, active: boolean, onClick: () => void, direction: 'asc' | 'desc' }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all border flex items-center gap-1.5",
                active
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
            )}
        >
            {label}
            {active && (
                <ArrowUpDown size={10} className={cn("transition-transform", direction === 'asc' ? "rotate-180" : "")} />
            )}
        </button>
    );
}

export default function NodesExplorer({ nodes }: { nodes: Node[] }) {
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [sort, setSort] = useState('total_score');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);

    // Comparison State
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const [isCompareOpen, setIsCompareOpen] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Watchlist State
    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);

    // Initial Load of Watchlist
    useEffect(() => {
        const saved = localStorage.getItem('xandscan_watchlist');
        if (saved) {
            try {
                setWatchlist(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse watchlist", e);
            }
        }
    }, []);

    const toggleWatchlist = (pubkey: string) => {
        setWatchlist(prev => {
            const next = prev.includes(pubkey)
                ? prev.filter(id => id !== pubkey)
                : [...prev, pubkey];
            localStorage.setItem('xandscan_watchlist', JSON.stringify(next));
            return next;
        });
    };

    const itemsPerPage = viewMode === 'grid' ? 12 : 20;
    const safeNodes = Array.isArray(nodes) ? nodes.filter(Boolean) : [];

    // Filter Logic
    const filteredNodes = safeNodes.filter(node =>
        node.pubkey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.ip_address?.includes(searchTerm) ||
        node.stats?.version?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Auto-enable selection mode if user starts selecting
    const toggleSelection = (pubkey: string) => {
        if (!isSelectionMode) setIsSelectionMode(true);

        if (selectedNodes.includes(pubkey)) {
            setSelectedNodes(prev => prev.filter(id => id !== pubkey));
        } else {
            if (selectedNodes.length >= 4) {
                // Optional: Show toast or visual feedback that max is 4
                return;
            }
            setSelectedNodes(prev => [...prev, pubkey]);
        }
    };

    // Sort Logic
    const sortedNodes = [...filteredNodes].sort((a, b) => {
        let valA: any = sort === 'country' ? a.country :
            sort === 'last_seen_at' ? a.last_seen_at :
                a.stats?.[sort as keyof typeof a.stats];

        let valB: any = sort === 'country' ? b.country :
            sort === 'last_seen_at' ? b.last_seen_at :
                b.stats?.[sort as keyof typeof b.stats];

        if (valA === undefined) valA = 0;
        if (valB === undefined) valB = 0;

        if (typeof valA === 'string' && typeof valB === 'string') {
            return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        if (sort === 'last_seen_at') {
            const dateA = new Date(valA).getTime();
            const dateB = new Date(valB).getTime();
            return order === 'asc' ? dateA - dateB : dateB - dateA;
        }

        return order === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    const totalPages = Math.ceil(sortedNodes.length / itemsPerPage);
    const paginatedNodes = sortedNodes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (key: string) => {
        if (sort === key) {
            setOrder(order === 'asc' ? 'desc' : 'asc');
        } else {
            setSort(key);
            setOrder('desc');
        }
    };

    const sortOptions = [
        { key: 'total_score', label: 'Score' },
        { key: 'version', label: 'Version' },
        { key: 'cpu_percent', label: 'CPU' },
        { key: 'credits', label: 'Credits' },
        { key: 'uptime_seconds', label: 'Uptime' }
    ];

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
        return d > 0 ? `${d}d` : `${Math.floor(seconds / 3600)}h`;
    };



    const getSelectedNodeObjects = () => {
        return safeNodes.filter(n => selectedNodes.includes(n.pubkey));
    };

    return (
        <div className="space-y-6 relative">
            <CompareModal
                isOpen={isCompareOpen}
                onClose={() => setIsCompareOpen(false)}
                nodes={getSelectedNodeObjects()}
            />

            <WatchlistSidebar
                isOpen={isWatchlistOpen}
                onClose={() => setIsWatchlistOpen(false)}
                watchedNodeIds={watchlist}
                nodes={safeNodes}
                onToggleWatchlist={toggleWatchlist}
            />

            {/* Toolbar */}
            <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#0a0a0a] p-4 md:flex-row md:items-center md:justify-between shadow-2xl">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search nodes..."
                        className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Watchlist Toggle */}
                    <button
                        onClick={() => setIsWatchlistOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white transition-all shadow-sm"
                    >
                        <Star size={16} />
                        <span className="hidden lg:inline">Watchlist</span>
                        {watchlist.length > 0 && (
                            <span className="bg-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                                {watchlist.length}
                            </span>
                        )}
                    </button>

                    {/* Compare Toggle */}
                    <button
                        onClick={() => setIsSelectionMode(!isSelectionMode)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold transition-all shadow-sm mr-2",
                            isSelectionMode || selectedNodes.length > 0
                                ? "bg-primary text-black border-primary shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                                : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
                        )}
                    >
                        <Scale size={16} />
                        {isSelectionMode ? 'Done' : 'Compare Nodes'}
                    </button>

                    <span className="text-xs text-muted-foreground font-medium mr-1 hidden lg:block">Sort by:</span>
                    {sortOptions.map(opt => (
                        <SortOption
                            key={opt.key}
                            label={opt.label}
                            active={sort === opt.key}
                            direction={order}
                            onClick={() => handleSort(opt.key)}
                        />
                    ))}

                    <div className="h-6 w-px bg-white/10 mx-2" />

                    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn("rounded-md p-1.5 transition-all", viewMode === 'grid' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}
                            title="Grid View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn("rounded-md p-1.5 transition-all", viewMode === 'table' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}
                            title="List View"
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {sortedNodes.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-muted-foreground"
                    >
                        <Search className="mb-4 h-12 w-12 opacity-20" />
                        <p className="text-lg font-medium">No nodes found</p>
                    </motion.div>
                ) : viewMode === 'grid' ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {paginatedNodes.map((node, i) => (
                            <NodeCard
                                key={node.pubkey}
                                node={node}
                                index={i}
                                isSelected={selectedNodes.includes(node.pubkey)}
                                isSelectionMode={isSelectionMode}
                                onToggleSelect={() => toggleSelection(node.pubkey)}
                                isWatchlisted={watchlist.includes(node.pubkey)}
                                onToggleWatchlist={() => toggleWatchlist(node.pubkey)}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="table"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
                    >
                        <table className="w-full text-left text-sm min-w-[900px]">
                            <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground font-medium border-b border-white/5">
                                <tr>
                                    <th className="p-4 w-10"></th> {/* Watchlist col */}
                                    <th className="p-4 w-10"></th> {/* Checkbox col */}
                                    <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('pubkey')}>Node</th>
                                    <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('country')}>Location</th>
                                    <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('version')}>Version</th>
                                    <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('uptime_seconds')}>Uptime</th>
                                    <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('cpu_percent')}>CPU</th>
                                    <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('ram_used')}>RAM</th>
                                    <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('storage_used')}>Storage</th>
                                    <th className="p-4 cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort('total_score')}>Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedNodes.map((node, i) => (
                                    <tr key={node.pubkey} className={cn("group transition-colors", selectedNodes.includes(node.pubkey) ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-white/5")}>
                                        <td className="p-4 pr-0">
                                            <button
                                                onClick={() => toggleWatchlist(node.pubkey)}
                                                className={cn("transition-all hover:scale-110", watchlist.includes(node.pubkey) ? "text-yellow-500" : "text-muted-foreground/20 hover:text-yellow-500")}
                                            >
                                                <Star size={16} fill={watchlist.includes(node.pubkey) ? "currentColor" : "none"} />
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => toggleSelection(node.pubkey)}
                                                className={cn("h-4 w-4 rounded border flex items-center justify-center transition-colors", selectedNodes.includes(node.pubkey) ? "bg-primary border-primary text-black" : "border-white/20 hover:border-primary")}
                                            >
                                                {selectedNodes.includes(node.pubkey) && <Check size={10} strokeWidth={4} />}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-mono font-medium text-foreground text-sm group-hover:text-primary transition-colors truncate w-32">
                                                {node.pubkey}
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                {(() => {
                                                    const code = getCountryCode(node.country || '');
                                                    const flag = getFlagUrl(code);
                                                    return flag ? (
                                                        <img src={flag} alt={node.country} className="w-5 h-3.5 rounded-[2px] shadow-sm" />
                                                    ) : (
                                                        <MapPin size={14} className="opacity-50" />
                                                    );
                                                })()}
                                                <span className="truncate max-w-[120px]" title={node.country || 'Unknown'}>{node.country || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-muted-foreground">
                                            <span className="bg-white/5 px-2 py-1 rounded border border-white/5">v{node.stats?.version || '0.0'}</span>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-muted-foreground">
                                            {formatUptime(node.stats?.uptime_seconds || 0)}
                                        </td>
                                        <td className="p-4 text-xs font-mono">
                                            {node.stats?.cpu_percent?.toFixed(0)}%
                                        </td>
                                        <td className="p-4 text-xs font-mono text-muted-foreground">
                                            {formatBytes(node.stats?.ram_used || 0)}
                                        </td>
                                        <td className="p-4 text-xs font-mono text-muted-foreground">
                                            {formatBytes(node.stats?.storage_used || 0)}
                                        </td>
                                        <td className="p-4 text-right font-bold text-primary">
                                            {node.stats?.total_score?.toFixed(0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Compare Floating Bar */}
            <AnimatePresence>
                {selectedNodes.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-md rounded-full border border-primary/20 p-2 pl-6 pr-2 flex items-center gap-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-white">
                                <span className="text-primary font-bold">{selectedNodes.length}</span> nodes selected
                            </span>
                            <div className="h-4 w-px bg-white/10" />
                            <button
                                onClick={() => setSelectedNodes([])}
                                className="text-xs text-muted-foreground hover:text-white transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                        <button
                            onClick={() => setIsCompareOpen(true)}
                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                        >
                            <Scale size={16} /> Compare
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center px-4 text-sm font-medium text-muted-foreground bg-white/5 rounded-lg">
                        Page {currentPage} of {totalPages}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}
