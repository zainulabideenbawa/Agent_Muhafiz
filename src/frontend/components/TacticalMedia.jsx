import React from 'react';
import { Camera, ShieldCheck, User, Clock, Image as ImageIcon } from 'lucide-react';

const TacticalMedia = ({ activeIncident }) => {
    if (!activeIncident) return (
        <div className="mt-4 p-6 bg-zinc-900/30 border border-zinc-800 rounded-xl flex flex-col items-center justify-center opacity-30">
            <ImageIcon size={32} className="mb-2" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-center">No Evidence Submitted</p>
        </div>
    );

    const isFire = activeIncident.logs.some(l => l.message.toLowerCase().includes('fire'));
    
    const evidence = [
        {
            url: isFire 
                ? "https://images.unsplash.com/photo-1516528387618-afa90b13e000?auto=format&fit=crop&w=400&q=80" 
                : "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=400&q=80",
            author: "@citizen_report_42",
            type: "Citizen Submission",
            status: "AI_VERIFIED"
        },
        {
            url: "https://images.unsplash.com/photo-1579389083395-4507e9f45e77?auto=format&fit=crop&w=400&q=80",
            author: "Officer_Zain (Field)",
            type: "Staff Verification",
            status: "OFFICIAL"
        }
    ];

    return (
        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                    <Camera size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-100">Evidence Gallery</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{evidence.length} Attachments</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {evidence.map((item, idx) => (
                    <div key={idx} className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 aspect-square">
                        <img 
                            src={item.url} 
                            alt="Evidence" 
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                        />
                        
                        {/* Overlay Metadata */}
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <User size={8} className="text-zinc-500" />
                                    <span className="text-[7px] text-zinc-300 font-medium truncate max-w-[60px]">{item.author}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock size={8} className="text-zinc-500" />
                                    <span className="text-[7px] text-zinc-500 font-mono">2m ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TacticalMedia;
