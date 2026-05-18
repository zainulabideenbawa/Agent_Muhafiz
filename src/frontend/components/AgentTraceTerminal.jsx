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
            <div className="p-6 border-b border-white/5 bg-white/[0.01]">
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
            <div className="p-4 bg-white/[0.01] border-t border-white/5 backdrop-blur-xl">
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
    const [expandedStep, setExpandedStep] = React.useState(null);
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
                <div className="mb-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2 p-2 bg-black/40 rounded-lg border border-white/5">
                        <div>
                            <p className="text-[7px] text-zinc-500 uppercase font-black">Resolution Score</p>
                            <p className="text-[10px] text-emerald-500 font-mono">98.4%</p>
                        </div>
                        <div>
                            <p className="text-[7px] text-zinc-500 uppercase font-black">Audit Status</p>
                            <p className="text-[10px] text-zinc-300 font-mono">Verified</p>
                        </div>
                    </div>
                    {latestLog.policy_recommendation && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Globe size={24} className="text-blue-500" />
                            </div>
                            <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest block mb-1">Sovereign Policy Advisory</span>
                            <p className="text-[10px] text-blue-100/80 leading-relaxed font-medium italic">"{latestLog.policy_recommendation}"</p>
                        </div>
                    )}
                </div>
            )}

            {/* Task Timeline */}
            <div className="space-y-3 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-zinc-800" />
                {incident.logs.map((log, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                        className={`flex gap-4 relative animate-in slide-in-from-right-4 duration-300 cursor-pointer p-2 rounded-xl hover:bg-white/[0.03] transition-all duration-300 ${expandedStep === idx ? 'bg-white/[0.02]' : ''}`}
                    >
                        <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                            log.outcome === 'Success' || log.outcome === 'Verified' || log.outcome === 'Approved' || log.outcome === 'Crisis Resolved' || log.outcome === 'Coordination Locked'
                            ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                        }`}>
                            <Zap size={10} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{log.agent}</span>
                                {log.agent === 'The Analyst' && incident.logs.find(l => l.agent === 'The Analyst')?.support_agency && (
                                    <span className="text-[7px] font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase">Support: {incident.logs.find(l => l.agent === 'The Analyst')?.support_agency.split('_')[0]}</span>
                                )}
                            </div>
                            <p className={`text-[9px] leading-relaxed text-zinc-500 mt-0.5 italic ${expandedStep === idx ? 'text-zinc-300' : 'line-clamp-1'}`}>
                                {log.message}
                            </p>

                            {/* Detailed Step Auditing */}
                            {expandedStep === idx && (
                                <div className="mt-3 p-3 bg-black/40 border border-white/5 rounded-2xl space-y-3 text-[9px] animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                                        <span className="text-zinc-500 uppercase tracking-widest font-black text-[6px]">Tactical Breakdown</span>
                                        <span className="text-emerald-500 font-mono text-[7px] uppercase tracking-wider">COMPUTATION_SUCCESS</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-[8px]">
                                        {log.agent === 'The Dispatcher' && (
                                            <>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">TRIAGE LEVEL</span>
                                                    <span className="text-red-400 font-black text-[10px]">Level {log.details?.threat_level || '8'}</span>
                                                </div>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">ASSIGNED ROUTE</span>
                                                    <span className="text-orange-400 font-black truncate block">{log.details?.department || 'FIRE BRIGADE'}</span>
                                                </div>
                                            </>
                                        )}
                                        {log.agent === 'The Sentinel' && (
                                            <>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">CRISIS ACTIVE</span>
                                                    <span className="text-red-400 font-black">{log.details?.is_crisis ? 'YES (ACTIVE)' : 'NO'}</span>
                                                </div>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">EXTRACTED LOCATION</span>
                                                    <span className="text-zinc-200 font-black truncate block">{log.details?.location || 'Karachi'}</span>
                                                </div>
                                            </>
                                        )}
                                        {log.agent === 'The Truth-Engine' && (
                                            <>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">TELEMETRY SCORE</span>
                                                    <span className="text-emerald-400 font-black font-mono text-[9px]">{Math.round((log.details?.classification?.confidence_level || 0.88) * 100)}%</span>
                                                </div>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">VERDICT</span>
                                                    <span className="text-emerald-400 font-black">{log.details?.verdict || 'VERIFIED'}</span>
                                                </div>
                                            </>
                                        )}
                                        {log.agent === 'The Analyst' && (
                                            <>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">PREDICTED SPREAD</span>
                                                    <span className="text-orange-400 font-black">{log.details?.spread_prediction || 'Moderate'}</span>
                                                </div>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">EST. DURATION</span>
                                                    <span className="text-zinc-200 font-black">{log.details?.estimated_duration || '2 hours'}</span>
                                                </div>
                                            </>
                                        )}
                                        {log.agent === 'The Strategist' && (
                                            <>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg col-span-2">
                                                    <span className="text-zinc-500 font-mono block mb-1">DISPATCHED UNITS</span>
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {(log.details?.deployment?.units || ['Heavy Water Tanker', 'Rescue Alpha']).map((u, i) => (
                                                            <span key={i} className="bg-white/5 border border-white/5 rounded px-1.5 py-0.5 text-zinc-300 font-bold text-[7px]">{u}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">ACTIVE HUB</span>
                                                    <span className="text-zinc-200 font-black truncate block">{log.details?.deployment?.hub || 'Central District Station'}</span>
                                                </div>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">ETA TO SECTOR</span>
                                                    <span className="text-emerald-400 font-black font-mono text-[9px]">{log.details?.deployment?.eta_mins || '14'} mins</span>
                                                </div>
                                            </>
                                        )}
                                        {log.agent === 'The Oracle' && (
                                            <>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">REHEARSAL PROBABILITY</span>
                                                    <span className="text-emerald-400 font-black font-mono text-[9px]">{Math.round((log.details?.success_probability || 0.90) * 100)}%</span>
                                                </div>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">SIM APPROVAL</span>
                                                    <span className="text-emerald-400 font-black">APPROVED</span>
                                                </div>
                                            </>
                                        )}
                                        {log.agent === 'The Communicator' && (
                                            <>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">BROADCAST RADIUS</span>
                                                    <span className="text-blue-400 font-black font-mono text-[9px]">{log.details?.radius_km || '5'} km</span>
                                                </div>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">BROADCAST SCOPE</span>
                                                    <span className="text-blue-400 font-black uppercase">{log.details?.scope || 'LOCAL'}</span>
                                                </div>
                                            </>
                                        )}
                                        {log.agent === 'The Auditor' && (
                                            <>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">RESOLUTION STATUS</span>
                                                    <span className="text-emerald-400 font-black uppercase">{log.details?.status || 'RESOLVED'}</span>
                                                </div>
                                                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                    <span className="text-zinc-500 font-mono block">PERFORMANCE SCORE</span>
                                                    <span className="text-emerald-400 font-black font-mono text-[9px]">{log.details?.performance_score || '88'}%</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Cognitive Chain of Thought Rationale */}
                                    <div className="bg-white/[0.01] border border-white/5 p-3 rounded-lg flex flex-col gap-1">
                                        <span className="text-zinc-500 font-mono uppercase tracking-widest text-[6px] font-black">Chain of Thought Rationale</span>
                                        <p className="text-zinc-400 leading-relaxed font-mono font-medium text-[8px] whitespace-pre-line text-left">
                                            {log.details?.reasoning || log.details?.simulation_log || log.details?.policy_recommendation || log.message.split('Reasoning: ')[1] || "Analyzing contextual patterns to form dynamic sovereign directive conclusions."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AgentTraceTerminal;
