import React, { useState, useEffect } from 'react';
import AgentTraceTerminal from './components/AgentTraceTerminal';

function App() {
  const [traces, setTraces] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Connect to Backend WebSocket
    const websocket = new WebSocket('ws://localhost:3001');
    
    websocket.onopen = () => console.log('Connected to Muhafiz-X Backend');
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'TRACE_LOG') {
        setTraces(prev => [...prev, data.log]);
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
    <div className="bg-muhafiz-bg min-h-screen">
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <button 
          onClick={triggerSimulation} 
          disabled={isSimulating}
          className={`px-6 py-3 font-bold rounded-lg shadow-lg transition-all border border-zinc-700
            ${isSimulating 
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
              : 'bg-muhafiz-green text-black hover:bg-emerald-400 hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            }`}
        >
          {isSimulating ? 'SIMULATION IN PROGRESS...' : 'TRIGGER INGESTION'}
        </button>
      </div>
      
      <AgentTraceTerminal traces={traces} />
    </div>
  );
}

export default App;
