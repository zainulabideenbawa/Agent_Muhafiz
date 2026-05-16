import React, { useState, useEffect } from 'react';
import { Shield, Truck, Users, LayoutDashboard, Settings, User, Save, Plus, MapPin, Trash2, Terminal, Send, TrendingUp, Megaphone, ClipboardList, Cpu } from 'lucide-react';

const SovereignSidebar = ({ activeDept, setDept, view, setView, dashboardView, setDashboardView, user }) => {
    const [hubs, setHubs] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const departments = {
        'KMC_HEALTH': { name: 'KMC Health & Infra', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        'POLICE_FORCE': { name: 'Sindh Police Force', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        'FIRE_BRIGADE': { name: 'Karachi Fire Brigade', color: 'text-orange-500', bg: 'bg-orange-500/10' },
        'RESCUE_1122': { name: 'Rescue 1122', color: 'text-red-500', bg: 'bg-red-500/10' }
    };

    const currentDept = departments[activeDept] || { name: 'Sovereign Unit', color: 'text-zinc-500', bg: 'bg-zinc-500/10' };

    useEffect(() => {
        fetchHubs();
    }, [activeDept]);

    const fetchHubs = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/department-resources/${activeDept}`);
            const data = await res.json();
            const hubList = Array.isArray(data) ? data : (data.hubs || []);
            
            if (user.role === 'DEPT_ADMIN' && activeDept !== user.department) {
                setHubs([]);
            } else {
                setHubs(hubList);
            }
        } catch (e) { console.error("Failed to fetch hubs"); }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await fetch(`http://localhost:3001/api/department-resources/${activeDept}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hubs)
            });
            setView('dashboard');
        } catch (e) { console.error("Save failed"); }
        setIsSaving(false);
    };

    const updateHub = (id, field, value) => {
        setHubs(hubs.map(h => h.id === id ? { ...h, [field]: value } : h));
    };

    const addHub = () => {
        const newHub = { id: `HUB-${Date.now()}`, name: 'New Station', location: 'Karachi', trucks: 0, ambulances: 0, officers: 0 };
        setHubs([...hubs, newHub]);
    };

    return (
        <div className="w-72 h-full bg-black/10 backdrop-blur-3xl border-r border-white/5 flex flex-col shadow-2xl relative overflow-hidden z-50">
            {/* Header / Dept Selector */}
            <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                    <div className={`p-2 rounded-lg ${currentDept.bg} ${currentDept.color}`}>
                        <Shield size={20} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate">Sovereign Unit</h4>
                        <p className={`text-xs font-bold truncate ${currentDept.color}`}>{currentDept.name}</p>
                    </div>
                </div>

                <nav className="flex flex-col gap-1.5">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2 ml-2">Main Stage</span>
                    <button 
                        onClick={() => { setDashboardView('TACTICAL'); setView('dashboard'); }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardView === 'TACTICAL' && view === 'dashboard' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                        <div className="flex items-center gap-3">
                            <LayoutDashboard size={14} /> Tactical Grid
                        </div>
                        {dashboardView === 'TACTICAL' && view === 'dashboard' && <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
                    </button>
                    <button 
                        onClick={() => { setDashboardView('STRATEGIC'); setView('dashboard'); }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardView === 'STRATEGIC' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                        <div className="flex items-center gap-3">
                            <TrendingUp size={14} /> Strategic Audit
                        </div>
                        {dashboardView === 'STRATEGIC' && <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
                    </button>
                    <button 
                        onClick={() => { setDashboardView('MISSIONS'); setView('dashboard'); }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardView === 'MISSIONS' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                        <div className="flex items-center gap-3">
                            <ClipboardList size={14} /> Mission Board
                        </div>
                        {dashboardView === 'MISSIONS' && <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
                    </button>
                    {user.role === 'SUPER_ADMIN' && (
                        <button 
                            onClick={() => { setDashboardView('ADMIN'); setView('dashboard'); }}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardView === 'ADMIN' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'text-zinc-500 hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Cpu size={14} /> Urban Optimization
                            </div>
                            {dashboardView === 'ADMIN' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                        </button>
                    )}
                    <button 
                        onClick={() => { setDashboardView('BROADCAST'); setView('dashboard'); }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardView === 'BROADCAST' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Megaphone size={14} /> Public Alerts
                        </div>
                        {dashboardView === 'BROADCAST' && <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
                    </button>

                    <div className="my-4 h-px bg-white/5" />
                    
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2 ml-2">Agency Tools</span>
                    <button 
                        onClick={() => setView('guidance')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'guidance' ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                        <Terminal size={14} /> Command Override
                    </button>
                    <button 
                        onClick={() => setView('manage')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'manage' ? 'bg-blue-600/20 text-blue-500 border border-blue-500/30' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                        <Settings size={14} /> Fleet Management
                    </button>
                </nav>
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {view === 'dashboard' ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Active Stations</h5>
                            <span className="text-[10px] font-mono text-emerald-500">{hubs.length} Hubs</span>
                        </div>
                        <div className="space-y-2">
                            {hubs.map((hub) => (
                                <div key={hub.id} className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold text-zinc-200">{hub.name}</span>
                                        <div className="flex items-center gap-1 text-[8px] text-zinc-500 font-mono">
                                            <MapPin size={8} /> {hub.location}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Stat mini label="Trk" value={hub.trucks} />
                                        <Stat mini label="Amb" value={hub.ambulances} />
                                        <Stat mini label="Off" value={hub.officers} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : view === 'guidance' ? (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <Terminal className="text-emerald-500" size={16} />
                            <h3 className="text-white text-xs font-black uppercase tracking-widest">Command Override</h3>
                        </div>

                        {/* Active Directives Log */}
                        <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 mb-6 overflow-y-auto space-y-4 custom-scrollbar">
                            <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest block mb-2">Active Directives</span>
                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                <p className="text-[10px] text-emerald-500/80 leading-relaxed font-mono">
                                    &gt; MANUAL_OVERRIDE: Prioritize Sector-7 rescue missions.
                                </p>
                                <span className="text-[8px] text-zinc-600 uppercase mt-1 block">Awaiting Dispatcher ACK...</span>
                            </div>
                        </div>

                        {/* Directive Input */}
                        <div className="space-y-4">
                            <div className="relative">
                                <textarea 
                                    id="directive_input"
                                    placeholder="Enter Sovereign Directive..."
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-[11px] text-zinc-300 font-mono outline-none focus:border-emerald-500/50 transition-all h-24"
                                />
                                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                    <span className="text-[8px] font-black text-zinc-700 uppercase">DIRECT_LINK_ACTIVE</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                            </div>
                            <button 
                                onClick={async () => {
                                    const input = document.getElementById('directive_input');
                                    const directive = input.value;
                                    if (!directive) return;
                                    try {
                                        await fetch('http://localhost:3001/api/agent-directive', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ directive })
                                        });
                                        input.value = '';
                                        alert("Sovereign Directive Committed to Brain.");
                                    } catch (e) { console.error(e); }
                                }}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                            >
                                <Send size={14} /> Commit Directive
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-2 pb-20">
                        <div className="flex justify-between items-center px-2">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-500">Edit Hubs</h5>
                            <button onClick={addHub} className="p-1 hover:bg-zinc-800 rounded text-blue-500"><Plus size={16}/></button>
                        </div>
                        
                        {hubs.map((hub) => (
                            <div key={hub.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
                                <input 
                                    className="w-full bg-transparent border-none text-xs font-bold text-white focus:outline-none"
                                    value={hub.name}
                                    onChange={(e) => updateHub(hub.id, 'name', e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <EditField label="Location" value={hub.location} onChange={(v) => updateHub(hub.id, 'location', v)} />
                                    <EditField type="number" label="Trucks" value={hub.trucks} onChange={(v) => updateHub(hub.id, 'trucks', parseInt(v))} />
                                    <EditField type="number" label="Amb" value={hub.ambulances} onChange={(v) => updateHub(hub.id, 'ambulances', parseInt(v))} />
                                    <EditField type="number" label="Off" value={hub.officers} onChange={(v) => updateHub(hub.id, 'officers', parseInt(v))} />
                                </div>
                                <button 
                                    onClick={() => setHubs(hubs.filter(h => h.id !== hub.id))}
                                    className="w-full py-1 text-[8px] text-zinc-600 hover:text-red-500 flex items-center justify-center gap-1 uppercase font-bold"
                                >
                                    <Trash2 size={10} /> Decommission Hub
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Persistence Layer */}
            {view === 'manage' && (
                <div className="p-4 bg-[#09090b] border-t border-zinc-800">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20"
                    >
                        <Save size={16} /> {isSaving ? 'SYNCING_ASSETS...' : 'COMMIT_FLEET_CHANGES()'}
                    </button>
                </div>
            )}

            {/* Profile Switcher (Simulated) */}
            <div className="p-4 bg-black/40 border-t border-zinc-800">
                 <select 
                    disabled={user.role === 'DEPT_ADMIN'}
                    value={activeDept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-bold p-2 rounded-lg outline-none uppercase tracking-tighter disabled:opacity-50"
                 >
                    {Object.keys(departments).map(id => (
                        <option key={id} value={id}>{departments[id].name}</option>
                    ))}
                 </select>
            </div>
        </div>
    );
};

const Stat = ({ label, value, mini }) => (
    <div className="flex flex-col">
        <span className="text-[8px] font-bold text-zinc-600 uppercase">{label}</span>
        <span className="text-xs font-mono text-zinc-100">{value}</span>
    </div>
);

const EditField = ({ label, value, onChange, type="text" }) => (
    <div className="space-y-1">
        <label className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">{label}</label>
        <input 
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-black/50 border border-zinc-800 rounded px-2 py-1.5 text-[10px] text-zinc-300 focus:border-blue-500 outline-none"
        />
    </div>
);

export default SovereignSidebar;
