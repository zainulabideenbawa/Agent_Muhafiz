import React, { useState, useEffect } from 'react';
import Map, { Marker, Popup, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Activity, Thermometer, Wind, Droplets, Flame, AlertTriangle, Shield, TrendingUp, Heart } from 'lucide-react';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';

const MAPBOX_TOKEN = "pk.eyJ1IjoiemFpbmJhd2EiLCJhIjoiY21wNzd3dHA5MDE1djJycXVmMXk3NW5yOSJ9.YDIdVPYdoQeSkqTVArC2TA";

const HOSPITALS = [
    { id: 'HOSP-001', name: 'Aga Khan University Hospital (AKUH)', type: 'LEVEL_1_TRAUMA', lng: 67.0747, lat: 24.8922 },
    { id: 'HOSP-002', name: 'Indus Hospital (Korangi)', type: 'REGIONAL_TRAUMA', lng: 67.1211, lat: 24.8504 },
    { id: 'HOSP-003', name: 'Jinnah Postgraduate Medical Center (JPMC)', type: 'CIVIL_TRAUMA', lng: 67.0426, lat: 24.8528 }
];

const resolveHubCoordinates = (hubName, dept) => {
    const name = (hubName || "").toLowerCase();
    if (name.includes("saddar") || name.includes("fire station road")) return { lng: 67.0250, lat: 24.8739 };
    if (name.includes("site")) return { lng: 67.0100, lat: 24.9200 };
    if (name.includes("landhi")) return { lng: 67.1400, lat: 24.8500 };
    if (name.includes("nipa")) return { lng: 67.0900, lat: 24.9215 };
    if (name.includes("cpo") || name.includes("police office")) return { lng: 67.0340, lat: 24.8740 };
    if (name.includes("sohrab goth") || name.includes("edhi")) return { lng: 67.0600, lat: 24.9500 };
    
    // Fallback based on department
    if (dept === 'FIRE_BRIGADE') return { lng: 67.0250, lat: 24.8739 };
    if (dept === 'POLICE_FORCE') return { lng: 67.0340, lat: 24.8740 };
    if (dept === 'RESCUE_1122') return { lng: 67.0900, lat: 24.9215 };
    return { lng: 67.0900, lat: 24.9215 }; // Default to Gulshan / NIPA
};

const generateRouteCoordinates = (start, end) => {
    const mid1 = { lng: start.lng, lat: (start.lat + end.lat) / 2 };
    const mid2 = { lng: end.lng, lat: (start.lat + end.lat) / 2 };
    return [
        [start.lng, start.lat],
        [mid1.lng, mid1.lat],
        [mid2.lng, mid2.lat],
        [end.lng, end.lat]
    ];
};

const generateAlternativeRouteCoordinates = (start, end) => {
    const deltaLng = end.lng - start.lng;
    const deltaLat = end.lat - start.lat;
    
    // Middle point offset to represent an alternate highway / corridor detour
    const midLng = start.lng + deltaLng * 0.4 - deltaLat * 0.25;
    const midLat = start.lat + deltaLat * 0.6 + deltaLng * 0.25;
    
    return [
        [start.lng, start.lat],
        [start.lng + deltaLng * 0.2, start.lat + deltaLat * 0.2],
        [midLng, midLat],
        [start.lng + deltaLng * 0.8, start.lat + deltaLat * 0.8],
        [end.lng, end.lat]
    ];
};

const DigitalTwinMap = ({ incidents, selectedIncident, onMarkerClick }) => {
    const [viewState, setViewState] = useState({
        longitude: 67.04,
        latitude: 24.89,
        zoom: 11,
        pitch: 45,
        bearing: 0
    });

    const [sensors, setSensors] = useState([]);
    const [selectedSensor, setSelectedSensor] = useState(null);
    const [selectedIncidentTooltip, setSelectedIncidentTooltip] = useState(null);
    const [hoveredIncident, setHoveredIncident] = useState(null);
    const [showRiskMap, setShowRiskMap] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState(null);

    const [routeGeoJson, setRouteGeoJson] = useState(null);
    const [blockedRouteGeoJson, setBlockedRouteGeoJson] = useState(null);

    useEffect(() => {
        if (selectedIncident && selectedIncident.location) {
            setViewState(prev => ({
                ...prev,
                longitude: selectedIncident.location.lng || 67.04,
                latitude: selectedIncident.location.lat || 24.89,
                zoom: 13.5,
                transitionDuration: 1500
            }));

            const hubName = selectedIncident.data?.action_plan?.deployment?.hub;
            const hubCoords = resolveHubCoordinates(hubName, selectedIncident.department);
            const incCoords = { lng: selectedIncident.location.lng, lat: selectedIncident.location.lat };
            
            const hasSimulation = selectedIncident.data?.simulation || selectedIncident.data?.oracle_reroute;
            
            if (hasSimulation) {
                const altCoords = generateAlternativeRouteCoordinates(hubCoords, incCoords);
                const origCoords = generateRouteCoordinates(hubCoords, incCoords);
                
                setRouteGeoJson({
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: altCoords
                    }
                });
                
                setBlockedRouteGeoJson({
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: origCoords
                    }
                });
            } else {
                const coords = generateRouteCoordinates(hubCoords, incCoords);
                setRouteGeoJson({
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: coords
                    }
                });
                setBlockedRouteGeoJson(null);
            }
        } else {
            setRouteGeoJson(null);
            setBlockedRouteGeoJson(null);
        }
    }, [selectedIncident]);

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
                viewState={viewState}
                layers={layers}
                style={{ pointerEvents: 'none' }}
            >
                <Map
                    {...viewState}
                    onMove={e => setViewState(e.viewState)}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                    mapboxAccessToken={MAPBOX_TOKEN}
                >
                    {/* Blocked Original Route corridor rendering */}
                    {blockedRouteGeoJson && (
                        <Source id="blocked-route-source" type="geojson" data={blockedRouteGeoJson}>
                            <Layer
                                id="blocked-route-line"
                                type="line"
                                paint={{
                                    'line-color': '#ef4444',
                                    'line-width': 4,
                                    'line-opacity': 0.85,
                                    'line-dasharray': [1, 2]
                                }}
                            />
                        </Source>
                    )}

                    {/* Active routing corridors rendering */}
                    {routeGeoJson && (
                        <Source id="route-source" type="geojson" data={routeGeoJson}>
                            <Layer
                                id="route-glow"
                                type="line"
                                paint={{
                                    'line-color': '#10b981',
                                    'line-width': 8,
                                    'line-opacity': 0.25,
                                    'line-blur': 4
                                }}
                            />
                            <Layer
                                id="route-line"
                                type="line"
                                paint={{
                                    'line-color': '#10b981',
                                    'line-width': 3,
                                    'line-dasharray': [2, 2]
                                }}
                            />
                        </Source>
                    )}

                    {/* Incidents */}
                    {incidents.map((incident, idx) => (
                        <Marker 
                            key={`inc-${idx}`} 
                            longitude={incident.location?.lng || 67.05} 
                            latitude={incident.location?.lat || 24.89}
                            onClick={e => { 
                                e.originalEvent.stopPropagation(); 
                                setSelectedIncidentTooltip(incident);
                                onMarkerClick(incident); 
                            }}
                        >
                            <div 
                                className="flex flex-col items-center cursor-pointer group"
                                onMouseEnter={() => setHoveredIncident(incident)}
                                onMouseLeave={() => setHoveredIncident(null)}
                            >
                                <div className="animate-ping absolute w-8 h-8 rounded-full opacity-40 bg-red-500" />
                                <div className="w-4 h-4 rounded-full border-2 border-white shadow-lg bg-red-600 flex items-center justify-center">
                                    <Flame size={8} className="text-white" />
                                </div>
                            </div>
                        </Marker>
                    ))}

                    {/* Hospital Hubs (Legend alignment) */}
                    {HOSPITALS.map((hosp) => (
                        <Marker
                            key={hosp.id}
                            longitude={hosp.lng}
                            latitude={hosp.lat}
                            onClick={e => {
                                e.originalEvent.stopPropagation();
                                setSelectedHospital(hosp);
                            }}
                        >
                            <div className="flex flex-col items-center cursor-pointer relative">
                                <div className="animate-pulse absolute w-6 h-6 rounded-full opacity-35 bg-emerald-500" />
                                <div className="w-3.5 h-3.5 rounded-full border border-emerald-400 bg-emerald-950 flex items-center justify-center text-emerald-400 hover:scale-110 transition-transform">
                                    <Heart size={7} />
                                </div>
                            </div>
                        </Marker>
                    ))}

                    {/* Hospital Popup Tooltip */}
                    {selectedHospital && (
                        <Popup
                            longitude={selectedHospital.lng}
                            latitude={selectedHospital.lat}
                            anchor="bottom"
                            onClose={() => setSelectedHospital(null)}
                            closeOnClick={false}
                        >
                            <div className="w-[200px] bg-zinc-950/95 border border-emerald-500/20 rounded-2xl backdrop-blur-3xl p-4 shadow-2xl flex flex-col gap-2 text-zinc-300 pointer-events-auto">
                                <div className="flex justify-between items-center">
                                    <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                        🏥 MEDICAL GRID
                                    </span>
                                    <button 
                                        onClick={() => setSelectedHospital(null)} 
                                        className="text-zinc-500 hover:text-white transition-all text-[8px] bg-white/5 w-4 h-4 rounded-full flex items-center justify-center"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-white text-[10px] font-black uppercase leading-tight">{selectedHospital.name}</h4>
                                    <span className="text-[7px] font-mono text-zinc-500 mt-0.5">STATUS: EMERGENCY DEPT SYNCD</span>
                                </div>
                                <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[8px] font-mono text-emerald-400">
                                    Capacity Status: OPTIMAL
                                </div>
                            </div>
                        </Popup>
                    )}

                    {/* Mini Incident Hover Popup */}
                    {hoveredIncident && (!selectedIncidentTooltip || selectedIncidentTooltip.id !== hoveredIncident.id) && (
                        <Popup
                            longitude={hoveredIncident.location?.lng || 67.05}
                            latitude={hoveredIncident.location?.lat || 24.89}
                            anchor="bottom"
                            closeButton={false}
                            closeOnClick={false}
                        >
                            <div className="bg-zinc-950/95 border border-white/10 rounded-xl p-3 shadow-2xl text-zinc-300 pointer-events-none select-none flex flex-col gap-1 min-w-[160px]">
                                <span className="text-[7px] text-zinc-500 block uppercase font-black tracking-widest">Active Crisis Signal</span>
                                <span className="text-white text-[10px] font-black uppercase tracking-tight">
                                    {hoveredIncident.location?.landmark || "Karachi Sector"}
                                </span>
                                <span className="text-[8px] font-mono text-zinc-400">
                                    Ref: {hoveredIncident.id}
                                </span>
                            </div>
                        </Popup>
                    )}

                    {/* Incident Tactical Tooltip Popup */}
                    {selectedIncidentTooltip && (
                        <Popup
                            longitude={selectedIncidentTooltip.location?.lng || 67.05}
                            latitude={selectedIncidentTooltip.location?.lat || 24.89}
                            anchor="bottom"
                            onClose={() => setSelectedIncidentTooltip(null)}
                            closeOnClick={false}
                        >
                            <div className="w-[280px] bg-zinc-950/90 border border-white/10 rounded-2xl backdrop-blur-3xl p-5 shadow-2xl flex flex-col gap-4 text-zinc-300 pointer-events-auto">
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-red-500/10 border-red-500/20 text-red-400 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                                        Crisis Triage
                                    </span>
                                    <button 
                                        onClick={() => setSelectedIncidentTooltip(null)} 
                                        className="text-zinc-500 hover:text-white transition-all text-[8px] font-black uppercase bg-white/5 w-6 h-6 rounded-full flex items-center justify-center border border-white/5"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <h3 className="text-white text-[12px] font-black uppercase tracking-tight">
                                        {selectedIncidentTooltip.location?.landmark || "Karachi Region"}
                                    </h3>
                                    <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                                        Ref: {selectedIncidentTooltip.id || "MHFZ-Simulated"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col gap-1">
                                        <span className="text-[7px] text-zinc-500 block uppercase font-bold tracking-wider">Triage Level</span>
                                        <span className="text-red-400 font-mono text-[10px] font-black flex items-center gap-1">
                                            <AlertTriangle size={8} /> Level {selectedIncidentTooltip.data?.classification?.urgency || 8}
                                        </span>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col gap-1">
                                        <span className="text-[7px] text-zinc-500 block uppercase font-bold tracking-wider">Department</span>
                                        <span className="text-orange-400 font-mono text-[9px] font-black uppercase truncate">
                                            {selectedIncidentTooltip.department?.replace('_', ' ') || 'FIRE BRIGADE'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-[8px] font-mono text-zinc-400">
                                        <span>SIGNAL SOURCE:</span>
                                        <span className="text-blue-400 font-bold uppercase">
                                            {selectedIncidentTooltip.type === 'fire' ? 'OSINT Twitter' : 'Citizen App'}
                                        </span>
                                    </div>
                                    <div className="h-[1px] bg-white/5" />
                                    <div className="flex items-center justify-between text-[8px] font-mono text-zinc-400">
                                        <span>TACTICAL STATUS:</span>
                                        <span className="text-emerald-400 font-bold uppercase animate-pulse">
                                            Active Dispatch
                                        </span>
                                    </div>
                                </div>

                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMarkerClick(selectedIncidentTooltip);
                                        setSelectedIncidentTooltip(null);
                                    }}
                                    className="w-full py-3.5 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white rounded-xl text-[8px] font-black uppercase tracking-[0.15em] transition-all shadow-xl flex items-center justify-center gap-2"
                                >
                                    <Shield size={10} /> Open Tactical Command
                                </button>
                            </div>
                        </Popup>
                    )}

                    {/* Sensors */}
                    {sensors.map(sensor => (
                        <Marker 
                            key={sensor.id} 
                            longitude={sensor.lng} 
                            latitude={sensor.lat}
                            onClick={e => { 
                                e.originalEvent.stopPropagation(); 
                                setSelectedSensor(sensor); 
                            }}
                        >
                            <div className="flex flex-col items-center cursor-pointer group">
                                <div className={`p-1.5 rounded-full border border-blue-500/50 backdrop-blur-md bg-blue-500/10 text-blue-400`}>
                                    {getSensorIcon(sensor.type)}
                                </div>
                            </div>
                        </Marker>
                    ))}

                    {/* Sensor Tooltip Popup directly on coordinates */}
                    {selectedSensor && (
                        <Popup
                            longitude={selectedSensor.lng}
                            latitude={selectedSensor.lat}
                            anchor="bottom"
                            onClose={() => setSelectedSensor(null)}
                            closeOnClick={false}
                        >
                            <div className="w-[240px] bg-zinc-950/90 border border-blue-500/30 rounded-2xl backdrop-blur-3xl p-5 shadow-2xl flex flex-col gap-4 text-zinc-300 pointer-events-auto">
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                                        {selectedSensor.type} Telemetry
                                    </span>
                                    <button 
                                        onClick={() => setSelectedSensor(null)} 
                                        className="text-zinc-500 hover:text-white transition-all text-[8px] font-black uppercase bg-white/5 w-6 h-6 rounded-full flex items-center justify-center border border-white/5"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <h3 className="text-white text-[11px] font-black uppercase tracking-tight">
                                        {selectedSensor.name}
                                    </h3>
                                    <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest">
                                        ID: {selectedSensor.id}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col gap-1 shadow-inner">
                                        <span className="text-[7px] text-zinc-500 block uppercase font-bold tracking-wider">Live Reading</span>
                                        <span className="text-blue-400 font-mono text-[11px] font-black">{selectedSensor.last_read}</span>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col gap-1 shadow-inner">
                                        <span className="text-[7px] text-zinc-500 block uppercase font-bold tracking-wider">Node Status</span>
                                        <span className={`text-[9px] font-black uppercase tracking-wide ${selectedSensor.status === 'ONLINE' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {selectedSensor.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    )}
                </Map>
            </DeckGL>

            {/* Prediction HUD */}
            <div className="absolute top-6 right-6 z-50 flex flex-col gap-3 items-end animate-in fade-in duration-500">
                <button 
                    onClick={() => setShowRiskMap(!showRiskMap)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-500 backdrop-blur-xl ${showRiskMap ? 'bg-orange-600/20 border-orange-500/50 text-orange-400 shadow-2xl' : 'bg-black/60 border-white/10 text-zinc-500 hover:text-zinc-300'}`}
                >
                    <TrendingUp size={14} className={showRiskMap ? 'animate-bounce' : ''} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {showRiskMap ? 'Risk Intelligence: LIVE' : 'Predictive Analysis'}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default DigitalTwinMap;
