'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid,
    List,
    Search,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Filter
} from 'lucide-react';
import NodeCard from './NodeCard';
import { Node } from '@/types'; // Assuming types exist
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

export default function NodesExplorer({ nodes }: { nodes: any[] }) {
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [sort, setSort] = useState('total_score');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = viewMode === 'grid' ? 12 : 15;

    const safeNodes = Array.isArray(nodes) ? nodes.filter(Boolean) : [];

    // Filter & Sort
    const filteredNodes = safeNodes.filter(node =>
        node.pubkey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.ip_address?.includes(searchTerm)
    );

    const sortedNodes = [...filteredNodes].sort((a, b) => {
        let valA = a.stats?.[sort];
        let valB = b.stats?.[sort];

        if (sort === 'country') {
            valA = a.country || '';
            valB = b.country || '';
        }

        if (valA === undefined) valA = 0;
        if (valB === undefined) valB = 0;

        if (typeof valA === 'string' && typeof valB === 'string') {
            return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return order === 'asc' ? valA - valB : valB - valA;
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

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur-md md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search nodes by ID, Country, IP..."
                        className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn("rounded-md p-1.5 transition-colors", viewMode === 'grid' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn("rounded-md p-1.5 transition-colors", viewMode === 'table' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                        >
                            <List size={16} />
                        </button>
                    </div>

                    <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors">
                        <Filter size={14} /> Filter
                    </button>
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
                        <p>No nodes found matching your search.</p>
                    </motion.div>
                ) : viewMode === 'grid' ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    >
                        {paginatedNodes.map((node, i) => (
                            <NodeCard key={node.pubkey} node={node} index={i} />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="table"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm"
                    >
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('pubkey')}>Node / Location</th>
                                    <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('version')}>Version</th>
                                    <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('cpu_percent')}>Resources</th>
                                    <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('total_score')}>Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedNodes.map((node) => (
                                    <tr key={node.pubkey} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                    {node.country?.slice(0, 2) || '?'}
                                                </div>
                                                <div>
                                                    <div className="font-mono font-medium text-foreground">{node.pubkey.substring(0, 10)}...</div>
                                                    <div className="text-xs text-muted-foreground">{node.city}, {node.country}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-muted-foreground">
                                            v{node.stats?.version}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 w-32">
                                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                                    <span>CPU</span><span>{node.stats?.cpu_percent}%</span>
                                                </div>
                                                <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${node.stats?.cpu_percent}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-bold text-primary">
                                            {node.stats?.total_score?.toFixed(2)}
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
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="flex items-center px-4 text-sm font-medium text-muted-foreground">
                        Page {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
