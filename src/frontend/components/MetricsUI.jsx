import React from 'react';
import { Shield, Activity, Users, Truck, Heart, Menu } from 'lucide-react';

const MetricsUI = ({ activeCrises, deptStats, livesSaved, toggleSidebar, activeDept, departments }) => {
    const currentDept = departments[activeDept] || { name: 'Unknown Unit', color: 'text-zinc-500' };
    const [vitals, setVitals] = React.useState(null);

    React.useEffect(() => {
        const fetchVitals = async () => {
            try {
                const res = await fetch('http://127.0.0.1:3001/api/city-vitals');
                const data = await res.json();
                setVitals(data);
            } catch (e) { console.error(e); }
        };
        fetchVitals();
        const interval = setInterval(fetchVitals, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-14 bg-[#09090b]/80 border-b border-white/5 backdrop-blur-3xl flex items-center px-6 justify-between z-[100] relative">
            {/* Left: Branding */}
            <div className="flex items-center gap-6 w-[300px]">
                <button 
                    onClick={toggleSidebar}
                    className="p-1.5 hover:bg-white/5 rounded text-zinc-500 transition-colors"
                >
                    <Menu size={16} />
                </button>
                <div className="flex items-center gap-3">
                    <Shield className="text-emerald-500" size={14} />
                    <div className="flex flex-col">
                        <h1 className="text-[10px] font-black tracking-[0.2em] text-white uppercase leading-none mb-0.5">Muhafiz-X</h1>
                        <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest leading-none">OS.SOVEREIGN.v1</span>
                    </div>
                </div>
            </div>

            {/* Center: City Vitals HUD (Integrated) */}
            <div className="flex-1 flex justify-center gap-8 border-x border-white/5 h-full items-center">
                {vitals ? (
                    <>
                        <HeaderVital label="AQI" value={vitals.avg_aqi} color="emerald" />
                        <HeaderVital label="TEMP" value={`${vitals.avg_temp}°`} color="orange" />
                        <HeaderVital label="HUMID" value={`${vitals.avg_humidity}%`} color="blue" />
                        <div className="h-4 w-px bg-white/5 mx-2" />
                        <div className="flex items-center gap-2">
                            <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">GRID</span>
                            <span className="text-[9px] font-mono font-black text-emerald-500">{vitals.active_nodes}/{vitals.total_nodes}</span>
                        </div>
                    </>
                ) : (
                    <span className="text-[8px] font-mono text-zinc-700 animate-pulse tracking-widest uppercase">Syncing City Pulse...</span>
                )}
            </div>

            {/* Right: Operational Metrics */}
            <div className="flex items-center gap-8 w-[300px] justify-end">
                <HeaderMetric label="CRISES" value={activeCrises} color="red" />
                <HeaderMetric label="SAVED" value={livesSaved} color="emerald" />
                <div className="flex items-center gap-3 pl-6 border-l border-white/5 h-6">
                    <div className={`w-1 h-3 rounded-full ${currentDept.color.replace('text-', 'bg-')}`} />
                    <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${currentDept.color}`}>
                        {currentDept.name.split(' ')[0]}
                    </span>
                </div>
            </div>
        </div>
    );
};

const HeaderVital = ({ label, value, color }) => {
    const textColors = {
        emerald: 'text-emerald-500/90',
        orange: 'text-orange-500/90',
        blue: 'text-blue-500/90',
        red: 'text-red-500/90'
    };
    return (
        <div className="flex items-baseline gap-2">
            <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
            <span className={`text-[11px] font-mono font-black ${textColors[color] || 'text-zinc-400'} tracking-tighter`}>{value}</span>
        </div>
    );
};

const HeaderMetric = ({ label, value, color }) => (
    <div className="flex flex-col items-end">
        <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">{label}</span>
        <span className="text-xs font-mono font-black text-white">{value}</span>
    </div>
);

const MetricItem = ({ icon, label, value, subValue }) => (
    <div className="flex items-center gap-3">
        <div className="p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
            {icon}
        </div>
        <div>
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-zinc-100 leading-none">{value}</span>
                <span className="text-[8px] font-mono text-zinc-600 uppercase whitespace-nowrap">{subValue}</span>
            </div>
        </div>
    </div>
);

export default MetricsUI;
