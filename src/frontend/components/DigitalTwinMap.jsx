import React, { useState, useEffect } from 'react';
import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Activity, Thermometer, Wind, Droplets, Flame, AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';

const MAPBOX_TOKEN = "pk.eyJ1IjoiemFpbmJhd2EiLCJhIjoiY21wNzd3dHA5MDE1djJycXVmMXk3NW5yOSJ9.YDIdVPYdoQeSkqTVArC2TA";

const DigitalTwinMap = ({ incidents, onMarkerClick }) => {
    const [viewState, setViewState] = useState({
        longitude: 67.04,
        latitude: 24.89,
        zoom: 11,
        pitch: 45,
        bearing: 0
    });

    const [sensors, setSensors] = useState([]);
    const [selectedSensor, setSelectedSensor] = useState(null);
    const [showRiskMap, setShowRiskMap] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const simulatedSensors = [
                { id: 'SEN-001', name: 'Saddar Air Terminal', type: 'AQI', last_read: Math.floor(Math.random() * 200) + 50, lng: 67.03, lat: 24.86, status: 'ONLINE', last_updated: Date.now() },
                { id: 'SEN-002', name: 'Gulshan Flood Sensor', type: 'WATER_LEVEL', last_read: (Math.random() * 2).toFixed(1) + 'm', lng: 67.08, lat: 24.91, status: 'ONLINE', last_updated: Date.now() },
                { id: 'SEN-003', name: 'Clifton Thermal Node', type: 'TEMP', last_read: Math.floor(Math.random() * 10) + 30 + '°C', lng: 67.04, lat: 24.81, status: 'ONLINE', last_updated: Date.now() },
                { id: 'SEN-004', name: 'Orangi AQI Monitor', type: 'AQI', last_read: Math.floor(Math.random() * 300) + 100, lng: 66.98, lat: 24.89, status: 'OFFLINE', last_updated: Date.now() }
            ];
            setSensors(simulatedSensors);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const getSensorIcon = (type) => {
        switch(type) {
            case 'AQI': return <Wind size={12} />;
            case 'TEMP': return <Thermometer size={12} />;
            case 'WATER_LEVEL': return <Droplets size={12} />;
            default: return <Activity size={12} />;
        }
    };

    const riskData = [
        { position: [67.03, 24.86], weight: 10 },
        { position: [67.08, 24.91], weight: 15 },
        { position: [67.04, 24.81], weight: 8 },
        { position: [67.12, 24.95], weight: 12 },
        { position: [66.98, 24.89], weight: 20 },
        { position: [67.05, 24.93], weight: 7 }
    ];

    const layers = [
        new HeatmapLayer({
            id: 'heatmap-layer',
            data: riskData,
            getPosition: d => d.position,
            getWeight: d => d.weight,
            radiusPixels: 80,
            intensity: 1.5,
            threshold: 0.1,
            visible: showRiskMap,
            colorRange: [
                [255, 255, 178, 0],
                [254, 217, 118],
                [254, 178, 76],
                [253, 141, 60],
                [240, 59, 32],
                [189, 0, 38]
            ]
        })
    ];

    return (
        <div className="w-full h-full relative group">
            <DeckGL
                initialViewState={viewState}
                onViewStateChange={e => setViewState(e.viewState)}
                controller={true}
                layers={layers}
            >
                <Map
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                    mapboxAccessToken={MAPBOX_TOKEN}
                >
                    {/* Incidents */}
                    {incidents.map((incident, idx) => (
                        <Marker 
                            key={`inc-${idx}`} 
                            longitude={incident.location?.lng || 67.05} 
                            latitude={incident.location?.lat || 24.89}
                            onClick={e => { e.originalEvent.stopPropagation(); onMarkerClick(incident); }}
                        >
                            <div className="flex flex-col items-center cursor-pointer group">
                                <div className="animate-ping absolute w-8 h-8 rounded-full opacity-40 bg-red-500" />
                                <div className="w-4 h-4 rounded-full border-2 border-white shadow-lg bg-red-600 flex items-center justify-center">
                                    <Flame size={8} className="text-white" />
                                </div>
                            </div>
                        </Marker>
                    ))}

                    {/* Sensors */}
                    {sensors.map(sensor => (
                        <Marker 
                            key={sensor.id} 
                            longitude={sensor.lng} 
                            latitude={sensor.lat}
                            onClick={e => { e.originalEvent.stopPropagation(); setSelectedSensor(sensor); }}
                        >
                            <div className="flex flex-col items-center cursor-pointer group">
                                <div className={`p-1.5 rounded-full border border-blue-500/50 backdrop-blur-md bg-blue-500/10 text-blue-400`}>
                                    {getSensorIcon(sensor.type)}
                                </div>
                            </div>
                        </Marker>
                    ))}
                </Map>
            </DeckGL>

            {/* Prediction HUD */}
            <div className="absolute top-6 right-6 z-50 flex flex-col gap-3 items-end">
                <button 
                    onClick={() => setShowRiskMap(!showRiskMap)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-500 backdrop-blur-xl ${showRiskMap ? 'bg-orange-600/20 border-orange-500/50 text-orange-400 shadow-2xl' : 'bg-black/60 border-white/10 text-zinc-500 hover:text-zinc-300'}`}
                >
                    <TrendingUp size={14} className={showRiskMap ? 'animate-bounce' : ''} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {showRiskMap ? 'Risk Intelligence: LIVE' : 'Predictive Analysis'}
                    </span>
                </button>

                {selectedSensor && (
                    <div className="w-64 p-5 bg-zinc-950/90 border border-blue-500/30 rounded-3xl backdrop-blur-3xl shadow-2xl animate-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{selectedSensor.type}</span>
                            <button onClick={() => setSelectedSensor(null)} className="text-zinc-600 hover:text-white">✕</button>
                        </div>
                        <h4 className="text-white text-[11px] font-black uppercase mb-4">{selectedSensor.name}</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white/5 rounded-2xl">
                                <span className="text-[7px] text-zinc-500 block mb-1 uppercase font-bold">Value</span>
                                <span className="text-blue-400 font-mono text-[11px] font-black">{selectedSensor.last_read}</span>
                            </div>
                            <div className="p-3 bg-white/5 rounded-2xl">
                                <span className="text-[7px] text-zinc-500 block mb-1 uppercase font-bold">Status</span>
                                <span className={`text-[8px] font-black ${selectedSensor.status === 'ONLINE' ? 'text-emerald-500' : 'text-red-500'}`}>{selectedSensor.status}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DigitalTwinMap;
