import React, { useState, useEffect } from 'react';
import { Megaphone, Users, Send, CheckCircle, AlertTriangle, MapPin } from 'lucide-react';

const PublicBroadcast = () => {
    const [message, setMessage] = useState('');
    const [targetSector, setTargetSector] = useState('ALL_CITY');
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [history, setHistory] = useState([
        { id: 1, text: "SEVERE WEATHER ALERT: Flash flood warning for Gulshan and Surrounding areas.", sector: "GULSHAN", reach: "1.2M", ack: "88%", time: "2H AGO" },
        { id: 2, text: "AQI ADVISORY: Air quality index has reached hazardous levels (300+).", sector: "CITY_WIDE", reach: "14M", ack: "65%", time: "5H AGO" }
    ]);

    const sectors = [
        { id: 'ALL_CITY', name: 'Karachi Metropolitan' },
        { id: 'GULSHAN', name: 'Gulshan-e-Iqbal' },
        { id: 'SADDAR', name: 'Saddar Central' },
        { id: 'CLIFTON', name: 'Clifton / DHA' },
        { id: 'ORANGI', name: 'Orangi Hub' }
    ];

    const handleBroadcast = () => {
        if (!message) return;
        setIsBroadcasting(true);
        
        setTimeout(() => {
            const newAlert = {
                id: Date.now(),
                text: message,
                sector: targetSector,
                reach: targetSector === 'ALL_CITY' ? '15M+' : '1.5M',
                ack: '0%',
                time: 'JUST NOW'
            };
            setHistory([newAlert, ...history]);
            setMessage('');
            setIsBroadcasting(false);
        }, 2000);
    };

    return (
        <div className="h-full w-full px-20 pb-32 space-y-12 animate-in fade-in duration-1000">
            {/* 1. BROADCAST HEADER */}
            <div className="pt-24 flex justify-between items-end border-b border-white/5 pb-10">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-1 h-8 bg-blue-500" />
                        <h2 className="text-white font-black text-4xl uppercase tracking-[-0.05em]">Emergency Broadcast Center</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em]">Public Alert Gateway</span>
                        <div className="h-px w-8 bg-white/10" />
                        <span className="text-emerald-500 font-mono text-[10px] uppercase tracking-[0.2em]">Ready for Transmission</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-8">
                {/* 2. BROADCAST COMPOSER */}
                <div className="col-span-3 space-y-6">
                    <div className="p-10 bg-[#09090b] border border-white/5 rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-8">
                            <Megaphone className="text-blue-500" size={18} />
                            <h3 className="text-zinc-100 text-xs font-black uppercase tracking-widest">Signal Composer</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-3 ml-2">Broadcast Message</label>
                                <textarea 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Draft emergency directive here..."
                                    className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-6 text-sm text-zinc-300 outline-none focus:border-blue-500/30 transition-all placeholder:text-zinc-800"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-3 ml-2">Target Sector</label>
                                    <select 
                                        value={targetSector}
                                        onChange={(e) => setTargetSector(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[10px] text-zinc-400 font-black uppercase outline-none focus:border-blue-500/30"
                                    >
                                        {sectors.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        onClick={handleBroadcast}
                                        disabled={isBroadcasting || !message}
                                        className={`w-full py-3 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${isBroadcasting ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20'}`}
                                    >
                                        {isBroadcasting ? 'TRANSMITTING...' : <><Send size={14} /> Send Broadcast</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* LIVE REACH MONITOR (Animated) */}
                    {isBroadcasting && (
                        <div className="p-8 bg-blue-600/10 border border-blue-500/20 rounded-[2rem] animate-pulse">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Live Transmission Progress</span>
                                <span className="text-blue-500 font-mono text-xs font-black">ACTIVE</span>
                            </div>
                            <div className="h-2 w-full bg-blue-900/30 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-2/3 animate-progress" />
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. BROADCAST LOGS */}
                <div className="col-span-2 space-y-6">
                    <div className="p-10 bg-[#09090b] border border-white/5 rounded-[3rem] shadow-2xl h-full overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="text-emerald-500" size={16} />
                                <h3 className="text-zinc-100 text-xs font-black uppercase tracking-widest">Recent Alerts</h3>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                            {history.map(item => (
                                <div key={item.id} className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[8px] font-black font-mono text-zinc-600 uppercase">{item.time} // {item.sector}</span>
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[7px] text-zinc-700 font-black uppercase">Reach</span>
                                                <span className="text-[10px] text-zinc-300 font-mono">{item.reach}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[7px] text-zinc-700 font-black uppercase">Ack</span>
                                                <span className="text-[10px] text-emerald-500 font-mono">{item.ack}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                                        {item.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicBroadcast;
