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

    // ── Fire stations ──────────────────────────────────────────────────────────
    if (name.includes("saddar") || name.includes("fire station road")) return { lng: 67.0250, lat: 24.8739 };
    if (name.includes("site") || name.includes("s.i.t.e")) return { lng: 67.0100, lat: 24.9200 };
    if (name.includes("landhi")) return { lng: 67.1400, lat: 24.8500 };
    if (name.includes("korangi")) return { lng: 67.1200, lat: 24.8350 };
    if (name.includes("malir")) return { lng: 67.1900, lat: 24.8950 };
    if (name.includes("liaquatabad")) return { lng: 67.0700, lat: 24.9100 };
    if (name.includes("north karachi") || name.includes("nk hub")) return { lng: 67.0650, lat: 24.9700 };
    if (name.includes("surjani")) return { lng: 67.0400, lat: 25.0100 };
    if (name.includes("orangi") || name.includes("baldia")) return { lng: 66.9850, lat: 24.9400 };
    if (name.includes("lyari")) return { lng: 66.9950, lat: 24.8600 };
    if (name.includes("clifton") || name.includes("boat basin")) return { lng: 67.0250, lat: 24.8050 };
    if (name.includes("defence") || name.includes("dha")) return { lng: 67.0750, lat: 24.8100 };
    if (name.includes("gulshan") || name.includes("johar")) return { lng: 67.0900, lat: 24.9100 };
    if (name.includes("nazimabad")) return { lng: 67.0600, lat: 24.9200 };
    if (name.includes("fb area") || name.includes("federal b")) return { lng: 67.0700, lat: 24.9400 };
    if (name.includes("nipa")) return { lng: 67.0900, lat: 24.9215 };

    // ── Police / Emergency ────────────────────────────────────────────────────
    if (name.includes("cpo") || name.includes("central police office") ||
        name.includes("police office") || name.includes("police hq")) return { lng: 67.0340, lat: 24.8740 };
    if (name.includes("edhi") || name.includes("sohrab goth")) return { lng: 67.0600, lat: 24.9500 };
    if (name.includes("aga khan") || name.includes("akuh")) return { lng: 67.0747, lat: 24.8922 };
    if (name.includes("jinnah") || name.includes("jpmc")) return { lng: 67.0426, lat: 24.8528 };
    if (name.includes("indus")) return { lng: 67.1211, lat: 24.8504 };
    if (name.includes("central") || name.includes("main hub") ||
        name.includes("central emergency") || name.includes("city hub")) return { lng: 67.0300, lat: 24.8700 };
    if (name.includes("rescue") && name.includes("1122")) return { lng: 67.0900, lat: 24.9215 };

    // ── Department fallbacks (spread across the city, not at the same spot) ──
    if (dept === 'FIRE_BRIGADE') return { lng: 67.0250, lat: 24.8739 }; // Saddar Fire HQ
    if (dept === 'POLICE_FORCE') return { lng: 67.0340, lat: 24.8740 }; // CPO
    if (dept === 'RESCUE_1122') return { lng: 67.0900, lat: 24.9215 }; // NIPA
    if (dept === 'KMC_HEALTH') return { lng: 67.0426, lat: 24.8528 }; // JPMC

    console.warn(`[DigitalTwinMap] Unresolved hub: "${hubName}" (dept=${dept}) — using Saddar Fire HQ fallback.`);
    return { lng: 67.0250, lat: 24.8739 }; // Safe geographic fallback
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
    const [hoveredRoute, setHoveredRoute] = useState(null);
    const [clickedRoute, setClickedRoute] = useState(null);
    const [activeHubCoords, setActiveHubCoords] = useState(null); // Hub origin pin

    const onMapMouseMove = (event) => {
        const { features, lngLat } = event;
        const hoveredFeature = features && features.find(f =>
            f.layer.id === 'route-line' ||
            f.layer.id === 'route-glow' ||
            f.layer.id === 'blocked-route-line'
        );

        if (hoveredFeature) {
            setHoveredRoute({
                type: (hoveredFeature.layer.id === 'route-line' || hoveredFeature.layer.id === 'route-glow') ? 'perfect' : 'blocked',
                lng: lngLat.lng,
                lat: lngLat.lat
            });
        } else {
            setHoveredRoute(null);
        }
    };

    const onMapMouseLeave = () => {
        setHoveredRoute(null);
    };

    const onMapClick = (event) => {
        const { features, lngLat } = event;
        const clickedFeature = features && features.find(f =>
            f.layer.id === 'route-line' ||
            f.layer.id === 'route-glow' ||
            f.layer.id === 'blocked-route-line'
        );

        if (clickedFeature) {
            setClickedRoute({
                type: (clickedFeature.layer.id === 'route-line' || clickedFeature.layer.id === 'route-glow') ? 'perfect' : 'blocked',
                lng: lngLat.lng,
                lat: lngLat.lat
            });
        } else {
            setClickedRoute(null);
        }
    };

    useEffect(() => {
        setHoveredRoute(null);
        setClickedRoute(null);
        if (selectedIncident && selectedIncident.location) {
            const hubName = selectedIncident.data?.action_plan?.deployment?.hub;
            const hubCoords = resolveHubCoordinates(hubName, selectedIncident.department);
            const incCoords = { lng: selectedIncident.location.lng, lat: selectedIncident.location.lat };

            console.log(`[DigitalTwinMap] Routing: hub="${hubName || '(none)'}" → [${hubCoords.lng.toFixed(4)}, ${hubCoords.lat.toFixed(4)}] → crisis [${incCoords.lng.toFixed(4)}, ${incCoords.lat.toFixed(4)}]`);

            // Fit map to show both hub and crisis with padding
            const midLng = (hubCoords.lng + incCoords.lng) / 2;
            const midLat = (hubCoords.lat + incCoords.lat) / 2;
            const spread = Math.max(
                Math.abs(hubCoords.lng - incCoords.lng),
                Math.abs(hubCoords.lat - incCoords.lat)
            );
            const zoom = spread < 0.02 ? 14 : spread < 0.05 ? 13 : spread < 0.1 ? 12 : 11;

            setViewState(prev => ({
                ...prev,
                longitude: midLng,
                latitude: midLat,
                zoom,
                transitionDuration: 1500
            }));

            setActiveHubCoords(hubCoords);

            const hasSimulation = selectedIncident.data?.simulation || selectedIncident.data?.oracle_reroute;

            if (hasSimulation) {
                const altCoords = generateAlternativeRouteCoordinates(hubCoords, incCoords);
                const origCoords = generateRouteCoordinates(hubCoords, incCoords);

                setRouteGeoJson({
                    type: 'Feature',
                    properties: { routeType: 'perfect' },
                    geometry: { type: 'LineString', coordinates: altCoords }
                });
                setBlockedRouteGeoJson({
                    type: 'Feature',
                    properties: { routeType: 'blocked' },
                    geometry: { type: 'LineString', coordinates: origCoords }
                });
            } else {
                const coords = generateRouteCoordinates(hubCoords, incCoords);
                setRouteGeoJson({
                    type: 'Feature',
                    properties: { routeType: 'perfect' },
                    geometry: { type: 'LineString', coordinates: coords }
                });
                setBlockedRouteGeoJson(null);
            }
        } else {
            setRouteGeoJson(null);
            setBlockedRouteGeoJson(null);
            setActiveHubCoords(null);
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
        switch (type) {
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
            <Map
                {...viewState}
                onMove={e => setViewState(e.viewState)}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                interactiveLayerIds={['route-line', 'route-glow', 'blocked-route-line']}
                onMouseMove={onMapMouseMove}
                onMouseLeave={onMapMouseLeave}
                onClick={onMapClick}
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

                {/* Filter and display only the newest high‑priority incidents */}
                {(() => {
                    const MAX_ALERTS = 3; // limit number of alerts shown
                    const PRIORITY_THRESHOLD = 7; // urgency rating threshold (higher = more urgent)
                    // Assume incident has a timestamp field; fallback to id order if missing
                    const sorted = [...incidents].sort((a, b) => {
                        const tA = new Date(a.timestamp || a.id);
                        const tB = new Date(b.timestamp || b.id);
                        return tB - tA;
                    });
                    const highPri = sorted.filter(i => (i.data?.classification?.urgency ?? 0) >= PRIORITY_THRESHOLD);
                    const displayed = highPri.slice(0, MAX_ALERTS);
                    return displayed.map((incident, idx) => (
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
                                {/* Blinking red pulse without extra status icon */}
                                <div className="animate-ping absolute w-8 h-8 rounded-full opacity-40 bg-red-500" />
                                <div className="w-4 h-4 rounded-full bg-red-600" />
                            </div>
                        </Marker>
                    ));
                })()}

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

                {/* Hub Origin Marker */}
                {activeHubCoords && (
                    <Marker
                        longitude={activeHubCoords.lng}
                        latitude={activeHubCoords.lat}
                        offsetLeft={-12}
                        offsetTop={-12}
                    >
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-red-600 flex items-center justify-center shadow-lg">
                            {/* Hub icon – simple lightning bolt for visual impact */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                        </div>
                    </Marker>
                )}

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
                        longitude={hoveredIncident.location_lng ?? hoveredIncident.location?.lng ?? 67.05}
                        latitude={hoveredIncident.location_lat ?? hoveredIncident.location?.lat ?? 24.89}
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

                {/* Route Hover/Click Popup */}
                {(hoveredRoute || clickedRoute) && (
                    <Popup
                        longitude={hoveredRoute?.lng || clickedRoute?.lng}
                        latitude={hoveredRoute?.lat || clickedRoute?.lat}
                        anchor="bottom"
                        closeButton={true}
                        closeOnClick={false}
                        onClose={() => {
                            setClickedRoute(null);
                            setHoveredRoute(null);
                        }}
                    >
                        <div className="bg-zinc-950/95 border border-white/10 rounded-xl p-3.5 shadow-2xl text-zinc-300 pointer-events-auto select-none flex flex-col gap-1.5 min-w-[200px] max-w-[280px]">
                            {(hoveredRoute?.type || clickedRoute?.type) === 'perfect' ? (
                                <>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Perfect Route</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-200 leading-snug">
                                        AI-optimized dispatch corridor. Minimized latency and clear channels.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Avoid This Route</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-200 leading-snug">
                                        Avoid this main route because of traffic at <span className="text-red-400 font-bold uppercase">{selectedIncident?.location?.landmark || "Incident Location"}</span>.
                                    </p>
                                </>
                            )}
                        </div>
                    </Popup>
                )}

                {/* Incident Tactical Tooltip Popup */}
                {selectedIncidentTooltip && (
                    <Popup
                        longitude={selectedIncidentTooltip.location_lng ?? selectedIncidentTooltip.location?.lng ?? 67.05}
                        latitude={selectedIncidentTooltip.location_lat ?? selectedIncidentTooltip.location?.lat ?? 24.89}
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

            <DeckGL
                viewState={viewState}
                layers={layers}
                style={{ pointerEvents: 'none', position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
            />

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
