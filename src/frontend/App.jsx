import React, { useState, useEffect } from 'react';
import AgentTraceTerminal from './components/AgentTraceTerminal';
import DigitalTwinMap from './components/DigitalTwinMap';
import MetricsUI from './components/MetricsUI';

function App() {
  const [traces, setTraces] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [ws, setWs] = useState(null);
  
  // Dashboard state mapped from backend
  const [activeCrises, setActiveCrises] = useState(0);
  const [availableResources, setAvailableResources] = useState(14); // Mock initial
  const [livesSaved, setLivesSaved] = useState(0);
  
  // Map State
  const [activeCrisisLocation, setActiveCrisisLocation] = useState(false);
  const [resolvedPlan, setResolvedPlan] = useState(false);

  useEffect(() => {
    // Connect to Backend WebSocket
    const websocket = new WebSocket('ws://localhost:3001');
    
    websocket.onopen = () => console.log('Connected to Muhafiz-X Backend');
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'TRACE_LOG') {
        setTraces(prev => [...prev, data.log]);
        
        // Parse logs to update UI state
        if (data.log.agent === 'The Sentinel' && data.log.outcome === 'Success') {
          setActiveCrises(1);
          setActiveCrisisLocation(true);
        }
        if (data.log.agent === 'The Oracle' && data.log.outcome === 'Approved') {
          setResolvedPlan(true);
          setLivesSaved(prev => prev + 15);
        }
        if (data.log.agent === 'The Auditor' && data.log.outcome === 'Crisis Resolved') {
          setActiveCrises(0);
        }
      }
    };

    websocket.onclose = () => console.log('Disconnected from Muhafiz-X Backend');
    
    setWs(websocket);
    
    return () => websocket.close();
  }, []);

  const triggerSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setTraces([]); // clear previous traces
    setActiveCrises(0);
    setActiveCrisisLocation(false);
    setResolvedPlan(false);
    
    try {
      const res = await fetch('http://localhost:3001/api/trigger-crisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: "NIPA doob gaya, traffic is stuck!" })
      });
      const data = await res.json();
      console.log("Simulation complete", data);
    } catch (error) {
      console.error("Simulation failed", error);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-muhafiz-bg overflow-hidden">
      {/* Top Bar: Metrics UI */}
      <MetricsUI 
        activeCrises={activeCrises} 
        availableResources={availableResources} 
        livesSaved={livesSaved} 
      />

      {/* Main Content Area */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Left Side: 3D Map */}
        <div className="flex-1 relative">
          <DigitalTwinMap activeCrisis={activeCrisisLocation} resolvedPlan={resolvedPlan} />
          
          {/* Overlay Trigger Button */}
          <div className="absolute top-4 left-4 z-10">
            <button 
              onClick={triggerSimulation} 
              disabled={isSimulating}
              className={`px-6 py-3 font-bold rounded-lg shadow-lg transition-all border border-zinc-700 font-mono text-sm tracking-wider
                ${isSimulating 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-zinc-800' 
                  : 'bg-muhafiz-bg/80 text-muhafiz-green hover:bg-muhafiz-green hover:text-black border-muhafiz-green/50 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                }`}
            >
              {isSimulating ? 'SIMULATION ACTIVE // DO NOT INTERRUPT' : 'INITIALIZE_AGENTIC_CASCADE()'}
            </button>
          </div>
        </div>

        {/* Right Side: Agent Trace Terminal Sidebar */}
        <div className="w-[450px] flex-shrink-0 z-20">
          <AgentTraceTerminal traces={traces} />
        </div>

      </div>
    </div>
  );
}

export default App;
