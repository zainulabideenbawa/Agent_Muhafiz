/**
 * Core Tools for Muhafiz-X Agents
 * These functions connect the Agents to the Backend REST APIs.
 */

const BACKEND_URL = "http://127.0.0.1:3001";

/**
 * Tool for The Truth-Engine: Connects to /tools/vitals
 */
export const get_city_vitals = async (location) => {
    console.log(`[Agent Tool] Fetching vitals from API for: ${location}`);
    try {
        const response = await fetch(`${BACKEND_URL}/tools/vitals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location })
        });
        const data = await response.json();
        
        // Bug 1 Fix: return avg_temp and avg_humidity directly — Truth Engine reads these fields
        // The old nested 'weather' object was hiding them from the confidence heuristic
        return {
            location: location,
            avg_temp: data.avg_temp,
            avg_humidity: data.avg_humidity,
            traffic_speed_kmh: data.traffic_speed,
            route_eta_mins: data.route_eta_mins || null,
            rainfall_mm: data.rainfall,
            water_level_cm: data.water_level,
            data_source: data.source,
        };
    } catch (error) {
        console.error("Tool Error (vitals):", error);
        return { location, avg_temp: 30, avg_humidity: 65, traffic_speed_kmh: 40, route_eta_mins: null, rainfall_mm: 0, water_level_cm: 0 };
    }
};

/**
 * Direct TomTom Routing ETA — called by Strategist to get real traffic-aware ETA
 * from any hub coordinates to the incident coordinates.
 * @param {number} fromLat @param {number} fromLng - Hub / station origin
 * @param {number} toLat   @param {number} toLng   - Incident location
 * @returns {{ eta_mins: number, distance_km: number, delay_mins: number, source: string }}
 */
export const get_route_eta = async (fromLat, fromLng, toLat, toLng) => {
    const TOMTOM_KEY = process.env.TOMTOM_API_KEY;
    if (!TOMTOM_KEY) {
        const simEta = 10 + Math.floor(Math.random() * 20);
        return { eta_mins: simEta, distance_km: null, delay_mins: 0, source: 'Simulated' };
    }
    try {
        const url = `https://api.tomtom.com/routing/1/calculateRoute/${fromLat},${fromLng}:${toLat},${toLng}/json?key=${TOMTOM_KEY}&traffic=true&travelMode=van`;
        const res = await fetch(url);
        const data = await res.json();
        const summary = data.routes?.[0]?.summary;
        if (summary) {
            const eta_mins = Math.round(summary.travelTimeInSeconds / 60);
            const distance_km = Math.round(summary.lengthInMeters / 100) / 10;
            const delay_mins = Math.round((summary.trafficDelayInSeconds || 0) / 60);
            console.log(`[TomTom ETA] ✅ ${distance_km}km → ${eta_mins} min (delay: ${delay_mins} min)`);
            return { eta_mins, distance_km, delay_mins, source: 'TomTom Routing API (live)' };
        }
    } catch (e) {
        console.warn(`[TomTom ETA] Failed: ${e.message}`);
    }
    return { eta_mins: 15, distance_km: null, delay_mins: 0, source: 'Fallback' };
};

/**
 * Tool for The Strategist: Connects to /tools/resources
 */
export const get_resource_status = async (deptId) => {
    const targetDept = deptId || 'KMC_HEALTH';
    console.log(`[Agent Tool] Fetching granular resources for department: ${targetDept}`);
    try {
        const response = await fetch(`${BACKEND_URL}/api/department-resources/${targetDept}`);
        const hubs = await response.json();
        
        // Return the actual hubs so the Strategist can see locations
        return {
            department: targetDept,
            hubs: hubs.map(hub => ({
                id: hub.id,
                name: hub.name,
                location: hub.location,
                inventory: {
                    trucks: Array(hub.trucks).fill(0).map((_, i) => ({ id: `${hub.id}-TR-${i}`, status: "idle" })),
                    ambulances: Array(hub.ambulances).fill(0).map((_, i) => ({ id: `${hub.id}-AMB-${i}`, status: "idle" })),
                    officers: Array(hub.officers).fill(0).map((_, i) => ({ id: `${hub.id}-OFF-${i}`, status: "ready" }))
                }
            }))
        };
    } catch (error) {
        console.error("Tool Error (resources):", error);
        return { department: targetDept, hubs: [] };
    }
};

/**
 * Tool for The Oracle: Connects to /tools/simulate
 */
export const run_impact_simulation = async (action_plan) => {
    console.log(`[Agent Tool] Running simulation via API`);
    try {
        const response = await fetch(`${BACKEND_URL}/tools/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action_plan })
        });
        const data = await response.json();
        
        return {
            success_probability: data.approved ? 0.9 : 0.3,
            simulation_log: `Approved: ${data.approved}. Time Saved: ${data.time_saved_minutes} mins. Congestion: ${data.congestion_reduction_percent}%`,
            approved: data.approved
        };
    } catch (error) {
        console.error("Tool Error (simulate):", error);
        return { success_probability: 0.5, approved: false, simulation_log: "Simulation API unreachable" };
    }
};

/**
 * Tool for Google Maps Geocoding API — now upgraded to Nominatim (OpenStreetMap).
 * Nominatim is 100% free with NO API KEY required.
 * Falls back to Google Maps if GOOGLE_API_KEY is present.
 */
export const get_gps_from_google_maps = async (landmark) => {
    console.log(`[Geocoder] Resolving landmark: "${landmark}"`);

    // Primary: Nominatim (OpenStreetMap) — free, no key needed
    try {
        const query = encodeURIComponent(`${landmark}, Karachi, Pakistan`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=pk`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'MuhafizX-SovereignOS/1.0 (crisis-management)' }
        });
        const data = await res.json();
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            console.log(`[Geocoder/Nominatim] ✅ ${landmark} → lat=${parseFloat(lat).toFixed(4)}, lng=${parseFloat(lon).toFixed(4)}`);
            return { lat: parseFloat(lat), lng: parseFloat(lon) };
        }
    } catch (e) {
        console.warn(`[Geocoder/Nominatim] Failed: ${e.message}`);
    }

    // Secondary: Google Maps (if key is set)
    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey) {
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(landmark + ", Karachi")}&key=${apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.status === 'OK' && data.results?.length > 0) {
                const loc = data.results[0].geometry.location;
                console.log(`[Geocoder/Google] ✅ ${landmark} → lat=${loc.lat}, lng=${loc.lng}`);
                return { lat: loc.lat, lng: loc.lng };
            }
        } catch (e) {
            console.warn(`[Geocoder/Google] Failed: ${e.message}`);
        }
    }

    console.warn(`[Geocoder] Both Nominatim and Google failed. Using hardcoded fallback for "${landmark}"`);
    return get_fallback_coordinates(landmark);
};

/**
 * Tool for The Strategist — Overpass API (OpenStreetMap)
 * Finds the REAL nearest hospital, fire station, or police station
 * to the incident location. 100% free, no API key.
 */
export const get_nearest_infrastructure = async (lat, lng, crisisType) => {
    const amenityMap = {
        fire: 'fire_station',
        flood: 'hospital',
        blast: 'hospital',
        protest: 'police',
    };
    const amenity = amenityMap[(crisisType || '').toLowerCase()] || 'hospital';
    const radius = 5000; // 5km search radius

    console.log(`[Overpass] Searching for nearest ${amenity} within ${radius}m of lat=${lat}, lng=${lng}`);

    try {
        const query = `[out:json][timeout:10];node[amenity=${amenity}](around:${radius},${lat},${lng});out body 3;`;
        // Try primary Overpass endpoint, fall back to alternate if rate-limited
        const endpoints = [
            'https://overpass-api.de/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter',
        ];
        for (const endpoint of endpoints) {
            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    body: `data=${encodeURIComponent(query)}`,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
                const contentType = res.headers.get('content-type') || '';
                if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
                    console.warn(`[Overpass] ${endpoint} returned non-JSON (${contentType}), trying next endpoint.`);
                    continue;
                }
                const data = await res.json();
                if (data.elements && data.elements.length > 0) {
                    const results = data.elements.map(el => ({
                        name: el.tags?.name || el.tags?.['name:en'] || `${amenity} facility`,
                        lat: el.lat,
                        lng: el.lon,
                        type: amenity,
                    }));
                    console.log(`[Overpass] ✅ Found ${results.length} ${amenity}(s): ${results.map(r => r.name).join(', ')}`);
                    return { found: true, results, amenity };
                }
                break; // got valid JSON but 0 results — stop trying
            } catch (innerErr) {
                console.warn(`[Overpass] ${endpoint} error: ${innerErr.message}`);
            }
        }
    } catch (e) {
        console.warn(`[Overpass] Outer query error: ${e.message}`);
    }

    return { found: false, results: [], amenity };
};

/**
 * Tool for The Analyst — Open-Meteo Forecast
 * Gets a 6-hour hourly rainfall forecast for Karachi.
 * 100% free, NO API KEY required.
 */
export const get_rainfall_forecast = async (lat, lng) => {
    console.log(`[Open-Meteo] Fetching 6h rainfall forecast for lat=${lat}, lng=${lng}`);
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=precipitation,temperature_2m,relativehumidity_2m&forecast_days=1&timezone=Asia%2FKarachi`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.hourly) {
            const now = new Date();
            const currentHour = now.getHours();
            // Next 6 hours of data
            const next6h = data.hourly.precipitation.slice(currentHour, currentHour + 6);
            const totalRain = next6h.reduce((a, b) => a + b, 0);
            const peakRain = Math.max(...next6h);
            const currentTemp = data.hourly.temperature_2m[currentHour];
            const currentHumidity = data.hourly.relativehumidity_2m[currentHour];

            console.log(`[Open-Meteo] ✅ Next 6h rainfall: ${totalRain.toFixed(1)}mm total, peak ${peakRain.toFixed(1)}mm/h`);
            return {
                source: 'Open-Meteo (live forecast)',
                total_rainfall_6h_mm: parseFloat(totalRain.toFixed(1)),
                peak_rainfall_mmph: parseFloat(peakRain.toFixed(1)),
                current_temp: currentTemp,
                current_humidity: currentHumidity,
                flood_risk: totalRain > 20 ? 'HIGH' : totalRain > 5 ? 'MODERATE' : 'LOW',
            };
        }
    } catch (e) {
        console.warn(`[Open-Meteo] Failed: ${e.message}`);
    }
    return { source: 'unavailable', total_rainfall_6h_mm: 0, flood_risk: 'UNKNOWN' };
};

/**
 * Tool for The Truth-Engine — NASA FIRMS (Fire Information for Resource Management)
 * Cross-references fire reports against real NASA satellite-detected active fire zones.
 * Free with no API key for basic queries.
 */
export const check_nasa_firms_fire = async (lat, lng) => {
    console.log(`[NASA FIRMS] Checking satellite fire data for lat=${lat}, lng=${lng}`);
    try {
        const nasaKey = process.env.NASA_FIRMS_KEY || 'DEMO_KEY';
        // VIIRS satellite, 1-day lookback, 0.5 degree radius (~55km)
        const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${nasaKey}/VIIRS_SNPP_NRT/${lng - 0.5},${lat - 0.5},${lng + 0.5},${lat + 0.5}/1`;
        const res = await fetch(url);
        const text = await res.text();
        const lines = text.trim().split('\n').filter(l => !l.startsWith('latitude'));

        if (lines.length > 0 && lines[0].length > 5) {
            console.log(`[NASA FIRMS] ✅ ${lines.length} active fire pixel(s) detected by satellite near incident zone!`);
            return { satellite_confirmed: true, fire_pixels: lines.length, source: 'NASA VIIRS Satellite (live)' };
        }
        console.log(`[NASA FIRMS] No active fire pixels detected in satellite data.`);
        return { satellite_confirmed: false, fire_pixels: 0, source: 'NASA VIIRS Satellite (live)' };
    } catch (e) {
        console.warn(`[NASA FIRMS] Query failed: ${e.message}`);
        return { satellite_confirmed: false, fire_pixels: 0, source: 'unavailable' };
    }
};

const get_fallback_coordinates = (landmark) => {
    const name = (landmark || "").toLowerCase();
    if (name.includes("nipa") || name.includes("gulshan")) {
        return { lng: 67.09, lat: 24.92 };
    }
    if (name.includes("saddar")) {
        return { lng: 67.03, lat: 24.86 };
    }
    if (name.includes("clifton")) {
        return { lng: 67.04, lat: 24.81 };
    }
    if (name.includes("defence") || name.includes("dha")) {
        return { lng: 67.06, lat: 24.82 };
    }
    if (name.includes("karsaz")) {
        return { lng: 67.07, lat: 24.88 };
    }
    // Deterministic offset for other areas
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offsetLng = ((hash % 100) / 1000) - 0.05;
    const offsetLat = (((hash >> 2) % 100) / 1000) - 0.05;
    return { lng: 67.05 + offsetLng, lat: 24.89 + offsetLat };
};

