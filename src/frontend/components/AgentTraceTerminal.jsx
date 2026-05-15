import React from 'react';
import { Shield, Activity, MapPin, CheckCircle2, Clock, Zap } from 'lucide-react';

const AgentTraceTerminal = ({ traces = [] }) => {
    // Group traces by incidentId
    const incidents = traces.reduce((acc, trace) => {
        const id = trace.incidentId || 'SYS-LOG';
        if (!acc[id]) acc[id] = { id, logs: [] };
        acc[id].logs.push(trace.log);
        return acc;
    }, {});

    return (
        <div className="h-full flex flex-col bg-black/40 border-l border-zinc-800/50 backdrop-blur-xl">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-zinc-800/50">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Activity className="text-emerald-500" size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black tracking-[0.2em] uppercase text-zinc-100">Tactical Feed</h2>
                        <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">Sovereign Agentic Grid v4.0</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Incident Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {Object.values(incidents).reverse().map((incident) => (
                    <IncidentTrack key={incident.id} incident={incident} />
                ))}
                
                {traces.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 space-y-4">
                        <Shield size={48} className="text-zinc-600" />
                        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">System Idle // Awaiting Signal</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const IncidentTrack = ({ incident }) => {
    const latestLog = incident.logs[incident.logs.length - 1];
    const isComplete = latestLog?.agent === 'The Auditor';
    
    return (
        <div className={`group relative p-4 rounded-xl border transition-all duration-500 ${
            isComplete ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
        }`}>
            {/* Incident Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded leading-none">
                            {incident.id}
                        </span>
                        {isComplete && (
                            <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">
                                <CheckCircle2 size={10} /> Archived
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                        <MapPin size={12} className="text-zinc-500" />
                        <span className="text-xs font-bold truncate max-w-[150px]">
                            {incident.logs[0]?.message?.split('at ')[1]?.replace('.', '') || 'Active Hotspot'}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <Clock size={10} className="text-zinc-600 mb-1" />
                    <span className="text-[8px] font-mono text-zinc-600">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Task Timeline */}
            <div className="space-y-3 relative">
                {/* Vertical Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-zinc-800" />

                {incident.logs.map((log, idx) => (
                    <div key={idx} className="flex gap-4 relative animate-in slide-in-from-right-4 duration-300">
                        <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                            log.outcome === 'Success' || log.outcome === 'Verified' || log.outcome === 'Approved' || log.outcome === 'Crisis Resolved'
                            ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                        }`}>
                            <Zap size={10} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{log.agent}</span>
                                <span className={`text-[8px] font-bold uppercase tracking-tighter ${
                                    log.outcome === 'Success' || log.outcome === 'Verified' || log.outcome === 'Approved' || log.outcome === 'Crisis Resolved'
                                    ? 'text-emerald-500' : 'text-zinc-500'
                                }`}>
                                    {log.outcome}
                                </span>
                            </div>
                            <p className="text-[10px] leading-relaxed text-zinc-500 mt-0.5 line-clamp-2 italic">
                                {log.message}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AgentTraceTerminal;
