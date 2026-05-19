import React, { useState, useEffect } from 'react';
import { Menu, X, Shield, Globe } from 'lucide-react';
import AgentTraceTerminal from './components/AgentTraceTerminal';
import DigitalTwinMap from './components/DigitalTwinMap';
import MetricsUI from './components/MetricsUI';
import TacticalLegend from './components/TacticalLegend';
import CrisisAlert from './components/CrisisAlert';
import SovereignSidebar from './components/SovereignSidebar';
import CityVitals from './components/CityVitals';
import SovereignAnalytics from './components/SovereignAnalytics';
import PublicBroadcast from './components/PublicBroadcast';
import MissionDashboard from './components/MissionDashboard';
import SovereignIntelligence from './components/SovereignIntelligence';
import SovereignLogin from './components/SovereignLogin';
import CrisisExplorer from './components/CrisisExplorer';

const resolveHotspotCoordinates = (locationName) => {
  const name = (locationName || "").toLowerCase();
  if (name.includes("nipa") || name.includes("gulshan")) {
    return { lng: 67.09, lat: 24.92 };
  }
  if (name.includes("saddar")) {
    return { lng: 67.03, lat: 24.86 };
  }
  if (name.includes("clifton")) {
    return { lng: 67.04, lat: 24.81 };
  }
  if (name.includes("defence") || name.includes("dha")) {
    return { lng: 67.06, lat: 24.82 };
  }
  if (name.includes("karsaz")) {
    return { lng: 67.07, lat: 24.88 };
  }
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const offsetLng = ((hash % 100) / 1000) - 0.05;
  const offsetLat = (((hash >> 2) % 100) / 1000) - 0.05;
  return { lng: 67.05 + offsetLng, lat: 24.89 + offsetLat };
};

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('muhafiz_user')) || null; } catch { return null; }
  });
  const [traces, setTraces] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [ws, setWs] = useState(null);
  const [latestAlert, setLatestAlert] = useState(null);
  const [activeDept, setActiveDept] = useState('KMC_HEALTH');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardView, setDashboardView] = useState('TACTICAL'); // 'TACTICAL' | 'STRATEGIC'
  const [deptStats, setDeptStats] = useState({ officers: 0, trucks: 0, ambulances: 0 });
  const [sidebarView, setSidebarView] = useState('dashboard'); // 'dashboard' | 'edit'
  
  // Dashboard state
  const [livesSaved, setLivesSaved] = useState(0);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:3001/api/department-resources/${activeDept}`);
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

  useEffect(() => {
    const fetchIncidentsAndTraces = async () => {
      try {
        const res = await fetch('http://127.0.0.1:3001/api/incidents');
        const dbIncidents = await res.json();
        if (Array.isArray(dbIncidents)) {
          const mappedIncidents = dbIncidents.map(inc => {
            const landmarkName = inc.location || 'NIPA Chowrangi';
            const coords = resolveHotspotCoordinates(landmarkName);
            return {
              id: inc.incident_id,
              department: inc.type === 'FIRE' ? 'FIRE_BRIGADE' : 'KMC_HEALTH',
              type: inc.type?.toLowerCase() || 'urban_flood',
              location: { 
                landmark: landmarkName,
                lng: coords.lng,
                lat: coords.lat
              },
              status: inc.status,
              signal_text: inc.description || (inc.data && inc.data.raw_input),
              created_at: inc.created_at,
              data: inc.data
            };
          });
          setIncidents(mappedIncidents);

          const extractedTraces = [];
          dbIncidents.forEach(inc => {
            if (inc.data && Array.isArray(inc.data.traceLogs)) {
              inc.data.traceLogs.forEach(log => {
                extractedTraces.push({
                  incidentId: inc.incident_id,
                  log: { ...log, timestamp: log.timestamp || (inc.created_at ? new Date(inc.created_at).getTime() : Date.now()) },
                  department: inc.type === 'FIRE' ? 'FIRE_BRIGADE' : 'KMC_HEALTH'
                });
              });
            }
          });
          setTraces(extractedTraces);
        }
      } catch (e) {
        console.error("Failed to fetch historical incidents:", e);
      }
    };
    fetchIncidentsAndTraces();
  }, []);

  const departments = {
    'KMC_HEALTH': { name: 'KMC Health & Infra', color: 'text-emerald-500' },
    'POLICE_FORCE': { name: 'Sindh Police Force', color: 'text-blue-500' },
    'FIRE_BRIGADE': { name: 'Karachi Fire Brigade', color: 'text-orange-500' },
    'RESCUE_1122': { name: 'Rescue 1122', color: 'text-red-500' }
  };

  const activeDeptRef = React.useRef(activeDept);
  useEffect(() => { activeDeptRef.current = activeDept; }, [activeDept]);

  useEffect(() => {
    const websocket = new WebSocket('ws://127.0.0.1:3001');
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'TRACE_LOG') {
        console.log(`[Tactical] Incoming Log: ${data.log.agent} for ${data.assigned_department}`);
        
        setTraces(prev => [...prev, { 
          incidentId: data.incidentId, 
          log: { ...data.log, timestamp: data.log.timestamp || Date.now() }, 
          department: data.assigned_department 
        }]);

        if (data.log.agent === 'The Sentinel' && data.log.outcome === 'Success') {
          const landmarkName = data.log.message.split('at ')[1]?.replace('.', '') || 'NIPA Chowrangi';
          const coords = resolveHotspotCoordinates(landmarkName);
          setIncidents(prev => [...prev, {
            id: data.incidentId,
            department: data.assigned_department,
            type: data.log.message.includes('fire') ? 'fire' : 'urban_flood',
            location: { 
              landmark: landmarkName,
              lng: coords.lng,
              lat: coords.lat
            },
            status: 'ACTIVE'
          }]);
        }

        // Live Incident Status Synchronizer (Field Officer & Auditor Actions)
        if (data.log.agent === 'The Auditor') {
          const isRetracted = data.log.message.includes('RETRACTED') || data.log.message.includes('retract') || data.log.message.includes('RETRACT');
          const isConfirmed = data.log.message.includes('CONFIRMED') || data.log.message.includes('confirm') || data.log.message.includes('CONFIRM');
          const isResolved = data.log.outcome === 'Crisis Resolved' || data.log.message.includes('Resolved') || data.log.message.includes('resolved');
          const newStatus = isRetracted ? 'RETRACTED' : (isConfirmed ? 'CONFIRMED' : (isResolved ? 'RESOLVED' : 'ACTIVE'));
          
          setIncidents(prevIncidents => prevIncidents.map(inc => 
            inc.id === data.incidentId 
              ? { 
                  ...inc, 
                  status: newStatus,
                  data: {
                    ...inc.data,
                    retraction_reason: isRetracted ? data.log.message.split('confirms ')[1]?.replace('.', '') : inc.data?.retraction_reason,
                    officer_note: isConfirmed ? data.log.message.split('confirms ')[1]?.replace('.', '') : inc.data?.officer_note
                  }
                } 
              : inc
          ));

          setSelectedIncident(prevSelected => {
            if (prevSelected && prevSelected.id === data.incidentId) {
              return { 
                ...prevSelected, 
                status: newStatus,
                data: {
                  ...prevSelected.data,
                  retraction_reason: isRetracted ? data.log.message.split('confirms ')[1]?.replace('.', '') : prevSelected.data?.retraction_reason,
                  officer_note: isConfirmed ? data.log.message.split('confirms ')[1]?.replace('.', '') : prevSelected.data?.officer_note
                }
              };
            }
            return prevSelected;
          });

          if (isResolved) {
            setLivesSaved(prev => prev + Math.floor(Math.random() * 50) + 20);
          }
        }

        if (data.log.agent === 'The TruthEngine' || data.log.agent === 'The Truth-Engine') {
          setIncidents(prevIncidents => prevIncidents.map(inc => 
            inc.id === data.incidentId ? { ...inc, status: 'INVESTIGATING' } : inc
          ));

          setSelectedIncident(prevSelected => {
            if (prevSelected && prevSelected.id === data.incidentId) {
              return { ...prevSelected, status: 'INVESTIGATING' };
            }
            return prevSelected;
          });
        }
      }
      if (data.type === 'COMMUNICATION_ALERT') setLatestAlert(data.data);
    };
    setWs(websocket);
    return () => websocket.close();
  }, []);

  // Unified Filtering Logic
  const filteredIncidents = (incidents || []).filter(inc => 
    !inc || !inc.department || inc.department === activeDept || inc.support_agency === activeDept
  );
  const filteredTraces = (traces || []).filter(t => {
    // System logs and The Dispatcher logs are ALWAYS visible for situational awareness
    if (!t.department || t.log.agent === 'The Dispatcher') return true;
    return t.department === activeDept || t.support_agency === activeDept;
  });
  const safeDeptStats = deptStats || { officers: 0, trucks: 0, ambulances: 0 };

  const triggerSimulation = async (type = "flood", customInput = null) => {
    if (isSimulating) return;
    let input = customInput;
    if (!input) {
      const hotspots = ["NIPA Chowrangi", "Saddar", "Clifton", "Gulshan", "Defence"];
      const landmark = hotspots[Math.floor(Math.random() * hotspots.length)];
      input = type === "flood" ? `${landmark} doob gaya!` : `Fire reported at ${landmark} factory!`;
    }
    setIsSimulating(true);
    try {
      await fetch('http://127.0.0.1:3001/api/incidents/trigger-crisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });
    } catch (error) { console.error(error); } finally { setIsSimulating(false); }
  };

  const handleLogin = (u) => {
    localStorage.setItem('muhafiz_user', JSON.stringify(u));
    setUser(u);
  };
  const handleLogout = () => {
    localStorage.removeItem('muhafiz_user');
    setUser(null);
  };

  if (!user) return <SovereignLogin onLogin={handleLogin} />;

  return (
    <div className="h-screen w-screen sovereign-bg overflow-hidden flex flex-col font-sans text-zinc-300">
      {/* 1. MASTER HEADER (Fixed Authority) */}
      <MetricsUI 
        activeCrises={filteredIncidents.length} 
        deptStats={safeDeptStats} 
        livesSaved={livesSaved}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeDept={activeDept}
        departments={departments}
      />

      {/* 2. MAIN OPERATIONAL AREA */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Left: Sovereign Sidebar (Asset Management) */}
        <div 
          className="absolute left-0 top-0 bottom-0 z-40 transition-all duration-500 ease-in-out overflow-visible"
          style={{ width: sidebarOpen ? '288px' : '64px', paddingTop: '56px' }}
        >
          <SovereignSidebar 
            activeDept={activeDept} 
            setDept={setActiveDept} 
            departments={departments}
            view={sidebarView}
            setView={setSidebarView}
            dashboardView={dashboardView}
            setDashboardView={setDashboardView}
            user={user}
            onLogout={handleLogout}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            selectedIncident={selectedIncident}
            setSelectedIncident={setSelectedIncident}
          />
        </div>

        {/* Center: Tactical Map / Strategic Audit */}
        <div 
          className="flex-1 relative bg-zinc-900 transition-all duration-500"
          style={{ paddingLeft: dashboardView === 'TACTICAL' ? '0px' : (sidebarOpen ? '288px' : '64px') }}
        >
          {dashboardView === 'TACTICAL' ? (
            <div className="w-full h-full relative">
              <DigitalTwinMap 
                incidents={filteredIncidents} 
                onMarkerClick={(inc) => {
                  setSelectedIncident(inc);
                  setSidebarOpen(true);
                  setSidebarView('dashboard');
                }} 
              />
              
              {/* Tactical Overlays (Map Space Only) */}
              <div 
                className="absolute top-6 left-6 z-20 transition-all duration-500" 
                style={{ transform: sidebarOpen ? 'translateX(288px)' : 'translateX(64px)' }}
              >
                <TacticalLegend />
              </div>

              {/* Bottom-Right: Unified Signal Hub */}
              <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-3 items-end pointer-events-auto">
                <div className="flex gap-2">
                  <button onClick={() => triggerSimulation("flood")} disabled={isSimulating} className="px-3 py-1.5 font-black rounded-lg border border-white/5 bg-black/40 text-[8px] tracking-widest uppercase hover:bg-emerald-500/10 hover:text-emerald-500 transition-all">
                    + FLOOD_SIM
                  </button>
                  <button onClick={() => triggerSimulation("fire")} disabled={isSimulating} className="px-3 py-1.5 font-black rounded-lg border border-white/5 bg-black/40 text-[8px] tracking-widest uppercase hover:bg-orange-500/10 hover:text-orange-500 transition-all">
                    + FIRE_SIM
                  </button>
                </div>
                <div className="w-72 p-4 bg-black/80 backdrop-blur-3xl border border-white/5 rounded-2xl shadow-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe size={10} className="text-blue-500" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">OSINT Signal Ingest</span>
                  </div>
                  <div className="flex gap-2">
                    <input id="social_input" type="text" placeholder="Simulate signal..." className="flex-1 bg-white/5 border border-white/5 rounded px-2 py-1.5 text-[10px] outline-none focus:border-blue-500/30 transition-all" />
                    <button onClick={() => { const i = document.getElementById('social_input'); triggerSimulation('social', i.value); i.value = ''; }} className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-400/30 rounded text-[8px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">INGEST</button>
                  </div>
                </div>
              </div>
            </div>
          ) : dashboardView === 'STRATEGIC' ? (
            <div className="w-full h-full overflow-y-auto bg-black/5 backdrop-blur-md animate-in fade-in duration-500">
              <SovereignAnalytics activeDept={activeDept} departments={departments} />
            </div>
          ) : dashboardView === 'MISSIONS' ? (
            <div className="w-full h-full overflow-y-auto bg-black/5 backdrop-blur-md animate-in fade-in duration-500">
              <MissionDashboard />
            </div>
          ) : dashboardView === 'ARCHIVE' ? (
            <div className="w-full h-full overflow-y-auto bg-black/5 backdrop-blur-md animate-in fade-in duration-500">
              <CrisisExplorer incidents={filteredIncidents} traces={filteredTraces} />
            </div>
          ) : dashboardView === 'ADMIN' ? (
            <div className="w-full h-full overflow-y-auto bg-black/5 backdrop-blur-md animate-in fade-in duration-500">
              <SovereignIntelligence />
            </div>
          ) : (
            <div className="w-full h-full overflow-y-auto bg-black/5 backdrop-blur-md animate-in fade-in duration-500">
              <PublicBroadcast />
            </div>
          )}
        </div>

        {/* Right: Tactical Feed (Agent Intelligence) */}
        {dashboardView === 'TACTICAL' && (
          <div className="w-[320px] h-full bg-black/10 backdrop-blur-3xl border-l border-white/5 z-40 animate-in slide-in-from-right duration-500" style={{ paddingTop: '56px' }}>
            <AgentTraceTerminal traces={filteredTraces} />
          </div>
        )}

      </div>

      <CrisisAlert message={latestAlert} onClose={() => setLatestAlert(null)} />
    </div>
  );
}

export default App;
