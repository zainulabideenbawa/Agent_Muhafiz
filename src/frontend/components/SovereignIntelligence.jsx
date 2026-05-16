import React, { useState, useEffect } from 'react';
import { Trophy, Target, Zap, AlertTriangle, MapPin, TrendingUp, ShieldAlert, Cpu, Settings, User } from 'lucide-react';

const SovereignIntelligence = () => {
    const [intel, setIntel] = useState(null);

    useEffect(() => {
        const fetchIntel = async () => {
            const res = await fetch('http://localhost:3001/api/sovereign-intelligence');
            const data = await res.json();
            setIntel(data);
        };
        fetchIntel();
    }, []);

    if (!intel) return null;

    return (
        <div className="h-full w-full px-20 pb-32 space-y-12 animate-in fade-in duration-1000">
            {/* SUPER ADMIN HEADER */}
            <div className="pt-24 flex justify-between items-end border-b border-white/5 pb-10">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-1.5 h-10 bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
                        <h2 className="text-white font-black text-5xl uppercase tracking-[-0.05em]">Sovereign Architect</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-orange-500/80 font-mono text-[10px] uppercase tracking-[0.4em]">Urban Optimization Intelligence</span>
                        <div className="h-px w-8 bg-orange-500/20" />
                        <span className="text-zinc-600 font-mono text-[10px] uppercase tracking-[0.2em]">KMC_GRID_LEVEL_5</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* 1. TEAM LEADERBOARD (The Elite Muhafiz) */}
                <div className="col-span-4 space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <Trophy size={16} className="text-yellow-500" />
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Agency Performance Ranking</h4>
                    </div>
                    <div className="space-y-3">
                        {intel.leaderboard.map((team, idx) => (
                            <div key={team.dept} className="p-6 bg-zinc-950/40 border border-white/5 rounded-3xl group hover:border-yellow-500/30 transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono text-zinc-700">0{idx + 1}</span>
                                        <h5 className="text-xs font-black text-white uppercase tracking-tight">{team.dept.replace('_', ' ')}</h5>
                                    </div>
                                    <span className={`text-[8px] font-black px-2 py-1 rounded-md ${team.status === 'ELITE' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{team.status}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[8px] text-zinc-600 uppercase font-black">Efficiency Score</p>
                                        <p className="text-xl font-black text-zinc-100">{team.score}%</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[8px] text-zinc-600 uppercase font-black">Avg Response</p>
                                        <p className="text-sm font-mono text-zinc-300">{team.response}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. COVERAGE GAPS & RECOMMENDATIONS */}
                <div className="col-span-8 space-y-10">
                    {/* COMMANDER REGISTRY (USER MANAGEMENT) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <User size={16} className="text-emerald-500" />
                            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Commander Registry // User Management</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { name: 'Cmdr. Ahmed', rank: 'Zonal Lead', dept: 'POLICE', status: 'ACTIVE' },
                                { name: 'Capt. Raza', rank: 'Division Head', dept: 'FIRE', status: 'ON_MISSION' },
                                { name: 'Para. Sara', rank: 'Senior Medic', dept: 'RESCUE', status: 'ACTIVE' },
                                { name: 'Eng. Zafar', rank: 'Infrastructure', dept: 'KMC', status: 'LEAVE' }
                            ].map((commander) => (
                                <div key={commander.name} className="p-5 bg-zinc-900/30 border border-white/5 rounded-3xl flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${commander.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                            {commander.name[0]}
                                        </div>
                                        <div>
                                            <h5 className="text-[11px] font-black text-white uppercase">{commander.name}</h5>
                                            <p className="text-[8px] text-zinc-500 font-mono">{commander.rank} // {commander.dept}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[7px] font-black px-2 py-1 rounded-md ${commander.status === 'ACTIVE' ? 'text-emerald-500' : 'text-zinc-600'}`}>{commander.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* GLOBAL CONTROLS */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <Settings size={16} className="text-zinc-500" />
                            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Global Agency Controls</h4>
                        </div>
                        <div className="p-8 bg-zinc-950/40 border border-white/5 rounded-[2.5rem] grid grid-cols-3 gap-10">
                            <div className="space-y-3">
                                <p className="text-[8px] font-black text-zinc-600 uppercase">Alert Threshold</p>
                                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full w-[70%] bg-emerald-500" />
                                </div>
                                <p className="text-[10px] font-mono text-zinc-400 text-right">7.5 / 10</p>
                            </div>
                            <div className="space-y-3">
                                <p className="text-[8px] font-black text-zinc-600 uppercase">Agency Synergy</p>
                                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full w-[90%] bg-blue-500" />
                                </div>
                                <p className="text-[10px] font-mono text-zinc-400 text-right">OPTIMAL</p>
                            </div>
                            <div className="space-y-3 flex items-center justify-center">
                                <button className="px-6 py-2 bg-red-600/10 border border-red-500/20 text-red-500 text-[8px] font-black uppercase rounded-full hover:bg-red-600 hover:text-white transition-all">
                                    Emergency Lockdown
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-2">
                        <Target size={16} className="text-orange-500" />
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Urban Infrastructure Optimization</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        {intel.coverage_gaps.map((gap) => (
                            <div key={gap.sector} className="p-8 bg-orange-600/5 border border-orange-500/10 rounded-[2.5rem] flex items-center gap-10 hover:border-orange-500/30 transition-all group">
                                <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500">
                                    <ShieldAlert size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{gap.sector}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                        <span className="text-[10px] font-mono text-orange-900 font-bold uppercase">Risk: {gap.risk}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase mb-2 tracking-tight">Recommendation: {gap.recommendation.replace('_', ' ')}</h3>
                                    <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-xl">{gap.logic}</p>
                                </div>
                                <button 
                                    onClick={async () => {
                                        try {
                                            await fetch('http://localhost:3001/api/execute/deploy-hub', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ sector: gap.sector, dept: 'RESCUE_1122' })
                                            });
                                            alert(`Command Authorized: Resource Deployment to ${gap.sector} Initiated.`);
                                        } catch (e) { console.error(e); }
                                    }}
                                    className="px-8 py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-900/20 group-hover:scale-105 transition-all"
                                >
                                    Authorize Deployment
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* SUB-SURFACE PREDICTIVE MAINTENANCE */}
                    <div className="pt-6 space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <Cpu size={16} className="text-blue-500" />
                            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sub-Surface Predictive Maintenance</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-8 bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] flex items-center justify-between group hover:border-blue-500/30 transition-all">
                                <div className="flex items-center gap-8">
                                    <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">NIPA Intersection // Blockage Detected</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        </div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Sewerage Flow: 0.2 m/s (Critical)</h3>
                                        <p className="text-xs text-zinc-500 font-medium">Predictive Model: 92% probability of urban flooding at this node if precipitation exceeds 10mm.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={async () => {
                                        try {
                                            await fetch('http://localhost:3001/api/execute/dispatch-maintenance', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ sector: 'NIPA Intersection', logic: 'Critical Blockage' })
                                            });
                                            alert("Sovereign Directive Committed: Maintenance Crew En-Route.");
                                        } catch (e) { console.error(e); }
                                    }}
                                    className="px-8 py-4 border border-blue-500/30 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                                >
                                    Dispatch Cleaning Crew
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SENSOR BLINDSPOTS */}
                </div>
            </div>
        </div>
    );
};

export default SovereignIntelligence;
