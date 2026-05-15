import React from 'react';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

const MetricsUI = ({ activeCrises, availableResources, livesSaved }) => {
  return (
    <div className="h-16 bg-[#09090b]/90 backdrop-blur-lg border-b border-zinc-800 flex items-center justify-between px-8 z-50 relative">
      <div className="flex items-center gap-4">
        <ShieldCheck className="text-muhafiz-green w-6 h-6" />
        <h1 className="text-white font-bold text-xl tracking-widest font-mono">
          MUHAFIZ<span className="text-muhafiz-green">-X</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center">
          <span className="text-zinc-500 text-xs font-mono tracking-wider">ACTIVE CRISES</span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-muhafiz-red animate-pulse"></span>
            <span className="text-muhafiz-red font-bold font-mono text-lg">{activeCrises}</span>
          </div>
        </div>
        
        <div className="h-8 w-[1px] bg-zinc-800"></div>
        
        <div className="flex flex-col items-center">
          <span className="text-zinc-500 text-xs font-mono tracking-wider">AVAILABLE RESOURCES</span>
          <div className="flex items-center gap-2">
            <Activity className="text-muhafiz-amber w-4 h-4" />
            <span className="text-muhafiz-amber font-bold font-mono text-lg">{availableResources} Units</span>
          </div>
        </div>
        
        <div className="h-8 w-[1px] bg-zinc-800"></div>
        
        <div className="flex flex-col items-center">
          <span className="text-zinc-500 text-xs font-mono tracking-wider">SIMULATED LIVES SAVED</span>
          <div className="flex items-center gap-2">
            <Zap className="text-muhafiz-green w-4 h-4" />
            <span className="text-muhafiz-green font-bold font-mono text-lg">{livesSaved}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsUI;
