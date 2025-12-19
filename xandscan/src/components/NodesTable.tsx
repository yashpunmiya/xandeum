'use client';
import { Node } from '@/types';
import Link from 'next/link';
import { useState } from 'react';
import { 
  MapPin, 
  Cpu, 
  HardDrive, 
  Activity, 
  Coins, 
  Eye, 
  Trophy, 
  Key,
  MemoryStick,
  GitCommit,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function NodesTable({ nodes }: { nodes: any[] }) {
  const [sort, setSort] = useState('total_score');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const sortedNodes = [...nodes].sort((a, b) => {
    let valA = a.stats?.[sort];
    let valB = b.stats?.[sort];

    // Handle special cases for sorting
    if (sort === 'country') {
      valA = a.country || '';
      valB = b.country || '';
    } else if (sort === 'last_seen_at') {
      valA = new Date(a.last_seen_at).getTime();
      valB = new Date(b.last_seen_at).getTime();
    }

    // Default to 0 if undefined
    if (valA === undefined || valA === null) valA = 0;
    if (valB === undefined || valB === null) valB = 0;

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

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-3 w-12 text-center">#</th>
              <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('pubkey')}>
                <div className="flex items-center gap-1"><Key className="w-4 h-4" /> Pubkey</div>
              </th>
              <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('country')}>
                <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Location</div>
              </th>
              <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('version')}>
                <div className="flex items-center gap-1"><GitCommit className="w-4 h-4" /> Ver</div>
              </th>
              <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('cpu_percent')}>
                <div className="flex items-center gap-1"><Cpu className="w-4 h-4" /> CPU</div>
              </th>
              <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('ram_used')}>
                <div className="flex items-center gap-1"><MemoryStick className="w-4 h-4" /> RAM</div>
              </th>
              <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('storage_used')}>
                <div className="flex items-center gap-1"><HardDrive className="w-4 h-4" /> Stor</div>
              </th>
              {/* <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('active_streams')}>
                <div className="flex items-center gap-1"><Activity className="w-4 h-4" /> Str</div>
              </th> */}
              <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('credits')}>
                <div className="flex items-center gap-1"><Coins className="w-4 h-4" /> Cred</div>
              </th>
              <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('last_seen_at')}>
                <div className="flex items-center gap-1"><Eye className="w-4 h-4" /> Seen</div>
              </th>
              <th className="p-3 cursor-pointer hover:text-foreground text-right" onClick={() => handleSort('total_score')}>
                <div className="flex items-center justify-end gap-1"><Trophy className="w-4 h-4" /> Score</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedNodes.map((node, index) => {
              const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
              return (
                <tr key={node.pubkey} className="border-t border-border hover:bg-muted/50 transition-colors">
                  <td className="p-3 text-center text-muted-foreground">{globalIndex}</td>
                  <td className="p-3">
                    <Link href={`/node/${node.pubkey}`} className="hover:text-primary font-mono text-xs">
                      {node.pubkey.substring(0, 8)}...
                    </Link>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {node.country !== 'Unknown' && (
                        <img 
                          src={`https://flagcdn.com/24x18/${node.country?.toLowerCase()}.png`} 
                          alt={node.country}
                          className="w-4 h-3 object-cover rounded-sm"
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                      )}
                      <span className="truncate max-w-[100px]" title={node.city}>{node.country}</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs">{node.stats?.version || '-'}</td>
                  <td className="p-3 text-xs">{node.stats?.cpu_percent !== null ? `${node.stats.cpu_percent}%` : '-'}</td>
                  <td className="p-3 text-xs">
                    {node.stats?.ram_used ? (
                      <span title={`${formatBytes(node.stats.ram_used)} / ${formatBytes(node.stats.ram_total)}`}>
                        {Math.round((node.stats.ram_used / node.stats.ram_total) * 100)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-3 text-xs">{node.stats?.storage_used ? formatBytes(node.stats.storage_used) : '-'}</td>
                  {/* <td className="p-3 text-xs">-</td> */}
                  <td className="p-3 text-xs">{node.stats?.credits?.toLocaleString() || 0}</td>
                  <td className="p-3 text-xs text-muted-foreground">{formatTimeAgo(node.last_seen_at)}</td>
                  <td className="p-3 text-right font-bold text-primary">
                    {node.stats?.total_score?.toFixed(1) || '0.0'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedNodes.length)} of {sortedNodes.length} nodes
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

