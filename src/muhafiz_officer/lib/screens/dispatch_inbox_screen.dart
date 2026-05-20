import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart' as geo;
import '../theme.dart';
import '../services/geocoding_service.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import 'ground_truth_screen.dart';
import 'verification_quest_screen.dart';

class DispatchInboxScreen extends StatefulWidget {
  const DispatchInboxScreen({super.key});

  @override
  State<DispatchInboxScreen> createState() => _DispatchInboxScreenState();
}

class _DispatchInboxScreenState extends State<DispatchInboxScreen>
    with TickerProviderStateMixin {
  final MapController _mapController = MapController();

  List<Map<String, dynamic>> incidents = [];
  bool isLoading = true;
  String? errorMessage;

  LatLng _officerLatLng = const LatLng(24.9180, 67.0971);
  bool _locationAcquired = false;
  late AnimationController _pulseController;


  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    _fetchData();
    _acquireLocation();
    OfficerSocketService.connect(ApiService.wsUrl);
    OfficerSocketService.addListener(_handleSocketMessage);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    OfficerSocketService.removeListener(_handleSocketMessage);
    super.dispose();
  }

  void _handleSocketMessage(Map<String, dynamic> msg) {
    if (msg['type'] == 'VERIFICATION_QUEST' && mounted) {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (_) => VerificationQuestScreen(quest: msg),
      );
    }
    if (msg['type'] == 'NEW_INCIDENT' && mounted) {
      _fetchData();
    }
  }

  Future<void> _acquireLocation() async {
    try {
      geo.LocationPermission perm = await geo.Geolocator.checkPermission();
      if (perm == geo.LocationPermission.denied) {
        perm = await geo.Geolocator.requestPermission();
      }
      if (perm == geo.LocationPermission.deniedForever) return;
      final pos = await geo.Geolocator.getCurrentPosition(
        locationSettings: const geo.LocationSettings(
            accuracy: geo.LocationAccuracy.high),
      );
      if (mounted) {
        setState(() {
          _officerLatLng = LatLng(pos.latitude, pos.longitude);
          _locationAcquired = true;
        });
        _mapController.move(_officerLatLng, 13.5);
      }
    } catch (_) {}
  }

  Future<void> _fetchData() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });
    try {
      final data = await ApiService.getIncidents();
      if (mounted) setState(() {
        incidents = data;
        isLoading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        isLoading = false;
        errorMessage = e.toString();
      });
    }
  }

  Color _severityColor(Map<String, dynamic> inc) {
    final status = (inc['status'] ?? '').toString().toUpperCase();
    final type = (inc['type'] ?? '').toString().toUpperCase();
    if (status == 'CONFIRMED' || type.contains('FIRE') || type.contains('BLAST')) {
      return const Color(0xFFFF4C4C);
    }
    return const Color(0xFFFFB340);
  }

  String _timeAgo(String? iso) {
    if (iso == null) return 'UNKNOWN';
    try {
      final dt = DateTime.parse(iso);
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 60) return '${diff.inMinutes}m AGO';
      if (diff.inHours < 24) return '${diff.inHours}h AGO';
      return '${diff.inDays}d AGO';
    } catch (_) {
      return 'UNKNOWN';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MuhafizTheme.nightOpsBlack,
      body: Column(
        children: [
          _buildHeader(),
          Expanded(
            flex: 5,
            child: _buildMap(),
          ),
          _buildMissionFeed(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return SafeArea(
      bottom: false,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFF0D182E),
          border: Border(
            bottom: BorderSide(
                color: MuhafizTheme.sovereignGreen.withValues(alpha: 0.2)),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: MuhafizTheme.sovereignGreen.withValues(alpha: 0.1),
                border:
                    Border.all(color: MuhafizTheme.sovereignGreen, width: 1.5),
              ),
              child: const Icon(LucideIcons.shield,
                  color: MuhafizTheme.sovereignGreen, size: 16),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      AnimatedBuilder(
                        animation: _pulseController,
                        builder: (_, __) => Container(
                          width: 7,
                          height: 7,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: MuhafizTheme.sovereignGreen,
                            boxShadow: [
                              BoxShadow(
                                color: MuhafizTheme.sovereignGreen.withValues(
                                    alpha: _pulseController.value * 0.8),
                                blurRadius: 8,
                                spreadRadius: 2,
                              )
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'ON DUTY — DISPATCH ACTIVE',
                        style: TextStyle(
                          color: MuhafizTheme.sovereignGreen,
                          fontSize: 9,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Text(
                        'MISSION FEED',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (incidents.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: MuhafizTheme.crisisRed.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                                color: MuhafizTheme.crisisRed.withValues(alpha: 0.5)),
                          ),
                          child: Text(
                            '${incidents.length} ACTIVE',
                            style: const TextStyle(
                              color: MuhafizTheme.crisisRed,
                              fontSize: 9,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(LucideIcons.refreshCw,
                  color: MuhafizTheme.sovereignGreen, size: 18),
              onPressed: _fetchData,
              tooltip: 'Refresh',
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMap() {
    final List<CircleMarker> circles = [];
    final List<Marker> markers = [];

    // Officer location marker
    markers.add(
      Marker(
        point: _officerLatLng,
        width: 44,
        height: 44,
        child: AnimatedBuilder(
          animation: _pulseController,
          builder: (_, __) => Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.blueAccent
                      .withValues(alpha: _pulseController.value * 0.3),
                  border: Border.all(
                    color: Colors.blueAccent
                        .withValues(alpha: _pulseController.value * 0.6),
                    width: 1.5,
                  ),
                ),
              ),
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.blueAccent,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: [
                    BoxShadow(
                        color: Colors.blueAccent.withValues(alpha: 0.6),
                        blurRadius: 8)
                  ],
                ),
                child: const Icon(LucideIcons.user,
                    color: Colors.white, size: 12),
              ),
            ],
          ),
        ),
      ),
    );

    // Incident threat zones
    for (final inc in incidents) {
      final String status = (inc['status'] ?? '').toString().toUpperCase();
      if (status == 'RESOLVED' || status == 'RETRACTED' || status == 'COMPLETED') {
        continue;
      }
      final loc = (inc['location'] ?? '').toString();
      if (loc.isEmpty || loc == 'ANALYZING') continue;
      final LatLng pos = GeocodingService.geocodeSync(loc);
      final Color color = _severityColor(inc);
      final double radius = status == 'CONFIRMED' ? 500.0 : 320.0;

      circles.add(CircleMarker(
        point: pos,
        radius: radius,
        useRadiusInMeter: true,
        color: color.withValues(alpha: 0.12),
        borderColor: color.withValues(alpha: 0.45),
        borderStrokeWidth: 1.5,
      ));

      markers.add(Marker(
        point: pos,
        width: 82,
        height: 58,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              constraints: const BoxConstraints(maxWidth: 80),
              padding:
                  const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(3),
              ),
              child: Text(
                (inc['incident_id'] ?? 'MHFZ-???').toString(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    color: Colors.black,
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace'),
              ),
            ),
            Icon(LucideIcons.alertTriangle, color: color, size: 24),
          ],
        ),
      ));
    }

    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: _officerLatLng,
            initialZoom: 13.5,
            maxZoom: 18.0,
            minZoom: 10.0,
          ),
          children: [
            TileLayer(
              urlTemplate:
                  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
              subdomains: const ['a', 'b', 'c', 'd'],
            ),
            CircleLayer(circles: circles),
            MarkerLayer(markers: markers),
          ],
        ),
        // HUD overlay
        Positioned(
          top: 12,
          left: 12,
          child: FadeInLeft(
            child: Container(
              padding: const EdgeInsets.all(10),
              width: 160,
              decoration: BoxDecoration(
                color: const Color(0xFF0F1B35).withValues(alpha: 0.88),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                    color: MuhafizTheme.sovereignGreen.withValues(alpha: 0.25)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('SECTOR HUD',
                      style: TextStyle(
                        color: MuhafizTheme.sovereignGreen,
                        fontWeight: FontWeight.bold,
                        fontSize: 9,
                        fontFamily: 'monospace',
                        letterSpacing: 1,
                      )),
                  const Divider(color: Colors.white10, height: 10),
                  _hudRow('INCIDENTS', '${incidents.length}'),
                  _hudRow('OFFICER LOC',
                      _locationAcquired ? 'ACQUIRED' : 'LOCATING...'),
                  _hudRow('COMMS',
                      OfficerSocketService.isConnected ? 'LINKED' : 'OFFLINE'),
                  const SizedBox(height: 6),
                  GestureDetector(
                    onTap: _acquireLocation,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          vertical: 5, horizontal: 6),
                      decoration: BoxDecoration(
                        color: MuhafizTheme.sovereignGreen
                            .withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(2),
                        border: Border.all(
                            color: MuhafizTheme.sovereignGreen
                                .withValues(alpha: 0.4)),
                      ),
                      child: const Center(
                        child: Text('RE-ACQUIRE GPS',
                            style: TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 8,
                              fontWeight: FontWeight.bold,
                              color: MuhafizTheme.sovereignGreen,
                            )),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        // Zoom controls
        Positioned(
          right: 12,
          top: 12,
          child: Column(
            children: [
              _mapButton(LucideIcons.plus, () {
                _mapController.move(
                    _mapController.camera.center,
                    math.min(
                        _mapController.camera.zoom + 0.5, 18));
              }),
              const SizedBox(height: 6),
              _mapButton(LucideIcons.minus, () {
                _mapController.move(
                    _mapController.camera.center,
                    math.max(
                        _mapController.camera.zoom - 0.5, 10));
              }),
              const SizedBox(height: 6),
              _mapButton(LucideIcons.locate, () {
                _mapController.move(_officerLatLng, 14);
              }),
            ],
          ),
        ),
      ],
    );
  }

  Widget _hudRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 7,
                  color: MuhafizTheme.textSecondary,
                  fontFamily: 'monospace')),
          Text(value,
              style: const TextStyle(
                  fontSize: 7,
                  color: Colors.white,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _mapButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: const Color(0xFF0F1B35).withValues(alpha: 0.88),
          border: Border.all(
              color: MuhafizTheme.sovereignGreen.withValues(alpha: 0.25)),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: MuhafizTheme.sovereignGreen, size: 15),
      ),
    );
  }

  Widget _buildMissionFeed() {
    return Container(
      height: 230,
      decoration: BoxDecoration(
        color: const Color(0xFF080F1D),
        border: Border(
          top: BorderSide(
              color: MuhafizTheme.sovereignGreen.withValues(alpha: 0.2),
              width: 1.5),
        ),
      ),
      child: Column(
        children: [
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'ACTIVE MISSIONS (${incidents.length})',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                    fontFamily: 'monospace',
                    letterSpacing: 1,
                  ),
                ),
                const Text(
                  'SOURCE: ORACLE AGENT',
                  style: TextStyle(
                    color: MuhafizTheme.sovereignGreen,
                    fontSize: 8,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                        color: MuhafizTheme.sovereignGreen, strokeWidth: 2))
                : errorMessage != null
                    ? _buildErrorState()
                    : incidents.isEmpty
                        ? const Center(
                            child: Text('NO ACTIVE MISSIONS IN SECTOR',
                                style: TextStyle(
                                    color: MuhafizTheme.textSecondary,
                                    fontFamily: 'monospace',
                                    fontSize: 11)))
                        : ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            itemCount: incidents.length,
                            itemBuilder: (context, i) {
                              return FadeInRight(
                                delay: Duration(milliseconds: i * 80),
                                child: _buildMissionCard(incidents[i]),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(LucideIcons.wifiOff,
              color: MuhafizTheme.crisisRed, size: 28),
          const SizedBox(height: 8),
          const Text('SERVER UNREACHABLE',
              style: TextStyle(
                  color: MuhafizTheme.crisisRed,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.bold,
                  fontSize: 11)),
          const SizedBox(height: 10),
          ElevatedButton.icon(
            onPressed: _fetchData,
            icon: const Icon(LucideIcons.refreshCw, size: 13),
            label: const Text('RETRY'),
            style: ElevatedButton.styleFrom(
              backgroundColor: MuhafizTheme.sovereignGreen,
              foregroundColor: Colors.black,
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              textStyle: const TextStyle(
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.bold,
                  fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMissionCard(Map<String, dynamic> inc) {
    Color color = _severityColor(inc);
    final String rawStatus = (inc['status'] ?? 'ANALYZING').toString().toUpperCase();
    String status = rawStatus;
    
    if (rawStatus == 'RESOLVED' || rawStatus == 'COMPLETED') {
      status = 'ROAD CLEAR';
      color = MuhafizTheme.sovereignGreen;
    } else if (rawStatus == 'RETRACTED') {
      status = 'FALSE ALARM';
      color = Colors.grey;
    }

    final bool isClosed = rawStatus == 'RESOLVED' || rawStatus == 'COMPLETED' || rawStatus == 'RETRACTED';

    final String type = (inc['type'] ?? 'UNKNOWN').toString();
    final double conf = ((inc['confidence'] ??
            inc['ai_confidence'] ??
            0.0) as num)
        .toDouble();

    return GestureDetector(
      onTap: () {
        if (!isClosed) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => GroundTruthScreen(incident: inc),
            ),
          );
        }
      },
      child: Container(
        width: 240,
        margin: const EdgeInsets.only(right: 10, bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: MuhafizTheme.tacticalGray,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.35)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(3),
                    border: Border.all(color: color.withValues(alpha: 0.5)),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(
                        color: color,
                        fontSize: 8,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold),
                  ),
                ),
                const Spacer(),
                Icon(LucideIcons.radio, color: color, size: 11),
                const SizedBox(width: 3),
                Text(
                  conf > 0
                      ? '${(conf * 100).toInt()}% CONF'
                      : '—',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              inc['incident_id'] ?? 'MHFZ-???',
              style: TextStyle(
                color: color,
                fontFamily: 'monospace',
                fontWeight: FontWeight.bold,
                fontSize: 13,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              type,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace'),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Row(
              children: [
                const Icon(LucideIcons.mapPin,
                    color: MuhafizTheme.crisisRed, size: 10),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    inc['location'] ?? 'ANALYZING...',
                    style: const TextStyle(
                        color: MuhafizTheme.textSecondary,
                        fontSize: 10),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            if (isClosed) ...[
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: color.withValues(alpha: 0.35)),
                ),
                child: Builder(
                  builder: (context) {
                    String? retractionReason;
                    if (inc['data'] is Map) {
                      retractionReason = inc['data']['retraction_reason']?.toString();
                    } else if (inc['data'] is String) {
                      try {
                        final decoded = json.decode(inc['data'] as String);
                        if (decoded is Map) {
                          retractionReason = decoded['retraction_reason']?.toString();
                        }
                      } catch (_) {}
                    }
                    retractionReason ??= inc['retraction_reason']?.toString();

                    return Text(
                      rawStatus == 'RETRACTED'
                          ? '🚫 FALSE ALARM: ${retractionReason ?? "Alert retracted by Auditor agent."}'
                          : '🛣️ ROAD CLEAR: Emergency resolved. Corridor restored.',
                      style: TextStyle(
                        color: color,
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'monospace',
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    );
                  }
                ),
              ),
            ],
            const Spacer(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _timeAgo(inc['created_at']?.toString()),
                  style: const TextStyle(
                      color: MuhafizTheme.textSecondary,
                      fontSize: 9,
                      fontFamily: 'monospace'),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: isClosed 
                        ? color.withValues(alpha: 0.1) 
                        : MuhafizTheme.sovereignGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(
                        color: isClosed
                            ? color.withValues(alpha: 0.4)
                            : MuhafizTheme.sovereignGreen.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    isClosed ? 'CLOSED' : 'OPEN →',
                    style: TextStyle(
                      color: isClosed ? color : MuhafizTheme.sovereignGreen,
                      fontSize: 9,
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
