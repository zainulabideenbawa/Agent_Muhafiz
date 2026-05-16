import React from 'react';
import { AlertCircle, X, Shield, Globe, Copy, Check } from 'lucide-react';

const CrisisAlert = ({ message, onClose }) => {
    const [copied, setCopied] = React.useState(false);
    if (!message) return null;

    const copyDraft = () => {
        const fullText = `${message.whatsapp_draft?.en}\n\n${message.whatsapp_draft?.ur}`;
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-zinc-950 border border-white/10 shadow-[0_0_80px_rgba(16,185,129,0.15)] max-w-4xl w-full rounded-3xl overflow-hidden flex flex-col md:flex-row">
                
                {/* Left Side: Citizen Ingest View (Mobile App) */}
                <div className="w-full md:w-5/12 p-8 border-r border-white/5 bg-zinc-900/30">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <Globe size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-black uppercase text-[10px] tracking-widest">Citizen App Push</h3>
                            <p className="text-blue-500 font-mono text-[8px] uppercase tracking-widest">{message.scope} Broadcast</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 shadow-2xl relative">
                            <div className="absolute top-2 left-4 flex gap-1">
                                <div className="w-1 h-1 rounded-full bg-zinc-700" />
                                <div className="w-1 h-1 rounded-full bg-zinc-700" />
                            </div>
                            <p className="text-zinc-100 text-sm font-bold leading-relaxed mb-4 mt-2">"{message.push_notification?.en}"</p>
                            <p className="text-zinc-400 text-base font-medium text-right dir-rtl" style={{ fontFamily: 'Noto Naskh Arabic, serif' }}>{message.push_notification?.ur}</p>
                        </div>

                        <div className="p-4 bg-zinc-950/50 rounded-xl border border-dashed border-white/10">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Executive Briefing</span>
                            <p className="text-zinc-500 text-[10px] italic leading-relaxed">"{message.mayor_brief}"</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Command Center View (WhatsApp Channel) */}
                <div className="flex-1 p-8 bg-zinc-950">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500 rounded-lg">
                                <Shield size={18} className="text-black" />
                            </div>
                            <div>
                                <h3 className="text-white font-black uppercase text-[10px] tracking-widest">WhatsApp Channel Draft</h3>
                                <p className="text-emerald-500 font-mono text-[8px] uppercase tracking-widest">Zero-Cost Broadcast Channel</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-500">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="bg-[#075e54]/5 rounded-2xl border border-emerald-500/20 overflow-hidden shadow-2xl">
                        <div className="bg-[#075e54]/20 p-4 flex items-center justify-between border-b border-emerald-500/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-black text-sm shadow-lg">M</div>
                                <div>
                                    <span className="text-[11px] font-bold text-white block">Muhafiz-X Alerts (Official)</span>
                                    <span className="text-[9px] text-emerald-500 font-medium">824,501 followers</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-[#0b141a]">
                            <div className="bg-[#202c33] p-4 rounded-lg rounded-tl-none border border-white/5 shadow-lg">
                                <p className="text-zinc-100 text-xs leading-relaxed mb-4 whitespace-pre-wrap">{message.whatsapp_draft?.en}</p>
                                <p className="text-zinc-100 text-lg leading-relaxed text-right dir-rtl mb-4" style={{ fontFamily: 'Noto Naskh Arabic, serif' }}>{message.whatsapp_draft?.ur}</p>
                                <div className="flex justify-end">
                                    <span className="text-[9px] text-zinc-500 font-mono">14:02 PM</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <button 
                            onClick={copyDraft}
                            className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            {copied ? "Copied to Clipboard" : "Copy WhatsApp Draft"}
                        </button>
                        <button 
                            onClick={onClose}
                            className="flex-1 py-4 bg-zinc-100 hover:bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all"
                        >
                            Acknowledge & Sync
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CrisisAlert;
