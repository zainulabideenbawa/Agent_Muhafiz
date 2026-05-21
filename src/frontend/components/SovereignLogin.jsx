import React, { useState } from 'react';
import { Shield, Fingerprint, Lock, ChevronRight, Cpu, User } from 'lucide-react';
import { setToken } from '../utils/auth';
import { API_BASE } from '../utils/config.js';

const SovereignLogin = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const res = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.success) {
                if (data.token) {
                    setToken(data.token);
                }
                onLogin(data.user);
            } else {
                setError(data.message || 'Authentication Failed');
            }
        } catch (e) {
            setError('System Offline: Connection Refused');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-[#020203] flex items-center justify-center overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full" />
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 w-[440px] p-12 bg-white/[0.02] border border-white/5 rounded-[3rem] backdrop-blur-3xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-700">
                <div className="p-4 bg-zinc-900/50 border border-white/10 rounded-2xl mb-8">
                    <Shield size={32} className="text-emerald-500" />
                </div>
                
                <h1 className="text-white font-black text-3xl uppercase tracking-[-0.02em] mb-2 text-center">Sovereign Gateway</h1>
                <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em] mb-12 text-center">Identity Verification Required</p>

                <div className="w-full space-y-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Command Identity (Email)</label>
                        <input 
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white text-xs outline-none focus:border-emerald-500/50 transition-all"
                            placeholder="commander@muhafiz.gov"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Access Protocol (Password)</label>
                        <input 
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white text-xs outline-none focus:border-emerald-500/50 transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                {error && <p className="mt-6 text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full mt-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3"
                >
                    {loading ? 'Verifying...' : (
                        <>
                            Commit Authentication <ChevronRight size={14} />
                        </>
                    )}
                </button>

                <p className="mt-8 text-[8px] text-zinc-600 font-mono uppercase tracking-widest">Muhafiz-X // Security Level 5</p>
            </form>

            {/* Footer Tech Info */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 opacity-30">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">RSA_4096_ENCRYPTION_ACTIVE</span>
                <div className="w-1 h-1 bg-zinc-700 rounded-full" />
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">KARACHI_GRID_SECURED</span>
            </div>
        </div>
    );
};

export default SovereignLogin;
