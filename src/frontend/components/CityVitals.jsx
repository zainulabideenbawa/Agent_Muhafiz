import React, { useState, useEffect } from 'react';
import { Wind, Thermometer, Droplets, Activity } from 'lucide-react';

const CityVitals = () => {
    const [vitals, setVitals] = useState(null);

    useEffect(() => {
        const fetchVitals = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/city-vitals');
                const data = await res.json();
                setVitals(data);
            } catch (e) { console.error(e); }
        };
        fetchVitals();
        const interval = setInterval(fetchVitals, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!vitals) return null;

    const VitalItem = ({ icon: Icon, label, value, unit, color }) => (
        <div className="flex items-center gap-3 px-4 py-2 bg-black/40 border border-white/5 rounded-xl backdrop-blur-md">
            <div className={`p-1.5 rounded-lg bg-${color}-500/10 text-${color}-500`}>
                <Icon size={14} />
            </div>
            <div className="flex flex-col">
                <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
                <div className="flex items-baseline gap-0.5">
                    <span className="text-white text-xs font-black font-mono">{value}</span>
                    <span className="text-[8px] text-zinc-400 font-bold uppercase">{unit}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex gap-4 pointer-events-auto">
            <VitalItem icon={Activity} label="City AQI" value={vitals.avg_aqi} unit="Index" color="emerald" />
            <VitalItem icon={Thermometer} label="Avg Temp" value={vitals.avg_temp} unit="°C" color="orange" />
            <VitalItem icon={Droplets} label="Humidity" value={vitals.avg_humidity} unit="%" color="blue" />
            
            <div className="flex items-center gap-3 px-4 py-2 bg-black/40 border border-white/5 rounded-xl backdrop-blur-md">
                <div className="flex flex-col text-right">
                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Sovereign Grid</span>
                    <span className="text-emerald-500 text-[10px] font-black font-mono">{vitals.active_nodes}/{vitals.total_nodes} ONLINE</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
        </div>
    );
};

export default CityVitals;
