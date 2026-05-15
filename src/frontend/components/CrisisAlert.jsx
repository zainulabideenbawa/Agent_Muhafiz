import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const CrisisAlert = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-zinc-950 border-2 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] max-w-lg w-full rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-emerald-500 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3 text-black font-bold uppercase tracking-widest text-sm">
                        <AlertCircle size={20} /> Sovereign Citizen Alert
                    </div>
                    <button onClick={onClose} className="hover:rotate-90 transition-transform text-black">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <span className="text-emerald-500 text-[10px] font-mono uppercase tracking-[0.2em] font-bold">Urdu Transmission // اردو</span>
                        <p className="text-2xl font-bold leading-relaxed text-zinc-100 text-right" dir="rtl">
                            {message.public_alert_urdu}
                        </p>
                    </div>

                    <div className="h-px bg-zinc-800" />

                    <div className="space-y-2">
                        <span className="text-emerald-500 text-[10px] font-mono uppercase tracking-[0.2em] font-bold">English Transmission</span>
                        <p className="text-lg leading-relaxed text-zinc-300">
                            {message.public_alert_english}
                        </p>
                    </div>

                    <div className="pt-4">
                        <button 
                            onClick={onClose}
                            className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black font-bold uppercase tracking-widest text-xs transition-all border border-emerald-500/50 rounded-xl"
                        >
                            Acknowledge & Sync Device
                        </button>
                    </div>
                </div>
                
                <div className="bg-zinc-900 px-8 py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex justify-between">
                    <span>Source: Muhafiz-X Core</span>
                    <span>Ref: PK-KHI-G20</span>
                </div>
            </div>
        </div>
    );
};

export default CrisisAlert;
