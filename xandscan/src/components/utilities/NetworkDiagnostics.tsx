'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCw, CheckCircle, XCircle, Clock, Database, Server, ChevronDown, ChevronUp, Copy, Terminal } from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---
interface TestResult {
    id: string;
    name: string;
    endpoint: string;
    type: 'RPC' | 'API';
    status: 'idle' | 'running' | 'success' | 'error';
    latency: number | null;
    response: any | null;
    errorMsg?: string;
    lastRun?: number;
}

// --- Component ---
export function NetworkDiagnostics() {
    // Initial State Definition
    const [tests, setTests] = useState<TestResult[]>([
        { id: 'ver', name: 'get-version', endpoint: '/api/rpc-proxy', type: 'RPC', status: 'idle', latency: null, response: null },
        { id: 'stats', name: 'get-stats', endpoint: '/api/rpc-proxy', type: 'RPC', status: 'idle', latency: null, response: null },
        { id: 'pods', name: 'get-pods', endpoint: '/api/rpc-proxy', type: 'RPC', status: 'idle', latency: null, response: null },
        { id: 'pods_stats', name: 'get-pods-with-stats', endpoint: '/api/rpc-proxy', type: 'RPC', status: 'idle', latency: null, response: null },
        { id: 'credits', name: 'pod-credits', endpoint: '/api/pod-credits-proxy', type: 'API', status: 'idle', latency: null, response: null },
    ]);

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isGlobalRunning, setIsGlobalRunning] = useState(false);

    // --- Actions ---
    const runTest = async (id: string) => {
        setTests(prev => prev.map(t => t.id === id ? { ...t, status: 'running', errorMsg: undefined } : t));

        const test = tests.find(t => t.id === id)!;
        const start = Date.now();

        try {
            const body = test.type === 'RPC' ? JSON.stringify({
                jsonrpc: '2.0',
                method: test.name,
                params: {},
                id: Date.now()
            }) : undefined;

            const res = await fetch(test.endpoint, {
                method: test.type === 'RPC' ? 'POST' : 'GET',
                body: body
            });

            const latency = Date.now() - start;
            const json = await res.json();

            // Validate Response
            const isSuccess = test.type === 'RPC'
                ? (json.result !== undefined && !json.error)
                : (!json.error);

            setTests(prev => prev.map(t => t.id === id ? {
                ...t,
                status: isSuccess ? 'success' : 'error',
                latency,
                response: json,
                errorMsg: isSuccess ? undefined : (json.error?.message || json.error || 'Unknown Error'),
                lastRun: Date.now()
            } : t));

        } catch (e: any) {
            setTests(prev => prev.map(t => t.id === id ? {
                ...t,
                status: 'error',
                latency: Date.now() - start,
                response: null,
                errorMsg: e.message
            } : t));
        }
    };

    const runAll = async () => {
        if (isGlobalRunning) return;
        setIsGlobalRunning(true);

        // reset all
        setTests(prev => prev.map(t => ({ ...t, status: 'idle', latency: null, response: null, errorMsg: undefined })));

        // Sequential execution to avoid rate limits/congestion
        for (const test of tests) {
            await runTest(test.id);
            await new Promise(r => setTimeout(r, 200)); // small delay between tests
        }

        setIsGlobalRunning(false);
    };

    const toggleExpand = (id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    const copyResponse = (data: any) => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        toast.success('Response copied to clipboard');
    };

    return (
        <div className="max-w-5xl mx-auto">

            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-black/40 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-emerald-400" />
                        NETWORK INTEGRITY CHECK
                    </h2>
                    <div className="text-sm text-white/40 mt-1">Diagnostic tools for Xandeum RPC & API endpoints</div>
                </div>

                <button
                    onClick={runAll}
                    disabled={isGlobalRunning}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isGlobalRunning
                            ? 'bg-emerald-500/10 text-emerald-500 cursor-not-allowed border border-emerald-500/20'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                        }`}
                >
                    {isGlobalRunning ? <RotateCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    {isGlobalRunning ? 'RUNNING SEQUENCE...' : 'EXECUTE ALL TESTS'}
                </button>
            </div>

            {/* Compact Grid List */}
            <div className="space-y-3">
                {/* Labels Header (Desktop) */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 text-xs font-bold text-white/30 uppercase tracking-widest mb-2">
                    <div className="col-span-4">Endpoint Method</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-2">Latency</div>
                    <div className="col-span-1 text-right">Action</div>
                </div>

                {tests.map((test) => (
                    <div key={test.id} className="group">
                        {/* Main Row */}
                        <div
                            className={`relative grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border transition-all ${test.status === 'running' ? 'bg-white/5 border-emerald-500/30' :
                                    expandedId === test.id ? 'bg-white/[0.07] border-white/20' : 'bg-black/40 border-white/10 hover:border-white/20'
                                }`}
                        >
                            {/* Name */}
                            <div className="col-span-4 flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${test.type === 'RPC' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                    {test.type === 'RPC' ? <Server size={16} /> : <Database size={16} />}
                                </div>
                                <div>
                                    <div className="font-mono font-medium text-white text-sm">{test.name}</div>
                                    <div className="text-[10px] text-white/40 md:hidden">{test.endpoint}</div>
                                </div>
                            </div>

                            {/* Type (Hidden on Mobile) */}
                            <div className="hidden md:block col-span-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded border ${test.type === 'RPC' ? 'border-blue-500/20 text-blue-400' : 'border-purple-500/20 text-purple-400'}`}>
                                    {test.type} PROTOCOL
                                </span>
                            </div>

                            {/* Status */}
                            <div className="col-span-3 flex items-center gap-2">
                                {test.status === 'idle' && <span className="text-white/20 text-xs font-mono">READY</span>}

                                {test.status === 'running' && (
                                    <div className="flex items-center gap-2 text-yellow-400">
                                        <RotateCw size={14} className="animate-spin" />
                                        <span className="text-xs font-mono">TESTING...</span>
                                    </div>
                                )}

                                {test.status === 'success' && (
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <CheckCircle size={14} />
                                        <span className="text-xs font-mono">OPERATIONAL</span>
                                    </div>
                                )}

                                {test.status === 'error' && (
                                    <div className="flex items-center gap-2 text-red-400">
                                        <XCircle size={14} />
                                        <span className="text-xs font-mono">FAILED</span>
                                    </div>
                                )}
                            </div>

                            {/* Latency */}
                            <div className="col-span-2">
                                {test.latency ? (
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={12} className={test.latency < 200 ? 'text-emerald-400' : test.latency < 500 ? 'text-yellow-400' : 'text-red-400'} />
                                        <span className={`font-mono text-sm ${test.latency < 200 ? 'text-white' : 'text-white/70'}`}>
                                            {test.latency}ms
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-white/10 text-sm">--</span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="col-span-1 flex items-center justify-end gap-2">
                                {/* View Details Toggle */}
                                {(test.response || test.errorMsg) && (
                                    <button
                                        onClick={() => toggleExpand(test.id)}
                                        className={`p-2 rounded-lg transition-colors ${expandedId === test.id ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/40'}`}
                                    >
                                        {expandedId === test.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                )}

                                {/* Run Button */}
                                <button
                                    onClick={() => runTest(test.id)}
                                    disabled={test.status === 'running' || isGlobalRunning}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Play size={16} className={test.status === 'running' ? 'opacity-50' : 'fill-white/20'} />
                                </button>
                            </div>
                        </div>

                        {/* Expandable Details Panel */}
                        <AnimatePresence>
                            {expandedId === test.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mx-4 mb-4 p-4 rounded-b-xl bg-black/40 border border-t-0 border-white/10 shadow-inner">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="text-xs font-bold text-white/40 uppercase tracking-wider">Payload Response</div>
                                            <button
                                                onClick={() => copyResponse(test.response)}
                                                className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
                                            >
                                                <Copy size={12} /> COPY JSON
                                            </button>
                                        </div>

                                        {test.errorMsg ? (
                                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-mono">
                                                Error: {test.errorMsg}
                                            </div>
                                        ) : (
                                            <pre className="p-3 bg-black/50 rounded-lg text-emerald-400/80 text-xs font-mono overflow-x-auto max-h-64 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                                {JSON.stringify(test.response, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
}
