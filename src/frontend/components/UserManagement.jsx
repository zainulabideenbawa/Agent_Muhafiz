import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Lock, MapPin, Mail, ChevronRight } from 'lucide-react';

const UserManagement = () => {
    const [activeTab, setActiveTab] = useState('OFFICERS');
    const [officers, setOfficers] = useState([]);
    const [citizens, setCitizens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateOfficer, setShowCreateOfficer] = useState(false);

    // Form State
    const [newOfficer, setNewOfficer] = useState({
        name: '',
        email: '',
        password: '',
        cnic: '',
        rank: '',
        department: 'POLICE_FORCE'
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'OFFICERS' ? '/api/admin/officers' : '/api/admin/citizens';
            const res = await fetch(`http://127.0.0.1:3001${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('muhafiz_user') ? JSON.parse(localStorage.getItem('muhafiz_user')).token : ''}`
                }
            });
            const data = await res.json();
            if (data.success) {
                if (activeTab === 'OFFICERS') setOfficers(data.data);
                else setCitizens(data.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOfficer = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://127.0.0.1:3001/api/admin/officers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('muhafiz_user') ? JSON.parse(localStorage.getItem('muhafiz_user')).token : ''}`
                },
                body: JSON.stringify(newOfficer)
            });
            const data = await res.json();
            if (data.success) {
                setOfficers([data.data, ...officers]);
                setShowCreateOfficer(false);
                setNewOfficer({ name: '', email: '', password: '', cnic: '', rank: '', department: 'POLICE_FORCE' });
            } else {
                alert(data.message || 'Failed to create officer');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Users className="text-purple-500" /> Identity Management
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mt-1">Sovereign Directory Access</p>
                </div>
                <div className="flex bg-black/40 border border-white/5 p-1 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('OFFICERS')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'OFFICERS' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Command Officers
                    </button>
                    <button
                        onClick={() => setActiveTab('CITIZENS')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CITIZENS' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Registered Citizens
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2rem] backdrop-blur-md overflow-hidden flex flex-col">
                {activeTab === 'OFFICERS' && (
                    <div className="p-4 border-b border-white/5 flex justify-end bg-black/20">
                        <button
                            onClick={() => setShowCreateOfficer(!showCreateOfficer)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                        >
                            <Plus size={14} /> Provision Officer
                        </button>
                    </div>
                )}

                {showCreateOfficer && activeTab === 'OFFICERS' && (
                    <form onSubmit={handleCreateOfficer} className="p-6 bg-zinc-900 border-b border-white/5 grid grid-cols-2 gap-4 animate-in slide-in-from-top-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase">Full Name</label>
                            <input required value={newOfficer.name} onChange={e => setNewOfficer({...newOfficer, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500" placeholder="Officer Name" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase">Command Email</label>
                            <input required type="email" value={newOfficer.email} onChange={e => setNewOfficer({...newOfficer, email: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500" placeholder="officer@muhafiz.gov" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase">Access Password</label>
                            <input required type="password" value={newOfficer.password} onChange={e => setNewOfficer({...newOfficer, password: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500" placeholder="••••••••" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase">CNIC</label>
                            <input value={newOfficer.cnic} onChange={e => setNewOfficer({...newOfficer, cnic: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500" placeholder="42101-1234567-1" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase">Rank</label>
                            <input value={newOfficer.rank} onChange={e => setNewOfficer({...newOfficer, rank: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500" placeholder="Field Commander" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase">Department</label>
                            <select value={newOfficer.department} onChange={e => setNewOfficer({...newOfficer, department: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500">
                                <option value="POLICE_FORCE">Sindh Police</option>
                                <option value="KMC_HEALTH">KMC Health</option>
                                <option value="FIRE_BRIGADE">Fire Brigade</option>
                                <option value="RESCUE_1122">Rescue 1122</option>
                                <option value="SOVEREIGN">Sovereign Command</option>
                            </select>
                        </div>
                        <div className="col-span-2 mt-2">
                            <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500">
                                Save Identity <ChevronRight size={14} />
                            </button>
                        </div>
                    </form>
                )}

                <div className="flex-1 overflow-auto custom-scrollbar p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : activeTab === 'OFFICERS' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="pb-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">ID</th>
                                    <th className="pb-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Identity</th>
                                    <th className="pb-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">CNIC (Masked)</th>
                                    <th className="pb-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Role / Dept</th>
                                </tr>
                            </thead>
                            <tbody>
                                {officers.map(o => (
                                    <tr key={o.commander_id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="py-4 text-[10px] font-mono text-zinc-400">{o.commander_id}</td>
                                        <td className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-white">{o.name}</span>
                                                <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Mail size={10} /> {o.email}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-xs font-mono text-emerald-400">{o.cnic || 'N/A'}</td>
                                        <td className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-white">{o.rank}</span>
                                                <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-500/10 inline-block px-2 py-0.5 rounded w-max mt-1">{o.department}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="pb-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">ID</th>
                                    <th className="pb-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Name</th>
                                    <th className="pb-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">CNIC (Masked)</th>
                                    <th className="pb-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Sector</th>
                                </tr>
                            </thead>
                            <tbody>
                                {citizens.map(c => (
                                    <tr key={c.nic_number} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="py-4 text-[10px] font-mono text-zinc-400">CIT-{c.id}</td>
                                        <td className="py-4 text-xs font-bold text-white">{c.name}</td>
                                        <td className="py-4 text-xs font-mono text-emerald-400">{c.nic_number}</td>
                                        <td className="py-4 text-[10px] font-black uppercase text-blue-400 flex items-center gap-1"><MapPin size={10} /> {c.sector}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
