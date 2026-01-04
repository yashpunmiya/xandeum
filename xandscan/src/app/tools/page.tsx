'use client';

import { useState } from 'react';
import { ProfitSimulator } from '@/components/utilities/ProfitSimulator';
import { NetworkDiagnostics } from '@/components/utilities/NetworkDiagnostics';
import { MarketPulse } from '@/components/utilities/MarketPulse';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Terminal, Coins, ArrowLeft, Hexagon } from 'lucide-react';
import Link from 'next/link';

export default function ToolsPage() {
    const [activeView, setActiveView] = useState<'market' | 'diagnostics' | 'simulator'>('market');

    const MENU_ITEMS = [
        { id: 'market', label: 'MARKET PULSE', icon: Activity },
        { id: 'diagnostics', label: 'ENDPOINT DIAGNOSTICS', icon: Terminal },
        { id: 'simulator', label: 'YIELD SIMULATOR', icon: Coins },
    ] as const;

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 font-sans">

            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

                    {/* Left: Back & Brand */}
                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
                        >
                            <div className="p-1.5 rounded-md bg-white/5 group-hover:bg-white/10 border border-white/5 transition-all">
                                <ArrowLeft size={16} />
                            </div>
                            <span className="text-sm font-bold tracking-wide">EXIT</span>
                        </Link>

                        <div className="h-6 w-px bg-white/10" />

                        
                    </div>

                    {/* Center: Segmented Controls */}
                    <div className="hidden md:flex bg-white/5 p-1 rounded-lg border border-white/5">
                        {MENU_ITEMS.map((item) => {
                            const isActive = activeView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveView(item.id)}
                                    className={`relative px-4 py-1.5 rounded-md text-sm font-bold transition-all duration-300 flex items-center gap-2 ${isActive ? 'text-white shadow-lg' : 'text-white/40 hover:text-white/60'
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeSegment"
                                            className="absolute inset-0 bg-white/10 rounded-md border border-white/10"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <item.icon size={14} />
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right: Status Indicator (Decorative) */}
                    <div className="flex items-center gap-2 text-xs font-mono text-white/30">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        SYSTEM ONLINE
                    </div>
                </div>
            </div>

            {/* Mobile Tab Bar (Visible only on small screens) */}
            <div className="md:hidden px-4 py-4 border-b border-white/5 bg-[#050505]">
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                    {MENU_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${activeView === item.id ? 'bg-white/10 text-white shadow' : 'text-white/40'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Container */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeView}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeView === 'market' && <MarketPulse />}
                        {activeView === 'diagnostics' && <NetworkDiagnostics />}
                        {activeView === 'simulator' && <ProfitSimulator />}
                    </motion.div>
                </AnimatePresence>
            </main>

        </div>
    );
}
