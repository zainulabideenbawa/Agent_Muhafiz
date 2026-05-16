const CITY_SENSORS = [
    { id: 'SEN-NIPA-W', name: 'NIPA Water Node', type: 'WATER_LEVEL', lat: 24.9175, lng: 67.0970 },
    { id: 'SEN-SAD-A', name: 'Saddar Air Station', type: 'AIR_QUALITY', lat: 24.8615, lng: 67.0099 },
    { id: 'SEN-CLI-W', name: 'Clifton Wind Node', type: 'WIND_SPEED', lat: 24.8138, lng: 67.0333 },
    { id: 'SEN-DEF-H', name: 'DHA Heat Sensor', type: 'TEMPERATURE', lat: 24.8250, lng: 67.0650 },
    { id: 'SEN-NAZ-A', name: 'Nazimabad AQI Node', type: 'AIR_QUALITY', lat: 24.9167, lng: 67.0333 },
    { id: 'SEN-GUL-H', name: 'Gulshan Humidity', type: 'HUMIDITY', lat: 24.9300, lng: 67.0900 },
    { id: 'SEN-MAL-T', name: 'Malir Temp Node', type: 'TEMPERATURE', lat: 24.8833, lng: 67.1833 },
    { id: 'SEN-KOR-A', name: 'Korangi Industrial AQI', type: 'AIR_QUALITY', lat: 24.8333, lng: 67.1167 },
    { id: 'SEN-LYA-W', name: 'Lyari Water Node', type: 'WATER_LEVEL', lat: 24.8667, lng: 66.9833 },
    { id: 'SEN-ORA-T', name: 'Orangi Heat Node', type: 'TEMPERATURE', lat: 24.9500, lng: 66.9667 },
    { id: 'SEN-SUR-A', name: 'Surjani AQI Station', type: 'AIR_QUALITY', lat: 25.0167, lng: 67.0667 },
    { id: 'SEN-FED-H', name: 'Federal B Humidity', type: 'HUMIDITY', lat: 24.9167, lng: 67.0667 },
    { id: 'SEN-NIPA-SF', name: 'NIPA Sewer Flow', type: 'SEWER_FLOW', lat: 24.9175, lng: 67.0970 },
    { id: 'SEN-UNI-SF', name: 'University Rd Flow', type: 'SEWER_FLOW', lat: 24.9200, lng: 67.1100 },
    { id: 'SEN-SHA-SF', name: 'Shaheed-e-Millat Flow', type: 'SEWER_FLOW', lat: 24.8700, lng: 67.0700 }
];

export const getCitySensors = () => {
    return CITY_SENSORS.map(s => ({
        ...s,
        last_read: s.type === 'AIR_QUALITY' ? (Math.random() * 200 + 50).toFixed(0) :
            s.type === 'SEWER_FLOW' ? (Math.random() * 5).toFixed(1) + ' m/s' :
                (Math.random() * 45).toFixed(1),
        status: s.type === 'SEWER_FLOW' && Math.random() > 0.8 ? 'CRITICAL' : (Math.random() > 0.05 ? 'ONLINE' : 'OFFLINE'),
        last_updated: new Date().toISOString()
    }));
};

export const getCityVitals = () => {
    const sensors = getCitySensors();
    const aqi = sensors.filter(s => s.type === 'AIR_QUALITY');
    const temp = sensors.filter(s => s.type === 'TEMPERATURE');
    const humidity = sensors.filter(s => s.type === 'HUMIDITY');

    return {
        avg_aqi: (aqi.reduce((acc, s) => acc + parseFloat(s.last_read), 0) / aqi.length).toFixed(0),
        avg_temp: (temp.reduce((acc, s) => acc + parseFloat(s.last_read), 0) / temp.length).toFixed(1),
        avg_humidity: (humidity.reduce((acc, s) => acc + parseFloat(s.last_read), 0) / humidity.length).toFixed(0),
        active_nodes: sensors.filter(s => s.status === 'ONLINE').length,
        total_nodes: sensors.length
    };
};

const DEPARTMENT_PERFORMANCE = {
    'KMC_HEALTH': {
        resolved: 1420, active: 12, avg_response: '14m', citizen_rating: 4.8,
        top_muhafiz: 'Officer Ahmed (Gulshan Hub)',
        monthly_incidents: [120, 150, 180, 140, 210, 190],
        hub_performance: [
            { name: 'Gulshan Hub', status: 'Optimal', resolved: 450 },
            { name: 'Saddar Central', status: 'High Load', resolved: 970 }
        ]
    },
    'FIRE_BRIGADE': {
        resolved: 850, active: 4, avg_response: '9m', citizen_rating: 4.9,
        top_muhafiz: 'Captain Raza (Central Stn)',
        monthly_incidents: [40, 55, 70, 45, 80, 65],
        hub_performance: [
            { name: 'Central Fire Stn', status: 'Optimal', resolved: 600 },
            { name: 'Landhi Hub', status: 'Optimal', resolved: 250 }
        ]
    },
    'POLICE_FORCE': {
        resolved: 3200, active: 45, avg_response: '11m', citizen_rating: 4.2,
        top_muhafiz: 'Insp. Zafar (Defence Precinct)',
        monthly_incidents: [400, 450, 520, 480, 600, 550],
        hub_performance: [
            { name: 'Defence Precinct', status: 'Optimal', resolved: 1800 },
            { name: 'Nazimabad Station', status: 'Strained', resolved: 1400 }
        ]
    },
    'RESCUE_1122': {
        resolved: 2100, active: 8, avg_response: '12m', citizen_rating: 4.7,
        top_muhafiz: 'Para. Sara (Clifton HQ)',
        monthly_incidents: [200, 230, 280, 210, 310, 270],
        hub_performance: [
            { name: 'Clifton HQ', status: 'Optimal', resolved: 2100 }
        ]
    }
};

export const getPerformanceStats = (deptId) => {
    return DEPARTMENT_PERFORMANCE[deptId] || DEPARTMENT_PERFORMANCE['KMC_HEALTH'];
};

export const getUrbanOptimization = () => {
    return {
        coverage_gaps: [
            { sector: 'MALIR_EAST', risk: 'HIGH', recommendation: 'ADD_AMBULANCE_HUB', logic: 'Avg response time > 18m' },
            { sector: 'NORTH_KARA', risk: 'CRITICAL', recommendation: 'DEPLOY_FLOOD_SENSOR', logic: 'High risk zone with 0 sensor density' },
            { sector: 'LYARI', risk: 'MEDIUM', recommendation: 'STATION_FIRE_BRIGADE', logic: 'Industrial density vs low asset count' }
        ],
        leaderboard: [
            { dept: 'RESCUE_1122', score: 98, status: 'ELITE', response: '8m' },
            { dept: 'FIRE_BRIGADE', score: 92, status: 'OPTIMAL', response: '11m' },
            { dept: 'POLICE_FORCE', score: 85, status: 'STRAINED', response: '14m' },
            { dept: 'KMC_HEALTH', score: 78, status: 'CRITICAL', response: '19m' }
        ],
        sensor_blindspots: [
            { lat: 24.95, lng: 67.12, reason: 'Zero telemetry in high-density residential' },
            { lat: 24.82, lng: 67.01, reason: 'Critical coastal monitoring gap' }
        ]
    };
};
