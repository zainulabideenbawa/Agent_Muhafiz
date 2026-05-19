import React from 'react';
import { AlertCircle, X, Shield, Globe, Copy, Check, Terminal, Cpu, Users, Eye, Zap } from 'lucide-react';

const CrisisAlert = ({ message, onClose }) => {
    const [copied, setCopied] = React.useState(false);
    if (!message) return null;

    const copyDraft = () => {
        const fullText = `${message.whatsapp_draft?.en || ''}\n\n${message.whatsapp_draft?.ur || ''}`;
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Calculate a mock confidence percentage from the mayor_brief text
    const confidenceMatch = message.mayor_brief?.match(/(\d+)%/);
    const confidenceScore = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 62;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 overflow-y-auto animate-in fade-in duration-300">
            {/* Background cybernetics grid / atmosphere */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[150px] rounded-full" />
            </div>

            <div className="relative bg-[#070709] border border-amber-500/20 shadow-[0_0_100px_rgba(245,158,11,0.12)] max-w-5xl w-full rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300 z-10">
                {/* Micro tech accent lines */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80" />
                <div className="absolute top-0 left-12 w-32 h-[1px] bg-amber-500/50" />
                <div className="absolute bottom-0 right-12 w-32 h-[1px] bg-amber-500/30" />

                {/* Left Side: Geospatial & AI Truth-Engine Analytics */}
                <div className="w-full md:w-5/12 p-8 border-r border-white/5 bg-zinc-950/40 flex flex-col justify-between">
                    <div>
                        {/* Header Status */}
                        <div className="flex items-center gap-2 mb-6 text-amber-500 font-mono text-[8px] font-black uppercase tracking-[0.25em] bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 rounded-full w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Command Audit Required
                        </div>

                        <div className="flex items-center gap-3.5 mb-8">
                            <div className="p-3 bg-gradient-to-br from-amber-600/20 to-amber-700/5 border border-amber-500/25 rounded-2xl">
                                <Cpu size={22} className="text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-black uppercase text-xs tracking-wider">Truth-Engine Audit</h3>
                                <p className="text-zinc-500 font-mono text-[8px] uppercase tracking-widest mt-0.5">Confidence Threshold Mismatch</p>
                            </div>
                        </div>

                        {/* Circular AI Meter */}
                        <div className="mb-8 p-6 bg-white/[0.01] border border-white/5 rounded-3xl flex items-center gap-6 shadow-inner">
                            <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="40" cy="40" r="34" className="stroke-zinc-800" strokeWidth="6" fill="transparent" />
                                    <circle 
                                        cx="40" cy="40" r="34" 
                                        className="stroke-amber-500 transition-all duration-1000" 
                                        strokeWidth="6" 
                                        fill="transparent" 
                                        strokeDasharray="213.6"
                                        strokeDashoffset={213.6 - (213.6 * confidenceScore) / 100}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <span className="absolute text-sm font-black text-amber-400 font-mono">{confidenceScore}%</span>
                            </div>
                            <div>
                                <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest block">AI Trust Rating</span>
                                <h4 className="text-white font-black uppercase text-[11px] mt-0.5">Unverified Threat Signal</h4>
                                <p className="text-zinc-400 text-[9px] leading-relaxed mt-1 font-mono">Discrepancy detected between local multisensory nodes and social feeds.</p>
                            </div>
                        </div>

                        {/* Cognitive Discrepancy Logger */}
                        <div className="space-y-4">
                            <div className="p-4 bg-zinc-950/80 rounded-2xl border border-white/5 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Terminal size={10} className="text-zinc-500" />
                                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">OSINT Discordant Context</span>
                                </div>
                                <p className="text-zinc-300 text-[10px] italic leading-relaxed">
                                    "{message.mayor_brief || 'Discrepancy alert: heat signatures within expected range but localized reports indicate fire eruption near sector.'}"
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between opacity-50">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">LEVEL_5_HITL_VERIFY</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">SYSTEM: OK</span>
                    </div>
                </div>

                {/* Right Side: Command Directives & Broadcast Actions */}
                <div className="flex-1 p-8 bg-zinc-950/20 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                    <Globe size={16} className="text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black uppercase text-[10px] tracking-widest">Executive Directives</h3>
                                    <p className="text-blue-400 font-mono text-[8px] uppercase tracking-widest">Situational Broadcast Draft</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-2 hover:bg-white/5 text-zinc-500 hover:text-white rounded-full transition-all border border-transparent hover:border-white/5"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Broadcast previews */}
                        <div className="space-y-4">
                            {/* Citizen App Push Preview */}
                            <div className="p-5 bg-gradient-to-b from-white/[0.02] to-transparent rounded-3xl border border-white/5 relative shadow-xl">
                                <div className="absolute top-2.5 left-4 flex gap-1 items-center">
                                    <Globe size={8} className="text-blue-500" />
                                    <span className="text-[6px] font-mono text-zinc-600 uppercase tracking-widest font-black">Citizen Push Notification</span>
                                </div>
                                <div className="mt-3 space-y-2">
                                    <p className="text-zinc-100 text-xs font-bold leading-relaxed">"{message.push_notification?.en || 'Tactical Alert: Incident under verification by command authorities.'}"</p>
                                    {message.push_notification?.ur && (
                                        <p className="text-zinc-400 text-sm font-medium text-right dir-rtl leading-relaxed" style={{ fontFamily: 'Noto Naskh Arabic, serif' }}>
                                            {message.push_notification.ur}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* WhatsApp Official Draft */}
                            <div className="bg-[#0b141a] rounded-3xl border border-[#075e54]/30 overflow-hidden shadow-2xl">
                                <div className="bg-[#111b21] px-5 py-3.5 flex items-center justify-between border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-black font-black text-xs shadow-md">M</div>
                                        <div>
                                            <span className="text-[10px] font-bold text-white block">Muhafiz-X Alerts (Official)</span>
                                            <span className="text-[8px] text-emerald-500 font-medium">Zero-Cost Channel Broadcast</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                </div>
                                <div className="p-5 max-h-[160px] overflow-y-auto custom-scrollbar bg-[#0b141a]/95">
                                    <div className="bg-[#202c33] p-4 rounded-2xl rounded-tl-none border border-white/5 shadow-md space-y-2">
                                        <p className="text-zinc-100 text-[11px] leading-relaxed whitespace-pre-wrap">{message.whatsapp_draft?.en || 'Quest under investigation by Field Units. Further alerts to follow.'}</p>
                                        {message.whatsapp_draft?.ur && (
                                            <p className="text-zinc-100 text-base leading-relaxed text-right dir-rtl" style={{ fontFamily: 'Noto Naskh Arabic, serif' }}>
                                                {message.whatsapp_draft.ur}
                                            </p>
                                        )}
                                        <div className="flex justify-end pt-1">
                                            <span className="text-[8px] text-zinc-500 font-mono">AUTHORIZED ALERT</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={copyDraft}
                            className="flex-1 py-4 bg-zinc-900/60 border border-white/5 hover:border-white/10 hover:bg-zinc-900 text-zinc-300 font-black uppercase tracking-widest text-[9px] rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            {copied ? "Copied" : "Copy WhatsApp Draft"}
                        </button>
                        <button 
                            onClick={onClose}
                            className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-[9px] rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.2)] hover:shadow-[0_0_45px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 border border-amber-600/30"
                        >
                            <Shield size={12} className="text-black" />
                            Acknowledge & Sync Quest
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrisisAlert;
