import React, { useState } from 'react';
import { Search, Flame, Droplets, Shield, AlertTriangle, Clock, MapPin, SlidersHorizontal, CheckCircle, ChevronRight, Activity, Calendar } from 'lucide-react';

const CrisisExplorer = ({ incidents = [], traces = [] }) => {
    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [deptFilter, setDeptFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [timeFilter, setTimeFilter] = useState('ALL');
    const [selectedIncidentId, setSelectedIncidentId] = useState(null);

    // Group traces by incidentId
    const incidentTraces = traces.reduce((acc, trace) => {
        const id = trace.incidentId || 'SYS-LOG';
        if (!acc[id]) acc[id] = [];
        acc[id].push(trace.log);
        return acc;
    }, {});

    // Format incidents with details from traces
    const processedIncidents = incidents.map(inc => {
        const logs = incidentTraces[inc.id] || [];
        const latestLog = logs[logs.length - 1];
        const isComplete = logs.some(l => l.agent === 'The Auditor' && l.outcome === 'Crisis Resolved');
        
        // Match type from raw signal if type is not set
        const lowerSignal = (inc.signal_text || "").toLowerCase();
        const detectedType = inc.type !== 'UNKNOWN' ? inc.type.toLowerCase() : 
            (lowerSignal.includes('fire') || lowerSignal.includes('aag') || lowerSignal.includes('jal') ? 'fire' : 'flood');

        return {
            ...inc,
            type: detectedType,
            status: isComplete ? 'RESOLVED' : 'ACTIVE',
            logs: logs,
            assigned_hub: logs.find(l => l.agent === 'The Strategist')?.details?.deployment?.hub || 'Karachi Central Hub',
            dispatched_units: logs.find(l => l.agent === 'The Strategist')?.details?.deployment?.units || ['First Responder Unit'],
            eta: logs.find(l => l.agent === 'The Strategist')?.details?.deployment?.eta_mins || 14,
            priority: logs.find(l => l.agent === 'The Dispatcher')?.details?.threat_level || 8,
            confidence: logs.find(l => l.agent === 'The Truth-Engine')?.details?.classification?.confidence_level || 0.85,
            timestamp: inc.created_at || new Date().toISOString()
        };
    });

    // Apply Filter Logic
    const filteredIncidents = processedIncidents.filter(inc => {
        // Search filter (ID or Landmark)
        const matchesSearch = inc.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (inc.location?.landmark || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inc.signal_text || '').toLowerCase().includes(searchQuery.toLowerCase());

        // Type filter
        const matchesType = typeFilter === 'ALL' || inc.type.toUpperCase() === typeFilter;

        // Department filter
        const matchesDept = deptFilter === 'ALL' || inc.department === deptFilter;

        // Status filter
        const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;

        // Time filter
        let matchesTime = true;
        if (timeFilter !== 'ALL') {
            const now = new Date();
            const incDate = new Date(inc.timestamp);
            const diffHours = (now - incDate) / (1000 * 60 * 60);
            if (timeFilter === 'TODAY' && diffHours > 24) matchesTime = false;
            if (timeFilter === '3DAYS' && diffHours > 72) matchesTime = false;
            if (timeFilter === '7DAYS' && diffHours > 168) matchesTime = false;
        }

        return matchesSearch && matchesType && matchesDept && matchesStatus && matchesTime;
    });

    // Selected Incident Details for the audit panel
    const selectedIncident = processedIncidents.find(i => i.id === selectedIncidentId);

    // Dynamic stat counts
    const totalCount = processedIncidents.length;
    const activeCount = processedIncidents.filter(i => i.status === 'ACTIVE').length;
    const resolvedCount = processedIncidents.filter(i => i.status === 'RESOLVED').length;
    const avgETA = processedIncidents.length > 0 
        ? Math.round(processedIncidents.reduce((acc, i) => acc + (i.eta || 0), 0) / processedIncidents.length) 
        : 14;

    return (
        <div className="w-full h-full flex flex-col p-8 space-y-6 overflow-hidden text-zinc-300">
            {/* Header Readout */}
            <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-xl font-black uppercase tracking-[0.2em] text-zinc-100 flex items-center gap-3">
                        <Shield className="text-emerald-500" size={24} /> Sovereign Audit Explorer
                    </h1>
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Sovereign Governance Intelligence & Historical Crisis Archiver</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-mono font-black uppercase text-zinc-400">Archiver Pipeline Active</span>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard title="Total Archive Logs" value={totalCount} sub="Crisis records saved" color="text-zinc-100" bg="bg-white/[0.01]" />
                <StatCard title="Active Operations" value={activeCount} sub="Units currently on grid" color="text-red-400" bg="bg-red-500/5 border-red-500/10" />
                <StatCard title="Resolution Index" value={totalCount > 0 ? `${Math.round((resolvedCount / totalCount) * 100)}%` : '100%'} sub="Successful auditor resolves" color="text-emerald-400" bg="bg-emerald-500/5 border-emerald-500/10" />
                <StatCard title="Average Asset ETA" value={`${avgETA} min`} sub="Target response standard" color="text-orange-400" bg="bg-orange-500/5 border-orange-500/10" />
            </div>

            {/* Advanced Search & Filtering Controls */}
            <div className="bg-zinc-950/40 border border-white/5 rounded-[2rem] p-6 backdrop-blur-3xl shadow-2xl space-y-4">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <SlidersHorizontal size={14} className="text-zinc-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tactical Filters</span>
                </div>

                <div className="grid grid-cols-12 gap-4">
                    {/* Search query input */}
                    <div className="col-span-4 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Incident ID, Landmark, Signal..."
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white outline-none focus:border-emerald-500/30 transition-all font-mono"
                        />
                    </div>

                    {/* Crisis Type Selector */}
                    <div className="col-span-2 space-y-1">
                        <label className="text-[7px] font-black text-zinc-500 uppercase tracking-widest ml-1">Crisis Type</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-xs text-zinc-300 outline-none uppercase font-bold focus:border-emerald-500/30"
                        >
                            <option value="ALL">All Categories</option>
                            <option value="FIRE">Fires / Aag</option>
                            <option value="FLOOD">Floods / Pani</option>
                        </select>
                    </div>

                    {/* Assigned Department Selector */}
                    <div className="col-span-2 space-y-1">
                        <label className="text-[7px] font-black text-zinc-500 uppercase tracking-widest ml-1">Assigned Department</label>
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-xs text-zinc-300 outline-none uppercase font-bold focus:border-emerald-500/30"
                        >
                            <option value="ALL">All Agencies</option>
                            <option value="FIRE_BRIGADE">Fire Brigade</option>
                            <option value="KMC_HEALTH">KMC Health</option>
                            <option value="POLICE_FORCE">Sindh Police</option>
                            <option value="RESCUE_1122">Rescue 1122</option>
                        </select>
                    </div>

                    {/* Operational Status Selector */}
                    <div className="col-span-2 space-y-1">
                        <label className="text-[7px] font-black text-zinc-500 uppercase tracking-widest ml-1">Auditor Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-xs text-zinc-300 outline-none uppercase font-bold focus:border-emerald-500/30"
                        >
                            <option value="ALL">All States</option>
                            <option value="ACTIVE">Active / Dispatched</option>
                            <option value="RESOLVED">Resolved / Closed</option>
                        </select>
                    </div>

                    {/* Time Window Selector */}
                    <div className="col-span-2 space-y-1">
                        <label className="text-[7px] font-black text-zinc-500 uppercase tracking-widest ml-1">Time Window</label>
                        <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-xs text-zinc-300 outline-none uppercase font-bold focus:border-emerald-500/30"
                        >
                            <option value="ALL">All Time</option>
                            <option value="TODAY">Last 24 Hours</option>
                            <option value="3DAYS">Last 3 Days</option>
                            <option value="7DAYS">Last 7 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Explorer Hub */}
            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                {/* Master Incident List (Left side) */}
                <div className="flex-1 bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-3xl overflow-y-auto custom-scrollbar shadow-2xl space-y-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3 px-2 mb-3">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Query Records ({filteredIncidents.length})</span>
                        <span className="text-[9px] font-mono text-zinc-500">Sorted by newest first</span>
                    </div>

                    {filteredIncidents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 opacity-30 space-y-3">
                            <SlidersHorizontal size={40} />
                            <p className="text-[10px] font-mono uppercase tracking-widest">No matching crisis logs found in active registry</p>
                        </div>
                    ) : (
                        filteredIncidents.reverse().map((inc) => (
                            <div
                                key={inc.id}
                                onClick={() => setSelectedIncidentId(selectedIncidentId === inc.id ? null : inc.id)}
                                className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                                    selectedIncidentId === inc.id 
                                        ? 'bg-emerald-500/5 border-emerald-500/40 shadow-lg shadow-emerald-950/10' 
                                        : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                                }`}
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    {/* Icon Indicator */}
                                    <div className={`p-3 rounded-2xl border shrink-0 ${
                                        inc.type === 'fire' 
                                            ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                                            : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                    }`}>
                                        {inc.type === 'fire' ? <Flame size={16} /> : <Droplets size={16} />}
                                    </div>

                                    {/* Core details */}
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-xs font-mono font-black text-white">{inc.id}</span>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                                inc.status === 'RESOLVED' 
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                                    : 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'
                                            }`}>
                                                {inc.status}
                                            </span>
                                            <span className="text-[9px] font-mono text-zinc-500 uppercase">
                                                {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <h3 className="text-[11px] font-bold text-zinc-300 truncate max-w-[280px]">
                                            {inc.location?.landmark || 'Karachi Sector'}
                                        </h3>
                                        <p className="text-[9px] font-mono text-zinc-500 line-clamp-1 italic max-w-[320px]">
                                            "{inc.signal_text || 'Citizen reported crisis.'}"
                                        </p>
                                    </div>
                                </div>

                                {/* Right stats */}
                                <div className="flex items-center gap-6 shrink-0">
                                    <div className="text-right">
                                        <span className="text-[7px] text-zinc-500 block uppercase font-bold">Priority Triage</span>
                                        <span className="text-xs font-mono font-black text-red-400">Lvl {inc.priority}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[7px] text-zinc-500 block uppercase font-bold">Assigned Dept</span>
                                        <span className="text-[10px] font-mono font-black uppercase text-zinc-400">
                                            {inc.department?.replace('_', ' ') || 'FIRE BRIGADE'}
                                        </span>
                                    </div>
                                    <ChevronRight size={16} className={`text-zinc-500 transition-transform ${selectedIncidentId === inc.id ? 'rotate-90 text-emerald-500' : ''}`} />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Audit Detail Panel (Right side) */}
                <div className={`w-[450px] bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-3xl overflow-y-auto custom-scrollbar shadow-2xl transition-all duration-500 ease-in-out ${
                    selectedIncident ? 'opacity-100 translate-x-0' : 'opacity-30 pointer-events-none'
                }`}>
                    {selectedIncident ? (
                        <div className="space-y-6">
                            {/* Panel Header */}
                            <div className="flex justify-between items-start border-b border-white/5 pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded">
                                            {selectedIncident.id}
                                        </span>
                                        <span className="text-[9px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                                            <Calendar size={10} /> {new Date(selectedIncident.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h2 className="text-sm font-black uppercase text-white mt-2 flex items-center gap-2">
                                        {selectedIncident.location?.landmark || 'Karachi Core'}
                                    </h2>
                                </div>
                                <button 
                                    onClick={() => setSelectedIncidentId(null)} 
                                    className="text-zinc-500 hover:text-white text-[10px] bg-white/5 w-6 h-6 rounded-full flex items-center justify-center border border-white/5"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Core Parameters grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl space-y-1">
                                    <span className="text-[7px] text-zinc-500 uppercase font-black">Verification Confidence</span>
                                    <span className="text-emerald-400 font-mono text-xs font-black">{Math.round((selectedIncident.confidence || 0.88) * 100)}%</span>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl space-y-1">
                                    <span className="text-[7px] text-zinc-500 uppercase font-black">Dispatcher Threat Level</span>
                                    <span className="text-red-400 font-mono text-xs font-black">Level {selectedIncident.priority}</span>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl space-y-1">
                                    <span className="text-[7px] text-zinc-500 uppercase font-black">Target Operational Hub</span>
                                    <span className="text-zinc-200 text-[10px] font-bold truncate block">{selectedIncident.assigned_hub}</span>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl space-y-1">
                                    <span className="text-[7px] text-zinc-500 uppercase font-black">Responder Fleet ETA</span>
                                    <span className="text-orange-400 font-mono text-xs font-black">{selectedIncident.eta} Mins</span>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl col-span-2 space-y-1.5">
                                    <span className="text-[7px] text-zinc-500 uppercase font-black block">Dispatched Vehicles & Crews</span>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {(selectedIncident.dispatched_units || []).map((unit, index) => (
                                            <span key={index} className="bg-white/5 border border-white/5 rounded-lg px-2 py-1 text-[8px] text-zinc-300 font-bold">
                                                {unit}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Full Cognitive Agent Audits */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                    <Activity size={12} className="text-emerald-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">8-Agent Resolution Trace</span>
                                </div>

                                {selectedIncident.logs.length === 0 ? (
                                    <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl text-[9px] text-zinc-500 text-center font-mono">
                                        No active agent traces found. Standard local fallback rules applied.
                                    </div>
                                ) : (
                                    <div className="space-y-4 relative pl-3 border-l border-zinc-800">
                                        {selectedIncident.logs.map((log, index) => (
                                            <div key={index} className="space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[8px] font-black uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        {log.agent}
                                                    </span>
                                                    <span className="text-[7px] font-mono text-emerald-400 font-bold uppercase">{log.outcome}</span>
                                                </div>
                                                <p className="text-[9px] text-zinc-400 leading-relaxed pl-3 italic border-l border-white/5">
                                                    {log.message}
                                                </p>
                                                {log.details?.reasoning && (
                                                    <div className="mt-1.5 p-2 bg-black/40 border border-white/5 rounded-xl text-[8px] font-mono text-zinc-500 pl-3 leading-normal">
                                                        <span className="text-[6px] font-black uppercase text-zinc-600 block mb-1">Audit Reasoning</span>
                                                        {log.details.reasoning}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-20 space-y-3 py-36">
                            <Shield size={48} />
                            <p className="text-[10px] font-mono uppercase tracking-widest text-center">Select an incident from the grid to audit step-by-step cognitive dispatches</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, sub, color, bg }) => (
    <div className={`p-5 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-xl flex flex-col gap-1 ${bg || 'bg-white/[0.01]'}`}>
        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{title}</span>
        <span className={`text-2xl font-black font-mono tracking-tight ${color}`}>{value}</span>
        <span className="text-[8px] font-medium text-zinc-500 uppercase tracking-wider leading-none mt-1">{sub}</span>
    </div>
);

export default CrisisExplorer;
