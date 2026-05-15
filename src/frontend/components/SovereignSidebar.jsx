import React from 'react';
import { Shield, Truck, Users, LayoutDashboard, Settings, User } from 'lucide-react';

const SovereignSidebar = ({ activeDept, setDept }) => {
    const departments = [
        { id: 'KMC_HEALTH', name: 'KMC Health & Infra', icon: <Shield size={18} />, color: 'text-emerald-500' },
        { id: 'POLICE_FORCE', name: 'Sindh Police Force', icon: <Shield size={18} />, color: 'text-blue-500' },
        { id: 'FIRE_BRIGADE', name: 'Karachi Fire Brigade', icon: <Truck size={18} />, color: 'text-orange-500' },
        { id: 'RESCUE_1122', name: 'Rescue 1122', icon: <Users size={18} />, color: 'text-red-500' }
    ];

    return (
        <div className="w-64 h-full bg-[#09090b] border-r border-zinc-800 flex flex-col">
            {/* Profile Section */}
            <div className="p-6 border-b border-zinc-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                        <User size={20} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Active Officer</h4>
                        <p className="text-xs font-bold text-zinc-200">Zain Bawa</p>
                    </div>
                </div>

                <nav className="space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-emerald-500 bg-emerald-500/10 rounded-lg">
                        <LayoutDashboard size={16} /> Dashboard
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
                        <Settings size={16} /> My Equipment
                    </button>
                </nav>
            </div>

            {/* Department Switcher */}
            <div className="flex-1 overflow-y-auto p-4">
                <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 px-2">Sovereign Departments</h5>
                <div className="space-y-1">
                    {departments.map((dept) => (
                        <button
                            key={dept.id}
                            onClick={() => setDept(dept.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-300 ${
                                activeDept === dept.id 
                                ? `bg-zinc-800 border-zinc-700 ${dept.color} shadow-xl scale-[1.02]` 
                                : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-900'
                            }`}
                        >
                            {dept.icon}
                            <span className="text-[10px] font-bold uppercase tracking-widest text-left leading-tight">
                                {dept.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Inventory Quick Look */}
            <div className="p-4 bg-black/40 border-t border-zinc-800">
                <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
                    <h6 className="text-[9px] font-bold text-zinc-500 uppercase mb-2">My Units (Ready)</h6>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="text-[10px] font-mono text-zinc-400">Mobiles: <span className="text-white">08</span></div>
                        <div className="text-[10px] font-mono text-zinc-400">Trucks: <span className="text-white">12</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SovereignSidebar;
