import React from 'react';
import { Shield, Activity, Users, Truck, Heart, Menu } from 'lucide-react';

const MetricsUI = ({ activeCrises, deptStats, livesSaved, toggleSidebar, activeDept, departments }) => {
    const currentDept = departments[activeDept] || { name: 'Unknown Unit', color: 'text-zinc-500' };

    return (
        <div className="h-20 bg-black/40 border-b border-zinc-800 backdrop-blur-xl flex items-center px-6 justify-between z-50 relative">
            {/* Left: Branding & Toggle */}
            <div className="flex items-center gap-6">
                <button 
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
                >
                    <Menu size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <Shield className="text-emerald-500" size={16} />
                    </div>
                    <div>
                        <h1 className="text-xs font-black tracking-[0.2em] text-zinc-100 uppercase leading-none mb-1">Muhafiz-X</h1>
                        <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest leading-none">Sovereign Grid</p>
                    </div>
                </div>
            </div>

            {/* Center: Sovereign Identity Header */}
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Active Tactical Authority</span>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${currentDept.color.replace('text-', 'bg-')}`} />
                    <span className={`text-sm font-black uppercase tracking-tighter ${currentDept.color}`}>
                        {currentDept.name}
                    </span>
                </div>
            </div>

            {/* Right: Live Metrics Grid */}
            <div className="flex items-center gap-8">
                <MetricItem 
                    icon={<Activity className="text-red-500" size={14} />} 
                    label="Crises" 
                    value={activeCrises} 
                />
                <MetricItem 
                    icon={<Users className="text-blue-500" size={14} />} 
                    label="Personnel" 
                    value={deptStats.officers} 
                />
                <MetricItem 
                    icon={<Truck className="text-orange-500" size={14} />} 
                    label="Fleet" 
                    value={deptStats.trucks} 
                />
                <MetricItem 
                    icon={<Heart className="text-emerald-500" size={14} />} 
                    label="Saved" 
                    value={livesSaved} 
                />
            </div>
        </div>
    );
};

const MetricItem = ({ icon, label, value, subValue }) => (
    <div className="flex items-center gap-3">
        <div className="p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
            {icon}
        </div>
        <div>
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-zinc-100 leading-none">{value}</span>
                <span className="text-[8px] font-mono text-zinc-600 uppercase whitespace-nowrap">{subValue}</span>
            </div>
        </div>
    </div>
);

export default MetricsUI;
