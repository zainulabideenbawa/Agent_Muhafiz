import React from 'react';
import { Shield, Activity, MapPin, CheckCircle2, Clock, Zap, Cpu, Server, Globe } from 'lucide-react';
import TacticalMedia from './TacticalMedia';

const AgentTraceTerminal = ({ traces = [] }) => {
    // Group traces by incidentId
    const incidents = traces.reduce((acc, trace) => {
        const id = trace.incidentId || 'SYS-LOG';
        if (!acc[id]) acc[id] = { id, logs: [], department: trace.department };
        acc[id].logs.push(trace.log);
        return acc;
    }, {});

    const latestIncident = Object.values(incidents).reverse()[0];

    return (
        <div className="h-full flex flex-col bg-transparent">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <Activity className="text-emerald-500" size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black tracking-[0.2em] uppercase text-zinc-100">Tactical Feed</h2>
                        <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest leading-none">Sovereign Agentic Grid v4.0</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Incident Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                
                {/* Live Media Component */}
                <TacticalMedia activeIncident={latestIncident} />

                <div className="pt-4 border-t border-white/5">
                    <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 px-1">Incident History</h5>
                    {Object.values(incidents).reverse().map((incident) => (
                        <IncidentTrack key={incident.id} incident={incident} />
                    ))}
                    
                    {traces.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 opacity-20 space-y-4">
                            <Shield size={48} className="text-zinc-600" />
                            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">System Idle // Awaiting Signal</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Agent Sovereign Grid Health */}
            <div className="p-4 bg-black/60 border-t border-white/5 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Sovereign Brain Health</span>
                    <span className="text-[8px] font-mono text-emerald-500">8/8 AGENTS_ONLINE</span>
                </div>
                <div className="flex gap-1.5 justify-between">
                    {['SNTL', 'TRTH', 'ANLY', 'STRT', 'ORCL', 'COMM', 'AUDT', 'DISP'].map(a => (
                        <div key={a} className="group relative flex flex-col items-center">
                            <div className="w-6 h-1 bg-emerald-500/40 rounded-full group-hover:bg-emerald-500 transition-colors" />
                            <span className="text-[6px] font-mono text-zinc-600 mt-1 uppercase">{a}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const IncidentTrack = ({ incident }) => {
    const latestLog = incident.logs[incident.logs.length - 1];
    const isComplete = latestLog?.agent === 'The Auditor';
    
    return (
        <div className={`group relative p-4 rounded-xl border transition-all duration-500 mb-4 ${
            isComplete ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-900/30 border-zinc-800/50 hover:border-white/10'
        }`}>
            {/* Incident Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded leading-none">
                            {incident.id}
                        </span>
                        {incident.logs[0]?.agent === 'The Dispatcher' && (
                             <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-tighter ${
                                incident.logs.some(l => l.message.includes('POLICE')) ? 'border-blue-500/30 text-blue-500 bg-blue-500/10' :
                                incident.logs.some(l => l.message.includes('FIRE')) ? 'border-orange-500/30 text-orange-500 bg-orange-500/10' :
                                incident.logs.some(l => l.message.includes('KMC')) ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' :
                                'border-zinc-500/30 text-zinc-500 bg-zinc-500/10'
                             }`}>
                                {incident.logs.find(l => l.message.includes('Routed'))?.message.split('to ')[1] || 'Assigned'}
                             </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                        <MapPin size={12} className="text-zinc-500" />
                        <span className="text-xs font-bold truncate max-w-[120px]">
                            {incident.logs[0]?.message?.split('at ')[1]?.replace('.', '') || 'Active Hotspot'}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <Clock size={10} className="text-zinc-600 mb-1" />
                    <span className="text-[8px] font-mono text-zinc-600 uppercase">
                        {isComplete ? 'Archived' : 'Live'}
                    </span>
                </div>
            </div>

            {/* Performance Analytics (Visible when resolved) */}
            {isComplete && (
                <div className="mb-4 grid grid-cols-2 gap-2 p-2 bg-black/40 rounded-lg border border-white/5">
                    <div>
                        <p className="text-[7px] text-zinc-500 uppercase font-black">Accuracy</p>
                        <p className="text-[10px] text-emerald-500 font-mono">98.4%</p>
                    </div>
                    <div>
                        <p className="text-[7px] text-zinc-500 uppercase font-black">Response</p>
                        <p className="text-[10px] text-zinc-300 font-mono">24s</p>
                    </div>
                </div>
            )}

            {/* Task Timeline */}
            <div className="space-y-3 relative">
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
                            </div>
                            <p className="text-[9px] leading-relaxed text-zinc-500 mt-0.5 line-clamp-1 italic">
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
