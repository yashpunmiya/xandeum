'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid,
    List,
    Search,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Check
} from 'lucide-react';
import NodeCard from './NodeCard';
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

    const itemsPerPage = viewMode === 'grid' ? 12 : 20; // 3 rows of 4 or similar
    const safeNodes = Array.isArray(nodes) ? nodes.filter(Boolean) : [];

    // Filter Logic
    const filteredNodes = safeNodes.filter(node =>
        node.pubkey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.ip_address?.includes(searchTerm) ||
        node.stats?.version?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

        // String comparison
        if (typeof valA === 'string' && typeof valB === 'string') {
            return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        // Date handling
        if (sort === 'last_seen_at') {
            const dateA = new Date(valA).getTime();
            const dateB = new Date(valB).getTime();
            return order === 'asc' ? dateA - dateB : dateB - dateA;
        }

        // Numeric comparison
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

    // Sort Options List
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

    return (
        <div className="space-y-6">
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

                {/* Sorting & View Toggle */}
                <div className="flex flex-wrap items-center gap-2">
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
                        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" // Strictly 3 columns on large screens
                    >
                        {paginatedNodes.map((node, i) => (
                            <NodeCard key={node.pubkey} node={node} index={i} />
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
                                    <tr key={node.pubkey} className="group hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="font-mono font-medium text-foreground text-sm group-hover:text-primary transition-colors truncate w-32">
                                                {node.pubkey}
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            {node.country || 'Unknown'}
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
