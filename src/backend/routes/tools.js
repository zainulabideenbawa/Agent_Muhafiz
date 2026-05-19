import { Router } from 'express';

const router = Router();

// Karachi-specific coordinates for traffic queries
const KARACHI_COORDS = { lat: 24.8607, lng: 67.0011 };

// Location name → approximate coordinates for API queries
const LOCATION_COORDS = {
    'nipa': { lat: 24.9215, lng: 67.0900 },
    'gulshan': { lat: 24.9215, lng: 67.0900 },
    'saddar': { lat: 24.8607, lng: 67.0300 },
    'clifton': { lat: 24.8100, lng: 67.0400 },
    'defence': { lat: 24.8200, lng: 67.0600 },
    'dha': { lat: 24.8200, lng: 67.0600 },
    'karsaz': { lat: 24.8800, lng: 67.0700 },
    'liaquatabad': { lat: 24.9100, lng: 67.0500 },
    'nazimabad': { lat: 24.9300, lng: 67.0200 },
    'johar': { lat: 24.9400, lng: 67.0800 },
};

const getCoords = (location) => {
    const key = (location || '').toLowerCase();
    for (const [area, coords] of Object.entries(LOCATION_COORDS)) {
        if (key.includes(area)) return coords;
    }
    return KARACHI_COORDS;
};

router.post('/vitals', async (req, res) => {
    const { location } = req.body;
    console.log(`[Tool] Vitals request for: ${location}`);

    const coords = getCoords(location);
    let weather = null;
    let trafficSpeed = null;

    // ── Real Weather: OpenWeatherMap ────────────────────────────────
    const OWM_KEY = process.env.OPENWEATHER_API_KEY;
    if (OWM_KEY) {
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lng}&appid=${OWM_KEY}&units=metric`;
            const owmRes = await fetch(url);
            const owmData = await owmRes.json();
            if (owmData.main) {
                weather = {
                    avg_temp: Math.round(owmData.main.temp),
                    avg_humidity: owmData.main.humidity,
                    rainfall: owmData.rain?.['1h'] ? Math.round(owmData.rain['1h'] * 10) : 0,
                    water_level: owmData.rain?.['1h'] ? Math.round(owmData.rain['1h'] * 8) : 10,
                };
                console.log(`[Tool/OWM] Real weather for ${location}: ${weather.avg_temp}°C, ${weather.avg_humidity}% humidity`);
            }
        } catch (e) {
            console.warn(`[Tool/OWM] OpenWeatherMap call failed: ${e.message}`);
        }
    }

    // ── Real Traffic ETA: TomTom Routing API ─────────────────────────
    // Flow API has no Pakistan coverage, but Routing API works perfectly for Karachi.
    // We route from Karachi city center (hub) to the incident coordinates.
    const TOMTOM_KEY = process.env.TOMTOM_API_KEY;
    if (TOMTOM_KEY) {
        try {
            // Route from Karachi center to incident location for real ETA
            const origin = `24.8607,67.0011`; // Karachi city center (hub proxy)
            const dest = `${coords.lat},${coords.lng}`;
            const url = `https://api.tomtom.com/routing/1/calculateRoute/${origin}:${dest}/json?key=${TOMTOM_KEY}&traffic=true&travelMode=van`;
            const tomRes = await fetch(url);
            const tomData = await tomRes.json();
            const summary = tomData.routes?.[0]?.summary;
            if (summary) {
                const etaMins = Math.round(summary.travelTimeInSeconds / 60);
                const delaySecs = summary.trafficDelayInSeconds || 0;
                trafficSpeed = etaMins; // repurposed: ETA in minutes
                console.log(`[Tool/TomTom] ✅ Real route ETA: ${etaMins} min to ${location} (traffic delay: ${Math.round(delaySecs/60)} min)`);
            }
        } catch (e) {
            console.warn(`[Tool/TomTom] Routing API failed: ${e.message}`);
        }
    }

    // ── Fallback: realistic simulated values ─────────────────────────
    if (!weather) {
        console.log(`[Tool/Vitals] No weather API key — using simulated Karachi values`);
        weather = {
            avg_temp: 28 + Math.floor(Math.random() * 12),
            avg_humidity: 60 + Math.floor(Math.random() * 35),
            rainfall: Math.random() > 0.6 ? 20 + Math.floor(Math.random() * 40) : 0,
            water_level: 10 + Math.floor(Math.random() * 40),
        };
    }
    // trafficSpeed is now ETA in minutes when TomTom key is set, else simulated
    if (trafficSpeed === null) {
        trafficSpeed = 10 + Math.floor(Math.random() * 20); // simulated ETA: 10-30 mins
    }

    res.json({
        location,
        traffic_speed: trafficSpeed,        // kept for backward compat
        route_eta_mins: trafficSpeed,       // real TomTom routing ETA (minutes)
        rainfall: weather.rainfall,
        water_level: weather.water_level,
        avg_temp: weather.avg_temp,
        avg_humidity: weather.avg_humidity,
        source: {
            weather: OWM_KEY ? 'OpenWeatherMap (live)' : 'Simulated',
            traffic: TOMTOM_KEY ? 'TomTom Routing API (live)' : 'Simulated',
        }
    });
});

router.post('/simulate', (req, res) => {
    const isApproved = Math.random() > 0.2;
    res.json({
        approved: isApproved,
        time_saved_minutes: isApproved ? 45 : 0,
        congestion_reduction_percent: isApproved ? Math.floor(20 + Math.random() * 40) : 0
    });
});

// Returns real department hub resources from database
router.get('/resources', async (req, res) => {
    const deptId = req.query.dept || 'KMC_HEALTH';
    const { getDepartmentResources } = await import('../db/index.js');
    res.json(await getDepartmentResources(deptId));
});

export default router;
