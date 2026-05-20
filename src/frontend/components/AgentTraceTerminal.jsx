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

    const formatTime = (ts) => {
        if (!ts) return "Just Now";
        const diff = Date.now() - ts;
        if (diff < 60000) return "Just Now";
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

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
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Incident History</h5>
                        <span className="text-[7px] font-mono font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            LATEST 3 ACTIVE
                        </span>
                    </div>
                    {Object.values(incidents)
                        .reverse()
                        .slice(0, 3)
                        .map((incident) => (
                            <IncidentTrack key={incident.id} incident={incident} formatTime={formatTime} />
                        ))
                    }
                    
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

const IncidentTrack = ({ incident, formatTime }) => {
    const [expandedSteps, setExpandedSteps] = React.useState({
        0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true
    });
    
    const toggleStep = (idx) => {
        setExpandedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const toggleAll = () => {
        const anyCollapsed = incident.logs.some((_, i) => !expandedSteps[i]);
        const updated = {};
        incident.logs.forEach((_, i) => {
            updated[i] = anyCollapsed;
        });
        setExpandedSteps(updated);
    };

    const latestLog = incident.logs[incident.logs.length - 1];
    const isComplete = latestLog?.agent === 'The Auditor';

    const getLandmarkName = () => {
        const sntlLog = incident.logs.find(l => l.agent === 'The Sentinel');
        if (sntlLog?.details?.classification?.location?.landmark) {
            return sntlLog.details.classification.location.landmark;
        }
        if (sntlLog?.details?.location?.landmark) {
            return sntlLog.details.location.landmark;
        }
        for (const log of incident.logs) {
            if (log.message?.includes('at ')) {
                const landmark = log.message.split('at ')[1]?.split(' via')[0]?.split('.')[0];
                if (landmark) return landmark;
            }
        }
        return 'Active Hotspot';
    };

    const getDepartmentName = () => {
        const dispLog = incident.logs.find(l => l.agent === 'The Dispatcher');
        if (!dispLog) return 'Assigned';
        const msg = dispLog.message || '';
        if (msg.includes('dispatched to ')) {
            return msg.split('dispatched to ')[1]?.split('.')[0];
        }
        if (msg.includes('Routed to ')) {
            return msg.split('Routed to ')[1]?.split('.')[0];
        }
        if (msg.includes('Routed ')) {
            return msg.split('Routed ')[1]?.split('.')[0];
        }
        return 'Assigned';
    };
    
    return (
        <div className={`group relative p-5 rounded-2xl border transition-all duration-500 mb-6 ${
            isComplete ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-zinc-900/30 border-zinc-800/40 hover:border-white/5'
        }`}>
            {/* Incident Header */}
            <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-3">
                <div className="space-y-1.5 min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded leading-none border border-emerald-500/20">
                            {incident.id}
                        </span>
                        {incident.logs.some(l => l.agent === 'The Dispatcher') && (
                             <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-tighter ${
                                incident.logs.some(l => l.message.includes('POLICE')) ? 'border-blue-500/30 text-blue-500 bg-blue-500/10' :
                                incident.logs.some(l => l.message.includes('FIRE')) ? 'border-orange-500/30 text-orange-500 bg-orange-500/10' :
                                incident.logs.some(l => l.message.includes('KMC')) ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' :
                                'border-zinc-500/30 text-zinc-500 bg-zinc-500/10'
                             }`}>
                                {getDepartmentName()}
                             </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                        <MapPin size={12} className="text-zinc-500 shrink-0" />
                        <span className="text-xs font-bold truncate max-w-[160px]">
                            {getLandmarkName()}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-1 text-zinc-500 mb-1">
                        <Clock size={10} />
                        <span className="text-[8px] font-mono font-bold">
                            {formatTime(latestLog?.timestamp)}
                        </span>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isComplete 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'
                    }`}>
                        {isComplete ? 'RESOLVED' : 'ACTIVE'}
                    </span>
                </div>
            </div>

            {/* Performance Analytics (Visible when resolved) */}
            {isComplete && (
                <div className="mb-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2 p-2 bg-black/40 rounded-lg border border-white/5">
                        <div>
                            <p className="text-[7px] text-zinc-500 uppercase font-black">Resolution Score</p>
                            <p className="text-[10px] text-emerald-500 font-mono font-black">
                                {incident.logs.find(l => l.agent === 'The Auditor')?.details?.performance_score ?? 88}%
                            </p>
                        </div>
                        <div>
                            <p className="text-[7px] text-zinc-500 uppercase font-black">Audit Status</p>
                            <p className="text-[10px] text-zinc-300 font-mono">
                                {incident.logs.find(l => l.agent === 'The Auditor')?.details?.status ?? 'Verified'}
                            </p>
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

            {/* Timeline Control */}
            <div className="flex justify-between items-center mb-3">
                <span className="text-[7px] font-black text-zinc-650 uppercase tracking-widest">Cognitive Timeline Trace</span>
                <button 
                    onClick={toggleAll}
                    className="text-[7px] font-mono font-black text-zinc-500 hover:text-emerald-400 bg-zinc-950/40 border border-white/5 px-2 py-0.5 rounded transition-all uppercase"
                >
                    Expand/Collapse Grid
                </button>
            </div>

            {/* Task Timeline */}
            <div className="space-y-4 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-zinc-800/80" />
                {incident.logs.map((log, idx) => {
                    const isExpanded = expandedSteps[idx];
                    const timestampStr = log.timestamp 
                        ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) 
                        : '--:--:--';
                    
                    return (
                        <div 
                            key={idx} 
                            onClick={() => toggleStep(idx)}
                            className={`flex gap-4 relative animate-in slide-in-from-right-4 duration-300 cursor-pointer p-2 rounded-xl hover:bg-white/[0.03] transition-all duration-300 ${isExpanded ? 'bg-white/[0.01] border border-white/[0.02]' : ''}`}
                        >
                            <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                                isExpanded
                                ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                            }`}>
                                <Zap size={10} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center flex-wrap gap-1.5 mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[7px] font-mono text-zinc-500 bg-zinc-950 px-1 py-0.5 rounded border border-white/5">
                                            {timestampStr}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">
                                            {log.agent}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {log.outcome && (
                                            <span className={`text-[7px] font-black font-mono px-1.5 py-0.5 rounded uppercase leading-none ${
                                                log.outcome.toLowerCase().includes('success') || log.outcome.toLowerCase().includes('verified') || log.outcome.toLowerCase().includes('approved') || log.outcome.toLowerCase().includes('resolved')
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>
                                                {log.outcome}
                                            </span>
                                        )}
                                        {log.agent === 'The Analyst' && incident.logs.find(l => l.agent === 'The Analyst')?.support_agency && (
                                            <span className="text-[7px] font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase">Support: {incident.logs.find(l => l.agent === 'The Analyst')?.support_agency.split('_')[0]}</span>
                                        )}
                                    </div>
                                </div>
                                <p className={`text-[9px] leading-relaxed text-zinc-400 mt-0.5 italic ${isExpanded ? 'text-zinc-200' : 'line-clamp-1'}`}>
                                    {log.message}
                                </p>

                                {/* Detailed Step Auditing */}
                                {isExpanded && (
                                    <div className="mt-3 p-3 bg-zinc-950/80 border border-white/5 rounded-xl space-y-3 text-[9px] animate-in slide-in-from-top-2 duration-300">
                                        <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                                            <span className="text-zinc-500 uppercase tracking-widest font-mono font-black text-[6px]">Diagnostic Output</span>
                                            <span className="text-emerald-500 font-mono text-[7px] uppercase tracking-wider">COMPUTATION_SUCCESS</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 text-[8px]">
                                            {log.agent === 'The Dispatcher' && (
                                                <>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                        <span className="text-zinc-500 font-mono block">THREAT LEVEL</span>
                                                        <span className="text-red-400 font-black text-[10px]">Level {log.details?.threat_level || '8'} / 10</span>
                                                    </div>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                        <span className="text-zinc-500 font-mono block">ROUTED TO</span>
                                                        <span className="text-orange-400 font-black truncate block text-[8px]">{(log.details?.department || 'FIRE BRIGADE').replace(/_/g, ' ')}</span>
                                                    </div>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg col-span-2">
                                                        <span className="text-zinc-500 font-mono block mb-0.5">PRIMARY ROUTE</span>
                                                        <span className="text-emerald-400 font-bold text-[8px]">{log.details?.route_directive?.primary_route || 'Shara-e-Faisal (M-9 Corridor)'}</span>
                                                    </div>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg col-span-2">
                                                        <span className="text-zinc-500 font-mono block mb-0.5">AVOID (CONGESTION)</span>
                                                        <span className="text-amber-400 font-bold text-[8px]">{log.details?.route_directive?.avoid || 'Low-lying underpasses'}</span>
                                                    </div>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg col-span-2">
                                                        <span className="text-zinc-500 font-mono block mb-0.5">POLICE BLOCK REQUIRED AT</span>
                                                        <span className="text-red-400 font-bold text-[8px]">{log.details?.route_directive?.police_block_required_at || 'Nearest intersection'}</span>
                                                    </div>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg col-span-2">
                                                        <span className="text-zinc-500 font-mono block mb-0.5">POLICE NOTIFICATION</span>
                                                        <span className="text-zinc-300 font-medium text-[7px] leading-relaxed">{log.details?.police_notification || 'Traffic police alerted'}</span>
                                                    </div>
                                                </>
                                            )}
                                            {log.agent === 'The Sentinel' && (
                                                <>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                        <span className="text-zinc-500 font-mono block">CRISIS ACTIVE</span>
                                                        <span className={log.details?.is_crisis ? 'text-red-400 font-black' : 'text-emerald-400 font-black'}>{log.details?.is_crisis ? '🔴 CONFIRMED' : '✅ NO CRISIS'}</span>
                                                    </div>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                        <span className="text-zinc-500 font-mono block">URGENCY SCORE</span>
                                                        <span className="text-red-400 font-black font-mono text-[10px]">{log.details?.urgency || log.details?.zone_intel ? log.details.urgency : '7'} / 10</span>
                                                    </div>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg col-span-2">
                                                        <span className="text-zinc-500 font-mono block mb-0.5">EXTRACTED ADDRESS</span>
                                                        <span className="text-zinc-200 font-bold text-[8px]">
                                                            {typeof log.details?.location === 'object' 
                                                                ? (log.details.location.landmark || 'Karachi') 
                                                                : (log.details?.location || 'Karachi')}
                                                        </span>
                                                    </div>
                                                    {log.details?.zone_intel?.key_roads && (
                                                        <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg col-span-2">
                                                            <span className="text-zinc-500 font-mono block mb-0.5">KEY ROADS IN ZONE</span>
                                                            <span className="text-zinc-300 font-medium text-[7px]">{log.details.zone_intel.key_roads.join(' · ')}</span>
                                                        </div>
                                                    )}
                                                    {log.details?.zone_intel?.nearby_hospitals && (
                                                        <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg col-span-2">
                                                            <span className="text-zinc-500 font-mono block mb-0.5">NEARBY HOSPITALS</span>
                                                            <span className="text-amber-400 font-medium text-[7px]">{log.details.zone_intel.nearby_hospitals.join(' · ')}</span>
                                                        </div>
                                                    )}
                                                    {log.details?.zone_intel?.police_station && (
                                                        <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg col-span-2">
                                                            <span className="text-zinc-500 font-mono block mb-0.5">RESPONSIBLE POLICE STATION</span>
                                                            <span className="text-blue-400 font-bold text-[8px]">{log.details.zone_intel.police_station}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {log.agent === 'The Truth-Engine' && (
                                                <>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                        <span className="text-zinc-500 font-mono block">TELEMETRY SCORE</span>
                                                        <span className="text-emerald-405 font-black font-mono text-[9px]">{Math.round((log.details?.classification?.confidence_level || log.details?.confidence_level || 0.88) * 100)}%</span>
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
                                                        <span className="text-zinc-500 font-mono block">EST. DURATION</span>
                                                        <span className="text-zinc-200 font-black text-[8px]">{log.details?.estimated_duration || '2 hours'}</span>
                                                    </div>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                        <span className="text-zinc-500 font-mono block">AFFECTED CITIZENS</span>
                                                        <span className="text-orange-400 font-black text-[8px]">{(log.details?.affected_population || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg col-span-2">
                                                        <span className="text-zinc-500 font-mono block mb-0.5">SPREAD PREDICTION</span>
                                                        <span className="text-orange-300 font-medium text-[7px] leading-relaxed">{(log.details?.spread_prediction || 'Moderate').substring(0, 200)}</span>
                                                    </div>
                                                    {log.details?.hospitals_at_risk && (
                                                        <div className="bg-red-500/[0.04] border border-red-500/15 p-2 rounded-lg col-span-2">
                                                            <span className="text-red-400 font-mono block mb-0.5 font-black text-[7px]">⚠️ HOSPITALS AT RISK</span>
                                                            {(Array.isArray(log.details.hospitals_at_risk) ? log.details.hospitals_at_risk : [log.details.hospitals_at_risk]).map((h, i) => (
                                                                <span key={i} className="text-red-300 font-medium text-[7px] block">{h}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {log.details?.critical_infrastructure_risk && (
                                                        <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg col-span-2">
                                                            <span className="text-zinc-500 font-mono block mb-0.5">INFRASTRUCTURE RISKS</span>
                                                            {(Array.isArray(log.details.critical_infrastructure_risk) ? log.details.critical_infrastructure_risk : [log.details.critical_infrastructure_risk]).slice(0, 4).map((r, i) => (
                                                                <span key={i} className="text-amber-400 font-medium text-[7px] block">• {r}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {log.details?.rainfall_forecast && (
                                                        <div className="bg-blue-500/[0.03] border border-blue-500/10 p-2 rounded-lg col-span-2">
                                                            <span className="text-blue-400 font-mono block mb-0.5 font-black text-[7px]">🌧️ OPEN-METEO FORECAST</span>
                                                            <span className="text-blue-300 font-medium text-[7px]">{log.details.rainfall_forecast}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {log.agent === 'The Strategist' && (
                                                <>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg col-span-2">
                                                        <span className="text-zinc-500 font-mono block mb-0.5">DEPLOYED FROM HUB</span>
                                                        <span className="text-zinc-200 font-bold text-[8px]">{log.details?.deployment?.hub || 'Central District Station'}</span>
                                                        {log.details?.deployment?.hub_address && <span className="text-zinc-500 font-mono text-[7px] block mt-0.5">{log.details.deployment.hub_address}</span>}
                                                    </div>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                        <span className="text-zinc-500 font-mono block">ETA (TOMTOM)</span>
                                                        <span className="text-emerald-400 font-black font-mono text-[9px]">{log.details?.deployment?.eta_mins || '14'} min</span>
                                                        {log.details?.deployment?.traffic_delay_mins > 0 && <span className="text-amber-400 font-mono text-[7px] block">+{log.details.deployment.traffic_delay_mins}min delay</span>}
                                                    </div>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                        <span className="text-zinc-500 font-mono block">PRIORITY</span>
                                                        <span className="text-red-400 font-black text-[8px]">{log.details?.priority_level || 'CRITICAL'}</span>
                                                    </div>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg col-span-2">
                                                        <span className="text-zinc-500 font-mono block mb-1">DISPATCHED UNITS</span>
                                                        <div className="flex gap-1.5 flex-wrap">
                                                            {(log.details?.deployment?.units || ['Heavy Water Tanker', 'Rescue Alpha']).map((u, i) => (
                                                                <span key={i} className="bg-white/5 border border-white/5 rounded px-1.5 py-0.5 text-zinc-300 font-bold text-[7px]">{u}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {log.details?.nearest_facility && (
                                                        <div className="bg-emerald-500/[0.03] border border-emerald-500/10 p-2 rounded-lg col-span-2">
                                                            <span className="text-emerald-400 font-mono block mb-0.5 font-black text-[7px]">📍 NEAREST FACILITY (OpenStreetMap)</span>
                                                            <span className="text-emerald-300 font-medium text-[7px]">{log.details.nearest_facility}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {log.agent === 'The Oracle' && (
                                                <>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                        <span className="text-zinc-500 font-mono block">SUCCESS PROBABILITY</span>
                                                        <span className="text-emerald-400 font-black font-mono text-[9px]">{Math.round((log.details?.success_probability || 0.90) * 100)}%</span>
                                                    </div>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                        <span className="text-zinc-500 font-mono block">REHEARSAL STATUS</span>
                                                        <span className={log.details?.approved ? 'text-emerald-400 font-black' : 'text-amber-400 font-black'}>{log.details?.approved ? '✅ APPROVED' : '⚠️ FLAGGED'}</span>
                                                    </div>
                                                    {log.details?.time_saved_minutes > 0 && (
                                                        <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                            <span className="text-zinc-500 font-mono block">TIME SAVED</span>
                                                            <span className="text-emerald-400 font-bold text-[8px]">{log.details.time_saved_minutes} min</span>
                                                        </div>
                                                    )}
                                                    {log.details?.congestion_reduction_pct > 0 && (
                                                        <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                            <span className="text-zinc-500 font-mono block">CONGESTION REDUCTION</span>
                                                            <span className="text-blue-400 font-bold text-[8px]">{log.details.congestion_reduction_pct}%</span>
                                                        </div>
                                                    )}
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
                                                        <span className={log.details?.status === 'RESOLVED' ? 'text-emerald-400 font-black' : 'text-amber-400 font-black'}>{log.details?.status || 'RESOLVED'}</span>
                                                    </div>
                                                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                        <span className="text-zinc-500 font-mono block">SOVEREIGN PI</span>
                                                        <span className="text-emerald-400 font-black font-mono text-[9px]">{log.details?.performance_score || '88'}%</span>
                                                    </div>
                                                    {log.details?.kpi_breakdown && (
                                                        <>
                                                            <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                                <span className="text-zinc-500 font-mono block">ETA SCORE</span>
                                                                <span className="text-blue-400 font-bold text-[8px]">{log.details.kpi_breakdown.eta_score}%</span>
                                                            </div>
                                                            <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                                                                <span className="text-zinc-500 font-mono block">CONFIDENCE SCORE</span>
                                                                <span className="text-blue-400 font-bold text-[8px]">{log.details.kpi_breakdown.confidence_score}%</span>
                                                            </div>
                                                        </>
                                                    )}
                                                    {log.details?.policy_recommendation && (
                                                        <div className="bg-amber-500/[0.03] border border-amber-500/10 p-2 rounded-lg col-span-2">
                                                            <span className="text-amber-400 font-mono block mb-0.5 font-black text-[7px]">🏛️ URBAN POLICY DIRECTIVE</span>
                                                            <span className="text-amber-300 font-medium text-[7px] leading-relaxed">{log.details.policy_recommendation}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {log.agent === 'The Truth-Engine' && log.details?.twitter_posts && log.details.twitter_posts.length > 0 && (
                                             <div className="w-full mt-1.5 space-y-2 border-t border-white/5 pt-2.5">
                                                 <div className="flex items-center gap-1.5 mb-1">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_6px_rgba(96,165,250,0.5)]" />
                                                     <span className="text-[7px] font-mono text-blue-400 font-black uppercase tracking-widest text-left block">Live Twitter OSINT Corroboration Feed</span>
                                                 </div>
                                                 <div className="grid grid-cols-1 gap-1.5 flex-col">
                                                     {log.details.twitter_posts.map((post, idx) => (
                                                         <div key={idx} className="bg-blue-500/[0.02] border border-blue-500/10 p-2.5 rounded-lg flex gap-2.5 hover:bg-blue-500/[0.04] transition-all group">
                                                             <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-bold flex items-center justify-center text-[9px] shrink-0 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.2)]">
                                                                 {post.username.charAt(1).toUpperCase()}
                                                             </div>
                                                             <div className="flex-1 min-w-0">
                                                                 <div className="flex items-center justify-between">
                                                                     <div className="flex flex-row items-center gap-1">
                                                                         <span className="text-[8px] font-black text-zinc-200 group-hover:text-blue-300 transition-colors">{post.handle}</span>
                                                                         <span className="text-[7px] font-mono text-zinc-500">{post.username}</span>
                                                                     </div>
                                                                     <span className="text-[6px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-1 font-bold uppercase tracking-wide leading-none py-0.5">CORROBORATED</span>
                                                                 </div>
                                                                 <p className="text-[8px] text-zinc-300 leading-relaxed mt-1 text-left">
                                                                     {post.text}
                                                                 </p>
                                                                 <span className="text-[7px] text-blue-400 font-mono font-semibold mt-1 block text-left">
                                                                     {post.hashtag}
                                                                 </span>
                                                             </div>
                                                         </div>
                                                     ))}
                                                 </div>
                                             </div>
                                         )}

                                         
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
                    );
                })}
            </div>
        </div>
    );
};

export default AgentTraceTerminal;
