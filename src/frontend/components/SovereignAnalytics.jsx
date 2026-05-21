import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Clock, Star, MapPin, CheckCircle, Activity } from 'lucide-react';
import { API_BASE } from '../utils/config.js';

const SovereignAnalytics = ({ activeDept, departments }) => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/performance/${activeDept}`);
                const data = await res.json();
                setStats(data);
            } catch (e) { console.error(e); }
        };
        fetchStats();
    }, [activeDept]);

    if (!stats) return null;

    return (
        <div className="h-full w-full px-20 pb-32 space-y-16 animate-in fade-in duration-1000">
            {/* 1. EXECUTIVE HEADER */}
            <div className="pt-24 flex justify-between items-end border-b border-white/5 pb-10">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className={`w-1 h-8 ${departments[activeDept].color.replace('text', 'bg')}`} />
                        <h2 className="text-white font-black text-4xl uppercase tracking-[-0.05em]">Performance Audit</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em]">
                            {departments[activeDept].name}
                        </span>
                        <div className="h-px w-8 bg-white/10" />
                        <span className="text-zinc-600 font-mono text-[10px] uppercase tracking-[0.2em]">Sovereign Node #0{activeDept.length}</span>
                    </div>
                </div>
                
                <div className="flex gap-16">
                    <div className="flex flex-col items-end">
                        <span className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] mb-2">Efficiency Index</span>
                        <span className="text-white text-3xl font-black font-mono tracking-tighter italic">98.2<span className="text-zinc-500 text-sm font-normal ml-1">%</span></span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] mb-2">City-Wide Rank</span>
                        <span className="text-white text-3xl font-black font-mono tracking-tighter">#01</span>
                    </div>
                </div>
            </div>

            {/* 2. CORE PERFORMANCE METRICS */}
            <div className="grid grid-cols-4 gap-6">
                <MetricCard 
                    icon={CheckCircle} 
                    label="Total Resolved" 
                    value={stats.resolved.toLocaleString()} 
                    color="emerald" 
                    trend="+12%" 
                />
                <MetricCard 
                    icon={Clock} 
                    label="Avg Response" 
                    value={stats.avg_response.replace('m', '')} 
                    unit="m" 
                    color="blue" 
                    trend="-2.4m" 
                />
                <MetricCard 
                    icon={Star} 
                    label="Citizen CSAT" 
                    value={stats.citizen_rating} 
                    unit="/ 5.0" 
                    color="orange" 
                    trend="+0.2" 
                />
                <MetricCard 
                    icon={Activity} 
                    label="Active Signal" 
                    value={stats.active} 
                    color="red" 
                    trend="LIVE" 
                />
            </div>

            {/* 3. TRENDS & DISTINCTIONS */}
            <div className="grid grid-cols-3 gap-8">
                {/* Operational Trend Graph */}
                <div className="col-span-2 p-10 bg-[#09090b] border border-white/5 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="text-blue-500" size={18} />
                            <h3 className="text-zinc-100 text-xs font-black uppercase tracking-widest">Operational Volume Trend</h3>
                        </div>
                        <div className="flex gap-2 text-zinc-600 font-mono text-[8px] uppercase tracking-widest">
                            Real-Time Data Stream
                        </div>
                    </div>
                    <div className="h-64 flex items-end gap-4 px-4">
                        {stats.monthly_incidents.map((h, i) => {
                            const max = Math.max(...stats.monthly_incidents);
                            const height = (h / max) * 100;
                            return (
                                <div key={i} className="flex-1 group/bar relative">
                                    <div 
                                        className={`w-full bg-gradient-to-t from-blue-500/5 to-blue-500/30 rounded-t-xl transition-all duration-1000 group-hover/bar:from-blue-500/20 group-hover/bar:to-blue-500/50`} 
                                        style={{ height: `${height}%` }} 
                                    />
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded font-mono">
                                        {h}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-6 flex justify-between px-4 text-[8px] font-black text-zinc-700 uppercase tracking-widest font-mono">
                        <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
                    </div>
                </div>

                {/* Distinguished Officer Card */}
                <div className="p-10 bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[3rem] flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 text-orange-500/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                        <Award size={180} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <Award className="text-orange-500" size={18} />
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Distinguished Personnel</span>
                        </div>
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-white/10 flex items-center justify-center overflow-hidden">
                                <span className="text-2xl font-black text-white/20">
                                    {stats.top_muhafiz.charAt(0)}
                                </span>
                            </div>
                            <div>
                                <h4 className="text-white text-xl font-black tracking-tight leading-tight">
                                    {stats.top_muhafiz.split(' (')[0]}
                                </h4>
                                <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mt-1">
                                    {stats.top_muhafiz.split(' (')[1]?.replace(')', '') || 'Regional HQ'}
                                </p>
                            </div>
                        </div>
                        <p className="text-zinc-400 text-[10px] leading-relaxed font-medium uppercase tracking-tight">
                            Awarded the **Medal of Sovereign Excellence** for leading zero-casualty response and maintaining the highest CSAT rating.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/5">
                        <div className="flex flex-col">
                            <span className="text-zinc-600 text-[8px] font-black uppercase mb-1">Lifetime Resolved</span>
                            <span className="text-white font-mono font-black">{(stats.resolved / 6).toFixed(0)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-zinc-600 text-[8px] font-black uppercase mb-1">Efficiency</span>
                            <span className="text-orange-500 font-mono font-black">9.9/10</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ icon: Icon, label, value, unit = "", color, trend }) => {
    const colorClasses = {
        emerald: { text: 'text-emerald-500', bg: 'bg-emerald-500/20', bar: 'bg-emerald-500' },
        blue: { text: 'text-blue-500', bg: 'bg-blue-500/20', bar: 'bg-blue-500' },
        orange: { text: 'text-orange-500', bg: 'bg-orange-500/20', bar: 'bg-orange-500' },
        red: { text: 'text-red-500', bg: 'bg-red-500/20', bar: 'bg-red-500' }
    };
    const c = colorClasses[color] || colorClasses.emerald;

    return (
        <div className="p-10 bg-[#09090b] border border-white/5 rounded-[2.5rem] backdrop-blur-3xl group hover:border-white/10 transition-all shadow-2xl relative">
            <div className="flex justify-between items-start mb-10">
                <div className={`p-3.5 rounded-2xl bg-zinc-900 border border-white/5 ${c.text} shadow-inner group-hover:scale-110 transition-transform`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <div className="flex flex-col items-end">
                        <span className={`text-[10px] font-black font-mono ${c.text} tracking-tighter`}>{trend}</span>
                        <div className={`w-8 h-0.5 mt-1 ${c.bg} rounded-full overflow-hidden`}>
                            <div className={`w-2/3 h-full ${c.bar}`} />
                        </div>
                    </div>
                )}
            </div>
            <div>
                <span className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] block mb-2">{label}</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-white text-4xl font-black font-mono tracking-tighter italic">{value}</span>
                    <span className="text-zinc-600 text-xs font-bold font-mono uppercase">{unit}</span>
                </div>
            </div>
        </div>
    );
};

export default SovereignAnalytics;
