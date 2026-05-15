import React, { useState, useEffect } from 'react';
import AgentTraceTerminal from './components/AgentTraceTerminal';
import DigitalTwinMap from './components/DigitalTwinMap';
import MetricsUI from './components/MetricsUI';
import TacticalLegend from './components/TacticalLegend';
import DecisionCards from './components/DecisionCards';
import CrisisAlert from './components/CrisisAlert';
import SovereignSidebar from './components/SovereignSidebar';

function App() {
  const [traces, setTraces] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [ws, setWs] = useState(null);
  const [latestAlert, setLatestAlert] = useState(null);
  const [activeDept, setActiveDept] = useState('KMC_HEALTH'); // Default profile
  
  // Dashboard state
  const [activeCrises, setActiveCrises] = useState(0);
  const [availableResources, setAvailableResources] = useState(87);
  const [livesSaved, setLivesSaved] = useState(0);
  
  // Multiple Incidents State
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3001');
    
    websocket.onopen = () => console.log('Connected to Muhafiz-X Backend');
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'TRACE_LOG') {
        setTraces(prev => [...prev, { 
          incidentId: data.incidentId, 
          log: data.log,
          department: data.assigned_department // Capture routing info
        }]);
        
        // Handle Ingestion (Sentinel)
        if (data.log.agent === 'The Sentinel' && data.log.outcome === 'Success') {
          const newIncident = {
            id: data.incidentId,
            department: data.assigned_department,
            type: data.log.message.includes('fire') ? 'fire' : 'urban_flood',
            location: { landmark: data.log.message.split('at ')[1]?.replace('.', '') || 'NIPA Chowrangi' }
          };
          setIncidents(prev => [...prev, newIncident]);
        }
        
        // Handle Audit (Auditor)
        if (data.log.agent === 'The Auditor' && data.log.outcome === 'Crisis Resolved') {
          // Keep as is for global metrics, but filtering happens in render
          setLivesSaved(prev => prev + Math.floor(Math.random() * 50) + 20);
        }
      }

      if (data.type === 'COMMUNICATION_ALERT') {
        setLatestAlert(data.data);
      }
    };

    websocket.onclose = () => console.log('Disconnected from Muhafiz-X Backend');
    setWs(websocket);
    return () => websocket.close();
  }, []);

  // Filtering Logic: Only show what belongs to the active department
  const filteredIncidents = incidents.filter(inc => !inc.department || inc.department === activeDept);
  const filteredTraces = traces.filter(t => !t.department || t.department === activeDept);

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
    } catch (error) {
      console.error("Simulation failed", error);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#09090b] overflow-hidden text-zinc-100 font-inter">
      {/* New Left Sidebar: Sovereign Profile */}
      <SovereignSidebar activeDept={activeDept} setDept={setActiveDept} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar: Metrics UI */}
        <MetricsUI 
          activeCrises={filteredIncidents.length} 
          availableResources={availableResources} 
          livesSaved={livesSaved} 
        />

        {/* Main Content Area */}
        <div className="flex flex-1 relative overflow-hidden">
          
          {/* Left Side: 3D Map */}
          <div className="flex-1 relative border-r border-zinc-800">
            <DigitalTwinMap incidents={filteredIncidents} />
            
            <div className="absolute top-4 right-4 z-10">
              <TacticalLegend />
            </div>
            
            {/* Overlay Trigger Controls */}
            <div className="absolute bottom-6 left-6 z-10 flex gap-4">
              <button 
                onClick={() => triggerSimulation("flood")} 
                disabled={isSimulating}
                className="px-4 py-2 font-bold rounded-lg shadow-2xl transition-all border font-mono text-[9px] tracking-widest uppercase backdrop-blur-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-red-500/20"
              >
                GENERATE_SIGNAL(KMC)
              </button>
              <button 
                onClick={() => triggerSimulation("fire")} 
                disabled={isSimulating}
                className="px-4 py-2 font-bold rounded-lg shadow-2xl transition-all border font-mono text-[9px] tracking-widest uppercase backdrop-blur-md bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white border-orange-500/20"
              >
                GENERATE_SIGNAL(FIRE)
              </button>
            </div>
          </div>

          {/* Right Side: Agent Trace Terminal Sidebar */}
          <div className="w-[400px] flex-shrink-0 z-20 bg-black/40 backdrop-blur-xl border-l border-zinc-800">
            <AgentTraceTerminal traces={filteredTraces} />
          </div>

        </div>
      </div>

      {/* Modal Alerts */}
      <CrisisAlert 
        message={latestAlert} 
        onClose={() => setLatestAlert(null)} 
      />
    </div>
  );
}

export default App;


