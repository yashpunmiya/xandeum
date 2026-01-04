'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// --- Icons ---
const PulseIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);
const TrendingUp = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);
const TrendingDown = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        <polyline points="17 18 23 18 23 12" />
    </svg>
);

// --- Component ---
export function MarketPulse() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/xand-info-proxy').then(res => res.json()).then(setData).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading || !data) return <div className="h-64 flex items-center justify-center text-emerald-500/50 animate-pulse font-mono">ESTABLISHING DATA LINK...</div>;

    const m = data.market_data;
    const isUp = m.price_change_percentage_24h >= 0;

    const StatBox = ({ label, value, sub, color = "text-white" }: any) => (
        <div className="bg-black/40 border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-white/20 transition-all">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">{label}</div>
            <div>
                <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
                {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">

            {/* Ticker Row */}
            <div className="flex flex-col md:flex-row gap-6 items-stretch">
                {/* Main Price Card */}
                <div className="flex-1 bg-gradient-to-br from-emerald-900/20 to-black border border-white/10 rounded-2xl p-8 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />

                    <div className="flex items-center gap-6 z-10">
                        <div className="w-16 h-16 rounded-full bg-black border border-white/10 p-1 shadow-2xl">
                            <img src={data.image.large} alt={data.name} className="w-full h-full rounded-full object-cover" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-4xl font-black text-white tracking-tighter">{data.name.toUpperCase()}</h1>
                                <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono text-white/60">{data.symbol.toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-mono text-white">${m.current_price.usd.toFixed(4)}</span>
                                <span className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded bg-black/40 border border-white/5 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                    {m.price_change_percentage_24h.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mini Chart (Visual Only) */}
                    <div className="hidden lg:flex gap-1 items-end h-16 pl-8 border-l border-white/5 opacity-50">
                        {[40, 60, 45, 70, 65, 80, 75, 90, 85, 100].map((h, i) => (
                            <div key={i} className={`w-2 rounded-t-sm ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ height: `${h}%`, opacity: 0.3 + (i * 0.07) }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Dense Grid Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="Market Cap" value={`$${(m.market_cap.usd / 1e6).toFixed(2)}M`} sub={`Rank #${data.market_cap_rank}`} />
                <StatBox label="24h Volume" value={`$${(m.total_volume.usd / 1e6).toFixed(2)}M`} color="text-blue-300" />
                <StatBox label="Circulating" value={`${(m.circulating_supply / 1e6).toFixed(2)}M`} sub={`${((m.circulating_supply / m.max_supply) * 100).toFixed(1)}% Minted`} color="text-yellow-300" />
                <StatBox label="All Time High" value={`$${m.ath.usd.toFixed(2)}`} sub={`${((m.current_price.usd / m.ath.usd - 1) * 100).toFixed(1)}% from peak`} color="text-purple-300" />
            </div>

            {/* Bottom Details Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full max-h-[80vh]">
                {/* Changes */}
                <div className="lg:col-span-2 bg-black/20 border border-white/5 rounded-xl p-6">
                    <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-6">Price Action</h3>
                    <div className="grid grid-cols-4 gap-4 text-center">
                        {[
                            { l: '24h', v: m.price_change_percentage_24h },
                            { l: '7d', v: m.price_change_percentage_7d },
                            { l: '30d', v: m.price_change_percentage_30d },
                            { l: '1y', v: m.price_change_percentage_1y || 0 },
                        ].map((item) => (
                            <div key={item.l} className="bg-white/5 rounded-lg p-3">
                                <div className="text-[10px] text-white/40 uppercase mb-1">{item.l}</div>
                                <div className={`text-sm font-bold font-mono ${item.v >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {item.v > 0 ? '+' : ''}{item.v.toFixed(1)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Links */}
                <div className="bg-black/20 border border-white/5 rounded-xl p-6 flex flex-col justify-center gap-3">
                    <button
                        onClick={() => { navigator.clipboard.writeText(data.contract_address); toast.success('Copied'); }}
                        className="w-full flex justify-between items-center p-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono text-white/60 transition-colors border border-white/5"
                    >
                        <span className="truncate max-w-[200px]">{data.contract_address}</span>
                        <span className="text-emerald-500 font-bold">COPY ADDR</span>
                    </button>
                    <div className="flex gap-2">
                        <a href={data.links.homepage[0]} target="_blank" className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded text-center text-xs font-bold text-white/60 hover:text-white transition-colors">WEB</a>
                        <a href={`https://x.com/${data.links.twitter_screen_name}`} target="_blank" className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded text-center text-xs font-bold text-white/60 hover:text-white transition-colors">X / TWIT</a>
                    </div>
                </div>
            </div>

        </div>
    );
}
