import React from 'react';
import { Eye, ShieldCheck, BarChart3, Zap, MessageSquare } from 'lucide-react';

const DecisionCards = ({ traces }) => {
    // Group traces by agent to show current status in each "phase"
    const agentMap = {
        'The Sentinel': { icon: <Eye size={16} />, title: 'Detection' },
        'The Truth-Engine': { icon: <ShieldCheck size={16} />, title: 'Verification' },
        'The Analyst': { icon: <BarChart3 size={16} />, title: 'Impact' },
        'The Strategist': { icon: <Zap size={16} />, title: 'Deployment' },
        'The Communicator': { icon: <MessageSquare size={16} />, title: 'Response' },
        'The Auditor': { icon: <ShieldCheck size={16} />, title: 'Audit' }
    };

    const getStatus = (agentName) => {
        // Find the latest trace for this agent across ALL incidents (for the high-level cards)
        const traceObj = [...traces].reverse().find(t => t.log.agent === agentName);
        if (!traceObj) return 'pending';
        const log = traceObj.log;
        const okOutcomes = ['Success', 'Verified', 'Approved', 'Draft Plan Created', 'Crisis Resolved'];
        if (okOutcomes.includes(log.outcome)) return 'complete';
        if (log.outcome === 'False Positive' || log.outcome === 'Rejected') return 'error';
        return 'active';
    };

    return (
        <div className="absolute bottom-6 right-6 left-6 flex justify-between gap-4 z-20 overflow-x-auto pb-2 pointer-events-none">
            {Object.entries(agentMap).map(([name, meta]) => {
                const status = getStatus(name);
                return (
                    <div 
                        key={name}
                        className={`flex-1 min-w-[150px] p-3 rounded-lg border backdrop-blur-md transition-all duration-500 pointer-events-auto
                            ${status === 'complete' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 
                              status === 'error' ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 
                              status === 'active' ? 'bg-blue-500/10 border-blue-500/50 animate-pulse' : 
                              'bg-zinc-900/50 border-zinc-800 opacity-50'}`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <div className={status === 'complete' ? 'text-emerald-500' : status === 'error' ? 'text-red-500' : 'text-zinc-500'}>
                                {meta.icon}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">{meta.title}</span>
                        </div>
                        <p className="text-[9px] text-zinc-500 font-mono truncate">
                            {status === 'complete' ? 'MISSION_READY' : status === 'error' ? 'ACTION_REJECTED' : 'AWAITING_SIGNAL'}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};

export default DecisionCards;
