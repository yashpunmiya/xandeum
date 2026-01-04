'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, Box, Star, Zap, Gauge as GaugeIcon, DollarSign, Database, Server } from 'lucide-react';

// --- Constants ---
const NFT_BOOST_FACTORS = [
    { id: 'none', label: 'None', multiplier: 1.0, icon: Box },
    { id: 'gold', label: 'Gold', multiplier: 1.5, icon: Star },
    { id: 'platinum', label: 'Plat.', multiplier: 2.0, icon: Zap },
];

const ERA_BOOSTS = [
    { id: 'era1', label: 'Genesis', multiplier: 1.2 },
    { id: 'era2', label: 'Expansion', multiplier: 1.1 },
    { id: 'era3', label: 'Stable', multiplier: 1.0 },
];

export function ProfitSimulator() {
    const [pNodes, setPNodes] = useState(1);
    const [storage, setStorage] = useState(100);
    const [performance, setPerformance] = useState(0.9);
    const [stake, setStake] = useState(1000);
    const [selectedBoost, setSelectedBoost] = useState('none');
    const [selectedEra, setSelectedEra] = useState('era1');

    // Calculation Logic (same as before)
    const metrics = useMemo(() => {
        const nftMult = NFT_BOOST_FACTORS.find(b => b.id === selectedBoost)?.multiplier || 1;
        const eraMult = ERA_BOOSTS.find(e => e.id === selectedEra)?.multiplier || 1;
        const totalBoost = nftMult * eraMult;

        const oneNodeWeight = (Math.pow(storage, 0.4)) * (Math.pow(stake, 0.6)) * performance;
        const totalUserWeight = oneNodeWeight * pNodes * totalBoost;

        const params = {
            networkWeight: 500000,
            emission: 50000
        };

        const networkShare = totalUserWeight / (params.networkWeight + totalUserWeight);
        const earningsPerEpoch = params.emission * networkShare;

        return {
            earningsPerEpoch: earningsPerEpoch.toFixed(2),
            daily: (earningsPerEpoch * 2).toFixed(2), // approx 2 epochs/day
            monthly: (earningsPerEpoch * 60).toFixed(2),
            yearly: (earningsPerEpoch * 60 * 12).toFixed(2),
            yieldRate: ((earningsPerEpoch * 60 * 12 * 0.05) / (stake * 0.05 + 2000)).toFixed(1) // Fake ROI calc just for display
        };
    }, [pNodes, storage, performance, stake, selectedBoost, selectedEra]);

    const SliderControl = ({ label, value, min, max, step, unit, onChange, icon: Icon, colorClass }: any) => (
        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-white/60 text-xs font-mono uppercase">
                    <Icon size={14} className={colorClass} /> {label}
                </div>
                <div className={`font-mono font-bold text-lg ${colorClass}`}>
                    {value.toLocaleString()} <span className="text-white/20 text-xs">{unit}</span>
                </div>
            </div>
            <input
                type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white hover:accent-emerald-400 transition-all"
            />
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full max-h-[80vh]">

            {/* Left: Input Console */}
            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SliderControl label="Active Nodes" value={pNodes} min={1} max={50} step={1} unit="NODES" onChange={setPNodes} icon={Server} colorClass="text-emerald-400" />
                    <SliderControl label="Storage / Node" value={storage} min={100} max={10000} step={100} unit="GB" onChange={setStorage} icon={Database} colorClass="text-blue-400" />
                    <SliderControl label="Total Stake" value={stake} min={100} max={100000} step={100} unit="XAND" onChange={setStake} icon={DollarSign} colorClass="text-yellow-400" />
                    <SliderControl label="Uptime Score" value={(performance * 100).toFixed(0)} min={10} max={100} step={5} unit="%" onChange={(v: any) => setPerformance(v / 100)} icon={GaugeIcon} colorClass="text-purple-400" />
                </div>

                {/* Compact Boost Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <label className="text-xs text-white/40 font-mono mb-3 block">NFT MULTIPLIER</label>
                        <div className="flex gap-2">
                            {NFT_BOOST_FACTORS.map(nft => (
                                <button
                                    key={nft.id} onClick={() => setSelectedBoost(nft.id)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${selectedBoost === nft.id ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-black/20 border-white/10 text-white/40'}`}
                                >
                                    <nft.icon size={14} /> {nft.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <label className="text-xs text-white/40 font-mono mb-3 block">ERA MODIFIER</label>
                        <div className="flex gap-2">
                            {ERA_BOOSTS.map(era => (
                                <button
                                    key={era.id} onClick={() => setSelectedEra(era.id)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${selectedEra === era.id ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-black/20 border-white/10 text-white/40'}`}
                                >
                                    {era.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Output Monitor */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col backdrop-blur-md">
                <h3 className="text-xs font-bold text-white/40 tracking-widest uppercase mb-8">Projection Engine</h3>

                {/* Main Metric */}
                <div className="flex-1 flex flex-col items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full" />
                    <span className="text-6xl font-black text-white tracking-tighter relative">{metrics.earningsPerEpoch}</span>
                    <span className="text-sm font-mono text-emerald-400 mt-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">XAND / EPOCH</span>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Monthly</div>
                        <div className="text-xl font-mono text-white">{metrics.monthly}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Yearly</div>
                        <div className="text-xl font-mono text-white">{metrics.yearly}</div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                    <div className="text-xs text-white/30 font-mono">
                        Est. Yield Rate varies based on total network weight.
                    </div>
                </div>
            </div>

        </div>
    );
}
