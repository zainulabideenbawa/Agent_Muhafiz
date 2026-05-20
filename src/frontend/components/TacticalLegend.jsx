import React from 'react';
import { Shield, AlertTriangle, Route, Info } from 'lucide-react';

const TacticalLegend = () => {
    return (
        <div className="bg-zinc-950/90 backdrop-blur-md border border-emerald-500/20 p-4 rounded-xl shadow-2xl w-64 relative">
            <h3 className="text-emerald-500 text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
                <Info size={14} /> Tactical Legend
            </h3>
            <div className="space-y-2 text-[10px] font-mono text-zinc-400">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                    <span>Active Crisis Zone</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <span>Safe Reroute Node</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-0.5 bg-emerald-500/50" />
                    <span>Tactical Corridors</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 border border-emerald-500/50 rounded-sm" />
                    <span>Hospital Buffers (AKUH/Indus)</span>
                </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800">
                <p className="text-[9px] leading-relaxed text-zinc-500 uppercase tracking-tighter">
                    Real-time telemetry synced with Karachi Urban Data Grid.
                </p>
            </div>
        </div>
    );
};

export default TacticalLegend;
