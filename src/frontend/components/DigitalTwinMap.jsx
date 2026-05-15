import React, { useState } from "react";
import Map, { Source, Layer, Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = "pk.eyJ1IjoiemFpbmJhd2EiLCJhIjoiY21wNzd3dHA5MDE1djJycXVmMXk3NW5yOSJ9.YDIdVPYdoQeSkqTVArC2TA";

const DigitalTwinMap = ({ incidents = [] }) => {
  const [viewState, setViewState] = useState({
    longitude: 67.0011,
    latitude: 24.8607,
    zoom: 11.5,
    pitch: 45,
    bearing: 0
  });

  // Karachi Tactical Hotspots
  const getCoordinates = (landmark) => {
    const locations = {
      "NIPA Chowrangi": [67.0982, 24.9174],
      "Saddar": [67.0300, 24.8600],
      "Clifton": [67.0333, 24.8167],
      "Gulshan": [67.0900, 24.9300],
      "Defence": [67.0667, 24.8000],
      "Nazimabad": [67.0333, 24.9167],
      "Landhi": [67.1833, 24.8500],
    };
    return locations[landmark] || [67.0011, 24.8607];
  };

  const getMarkerColor = (type) => {
    switch (type) {
      case 'urban_flood': return '#ef4444'; // Red
      case 'fire': return '#f97316'; // Orange
      case 'civil_unrest': return '#8b5cf6'; // Purple
      default: return '#10b981'; // Emerald
    }
  };

  return (
    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
      terrain={{ source: "mapbox-dem", exaggeration: 1.5 }}
    >
      <Source
        id="mapbox-dem"
        type="raster-dem"
        url="mapbox://mapbox.mapbox-terrain-dem-v1"
        tileSize={512}
        maxzoom={14}
      />

      {incidents.map((incident, idx) => {
        const [lng, lat] = getCoordinates(incident.location?.landmark);
        const color = getMarkerColor(incident.type);
        
        return (
          <React.Fragment key={incident.id || idx}>
            {/* Pulsing Crisis Marker with Label */}
            <Marker longitude={lng} latitude={lat} anchor="bottom">
              <div className="relative flex flex-col items-center">
                {/* Floating Label */}
                <div className="absolute -top-10 px-3 py-1 bg-black/80 border border-white/20 rounded-md backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-500 whitespace-nowrap z-50">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest" style={{ color }}>{incident.type.replace('_', ' ')}</span>
                    <span className="text-[10px] font-bold text-white uppercase">{incident.location?.landmark}</span>
                  </div>
                  {/* Small arrow */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 border-r border-b border-white/20 rotate-45" />
                </div>

                <div className="relative flex items-center justify-center mt-2">
                  <div 
                    className="absolute w-12 h-12 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: color }}
                  />
                  <div 
                    className="relative w-4 h-4 rounded-full border-2 border-white shadow-lg"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            </Marker>

            {/* Tactical Zone (Circle) */}
            <Source
              id={`zone-${idx}`}
              type="geojson"
              data={{
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [lng, lat]
                }
              }}
            >
              <Layer
                id={`layer-zone-${idx}`}
                type="circle"
                paint={{
                  'circle-radius': 40,
                  'circle-color': color,
                  'circle-opacity': 0.1,
                  'circle-stroke-width': 1,
                  'circle-stroke-color': color,
                  'circle-stroke-opacity': 0.3
                }}
              />
            </Source>
          </React.Fragment>
        );
      })}

      {/* Hospital Indicators */}
      <Marker longitude={67.1147} latitude={24.8913} anchor="bottom">
        <div className="bg-emerald-500/20 border border-emerald-500 p-1 rounded text-[8px] font-bold text-emerald-500 backdrop-blur-sm">
          AGA KHAN HOSPITAL
        </div>
      </Marker>
      <Marker longitude={67.1189} latitude={24.8322} anchor="bottom">
        <div className="bg-emerald-500/20 border border-emerald-500 p-1 rounded text-[8px] font-bold text-emerald-500 backdrop-blur-sm">
          INDUS HOSPITAL
        </div>
      </Marker>
    </Map>
  );
};

export default DigitalTwinMap;
