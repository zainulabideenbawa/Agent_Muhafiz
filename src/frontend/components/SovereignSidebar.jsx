import React, { useState, useEffect } from 'react';
import { Shield, Truck, Users, LayoutDashboard, Settings, User, Save, Plus, MapPin, Trash2, Terminal, Send, TrendingUp, Megaphone, ClipboardList, Cpu, Search, ChevronRight, LogOut } from 'lucide-react';

const SovereignSidebar = ({ activeDept, setDept, view, setView, dashboardView, setDashboardView, user, sidebarOpen, setSidebarOpen, selectedIncident, setSelectedIncident, onLogout }) => {
    const [hubs, setHubs] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const handleAuditorAction = async (actionType) => {
        if (!selectedIncident) return;
        setIsSaving(true);
        try {
            let endpoint = '';
            let body = {};
            if (actionType === 'CONFIRM') {
                endpoint = 'http://127.0.0.1:3001/api/incidents/confirm-crisis';
                body = { incidentId: selectedIncident.id, note: 'Crisis officially confirmed by Sovereign Command.' };
            } else {
                endpoint = 'http://127.0.0.1:3001/api/incidents/retract-alert';
                body = { incidentId: selectedIncident.id, reason: actionType === 'FALSE_ALARM' ? 'False Alarm' : 'Road Clear' };
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                setSelectedIncident(prev => ({
                    ...prev,
                    status: actionType === 'CONFIRM' ? 'CONFIRMED' : 'RETRACTED',
                    data: {
                        ...prev.data,
                        retraction_reason: actionType === 'FALSE_ALARM' ? 'False Alarm' : (actionType === 'ROAD_CLEAR' ? 'Road Clear' : prev.data?.retraction_reason),
                        officer_note: actionType === 'CONFIRM' ? 'Crisis officially confirmed by Sovereign Command.' : prev.data?.officer_note
                    }
                }));
            }
        } catch (e) {
            console.error("Auditor action failed:", e);
        } finally {
            setIsSaving(false);
        }
    };

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
            const res = await fetch(`http://127.0.0.1:3001/api/department-resources/${activeDept}`);
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
            await fetch(`http://127.0.0.1:3001/api/department-resources/${activeDept}`, {
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

    if (!sidebarOpen) {
        return (
            <div className="w-full h-full bg-black/10 backdrop-blur-3xl border-r border-white/5 flex flex-col items-center py-6 shadow-2xl relative overflow-visible z-50 transition-all duration-500">
                {/* Dept Icon */}
                <div className="relative group mb-6">
                    <div className={`p-2.5 rounded-xl ${currentDept.bg} ${currentDept.color} border border-white/5 cursor-pointer`}>
                        <Shield size={18} />
                    </div>
                    <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-zinc-950/95 border border-white/10 text-white text-[9px] font-black tracking-widest uppercase pointer-events-none opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 backdrop-blur-md shadow-2xl whitespace-nowrap z-[100]">
                        {currentDept.name}
                    </div>
                </div>

                 {/* Main Stage Icons */}
                <div className="flex-1 flex flex-col gap-3 w-full items-center">
                    <div className="relative group">
                        <button
                            onClick={() => { setDashboardView('TACTICAL'); setView('dashboard'); setSidebarOpen(true); }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${dashboardView === 'TACTICAL' && view === 'dashboard' ? 'bg-white text-black' : 'text-zinc-500 hover:bg-white/5'}`}
                        >
                            <LayoutDashboard size={16} />
                        </button>
                        <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-zinc-950/95 border border-white/10 text-white text-[9px] font-black tracking-widest uppercase pointer-events-none opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 backdrop-blur-md shadow-2xl whitespace-nowrap z-[100]">
                            Tactical Grid
                        </div>
                    </div>

                    <div className="relative group">
                        <button
                            onClick={() => { setDashboardView('STRATEGIC'); setView('dashboard'); setSidebarOpen(true); }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${dashboardView === 'STRATEGIC' ? 'bg-white text-black' : 'text-zinc-500 hover:bg-white/5'}`}
                        >
                            <TrendingUp size={16} />
                        </button>
                        <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-zinc-950/95 border border-white/10 text-white text-[9px] font-black tracking-widest uppercase pointer-events-none opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 backdrop-blur-md shadow-2xl whitespace-nowrap z-[100]">
                            Strategic Audit
                        </div>
                    </div>

                    <div className="relative group">
                        <button
                            onClick={() => { setDashboardView('MISSIONS'); setView('dashboard'); setSidebarOpen(true); }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${dashboardView === 'MISSIONS' ? 'bg-white text-black' : 'text-zinc-500 hover:bg-white/5'}`}
                        >
                            <ClipboardList size={16} />
                        </button>
                        <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-zinc-950/95 border border-white/10 text-white text-[9px] font-black tracking-widest uppercase pointer-events-none opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 backdrop-blur-md shadow-2xl whitespace-nowrap z-[100]">
                            Mission Board
                        </div>
                    </div>

                    <div className="relative group">
                        <button
                            onClick={() => { setDashboardView('ARCHIVE'); setView('dashboard'); setSidebarOpen(true); }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${dashboardView === 'ARCHIVE' ? 'bg-white text-black' : 'text-zinc-500 hover:bg-white/5'}`}
                        >
                            <Search size={16} />
                        </button>
                        <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-zinc-950/95 border border-white/10 text-white text-[9px] font-black tracking-widest uppercase pointer-events-none opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 backdrop-blur-md shadow-2xl whitespace-nowrap z-[100]">
                            Audit Explorer
                        </div>
                    </div>

                    {user.role === 'SUPER_ADMIN' && (
                        <div className="relative group">
                            <button
                                onClick={() => { setDashboardView('ADMIN'); setView('dashboard'); setSidebarOpen(true); }}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${dashboardView === 'ADMIN' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'text-zinc-500 hover:bg-white/5'}`}
                            >
                                <Cpu size={16} />
                            </button>
                            <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-zinc-950/95 border border-orange-500/20 text-orange-500 text-[9px] font-black tracking-widest uppercase pointer-events-none opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 backdrop-blur-md shadow-2xl whitespace-nowrap z-[100]">
                                Urban Optimization
                            </div>
                        </div>
                    )}

                    {user.role === 'SUPER_ADMIN' && (
                        <div className="relative group">
                            <button
                                onClick={() => { setDashboardView('USERS'); setView('dashboard'); setSidebarOpen(true); }}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${dashboardView === 'USERS' ? 'bg-purple-500/20 text-purple-500 border border-purple-500/30' : 'text-zinc-500 hover:bg-white/5'}`}
                            >
                                <Users size={16} />
                            </button>
                            <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-zinc-950/95 border border-purple-500/20 text-purple-500 text-[9px] font-black tracking-widest uppercase pointer-events-none opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 backdrop-blur-md shadow-2xl whitespace-nowrap z-[100]">
                                User Management
                            </div>
                        </div>
                    )}

                    <div className="relative group">
                        <button
                            onClick={() => { setDashboardView('BROADCAST'); setView('dashboard'); setSidebarOpen(true); }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${dashboardView === 'BROADCAST' ? 'bg-white text-black' : 'text-zinc-500 hover:bg-white/5'}`}
                        >
                            <Megaphone size={16} />
                        </button>
                        <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-zinc-950/95 border border-white/10 text-white text-[9px] font-black tracking-widest uppercase pointer-events-none opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 backdrop-blur-md shadow-2xl whitespace-nowrap z-[100]">
                            Public Alerts
                        </div>
                    </div>

                    <div className="w-8 h-px bg-white/5 my-2" />

                    {/* Agency Tools Icons */}
                    <div className="relative group">
                        <button
                            onClick={() => { setView('guidance'); setSidebarOpen(true); }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${view === 'guidance' ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30' : 'text-zinc-500 hover:bg-white/5'}`}
                        >
                            <Terminal size={16} />
                        </button>
                        <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-zinc-950/95 border border-emerald-500/20 text-emerald-500 text-[9px] font-black tracking-widest uppercase pointer-events-none opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 backdrop-blur-md shadow-2xl whitespace-nowrap z-[100]">
                            Command Override
                        </div>
                    </div>

                    <div className="relative group">
                        <button
                            onClick={() => { setView('manage'); setSidebarOpen(true); }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${view === 'manage' ? 'bg-blue-600/20 text-blue-500 border border-blue-500/30' : 'text-zinc-500 hover:bg-white/5'}`}
                        >
                            <Settings size={16} />
                        </button>
                        <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-zinc-950/95 border border-blue-500/20 text-blue-500 text-[9px] font-black tracking-widest uppercase pointer-events-none opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 backdrop-blur-md shadow-2xl whitespace-nowrap z-[100]">
                            Fleet Management
                        </div>
                    </div>
                </div>

                {/* Bottom Toggle to Open */}
                <div className="flex flex-col gap-2.5 items-center mb-4">
                    {/* Collapsed User Avatar */}
                    <div className="relative group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 cursor-pointer transition-all hover:bg-emerald-500/20">
                            <User size={16} />
                            <div className="absolute bottom-1 right-1 w-2 h-2 bg-emerald-500 border border-black rounded-full animate-pulse" />
                        </div>
                        <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-zinc-950/95 border border-white/10 text-white text-[9px] font-black tracking-widest uppercase pointer-events-none opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 backdrop-blur-md shadow-2xl whitespace-nowrap z-[100]">
                            {user.name} ({user.role})
                        </div>
                    </div>

                    <div className="relative group">
                        <button
                            onClick={onLogout}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                        >
                            <LogOut size={16} />
                        </button>
                        <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-zinc-950/95 border border-red-500/20 text-red-400 text-[9px] font-black tracking-widest uppercase pointer-events-none opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 backdrop-blur-md shadow-2xl whitespace-nowrap z-[100]">
                            Sign Out
                        </div>
                    </div>

                    <div className="relative group">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:bg-white/5 hover:text-white transition-all border border-transparent hover:border-white/5"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-zinc-950/95 border border-white/10 text-white text-[9px] font-black tracking-widest uppercase pointer-events-none opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 backdrop-blur-md shadow-2xl whitespace-nowrap z-[100]">
                            Expand Menu
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-black/10 backdrop-blur-3xl border-r border-white/5 flex flex-col shadow-2xl relative overflow-hidden z-50 transition-all duration-500">
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
                        onClick={() => { setDashboardView('STRATEGIC'); setView('dashboard'); setSidebarOpen(false); }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardView === 'STRATEGIC' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                        <div className="flex items-center gap-3">
                            <TrendingUp size={14} /> Strategic Audit
                        </div>
                        {dashboardView === 'STRATEGIC' && <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
                    </button>
                    <button
                        onClick={() => { setDashboardView('MISSIONS'); setView('dashboard'); setSidebarOpen(false); }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardView === 'MISSIONS' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                        <div className="flex items-center gap-3">
                            <ClipboardList size={14} /> Mission Board
                        </div>
                        {dashboardView === 'MISSIONS' && <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
                    </button>
                    <button
                        onClick={() => { setDashboardView('ARCHIVE'); setView('dashboard'); setSidebarOpen(false); }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardView === 'ARCHIVE' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Search size={14} /> Audit Explorer
                        </div>
                        {dashboardView === 'ARCHIVE' && <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
                    </button>
                    {user.role === 'SUPER_ADMIN' && (
                        <button
                            onClick={() => { setDashboardView('ADMIN'); setView('dashboard'); setSidebarOpen(false); }}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardView === 'ADMIN' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'text-zinc-500 hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Cpu size={14} /> Urban Optimization
                            </div>
                            {dashboardView === 'ADMIN' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                        </button>
                    )}
                    {user.role === 'SUPER_ADMIN' && (
                        <button
                            onClick={() => { setDashboardView('USERS'); setView('dashboard'); setSidebarOpen(false); }}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dashboardView === 'USERS' ? 'bg-purple-500/20 text-purple-500 border border-purple-500/30' : 'text-zinc-500 hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Users size={14} /> User Management
                            </div>
                            {dashboardView === 'USERS' && <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />}
                        </button>
                    )}
                    <button
                        onClick={() => { setDashboardView('BROADCAST'); setView('dashboard'); setSidebarOpen(false); }}
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
                        onClick={() => { setView('guidance'); setSidebarOpen(false); }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'guidance' ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                        <Terminal size={14} /> Command Override
                    </button>
                    <button
                        onClick={() => { setView('manage'); setSidebarOpen(false); }}
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
                        {selectedIncident ? (
                            <div className="p-4 bg-zinc-950/60 border border-white/10 rounded-[2rem] space-y-4 backdrop-blur-md animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                                {selectedIncident.id}
                                            </span>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${selectedIncident.status === 'RESOLVED' || selectedIncident.status === 'CONFIRMED'
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : selectedIncident.status === 'RETRACTED'
                                                        ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                                                        : 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'
                                                }`}>
                                                {selectedIncident.status || 'ACTIVE'}
                                            </span>
                                        </div>
                                        <h4 className="text-[12px] font-black text-white uppercase tracking-tight flex items-center gap-1.5 mt-1">
                                            <MapPin size={10} className="text-zinc-500" /> {selectedIncident.location?.landmark || 'Karachi Sector'}
                                        </h4>
                                    </div>
                                    <button
                                        onClick={() => setSelectedIncident(null)}
                                        className="text-zinc-500 hover:text-white text-[9px] bg-white/5 w-5 h-5 rounded-full flex items-center justify-center border border-white/5"
                                        title="Close details"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Human-in-the-loop Verdict Banners */}
                                {selectedIncident.status === 'RETRACTED' && (
                                    <div className="p-3 bg-zinc-500/10 border border-zinc-500/20 rounded-2xl space-y-1">
                                        <span className="text-[7px] text-zinc-400 uppercase font-black tracking-widest block">Command Retraction Alert</span>
                                        <p className="text-[10px] text-zinc-300 font-bold leading-snug">
                                            Alert retracted and units recalled. Reason:
                                        </p>
                                        <p className="text-[9px] text-zinc-400 font-mono italic leading-relaxed">
                                            "{selectedIncident.data?.retraction_reason || 'False Alarm / Sensor Mismatch'}"
                                        </p>
                                    </div>
                                )}

                                {selectedIncident.status === 'CONFIRMED' && (
                                    <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl space-y-1">
                                        <span className="text-[7px] text-orange-400 uppercase font-black tracking-widest block">Ground-Truth Verified</span>
                                        <p className="text-[10px] text-orange-200 font-bold leading-snug">
                                            Crisis confirmed live by field officer. Note:
                                        </p>
                                        <p className="text-[9px] text-orange-300 font-mono italic leading-relaxed">
                                            "{selectedIncident.data?.officer_note || 'Crisis confirmed live. Deploying assets.'}"
                                        </p>
                                    </div>
                                )}

                                {selectedIncident.status === 'INVESTIGATING' && (
                                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-1 animate-pulse">
                                        <span className="text-[7px] text-blue-400 uppercase font-black tracking-widest block">Field Quest Active</span>
                                        <p className="text-[10px] text-blue-200 font-bold leading-snug">
                                            First responder is currently en route to investigate ground-reality.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2 text-[10px]">
                                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                                        <span className="text-[7px] text-zinc-500 uppercase font-black block mb-1">Raw Signal Description</span>
                                        <p className="text-zinc-300 italic font-medium leading-relaxed">
                                            "{selectedIncident.signal_text || 'No description provided.'}"
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-2.5 space-y-0.5">
                                            <span className="text-[7px] text-zinc-500 uppercase font-black block">Triage Priority</span>
                                            <span className="text-red-400 font-mono font-black">Level 8</span>
                                        </div>
                                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-2.5 space-y-0.5">
                                            <span className="text-[7px] text-zinc-500 uppercase font-black block">Assigned Support</span>
                                            <span className="text-zinc-300 font-bold uppercase truncate block">{selectedIncident.department?.replace('_', ' ') || 'FIRE BRIGADE'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 border-t border-white/5 pt-3">
                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Auditor Agent Controls</span>

                                    <div className="flex gap-2">
                                        <button
                                            disabled={isSaving || selectedIncident.status === 'CONFIRMED' || selectedIncident.status === 'RETRACTED'}
                                            onClick={() => handleAuditorAction('FALSE_ALARM')}
                                            className="flex-1 py-2.5 bg-red-950/20 border border-red-500/20 hover:border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
                                        >
                                            False Alarm
                                        </button>
                                        <button
                                            disabled={isSaving || selectedIncident.status === 'CONFIRMED' || selectedIncident.status === 'RETRACTED'}
                                            onClick={() => handleAuditorAction('ROAD_CLEAR')}
                                            className="flex-1 py-2.5 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
                                        >
                                            Road Clear
                                        </button>
                                    </div>

                                    <button
                                        disabled={isSaving || selectedIncident.status === 'CONFIRMED' || selectedIncident.status === 'RETRACTED'}
                                        onClick={() => handleAuditorAction('CONFIRM')}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-1.5 disabled:opacity-40"
                                    >
                                        Confirm Crisis
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
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
                                        await fetch('http://127.0.0.1:3001/api/agent-directive', {
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
                            <button onClick={addHub} className="p-1 hover:bg-zinc-800 rounded text-blue-500"><Plus size={16} /></button>
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

            {/* Profile & Switcher Section */}
            <div className="p-4 bg-transparent border-t border-white/5 space-y-4">
                <div className="flex flex-col gap-1.5">
                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Active Agency</span>
                    <select
                        disabled={user.role === 'DEPT_ADMIN'}
                        value={activeDept}
                        onChange={(e) => setDept(e.target.value)}
                        className="w-full bg-zinc-950/80 border border-white/5 text-[9px] text-zinc-400 font-bold p-2.5 rounded-xl outline-none uppercase tracking-tighter disabled:opacity-50 transition-all hover:bg-zinc-950"
                    >
                        {Object.keys(departments).map(id => (
                            <option key={id} value={id}>{departments[id].name}</option>
                        ))}
                    </select>
                </div>

                {/* Profile Details & Sign Out */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <User size={14} />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-black rounded-full animate-pulse" />
                        </div>
                        <div className="min-w-0">
                            <h5 className="text-[10px] font-bold text-white leading-none mb-1 truncate">{user.name}</h5>
                            <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-wider block">{user.role}</span>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="p-2.5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/20 shrink-0"
                        title="Sign Out of Sovereign Command"
                    >
                        <LogOut size={12} />
                    </button>
                </div>
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

const EditField = ({ label, value, onChange, type = "text" }) => (
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
