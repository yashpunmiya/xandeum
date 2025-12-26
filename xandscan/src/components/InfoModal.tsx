'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server, Coins, Landmark, Zap, Compass, MessageSquare, ExternalLink, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'pnode' | 'stoinc' | 'xand';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('pnode');

    if (!isOpen) return null;

    const tabs = [
        { id: 'pnode', label: 'What is a pNode?', icon: Server },
        { id: 'stoinc', label: 'STOINC', icon: Coins },
        { id: 'xand', label: 'XAND', icon: Landmark },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between border-b border-white/5 bg-white/[0.02] p-2">
                        <div className="flex items-center gap-1 p-1 overflow-x-auto w-full md:w-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap",
                                        activeTab === tab.id
                                            ? "bg-primary text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 md:relative md:top-0 md:right-0 p-3 text-muted-foreground hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="p-8 min-h-[450px]">
                        <AnimatePresence mode="wait">
                            {activeTab === 'pnode' && (
                                <motion.div
                                    key="pnode"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="grid md:grid-cols-2 gap-12"
                                >
                                    <div className="space-y-6">
                                        <h2 className="text-3xl font-black text-white">What is a pNode?</h2>
                                        <p className="text-lg text-muted-foreground leading-relaxed">
                                            A storage server that earns SOL by hosting data for Solana apps.
                                        </p>
                                        <div className="space-y-4">
                                            {[
                                                { num: '1', text: 'Stores encrypted data for dApps' },
                                                { num: '2', text: 'Proves it still has the data (earns credits)' },
                                                { num: '3', text: 'Gets paid SOL based on credits earned' },
                                            ].map((item) => (
                                                <div key={item.num} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                                                    <span className="text-xl font-black text-primary">{item.num}</span>
                                                    <span className="text-white font-medium">{item.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h3 className="text-xl font-bold text-white">Why Delegate XAND?</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Your XAND stake boosts the node's earning power. You share in their SOL rewards.
                                        </p>
                                        <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
                                            <div className="text-[10px] uppercase tracking-widest font-black text-primary/60">The Formula</div>
                                            <div className="text-lg md:text-xl font-mono text-white leading-loose">
                                                earnings = <span className="text-primary">nodes</span> × <span className="text-primary">storage</span> × <span className="text-primary">performance</span> × <span className="text-green-400">stake</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Higher stake = higher earnings for everyone in the pool</p>
                                        </div>
                                        <a href="https://xandeum.network/stoinc" target="_blank" className="flex items-center gap-2 text-primary text-sm font-bold hover:underline">
                                            Learn more at xandeum.network/stoinc <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'stoinc' && (
                                <motion.div
                                    key="stoinc"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="grid md:grid-cols-2 gap-12"
                                >
                                    <div className="space-y-6">
                                        <h2 className="text-3xl font-black text-white underline decoration-primary/30 decoration-4 underline-offset-8">STOINC = Storage Income</h2>
                                        <p className="text-lg text-muted-foreground">
                                            SOL fees from storage-enabled dApps, distributed every ~2 days.
                                        </p>
                                        <div className="flex items-center gap-8 p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                                            <div className="relative h-32 w-32 shrink-0">
                                                <div className="absolute inset-0 rounded-full border-[16px] border-primary" />
                                                <div className="absolute inset-0 rounded-full border-[16px] border-purple-500 border-t-transparent border-l-transparent -rotate-45" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <PieChart size={32} className="text-white/20" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-4 w-4 rounded-sm bg-primary" />
                                                    <span className="text-sm text-white"><span className="font-black text-primary">94%</span> Operators + Delegators</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-4 w-4 rounded-sm bg-purple-500" />
                                                    <span className="text-sm text-white"><span className="font-black text-purple-400">3%</span> XAND DAO</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-4 w-4 rounded-sm bg-gray-600" />
                                                    <span className="text-sm text-white"><span className="font-black text-gray-400">3%</span> Investors</span>
                                                </div>
                                            </div>
                                        </div>
                                        <a href="https://xandeum.network/stoinc" target="_blank" className="flex items-center gap-2 text-primary text-sm font-bold hover:underline">
                                            Source: xandeum.network/stoinc <ExternalLink size={14} />
                                        </a>
                                    </div>
                                    <div className="space-y-6">
                                        <h3 className="text-xl font-bold text-white">How Rewards Work</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
                                                <div className="text-[10px] font-black text-muted-foreground uppercase">Epoch</div>
                                                <div className="text-2xl font-black text-white">~2 days</div>
                                            </div>
                                            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
                                                <div className="text-[10px] font-black text-muted-foreground uppercase">Paid In</div>
                                                <div className="text-2xl font-black text-primary">SOL</div>
                                            </div>
                                        </div>
                                        <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
                                            <div className="text-[10px] uppercase tracking-widest font-black text-primary/60">Your Share</div>
                                            <div className="text-sm font-mono text-white leading-relaxed">
                                                (your stake ÷ pool stake) × (pool credits ÷ network credits) × <span className="text-primary font-bold">94%</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'xand' && (
                                <motion.div
                                    key="xand"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="grid md:grid-cols-2 gap-12"
                                >
                                    <div className="space-y-6 flex flex-col h-full">
                                        <h2 className="text-3xl font-black text-white">XAND Token</h2>
                                        <p className="text-lg text-muted-foreground">
                                            Governance token for Xandeum. Stake to pNodes to boost their earnings and share SOL rewards.
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
                                                <div className="text-[10px] font-black text-muted-foreground uppercase">Total Supply</div>
                                                <div className="text-2xl font-black text-white">4.015B</div>
                                            </div>
                                            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
                                                <div className="text-[10px] font-black text-muted-foreground uppercase">Circulating</div>
                                                <div className="text-2xl font-black text-green-400">1.3B</div>
                                                <div className="text-[10px] text-muted-foreground font-bold">~32%</div>
                                            </div>
                                        </div>
                                        <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 mt-auto">
                                            <div className="text-[10px] uppercase tracking-widest font-black text-primary/60 mb-2">Power-Up</div>
                                            <div className="text-sm font-bold text-white flex items-center gap-2">
                                                <Zap size={16} className="text-primary" />
                                                YOUR STAKE MULTIPLIES NODE EARNINGS
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">Rewards paid in SOL every ~2 days</div>
                                        </div>
                                        <div className="flex flex-wrap gap-4 pt-4">
                                            <a
                                                href="https://jup.ag/swap/SOL-XAND"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-6 py-3 bg-primary text-black font-black text-sm rounded-xl hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all flex items-center gap-2"
                                            >
                                                <Coins size={16} /> Buy on Jupiter
                                            </a>
                                            <div className="flex gap-2">
                                                <a
                                                    href="https://solscan.io/token/XANDuUoVoUqniKkpcKhrxmvYJybpJvUxJLr21Gaj3Hx"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-3 bg-white/5 text-white border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                                                    title="Solscan"
                                                >
                                                    <ExternalLink size={18} />
                                                </a>
                                                <a
                                                    href="https://www.geckoterminal.com/solana/tokens/XANDuUoVoUqniKkpcKhrxmvYJybpJvUxJLr21Gaj3Hx"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-3 bg-white/5 text-white border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                                                    title="GeckoTerminal"
                                                >
                                                    <PieChart size={18} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h3 className="text-xl font-bold text-white">How to Delegate</h3>
                                        <div className="p-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 space-y-2">
                                            <div className="text-[10px] font-black text-cyan-400 uppercase">Currently on Devnet</div>
                                            <p className="text-sm text-muted-foreground">
                                                Delegation is coordinated through Discord and the Xandeum Foundation Delegation Program (XFDP).
                                            </p>
                                        </div>
                                        <div className="space-y-4">
                                            {[
                                                { num: '1', text: 'Buy XAND on Jupiter', icon: Landmark, link: 'https://jup.ag/swap/SOL-XAND' },
                                                { num: '2', text: 'Join Xandeum Discord', icon: MessageSquare, link: 'https://discord.com/invite/mGAxAuwnR9' },
                                                { num: '3', text: 'Coordinate with XFDP team', icon: Compass, link: 'https://discord.com/invite/mGAxAuwnR9' },
                                            ].map((item) => (
                                                <a
                                                    key={item.num}
                                                    href={item.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm font-black text-muted-foreground">{item.num}</span>
                                                        <span className="text-white font-medium group-hover:text-primary transition-colors">{item.text}</span>
                                                    </div>
                                                    <item.icon size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                                </a>
                                            ))}
                                        </div>
                                        <a
                                            href="https://discord.com/invite/mGAxAuwnR9"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-black font-black rounded-2xl hover:scale-[1.02] transition-transform"
                                        >
                                            <MessageSquare size={18} /> Join Discord
                                        </a>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
