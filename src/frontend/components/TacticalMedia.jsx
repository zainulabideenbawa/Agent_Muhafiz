import React, { useState } from 'react';
import { Camera, ShieldCheck, User, Clock, Image as ImageIcon } from 'lucide-react';

const TacticalMedia = ({ activeIncident }) => {
    const [selectedImage, setSelectedImage] = useState(null);

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
                ? "https://images.unsplash.com/photo-1516528387618-afa90b13e000?auto=format&fit=crop&w=800&q=80" 
                : "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80",
            author: "@citizen_report_42",
            type: "Citizen Submission",
            status: "AI_VERIFIED"
        },
        {
            url: "https://images.unsplash.com/photo-1579389083395-4507e9f45e77?auto=format&fit=crop&w=800&q=80",
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
                    <div 
                        key={idx} 
                        onClick={() => setSelectedImage(item)}
                        className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 aspect-square cursor-zoom-in transition-all duration-350 hover:border-blue-500/50"
                    >
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

            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-8 cursor-pointer animate-in fade-in duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    <div 
                        className="relative max-w-2xl w-full bg-zinc-950 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl pointer-events-auto animate-in zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <img src={selectedImage.url} alt="Large Evidence" className="w-full h-auto max-h-[60vh] object-cover" />
                        <div className="p-6 bg-zinc-950 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{selectedImage.type}</span>
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${
                                    selectedImage.status === 'OFFICIAL' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' : 'border-blue-500/20 text-blue-400 bg-blue-500/10'
                                }`}>{selectedImage.status}</span>
                            </div>
                            <h4 className="text-white text-xs font-black uppercase tracking-tight">Evidence Uploaded by {selectedImage.author}</h4>
                            <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">Sovereign Crisis Grid Archive // Raw Image Feed</p>
                        </div>
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white w-8 h-8 rounded-full flex items-center justify-center border border-white/10 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TacticalMedia;
