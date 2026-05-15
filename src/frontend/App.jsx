import React, { useState, useEffect } from 'react';
import { Menu, X, Shield, Globe } from 'lucide-react';
import AgentTraceTerminal from './components/AgentTraceTerminal';
import DigitalTwinMap from './components/DigitalTwinMap';
import MetricsUI from './components/MetricsUI';
import TacticalLegend from './components/TacticalLegend';
import CrisisAlert from './components/CrisisAlert';
import SovereignSidebar from './components/SovereignSidebar';

function App() {
  const [traces, setTraces] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [ws, setWs] = useState(null);
  const [latestAlert, setLatestAlert] = useState(null);
  const [activeDept, setActiveDept] = useState('KMC_HEALTH');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deptStats, setDeptStats] = useState({ officers: 0, trucks: 0, ambulances: 0 });
  
  // Dashboard state
  const [livesSaved, setLivesSaved] = useState(0);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/department-resources/${activeDept}`);
        const hubs = await res.json();
        if (Array.isArray(hubs)) {
          const totals = hubs.reduce((acc, h) => ({
            officers: acc.officers + (h.officers || 0),
            trucks: acc.trucks + (h.trucks || 0),
            ambulances: acc.ambulances + (h.ambulances || 0)
          }), { officers: 0, trucks: 0, ambulances: 0 });
          setDeptStats(totals);
        }
      } catch (e) { console.error(e); }
    };
    fetchStats();
  }, [activeDept, incidents]);

  const departments = {
    'KMC_HEALTH': { name: 'KMC Health & Infra', color: 'text-emerald-500' },
    'POLICE_FORCE': { name: 'Sindh Police Force', color: 'text-blue-500' },
    'FIRE_BRIGADE': { name: 'Karachi Fire Brigade', color: 'text-orange-500' },
    'RESCUE_1122': { name: 'Rescue 1122', color: 'text-red-500' }
  };

  const activeDeptRef = React.useRef(activeDept);
  useEffect(() => { activeDeptRef.current = activeDept; }, [activeDept]);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3001');
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'TRACE_LOG') {
        console.log(`[Tactical] Incoming Log: ${data.log.agent} for ${data.assigned_department}`);
        
        setTraces(prev => [...prev, { 
          incidentId: data.incidentId, 
          log: data.log, 
          department: data.assigned_department 
        }]);

        if (data.log.agent === 'The Sentinel' && data.log.outcome === 'Success') {
          setIncidents(prev => [...prev, {
            id: data.incidentId,
            department: data.assigned_department,
            type: data.log.message.includes('fire') ? 'fire' : 'urban_flood',
            location: { landmark: data.log.message.split('at ')[1]?.replace('.', '') || 'NIPA Chowrangi' }
          }]);
        }
        if (data.log.agent === 'The Auditor' && data.log.outcome === 'Crisis Resolved') {
          setLivesSaved(prev => prev + Math.floor(Math.random() * 50) + 20);
        }
      }
      if (data.type === 'COMMUNICATION_ALERT') setLatestAlert(data.data);
    };
    setWs(websocket);
    return () => websocket.close();
  }, []);

  // Unified Filtering Logic
  const filteredIncidents = (incidents || []).filter(inc => !inc || !inc.department || inc.department === activeDept);
  const filteredTraces = (traces || []).filter(t => {
    // System logs and The Dispatcher logs are ALWAYS visible for situational awareness
    if (!t.department || t.log.agent === 'The Dispatcher') return true;
    return t.department === activeDept;
  });
  const safeDeptStats = deptStats || { officers: 0, trucks: 0, ambulances: 0 };

  const triggerSimulation = async (type = "flood") => {
    if (isSimulating) return;
    const hotspots = ["NIPA Chowrangi", "Saddar", "Clifton", "Gulshan", "Defence"];
    const landmark = hotspots[Math.floor(Math.random() * hotspots.length)];
    const input = type === "flood" ? `${landmark} doob gaya!` : `Fire reported at ${landmark} factory!`;
    setIsSimulating(true);
    try {
      await fetch('http://localhost:3001/api/trigger-crisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });
    } catch (error) { console.error(error); } finally { setIsSimulating(false); }
  };

  return (
    <div className="flex h-screen w-full bg-[#09090b] overflow-hidden text-zinc-100 font-inter relative">
      
      {/* BASE LAYER: 3D Tactical Map */}
      <div className="absolute inset-0 z-0">
        <DigitalTwinMap incidents={filteredIncidents} />
      </div>

      {/* OVERLAY LAYER: HUD Panels */}
      <div className="absolute inset-0 z-10 pointer-events-none flex justify-between">
        
        {/* Left Side: Sovereign Sidebar HUD */}
        <div className={`h-full pointer-events-auto transition-all duration-500 ease-in-out ${sidebarOpen ? 'w-72' : 'w-0'} overflow-hidden bg-zinc-950/60 backdrop-blur-xl border-r border-white/10 shadow-[20px_0_50px_rgba(0,0,0,0.5)]`}>
          <SovereignSidebar activeDept={activeDept} setDept={setActiveDept} />
        </div>

        {/* Right Side: Tactical Feed HUD */}
        <div className="w-[320px] h-full pointer-events-auto bg-zinc-950/60 backdrop-blur-xl border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
          <AgentTraceTerminal traces={filteredTraces} />
        </div>
      </div>

      {/* TOP LAYER: Floating UI & HUD Elements */}
      <div className="absolute inset-x-0 top-0 z-30">
        <MetricsUI 
          activeCrises={filteredIncidents.length} 
          deptStats={safeDeptStats} 
          livesSaved={livesSaved}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeDept={activeDept}
          departments={departments}
        />
      </div>

      {/* Floating Tactical Elements (Relocated to bottom-left area) */}
      <div className="absolute bottom-32 left-6 z-20 transition-all duration-500" style={{ transform: sidebarOpen ? 'translateX(288px)' : 'translateX(0)' }}>
        <TacticalLegend />
      </div>
      
      <div className="absolute bottom-6 left-6 z-20 pointer-events-auto flex flex-col gap-4 transition-all duration-500" style={{ transform: sidebarOpen ? 'translateX(288px)' : 'translateX(0)' }}>
            {/* Social Intelligence Simulation */}
            <div className="flex flex-col gap-2 p-3 bg-zinc-950/60 backdrop-blur-xl border border-white/5 rounded-xl w-80 shadow-2xl animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Globe size={12} className="text-blue-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-100">OSINT Listener Simulation</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <div className="flex gap-2">
                <input 
                  id="social_input"
                  type="text" 
                  placeholder="Simulate tweet: @MayorOfKarachi help..." 
                  className="flex-1 bg-black/40 border border-zinc-800 rounded px-2 py-1.5 text-[10px] text-zinc-300 outline-none focus:border-blue-500/50 transition-all font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      triggerSimulation('social', e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('social_input');
                    triggerSimulation('social', input.value);
                    input.value = '';
                  }}
                  className="px-2 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded text-blue-500 text-[8px] font-black uppercase transition-all"
                >
                  Listen
                </button>
              </div>
            </div>

            {/* Manual Ingest Buttons */}
            <div className="flex gap-4">
              <button onClick={() => triggerSimulation("flood")} disabled={isSimulating} className="px-4 py-2 font-black rounded-lg border font-mono text-[9px] tracking-widest uppercase backdrop-blur-md bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-black transition-all">
                SIGNAL_INGEST(FLOOD)
              </button>
              <button onClick={() => triggerSimulation("fire")} disabled={isSimulating} className="px-4 py-2 font-black rounded-lg border font-mono text-[9px] tracking-widest uppercase backdrop-blur-md bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500 hover:text-black transition-all">
                SIGNAL_INGEST(FIRE)
              </button>
            </div>
          </div>

      <CrisisAlert message={latestAlert} onClose={() => setLatestAlert(null)} />
    </div>
  );
}

export default App;


