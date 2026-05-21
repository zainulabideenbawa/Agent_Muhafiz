import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Clock, AlertCircle, User, Shield, ChevronRight } from 'lucide-react';
import { API_BASE } from '../utils/config.js';

const MissionDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
        const interval = setInterval(fetchTasks, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/tasks`);
            const data = await res.json();
            setTasks(data.length > 0 ? data : [
                { task_id: 'TSK-101', incident_ref: 'INC-001', status: 'ON_SCENE', assigned_agent: 'The Dispatcher', mission_objective: 'Contain secondary fire at Saddar Bazaar', priority_level: 2 },
                { task_id: 'TSK-102', incident_ref: 'INC-002', status: 'ANALYSIS', assigned_agent: 'The Analyst', mission_objective: 'Assess flood risk for NIPA bridge', priority_level: 1 }
            ]);
            setLoading(false);
        } catch (e) { console.error(e); }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'RESOLVED': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'ON_SCENE': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'ANALYSIS': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
        }
    };

    return (
        <div className="h-full w-full px-20 pb-32 space-y-12 animate-in fade-in duration-1000">
            {/* HEADER */}
            <div className="pt-24 flex justify-between items-end border-b border-white/5 pb-10">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-1 h-8 bg-emerald-500" />
                        <h2 className="text-white font-black text-4xl uppercase tracking-[-0.05em]">Mission Tasking Board</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em]">Active Operations Queue</span>
                        <div className="h-px w-8 bg-white/10" />
                        <span className="text-blue-500 font-mono text-[10px] uppercase tracking-[0.2em]">{tasks.length} ACTIVE_MISSIONS</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500">
                            <Shield size={16} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-zinc-500 uppercase">Current Commander</p>
                            <p className="text-[11px] font-black text-white">Sovereign-1 (Admin)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* TASK GRID */}
            <div className="grid grid-cols-1 gap-4">
                {tasks.map(task => (
                    <div key={task.task_id} className="group p-8 bg-[#09090b] border border-white/5 rounded-[2.5rem] hover:border-white/10 transition-all flex items-center gap-8 relative overflow-hidden">
                        {/* Status Bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getStatusColor(task.status).split(' ')[0].replace('text', 'bg')}`} />

                        {/* ID & Priority */}
                        <div className="flex flex-col items-center justify-center w-24 border-r border-white/5">
                            <span className="text-[8px] font-black text-zinc-600 uppercase mb-1">TASK_ID</span>
                            <span className="text-xs font-mono text-zinc-300 font-bold">{task.task_id}</span>
                            <div className="mt-3 px-2 py-0.5 bg-zinc-800 rounded text-[7px] font-black text-zinc-500 uppercase">PRIORITY_{task.priority_level}</div>
                        </div>

                        {/* Objective */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-1 rounded-md text-[8px] font-black border uppercase ${getStatusColor(task.status)}`}>
                                    {task.status}
                                </span>
                                <span className="text-zinc-700 text-[10px] font-mono tracking-tighter">REF: {task.incident_ref}</span>
                            </div>
                            <h3 className="text-lg font-bold text-zinc-100 mb-1">{task.mission_objective}</h3>
                            <div className="flex items-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <User size={12} className="text-zinc-500" />
                                    <span className="text-[10px] text-zinc-400 font-medium">Agent: <span className="text-zinc-100">{task.assigned_agent}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={12} className="text-zinc-500" />
                                    <span className="text-[10px] text-zinc-400 font-medium">Duration: <span className="text-zinc-100">{
                                        (() => {
                                            if (!task.created_at) return 'Ongoing';
                                            const secs = Math.floor((Date.now() - new Date(task.created_at).getTime()) / 1000);
                                            const m = Math.floor(secs / 60);
                                            const s = secs % 60;
                                            return m > 0 ? `${m}m ${s}s` : `${s}s`;
                                        })()
                                    }</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                View Logs
                            </button>
                            <button 
                                onClick={async () => {
                                    try {
                                        await fetch(`${API_BASE}/api/tasks/${task.task_id}/status`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'RESOLVED', summary: 'Manual Sovereign Resolution' })
                                        });
                                        fetchTasks();
                                    } catch (e) { console.error(e); }
                                }}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Resolve Task
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* EMPTY STATE / REPORT GENERATOR FOOTER */}
            <div className="flex justify-center pt-8">
                <button className="flex items-center gap-3 px-10 py-4 bg-emerald-600/10 border border-emerald-500/20 rounded-full text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all">
                    <ClipboardList size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Generate Full Operational Report</span>
                </button>
            </div>
        </div>
    );
};

export default MissionDashboard;
