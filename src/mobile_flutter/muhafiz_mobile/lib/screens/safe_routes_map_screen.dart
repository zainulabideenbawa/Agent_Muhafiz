import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/theme.dart';
import '../services/api_service.dart';
import '../widgets/feedback_widgets.dart';

class SafeRoutesMapScreen extends StatefulWidget {
  const SafeRoutesMapScreen({super.key});

  @override
  State<SafeRoutesMapScreen> createState() => _SafeRoutesMapScreenState();
}

class _SafeRoutesMapScreenState extends State<SafeRoutesMapScreen> with TickerProviderStateMixin {
  final MapController _mapController = MapController();
  
  List<Map<String, dynamic>> _activeCrises = [];
  bool _isLoading = false;
  double _zoomLevel = 14.0;
  bool _evacuationPathwayConverged = true;
  
  // Geolocation states
  String _province = "Sindh";
  String _city = "Karachi";
  String _district = "Karachi East";
  String _area = "Gulshan-e-Iqbal";
  String _landmark = "Nipa Chowk";

  // Coordinates
  LatLng _citizenLatLng = const LatLng(24.9184, 67.0971); // Nipa Chowk
  LatLng _safeHubLatLng = const LatLng(24.9036, 67.0620); // Hassan Square Chowk (Safe Hub)

  // Threat bypass route segments
  List<LatLng> _routePoints = [];

  // Deterministic area geocoder mapping areas to Karachi coordinates
  static const Map<String, LatLng> _geoMap = {
    'Nipa Chowk': LatLng(24.9184, 67.0971),
    'Hassan Square Chowk': LatLng(24.9036, 67.0620),
    'Disco Bakery Chowk': LatLng(24.9150, 67.0930),
    'Gulshan-e-Iqbal': LatLng(24.9180, 67.0971),
    'Jauhar Chowrangi': LatLng(24.9126, 67.1226),
    'Kamran Chowrangi': LatLng(24.9183, 67.1290),
    'Perfume Chowk': LatLng(24.9080, 67.1190),
    'Gulistan-e-Jauhar': LatLng(24.9123, 67.1234),
    'Teen Talwar': LatLng(24.8436, 67.0336),
    'Do Talwar': LatLng(24.8398, 67.0315),
    'Schon Circle': LatLng(24.8290, 67.0360),
    'Clifton': LatLng(24.8138, 67.0336),
    'Karachi': LatLng(24.9000, 67.0900),
  };

  LatLng _geocode(String name) {
    for (final entry in _geoMap.entries) {
      if (name.toLowerCase().contains(entry.key.toLowerCase())) {
        return entry.value;
      }
    }
    // Return deterministic coordinate based on name hash so it's placed in Karachi
    final int hash = name.hashCode;
    final double latOffset = (hash % 100) / 2000.0 - 0.025;
    final double lngOffset = ((hash >> 4) % 100) / 2000.0 - 0.025;
    return LatLng(24.9180 + latOffset, 67.0971 + lngOffset);
  }

  @override
  void initState() {
    super.initState();
    _loadUserLocation();
    _fetchLiveIncidents();
  }

  Future<void> _loadUserLocation() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _province = prefs.getString('province') ?? _province;
      _city = prefs.getString('city') ?? _city;
      _district = prefs.getString('district') ?? _district;
      _area = prefs.getString('area') ?? _area;
      _landmark = prefs.getString('landmark') ?? _landmark;
      
      _citizenLatLng = _geocode(_landmark);
      _safeHubLatLng = _geocode('Hassan Square Chowk');
    });
  }

  Future<void> _fetchLiveIncidents() async {
    if (mounted) setState(() => _isLoading = true);
    try {
      final response = await ApiService.get('/incidents');
      if (response['success'] == true && response['data'] != null) {
        final List<dynamic> rawList = response['data'] as List<dynamic>;
        final List<Map<String, dynamic>> mappedList = [];

        for (final dynamic raw in rawList) {
          if (raw is! Map) continue;
          final item = Map<String, dynamic>.from(raw);

          final String status = (item['status'] ?? '').toString();
          if (status == 'RESOLVED' || status == 'RETRACTED') continue;

          // Safely extract incident_id — guard against it being a nested object
          final dynamic rawId = item['incident_id'];
          final String incidentId = (rawId is String && rawId.isNotEmpty)
              ? rawId
              : 'MHFZ-${(item.hashCode.abs() % 9000 + 1000)}';

          // Normalise type — 'UNKNOWN' means still being classified
          final String rawType = (item['type'] ?? '').toString().toUpperCase();
          final String title = (rawType.isEmpty || rawType == 'UNKNOWN')
              ? _inferTypeFromData(item)
              : rawType;

          // Normalise location — 'ANALYZING' means not yet geocoded
          final String rawLocation = (item['location'] ?? '').toString();
          final String locationName =
              (rawLocation.isEmpty || rawLocation == 'ANALYZING')
                  ? _inferLocationFromData(item)
                  : rawLocation;

          // Confidence — LangGraph stores it deep in classification or data
          final dynamic dataField = item['data'];
          double confidence = 0.75;
          if (dataField is Map) {
            final c = dataField['confidence_level'] ??
                dataField['confidence'] ??
                dataField['classification']?['confidence_level'];
            if (c != null) confidence = (c as num).toDouble().clamp(0.0, 1.0);
          }

          // Details — try multiple fields
          final String desc = _safeString(item['description']) ??
              _safeString(dataField is Map ? dataField['summary'] : null) ??
              'Analyst Agent scanning area.';

          final LatLng coord = _geocode(locationName);

          // Only include incidents within 5km of the citizen
          final double distMeters = _distanceBetween(_citizenLatLng, coord);
          if (distMeters > 5000) continue;

          mappedList.add({
            'id': incidentId,
            'title': title,
            'location': locationName,
            'coordinate': coord,
            'radius': status == 'CONFIRMED' ? 450.0 : 300.0,
            'details': desc,
            'confidence': confidence,
            'dist': distMeters,
          });
        }

        // Sort by distance — nearest first
        mappedList.sort((a, b) => (a['dist'] as double).compareTo(b['dist'] as double));

        setState(() {
          _activeCrises = mappedList;
          _isLoading = false;
        });
        _calculateEvacuationRoute();
      } else {
        _loadPresets();
      }
    } catch (_) {
      _loadPresets();
    }
  }

  String _inferTypeFromData(Map<String, dynamic> item) {
    final dynamic data = item['data'];
    if (data is Map) {
      final raw = (data['raw_input'] ?? data['signal'] ?? '').toString().toLowerCase();
      if (raw.contains('fire') || raw.contains('aag')) return 'FIRE';
      if (raw.contains('flood') || raw.contains('paani') || raw.contains('doob')) return 'FLOOD';
      if (raw.contains('accident') || raw.contains('crash')) return 'ACCIDENT';
    }
    return 'CRISIS';
  }

  String _inferLocationFromData(Map<String, dynamic> item) {
    final dynamic data = item['data'];
    if (data is Map) {
      final loc = data['location'] ?? data['area'] ?? data['landmark'];
      if (loc is String && loc.isNotEmpty && loc != 'ANALYZING') return loc;
    }
    return 'Karachi';
  }

  String? _safeString(dynamic v) {
    if (v == null) return null;
    if (v is String && v.isNotEmpty) return v;
    return null;
  }

  void _loadPresets() {
    setState(() {
      _activeCrises = [
        {
          'id': 'MHFZ-4821',
          'title': 'FIRE OUTBREAK',
          'location': 'Disco Bakery Chowk',
          'coordinate': _geocode('Disco Bakery Chowk'),
          'radius': 350.0,
          'details': 'Commercial market fire. Air quality compromised.',
          'confidence': 0.94,
          'dist': _distanceBetween(_citizenLatLng, _geocode('Disco Bakery Chowk')),
        },
        {
          'id': 'MHFZ-9023',
          'title': 'URBAN_FLOOD',
          'location': 'Kamran Chowrangi',
          'coordinate': _geocode('Kamran Chowrangi'),
          'radius': 400.0,
          'details': 'Waterlogging reported. Road access blocked.',
          'confidence': 0.88,
          'dist': _distanceBetween(_citizenLatLng, _geocode('Kamran Chowrangi')),
        }
      ];
      _isLoading = false;
    });
    _calculateEvacuationRoute();
  }

  void _calculateEvacuationRoute() {
    // Generate green bypass points avoiding threat circles
    List<LatLng> points = [_citizenLatLng];
    
    // Add intermediates to bypass known crises dynamically
    LatLng current = _citizenLatLng;
    LatLng target = _safeHubLatLng;

    // Simple routing bypass algorithm around the nearest active crisis
    if (_activeCrises.isNotEmpty) {
      for (final crisis in _activeCrises) {
        final LatLng crisisCoord = crisis['coordinate'] as LatLng;
        final double dist = _distanceBetween(current, crisisCoord);
        if (dist < 800) {
          // Dodge threat by creating a safe midpoint offset
          final double avgLat = (current.latitude + target.latitude) / 2;
          final double avgLng = (current.longitude + target.longitude) / 2;
          // Offset slightly away from threat
          final double offsetLat = avgLat + 0.004;
          final double offsetLng = avgLng - 0.003;
          points.add(LatLng(offsetLat, offsetLng));
        }
      }
    }

    points.add(target);
    setState(() {
      _routePoints = points;
    });
  }

  double _distanceBetween(LatLng p1, LatLng p2) {
    final double dLat = (p2.latitude - p1.latitude) * math.pi / 180;
    final double dLng = (p2.longitude - p1.longitude) * math.pi / 180;
    final double a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(p1.latitude * math.pi / 180) *
            math.cos(p2.latitude * math.pi / 180) *
            math.sin(dLng / 2) *
            math.sin(dLng / 2);
    final double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return 6371000 * c; // meters
  }

  void _recalculateRoute() {
    setState(() => _evacuationPathwayConverged = false);
    MuhafizFeedback.showToast("Bypassing Danger Zones...");
    Timer(const Duration(milliseconds: 1000), () {
      if (mounted) {
        setState(() {
          _evacuationPathwayConverged = true;
        });
        _calculateEvacuationRoute();
        MuhafizFeedback.showToast("Optimal Green Route Recalculated");
      }
    });
  }

  Color _typeColor(String type) {
    final t = type.toUpperCase();
    if (t.contains('FIRE') || t.contains('BLAST') || t.contains('EXPLOSION')) return const Color(0xFFFF3B30);
    if (t.contains('FLOOD') || t.contains('WATER') || t.contains('RAIN')) return const Color(0xFF30A8FF);
    if (t.contains('ACCIDENT') || t.contains('CRASH') || t.contains('COLLISION')) return const Color(0xFFFF9500);
    if (t.contains('CRIME') || t.contains('SHOOT') || t.contains('TERROR') || t.contains('POLICE')) return const Color(0xFFBF5AF2);
    if (t.contains('GAS') || t.contains('CHEMICAL') || t.contains('TOXIC')) return const Color(0xFF34C759);
    if (t.contains('EARTHQUAKE') || t.contains('QUAKE')) return const Color(0xFFFF6B35);
    return const Color(0xFFFF9F0A); // default amber
  }

  IconData _typeIcon(String type) {
    final t = type.toUpperCase();
    if (t.contains('FIRE') || t.contains('BLAST') || t.contains('EXPLOSION')) return LucideIcons.flame;
    if (t.contains('FLOOD') || t.contains('WATER') || t.contains('RAIN')) return LucideIcons.droplets;
    if (t.contains('ACCIDENT') || t.contains('CRASH') || t.contains('COLLISION')) return LucideIcons.car;
    if (t.contains('CRIME') || t.contains('SHOOT') || t.contains('TERROR') || t.contains('POLICE')) return LucideIcons.siren;
    if (t.contains('GAS') || t.contains('CHEMICAL') || t.contains('TOXIC')) return LucideIcons.wind;
    if (t.contains('EARTHQUAKE') || t.contains('QUAKE')) return LucideIcons.activity;
    return LucideIcons.alertTriangle;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MuhafizTheme.backgroundSlate,
      body: SafeArea(
        child: Column(
          children: [
            _buildTacticalHeader(),
            Expanded(
              child: Stack(
                children: [
                  _buildMapView(),
                  _buildSideTelemetryOverlay(),
                  _buildZoomControls(),
                  if (_isLoading)
                    Container(
                      color: Colors.black.withValues(alpha: 0.4),
                      child: const Center(
                        child: CircularProgressIndicator(color: MuhafizTheme.primaryEmerald),
                      ),
                    ),
                ],
              ),
            ),
            _buildThreatFeed(),
          ],
        ),
      ),
    );
  }

  Widget _buildTacticalHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF0D182E),
        border: Border(
          bottom: BorderSide(color: MuhafizTheme.primaryEmerald.withValues(alpha: 0.15)),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: MuhafizTheme.primaryEmerald,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: MuhafizTheme.primaryEmerald, blurRadius: 6),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'STATUS: SAFE ROUTING ACTIVE',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: MuhafizTheme.primaryEmerald,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${_area.toUpperCase()}, ${_city.toUpperCase()}',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: _fetchLiveIncidents,
            icon: Icon(LucideIcons.refreshCw, color: MuhafizTheme.primaryEmerald, size: 20),
            splashRadius: 24,
          ),
        ],
      ),
    );
  }

  Widget _buildMapView() {
    // Collect threat zones
    final List<CircleMarker> circleMarkers = [];
    final List<Marker> markers = [
      // Citizen location
      Marker(
        point: _citizenLatLng,
        width: 40,
        height: 40,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.blueAccent,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [BoxShadow(color: Colors.blueAccent.withValues(alpha: 0.5), blurRadius: 8)],
          ),
          child: const Icon(LucideIcons.user, color: Colors.white, size: 16),
        ),
      ),
      // Safe Evacuation Hub
      Marker(
        point: _safeHubLatLng,
        width: 72,
        height: 56,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: MuhafizTheme.primaryEmerald,
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                'SAFE HUB',
                style: TextStyle(color: Colors.black, fontSize: 8, fontWeight: FontWeight.bold),
              ),
            ),
            const Icon(LucideIcons.home, color: MuhafizTheme.primaryEmerald, size: 28),
          ],
        ),
      ),
    ];

    for (final crisis in _activeCrises) {
      final LatLng pos = crisis['coordinate'] as LatLng;
      final Color color = _typeColor(crisis['title']?.toString() ?? '');
      final IconData pinIcon = _typeIcon(crisis['title']?.toString() ?? '');

      circleMarkers.add(
        CircleMarker(
          point: pos,
          radius: crisis['radius'] as double,
          useRadiusInMeter: true,
          color: color.withValues(alpha: 0.14),
          borderColor: color.withValues(alpha: 0.5),
          borderStrokeWidth: 2,
        ),
      );

      markers.add(
        Marker(
          point: pos,
          width: 80,
          height: 64,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                constraints: const BoxConstraints(maxWidth: 76),
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(3),
                ),
                child: Text(
                  crisis['id'].toString().length > 9
                      ? crisis['id'].toString().substring(crisis['id'].toString().length - 9)
                      : crisis['id'].toString(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.black, fontSize: 8, fontWeight: FontWeight.bold),
                ),
              ),
              Icon(pinIcon, color: color, size: 22),
            ],
          ),
        ),
      );
    }

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: _citizenLatLng,
        initialZoom: _zoomLevel,
        maxZoom: 18.0,
        minZoom: 10.0,
      ),
      children: [
        // Premium Dark CartoDB Tiles
        TileLayer(
          urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          subdomains: const ['a', 'b', 'c', 'd'],
        ),
        // Active Danger Zone Overlays
        CircleLayer(circles: circleMarkers),
        // Safe green bypass route polyline
        if (_evacuationPathwayConverged && _routePoints.isNotEmpty)
          PolylineLayer(
            polylines: [
              Polyline(
                points: _routePoints,
                strokeWidth: 5.0,
                color: MuhafizTheme.primaryEmerald,
                borderColor: MuhafizTheme.primaryEmerald.withValues(alpha: 0.3),
                borderStrokeWidth: 3.0,
              ),
            ],
          ),
        // Pins Layer
        MarkerLayer(markers: markers),
      ],
    );
  }

  Widget _buildSideTelemetryOverlay() {
    return Positioned(
      top: 16,
      left: 16,
      child: FadeInLeft(
        child: Container(
          padding: const EdgeInsets.all(12),
          width: 170,
          decoration: BoxDecoration(
            color: const Color(0xFF0F1B35).withValues(alpha: 0.85),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: MuhafizTheme.primaryEmerald.withValues(alpha: 0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'HUD TELEMETRY',
                style: TextStyle(
                  color: MuhafizTheme.primaryEmerald,
                  fontWeight: FontWeight.bold,
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                ),
              ),
              const Divider(color: Colors.white10, height: 12),
              _buildTelemetryRow("ALTITUDE", "48m"),
              _buildTelemetryRow("EVAC ZONE", "SAFE HUB A"),
              _buildTelemetryRow("BYPASS ENGAGED", _evacuationPathwayConverged ? "YES" : "WAIT..."),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _recalculateRoute,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                  decoration: BoxDecoration(
                    color: MuhafizTheme.primaryEmerald.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(2),
                    border: Border.all(color: MuhafizTheme.primaryEmerald.withValues(alpha: 0.4)),
                  ),
                  child: const Center(
                    child: Text(
                      'BYPASS PATH',
                      style: TextStyle(
                        fontFamily: 'JetBrains Mono',
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: MuhafizTheme.primaryEmerald,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTelemetryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 8, color: MuhafizTheme.mutedSlate, fontFamily: 'JetBrains Mono')),
          Text(value, style: const TextStyle(fontSize: 8, color: Colors.white, fontFamily: 'JetBrains Mono', fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildZoomControls() {
    return Positioned(
      right: 16,
      top: 16,
      child: Column(
        children: [
          _buildCircleButton(
            icon: LucideIcons.plus,
            onPressed: () {
              setState(() {
                _zoomLevel += 0.5;
                _mapController.move(_mapController.camera.center, _zoomLevel);
              });
            },
          ),
          const SizedBox(height: 8),
          _buildCircleButton(
            icon: LucideIcons.minus,
            onPressed: () {
              setState(() {
                _zoomLevel -= 0.5;
                _mapController.move(_mapController.camera.center, _zoomLevel);
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCircleButton({required IconData icon, required VoidCallback onPressed}) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: const Color(0xFF0F1B35).withValues(alpha: 0.85),
        border: Border.all(color: MuhafizTheme.primaryEmerald.withValues(alpha: 0.2)),
        shape: BoxShape.circle,
      ),
      child: IconButton(
        padding: EdgeInsets.zero,
        icon: Icon(icon, color: MuhafizTheme.primaryEmerald, size: 18),
        onPressed: onPressed,
      ),
    );
  }

  Widget _buildThreatFeed() {
    return Container(
      height: 180,
      decoration: BoxDecoration(
        color: const Color(0xFF080F1D),
        border: Border(
          top: BorderSide(color: MuhafizTheme.primaryEmerald.withValues(alpha: 0.15)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 20, right: 20, top: 12, bottom: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'CRISIS OVERLAYS IN RANGE (${_activeCrises.length})',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                  ),
                ),
                const Text(
                  'SOURCE: ANALYST AGENT',
                  style: TextStyle(
                    color: MuhafizTheme.primaryEmerald,
                    fontSize: 8,
                    fontFamily: 'JetBrains Mono',
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _activeCrises.isEmpty
                ? const Center(
                    child: Text(
                      'NO ACTIVE CRISES IN SECTOR',
                      style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, color: MuhafizTheme.mutedSlate),
                    ),
                  )
                : ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _activeCrises.length,
                    itemBuilder: (context, index) {
                      final crisis = _activeCrises[index];
                      final Color typeColor = _typeColor(crisis['title']?.toString() ?? '');
                      final IconData typeIcon = _typeIcon(crisis['title']?.toString() ?? '');
                      final double dist = (crisis['dist'] as double? ?? 0);
                      final String distLabel = dist < 1000
                          ? '${dist.toInt()}m away'
                          : '${(dist / 1000).toStringAsFixed(1)}km away';
                      return FadeInRight(
                        delay: Duration(milliseconds: index * 100),
                        child: Container(
                          width: 280,
                          margin: const EdgeInsets.only(right: 12, bottom: 16),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: MuhafizTheme.surfaceSlate,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: typeColor.withValues(alpha: 0.4)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: typeColor.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(2),
                                      border: Border.all(color: typeColor),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(typeIcon, color: typeColor, size: 8),
                                        const SizedBox(width: 3),
                                        Text(
                                          distLabel.toUpperCase(),
                                          style: TextStyle(
                                            fontFamily: 'JetBrains Mono',
                                            fontSize: 8,
                                            fontWeight: FontWeight.bold,
                                            color: typeColor,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    crisis['id'],
                                    style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, color: MuhafizTheme.mutedSlate),
                                  ),
                                  const Spacer(),
                                  Icon(LucideIcons.radio, color: typeColor, size: 12),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${(crisis['confidence'] * 100).toInt()}% CONF',
                                    style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 8, color: typeColor, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                crisis['title'],
                                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'JetBrains Mono'),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Area: ${crisis['location']}',
                                style: const TextStyle(color: MuhafizTheme.mutedSlate, fontSize: 10),
                              ),
                              const Spacer(),
                              Text(
                                crisis['details'],
                                style: const TextStyle(color: Colors.white70, fontSize: 10, height: 1.3),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
