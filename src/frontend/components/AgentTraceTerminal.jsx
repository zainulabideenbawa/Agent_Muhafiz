import React from 'react';

/**
 * AgentTraceTerminal - The "Agentic Trace" Terminal
 * This component visualizes the "thoughts" of the Agents to build trust in autonomous decisions.
 * Implements the "Sovereign Design" rules (Tactical Emerald, Night-Ops Dark Mode).
 */
const AgentTraceTerminal = ({ traces = [] }) => {
  return (
    <div className="bg-muhafiz-bg min-h-screen p-8 text-muhafiz-surface font-sans flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl backdrop-blur-md bg-muhafiz-surface/80 rounded-lg border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Terminal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#121214]">
          <h2 className="text-muhafiz-green font-bold text-xl tracking-wider flex items-center">
            MUHAFIZ-X
            <span className="text-zinc-500 font-mono text-sm ml-3">AGENTIC_TRACE_TERMINAL</span>
          </h2>
          <div className="flex gap-2">
            {/* System Status Indicators */}
            <span className="h-3 w-3 rounded-full bg-muhafiz-red animate-pulse shadow-[0_0_8px_#ef4444]"></span>
            <span className="h-3 w-3 rounded-full bg-muhafiz-amber"></span>
            <span className="h-3 w-3 rounded-full bg-muhafiz-green"></span>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-6 h-[500px] overflow-y-auto font-mono text-sm space-y-5">
          {traces.length === 0 && (
            <div className="text-zinc-500 flex items-center justify-center h-full">
              <span className="animate-pulse">Awaiting Agentic Signals...</span>
            </div>
          )}

          {traces.map((trace, idx) => {
            const isSuccess = trace.outcome === 'Success' || trace.outcome === 'Verified';

            return (
              <div
                key={idx}
                className="flex flex-col gap-1 border-l-2 border-zinc-800 pl-4 hover:border-muhafiz-indigo transition-colors duration-300"
              >
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">[{trace.timestamp}]</span>
                  <span className="text-muhafiz-indigo font-bold">{trace.agent}</span>
                </div>
                <div className="text-zinc-300 mt-1">
                  {trace.message}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-zinc-500">OUTCOME:</span>
                  <span className={`${isSuccess ? 'text-muhafiz-green' : 'text-muhafiz-red'} font-bold`}>
                    {trace.outcome}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AgentTraceTerminal;
