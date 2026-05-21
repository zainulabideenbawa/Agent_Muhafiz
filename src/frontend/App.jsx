import React, { useState, useEffect } from 'react';
import { API_BASE, WS_BASE } from './utils/config.js';
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
import UserManagement from './components/UserManagement';

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
    try {
      const stored = localStorage.getItem('muhafiz_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const handleLogin = (newUser) => {
    setUser(newUser);
    if (newUser) localStorage.setItem('muhafiz_user', JSON.stringify(newUser));
    else localStorage.removeItem('muhafiz_user');
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/logout`, { method: 'POST' });
    } catch (e) {
      console.error("Logout request failed:", e);
    }
    localStorage.removeItem('muhafiz_user');
    localStorage.removeItem('auth_token');
    setUser(null);
    setIncidents([]);
    setTraces([]);
    setResolutionAlert(null);
    setLatestAlert(null);
  };
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
  const [resolutionAlert, setResolutionAlert] = useState(null); // for False Alarm / Road Clear / Confirmed banners

  useEffect(() => {
    if (user && user.role === 'DEPT_ADMIN' && user.department) {
      setActiveDept(user.department);
    }
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/department-resources/${activeDept}`);
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
        const res = await fetch(`${API_BASE}/api/incidents`);
        const dbIncidents = await res.json();
        if (Array.isArray(dbIncidents)) {
          const mappedIncidents = dbIncidents.map(inc => {
            const landmarkName = inc.location || 'NIPA Chowrangi';
            // Prioritize coordinates geocoded by Google Maps in the backend
            const hasBackendCoords = inc.data?.classification?.location?.lat && inc.data?.classification?.location?.lng;
            const coords = hasBackendCoords
              ? { lng: inc.data.classification.location.lng, lat: inc.data.classification.location.lat }
              : resolveHotspotCoordinates(landmarkName);

            let dept = 'KMC_HEALTH';
            if (inc.type === 'FIRE' || inc.type === 'FIRE_BRIGADE') dept = 'FIRE_BRIGADE';
            else if (inc.type === 'POLICE_FORCE') dept = 'POLICE_FORCE';
            else if (inc.type === 'RESCUE_1122') dept = 'RESCUE_1122';

            return {
              id: inc.incident_id,
              department: dept,
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
    const websocket = new WebSocket(`${WS_BASE}`);
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      window.dispatchEvent(new CustomEvent('sovereign_websocket_message', { detail: data }));
      if (data.type === 'TRACE_LOG') {
        console.log(`[Tactical] Incoming Log: ${data.log.agent} for ${data.assigned_department}`);

        setTraces(prev => [...prev, {
          incidentId: data.incidentId,
          log: { ...data.log, timestamp: data.log.timestamp || Date.now() },
          department: data.assigned_department
        }]);

        if (data.log.agent === 'The Sentinel' && (data.log.outcome === 'Success' || data.log.outcome === 'Crisis Confirmed')) {
          const sentinelLoc = data.log.details?.location;
          const landmarkName = sentinelLoc?.landmark || data.log.message.split('at ')[1]?.replace('.', '') || 'NIPA Chowrangi';
          const hasBackendCoords = sentinelLoc?.lat && sentinelLoc?.lng;
          const coords = hasBackendCoords
            ? { lng: sentinelLoc.lng, lat: sentinelLoc.lat }
            : resolveHotspotCoordinates(landmarkName);

          let dept = data.assigned_department || 'KMC_HEALTH';
          const typeStr = (data.log.details?.type || '').toLowerCase();
          if (typeStr.includes('fire')) dept = 'FIRE_BRIGADE';
          else if (typeStr.includes('blast')) dept = 'POLICE_FORCE';
          else if (typeStr.includes('protest')) dept = 'POLICE_FORCE';
          else if (typeStr.includes('flood')) dept = 'RESCUE_1122';

          setIncidents(prev => {
            if (prev.some(inc => inc.id === data.incidentId)) {
              return prev.map(inc => inc.id === data.incidentId ? { ...inc, department: dept, location: { landmark: landmarkName, ...coords } } : inc);
            }
            return [...prev, {
              id: data.incidentId,
              department: dept,
              type: typeStr || 'urban_flood',
              location: {
                landmark: landmarkName,
                lng: coords.lng,
                lat: coords.lat
              },
              status: 'ACTIVE'
            }];
          });
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
            // Use actual affected_population from the Analyst agent if available
            const impactData = data.log.details?.impact_analysis || data.impact_analysis;
            const saved = impactData?.affected_population || 120;
            setLivesSaved(prev => prev + saved);
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

      if (data.type === 'RESOLUTION_ALERT') {
        setResolutionAlert(data);
        // Update the incident card status immediately
        const statusMap = {
          FALSE_ALARM: 'RETRACTED',
          ROAD_CLEAR: 'RETRACTED',
          CONFIRMED: 'CONFIRMED',
          QUEST_ACCEPTED: 'INVESTIGATING',
        };
        if (statusMap[data.resolution]) {
          setIncidents(prev => prev.map(inc =>
            inc.id === data.incidentId ? { ...inc, status: statusMap[data.resolution] } : inc
          ));
        }
        // Auto-dismiss after 8 seconds
        setTimeout(() => setResolutionAlert(null), 8000);
      }

      if (data.type === 'QUEST_ALERT') {
        // Surface the HITL verification modal
        setLatestAlert({
          scope: 'QUEST',
          incidentId: data.incidentId,
          radius_km: 0,
          push_notification: {
            en: `⚠️ VERIFICATION QUEST: ${data.data?.type?.toUpperCase() || 'CRISIS'} at ${data.data?.location || 'Karachi'}`,
            ur: `تصدیق ضروری ہے`
          },
          whatsapp_draft: {
            en: data.data?.message || 'Field officer verification required before asset deployment.'
          },
          mayor_brief: `Confidence score ${((data.data?.confidence || 0) * 100).toFixed(0)}% — below 80% threshold. Quest dispatched to field officer for ground-truth verification.`
        });
        // Update the incident card to show QUEST_ACTIVE status
        setIncidents(prev => prev.map(inc =>
          inc.id === data.incidentId ? { ...inc, status: 'QUEST_ACTIVE' } : inc
        ));
      }
    };
    setWs(websocket);
    return () => websocket.close();
  }, []);

  // Unified Filtering Logic
  const filteredIncidents = (incidents || []).filter(inc => {
    if (!inc) return false;
    if (user?.role === 'SUPER_ADMIN') return true;
    if (inc.status === 'QUEST_ACTIVE' || inc.status === 'INVESTIGATING' || inc.status === 'PENDING') return true;
    return !inc.department || inc.department === activeDept || inc.support_agency === activeDept;
  });
  const filteredTraces = (traces || []).filter(t => {
    if (!t) return false;
    if (user?.role === 'SUPER_ADMIN') return true;
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
      await fetch(`${API_BASE}/api/incidents/trigger-crisis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });
    } catch (error) { console.error(error); } finally { setIsSimulating(false); }
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
            incidents={filteredIncidents}
          />
        </div>

        {/* Center: Tactical Map / Strategic Audit */}
        <div
          className="flex-1 relative bg-zinc-900 transition-all duration-500"
          style={{ paddingLeft: sidebarOpen ? '288px' : '64px' }}
        >
          {dashboardView === 'TACTICAL' ? (
            <div className="w-full h-full relative">
              <DigitalTwinMap
                incidents={filteredIncidents}
                selectedIncident={selectedIncident}
                onMarkerClick={(inc) => {
                  setSelectedIncident(inc);
                  setSidebarOpen(true);
                  setSidebarView('dashboard');
                  setDashboardView('TACTICAL');
                  if (inc.department) {
                    setActiveDept(inc.department);
                  }
                }}
              />

              {/* Tactical Overlays (Map Space Only) */}
              <div className="absolute bottom-6 left-6 z-20">
                <TacticalLegend />
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
          ) : dashboardView === 'USERS' ? (
            <div className="w-full h-full overflow-y-auto bg-black/5 backdrop-blur-md animate-in fade-in duration-500">
              <UserManagement />
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

      {/* Resolution Notification Banner — False Alarm / Road Clear / Confirmed / Officer Dispatched */}
      {resolutionAlert && (() => {
        const colorMap = {
          FALSE_ALARM: { bg: 'from-amber-900/95 to-amber-800/95', border: 'border-amber-500', text: 'text-amber-300', dot: 'bg-amber-400' },
          ROAD_CLEAR: { bg: 'from-emerald-900/95 to-emerald-800/95', border: 'border-emerald-500', text: 'text-emerald-300', dot: 'bg-emerald-400' },
          CONFIRMED: { bg: 'from-red-900/95 to-red-800/95', border: 'border-red-500', text: 'text-red-300', dot: 'bg-red-400' },
          QUEST_ACCEPTED: { bg: 'from-blue-900/95 to-blue-800/95', border: 'border-blue-500', text: 'text-blue-300', dot: 'bg-blue-400' },
        };
        const c = colorMap[resolutionAlert.resolution] || colorMap['ROAD_CLEAR'];
        return (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[520px] max-w-[95vw] bg-gradient-to-r ${c.bg} border ${c.border} rounded-2xl shadow-2xl p-5 flex gap-4 items-start backdrop-blur-xl animate-in slide-in-from-top-4 duration-300`}>
            <div className={`w-3 h-3 rounded-full ${c.dot} mt-1 flex-shrink-0 animate-pulse`} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-black uppercase tracking-widest ${c.text}`}>
                  {resolutionAlert.label}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">{resolutionAlert.incidentId}</span>
              </div>
              <p className="text-sm text-zinc-100 font-medium leading-snug mb-1">{resolutionAlert.message}</p>
              {resolutionAlert.reason && (
                <p className="text-[11px] text-zinc-400 italic">Reason: {resolutionAlert.reason}</p>
              )}
            </div>
            <button
              onClick={() => setResolutionAlert(null)}
              className="text-zinc-500 hover:text-white transition-colors flex-shrink-0 mt-0.5 text-lg leading-none"
            >×</button>
          </div>
        );
      })()}
    </div>
  );
}

export default App;
