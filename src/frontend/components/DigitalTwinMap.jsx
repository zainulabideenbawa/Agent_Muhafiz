import React, { useState, useEffect } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/mapbox';

// You will need a Mapbox token to render the actual base map
// For now, we use a placeholder token or styling to let it render gracefully
const MAPBOX_TOKEN = "pk.eyJ1IjoiemFpbmJhd2EiLCJhIjoiY21wNzd3dHA5MDE1djJycXVmMXk3NW5yOSJ9.YDIdVPYdoQeSkqTVArC2TA"; 

const DigitalTwinMap = ({ activeCrisis, resolvedPlan }) => {
  const [viewState, setViewState] = useState({
    longitude: 67.0822, // Karachi NIPA Chowrangi area
    latitude: 24.9180,
    zoom: 13,
    pitch: 45, // 3D effect
    bearing: -17.6
  });

  // Mock polygon for Flood Area
  const floodPolygon = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [67.075, 24.910],
              [67.090, 24.910],
              [67.090, 24.925],
              [67.075, 24.925],
              [67.075, 24.910]
            ]
          ]
        }
      }
    ]
  };

  // Mock line for Reroute Path
  const reroutePath = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [67.070, 24.905],
            [67.080, 24.915],
            [67.085, 24.930]
          ]
        }
      }
    ]
  };

  return (
    <div className="w-full h-full relative bg-zinc-950 flex items-center justify-center">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Pulsing Red Polygon for Active Crisis */}
        {activeCrisis && !resolvedPlan && (
          <Source id="flood-data" type="geojson" data={floodPolygon}>
            <Layer
              id="flood-layer"
              type="fill"
              paint={{
                'fill-color': '#ef4444', // muhafiz-red
                'fill-opacity': 0.4,
                'fill-outline-color': '#ef4444'
              }}
            />
          </Source>
        )}

        {/* Sovereign Green Reroute Line for Resolved Crisis */}
        {resolvedPlan && (
          <Source id="reroute-data" type="geojson" data={reroutePath}>
            <Layer
              id="reroute-layer"
              type="line"
              paint={{
                'line-color': '#10b981', // muhafiz-green
                'line-width': 4,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}

        {/* Center Marker */}
        <Marker longitude={67.0822} latitude={24.9180} color={resolvedPlan ? '#10b981' : (activeCrisis ? '#ef4444' : '#818cf8')} />
      </Map>

      {/* Overlay info if no token is present */}
      <div className="absolute bottom-4 left-4 text-xs font-mono text-zinc-500 bg-zinc-900/80 px-3 py-1 rounded">
        MAPBOX_GL: DIGITAL TWIN ONLINE
      </div>
    </div>
  );
};

export default DigitalTwinMap;
