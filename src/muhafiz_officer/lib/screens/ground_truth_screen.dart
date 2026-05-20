import 'dart:io';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart' as geo;
import '../theme.dart';
import '../services/api_service.dart';
import '../services/geocoding_service.dart';

class GroundTruthScreen extends StatefulWidget {
  final Map<String, dynamic> incident;
  const GroundTruthScreen({super.key, required this.incident});

  @override
  State<GroundTruthScreen> createState() => _GroundTruthScreenState();
}

class _GroundTruthScreenState extends State<GroundTruthScreen>
    with TickerProviderStateMixin {
  bool isSubmitting = false;
  File? _capturedImage;
  final ImagePicker _picker = ImagePicker();
  List<Map<String, dynamic>> traceLogs = [];
  bool _logsExpanded = false;
  LatLng _officerLatLng = const LatLng(24.9180, 67.0971);
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    _acquireLocation();
    // Populate trace logs from incident data if available
    final dynamic data = widget.incident['data'];
    if (data is Map && data['traceLogs'] is List) {
      traceLogs = List<Map<String, dynamic>>.from(
        (data['traceLogs'] as List).map((e) => Map<String, dynamic>.from(e as Map)),
      );
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _acquireLocation() async {
    try {
      geo.LocationPermission perm = await geo.Geolocator.checkPermission();
      if (perm == geo.LocationPermission.denied) {
        perm = await geo.Geolocator.requestPermission();
      }
      if (perm == geo.LocationPermission.deniedForever) return;
      final pos = await geo.Geolocator.getCurrentPosition(
        locationSettings:
            const geo.LocationSettings(accuracy: geo.LocationAccuracy.high),
      );
      if (mounted) {
        setState(() {
          _officerLatLng = LatLng(pos.latitude, pos.longitude);
        });
      }
    } catch (_) {}
  }

  Future<void> _openCamera() async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 80,
        preferredCameraDevice: CameraDevice.rear,
      );
      if (photo != null && mounted) {
        setState(() {
          _capturedImage = File(photo.path);
          traceLogs.add({
            'agent': 'The Auditor',
            'message': 'Evidence photo captured: ${photo.name}',
            'outcome': 'Success',
            'timestamp': DateTime.now().toIso8601String(),
          });
        });
      }
    } catch (e) {
      if (mounted) {
        _showSnack('CAMERA ERROR: $e', MuhafizTheme.crisisRed);
      }
    }
  }

  Future<void> _openGallery() async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 80,
      );
      if (photo != null && mounted) {
        setState(() {
          _capturedImage = File(photo.path);
          traceLogs.add({
            'agent': 'The Auditor',
            'message': 'Evidence loaded from gallery: ${photo.name}',
            'outcome': 'Success',
            'timestamp': DateTime.now().toIso8601String(),
          });
        });
      }
    } catch (e) {
      if (mounted) {
        _showSnack('GALLERY ERROR: $e', MuhafizTheme.crisisRed);
      }
    }
  }

  void _showSnack(String msg, Color color, {int seconds = 4}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg,
          style: const TextStyle(fontFamily: 'monospace', fontSize: 12)),
      backgroundColor: color,
      duration: Duration(seconds: seconds),
    ));
  }

  Future<void> _showConfirmDialog() async {
    final noteController = TextEditingController(
      text: 'Crisis confirmed active by field officer.',
    );
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F1B35),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: MuhafizTheme.crisisRed.withValues(alpha: 0.5)),
        ),
        title: const Row(
          children: [
            Icon(LucideIcons.alertTriangle,
                color: MuhafizTheme.crisisRed, size: 18),
            SizedBox(width: 8),
            Text(
              'CONFIRM CRISIS',
              style: TextStyle(
                color: MuhafizTheme.crisisRed,
                fontFamily: 'monospace',
                fontWeight: FontWeight.bold,
                fontSize: 14,
                letterSpacing: 1,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Alert stays ACTIVE system-wide. Add field notes:',
              style: TextStyle(
                  color: MuhafizTheme.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: noteController,
              maxLines: 3,
              style: const TextStyle(
                  color: Colors.white,
                  fontFamily: 'monospace',
                  fontSize: 12),
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.black38,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                  borderSide:
                      const BorderSide(color: MuhafizTheme.surfaceBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                  borderSide:
                      const BorderSide(color: MuhafizTheme.surfaceBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                  borderSide: const BorderSide(color: MuhafizTheme.crisisRed),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('CANCEL',
                style: TextStyle(color: MuhafizTheme.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: MuhafizTheme.crisisRed,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('CONFIRM',
                style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await _handleConfirm(noteController.text.trim());
    }
  }

  Future<void> _handleConfirm(String note) async {
    setState(() => isSubmitting = true);
    try {
      await ApiService.confirmCrisis(
          widget.incident['incident_id'] ?? '', note);
      if (!mounted) return;
      setState(() {
        traceLogs.add({
          'agent': 'The Auditor',
          'message': 'CRISIS CONFIRMED: $note',
          'outcome': 'Success',
          'timestamp': DateTime.now().toIso8601String(),
        });
      });
      _showSnack(
          'CONFIRMED: ${widget.incident['incident_id']} — alert stays active.',
          MuhafizTheme.crisisRed);
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      setState(() => isSubmitting = false);
      _showSnack('ERROR: $e', MuhafizTheme.crisisRed, seconds: 6);
    }
  }

  Future<void> _handleRetract(String reason) async {
    setState(() => isSubmitting = true);
    try {
      await ApiService.retractAlert(
          widget.incident['incident_id'] ?? '', reason);
      if (!mounted) return;
      setState(() {
        traceLogs.add({
          'agent': 'The Auditor',
          'message': 'RETRACTION TRIGGERED: $reason',
          'outcome': 'Success',
          'timestamp': DateTime.now().toIso8601String(),
        });
      });
      _showSnack(
          'RETRACTED: ${widget.incident['incident_id']} — alert closed.',
          MuhafizTheme.sovereignGreen);
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      setState(() => isSubmitting = false);
      _showSnack('ERROR: $e', MuhafizTheme.crisisRed, seconds: 6);
    }
  }

  @override
  Widget build(BuildContext context) {
    final String incidentId = widget.incident['incident_id'] ?? 'UNKNOWN';
    final String type =
        (widget.incident['type'] ?? 'UNKNOWN').toString().toUpperCase();
    final String status =
        (widget.incident['status'] ?? 'ACTIVE').toString().toUpperCase();
    final String location = widget.incident['location'] ?? 'ANALYZING...';
    final Color statusColor = status == 'CONFIRMED'
        ? MuhafizTheme.crisisRed
        : status == 'ANALYZING' || status == 'PENDING'
            ? MuhafizTheme.cautionAmber
            : MuhafizTheme.sovereignGreen;

    return Scaffold(
      backgroundColor: MuhafizTheme.nightOpsBlack,
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D182E),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft,
              color: MuhafizTheme.sovereignGreen, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'AUDIT // $incidentId',
              style: const TextStyle(
                  color: Colors.white,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  letterSpacing: 1),
            ),
            Text(
              type,
              style: const TextStyle(
                  color: MuhafizTheme.textSecondary,
                  fontFamily: 'monospace',
                  fontSize: 10),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16, top: 10, bottom: 10),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: statusColor.withValues(alpha: 0.5)),
            ),
            child: Text(
              status,
              style: TextStyle(
                  color: statusColor,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.bold,
                  fontSize: 9),
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            height: 1,
            color: MuhafizTheme.sovereignGreen.withValues(alpha: 0.15),
          ),
        ),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 120),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildMissionMap(location),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildIncidentIntel(location),
                      const SizedBox(height: 16),
                      _buildEvidenceCapture(),
                      const SizedBox(height: 16),
                      _buildAgentTraceLogs(),
                      const SizedBox(height: 16),
                      _buildVerdictSection(),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (isSubmitting)
            Container(
              color: Colors.black.withValues(alpha: 0.6),
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(
                        color: MuhafizTheme.sovereignGreen),
                    SizedBox(height: 16),
                    Text('TRANSMITTING TO COMMAND...',
                        style: TextStyle(
                            color: MuhafizTheme.sovereignGreen,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMissionMap(String location) {
    final LatLng incidentLatLng = GeocodingService.geocodeSync(location);
    final List<LatLng> routePoints = [_officerLatLng, incidentLatLng];

    return Container(
      height: 220,
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
              color: MuhafizTheme.crisisRed.withValues(alpha: 0.4), width: 1.5),
        ),
      ),
      child: Stack(
        children: [
          FlutterMap(
            options: MapOptions(
              initialCenter: LatLng(
                (_officerLatLng.latitude + incidentLatLng.latitude) / 2,
                (_officerLatLng.longitude + incidentLatLng.longitude) / 2,
              ),
              initialZoom: 13,
              maxZoom: 18,
              minZoom: 10,
            ),
            children: [
              TileLayer(
                urlTemplate:
                    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                subdomains: const ['a', 'b', 'c', 'd'],
              ),
              CircleLayer(circles: [
                CircleMarker(
                  point: incidentLatLng,
                  radius: 380,
                  useRadiusInMeter: true,
                  color: MuhafizTheme.crisisRed.withValues(alpha: 0.12),
                  borderColor: MuhafizTheme.crisisRed.withValues(alpha: 0.5),
                  borderStrokeWidth: 1.5,
                ),
              ]),
              PolylineLayer(polylines: [
                Polyline(
                  points: routePoints,
                  strokeWidth: 3.5,
                  color: MuhafizTheme.sovereignGreen,
                  borderColor:
                      MuhafizTheme.sovereignGreen.withValues(alpha: 0.3),
                  borderStrokeWidth: 2,
                ),
              ]),
              MarkerLayer(markers: [
                // Officer
                Marker(
                  point: _officerLatLng,
                  width: 36,
                  height: 36,
                  child: AnimatedBuilder(
                    animation: _pulseController,
                    builder: (_, _c) => Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.blueAccent,
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: [
                          BoxShadow(
                              color: Colors.blueAccent
                                  .withValues(alpha: 0.5),
                              blurRadius: 8)
                        ],
                      ),
                      child: const Icon(LucideIcons.user,
                          color: Colors.white, size: 14),
                    ),
                  ),
                ),
                // Incident
                Marker(
                  point: incidentLatLng,
                  width: 90,
                  height: 62,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: MuhafizTheme.crisisRed,
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: Text(
                          widget.incident['incident_id'] ?? 'MHFZ-???',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 8,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'monospace'),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const Icon(LucideIcons.alertTriangle,
                          color: MuhafizTheme.crisisRed, size: 26),
                    ],
                  ),
                ),
              ]),
            ],
          ),
          // Route HUD
          Positioned(
            top: 10,
            left: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.75),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                    color: MuhafizTheme.sovereignGreen.withValues(alpha: 0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(LucideIcons.navigation,
                      color: MuhafizTheme.sovereignGreen, size: 11),
                  const SizedBox(width: 5),
                  Text(
                    _distanceLabel(_officerLatLng, GeocodingService.geocodeSync(location)),
                    style: const TextStyle(
                      color: MuhafizTheme.sovereignGreen,
                      fontFamily: 'monospace',
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _distanceLabel(LatLng a, LatLng b) {
    final dLat = (b.latitude - a.latitude) * math.pi / 180;
    final dLng = (b.longitude - a.longitude) * math.pi / 180;
    final x = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(a.latitude * math.pi / 180) *
            math.cos(b.latitude * math.pi / 180) *
            math.sin(dLng / 2) *
            math.sin(dLng / 2);
    final meters = 6371000 * 2 * math.atan2(math.sqrt(x), math.sqrt(1 - x));
    if (meters < 1000) return '${meters.toInt()}m TO INCIDENT';
    return '${(meters / 1000).toStringAsFixed(1)}km TO INCIDENT';
  }

  Widget _buildIncidentIntel(String location) {
    final dynamic data = widget.incident['data'];
    final String rawInput = (data is Map
            ? (data['raw_input'] ?? data['summary'] ?? '')
            : '')
        .toString();
    final double conf = ((widget.incident['confidence'] ??
            (data is Map ? data['confidence_level'] ?? data['confidence'] : null) ??
            0.0) as num)
        .toDouble();
    final String instructions = widget.incident['instructions'] ?? '';
    final String prediction =
        widget.incident['analyst_prediction'] ?? widget.incident['prediction'] ?? '';

    return FadeInUp(
      child: Container(
        decoration: BoxDecoration(
          color: MuhafizTheme.tacticalGray,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: MuhafizTheme.surfaceBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                border: Border(
                    bottom: BorderSide(color: MuhafizTheme.surfaceBorder)),
                color: Colors.black.withValues(alpha: 0.2),
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(10)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.fileText,
                      color: MuhafizTheme.sovereignGreen, size: 14),
                  const SizedBox(width: 8),
                  const Text('INCIDENT INTEL',
                      style: TextStyle(
                          color: Colors.white,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                          letterSpacing: 1)),
                  const Spacer(),
                  if (conf > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: MuhafizTheme.sovereignGreen
                            .withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: MuhafizTheme.sovereignGreen
                                .withValues(alpha: 0.4)),
                      ),
                      child: Text(
                        'AI: ${(conf * 100).toInt()}% CONF',
                        style: const TextStyle(
                            color: MuhafizTheme.sovereignGreen,
                            fontSize: 9,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _intelRow(LucideIcons.mapPin, 'LOCATION', location,
                      MuhafizTheme.crisisRed),
                  if (rawInput.isNotEmpty)
                    _intelRow(LucideIcons.messageSquare, 'FIELD REPORT',
                        rawInput, MuhafizTheme.cautionAmber),
                  if (instructions.isNotEmpty)
                    _intelRow(LucideIcons.clipboardList, 'INSTRUCTIONS',
                        instructions, MuhafizTheme.sovereignGreen),
                  if (prediction.isNotEmpty)
                    _intelRow(LucideIcons.trendingUp, 'AI PREDICTION',
                        prediction, Colors.purpleAccent),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _intelRow(IconData icon, String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 13),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        color: MuhafizTheme.textSecondary,
                        fontSize: 9,
                        fontFamily: 'monospace',
                        letterSpacing: 0.8)),
                const SizedBox(height: 2),
                Text(value,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEvidenceCapture() {
    return FadeInUp(
      delay: const Duration(milliseconds: 80),
      child: Container(
        decoration: BoxDecoration(
          color: MuhafizTheme.tacticalGray,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: _capturedImage != null
                ? MuhafizTheme.sovereignGreen.withValues(alpha: 0.5)
                : MuhafizTheme.surfaceBorder,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                border: Border(
                    bottom: BorderSide(color: MuhafizTheme.surfaceBorder)),
                color: Colors.black.withValues(alpha: 0.2),
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(10)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.camera,
                      color: MuhafizTheme.sovereignGreen, size: 14),
                  const SizedBox(width: 8),
                  const Text('FIELD EVIDENCE',
                      style: TextStyle(
                          color: Colors.white,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                          letterSpacing: 1)),
                  const Spacer(),
                  Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _capturedImage != null
                          ? MuhafizTheme.sovereignGreen
                          : MuhafizTheme.crisisRed,
                    ),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    _capturedImage != null ? 'LOGGED' : 'AWAITING',
                    style: TextStyle(
                        color: _capturedImage != null
                            ? MuhafizTheme.sovereignGreen
                            : MuhafizTheme.crisisRed,
                        fontSize: 9,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            // Image preview
            Container(
              height: 180,
              margin: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _capturedImage != null
                      ? MuhafizTheme.sovereignGreen.withValues(alpha: 0.4)
                      : MuhafizTheme.surfaceBorder,
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(7),
                child: _capturedImage != null
                    ? Image.file(_capturedImage!,
                        fit: BoxFit.cover, width: double.infinity)
                    : Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(LucideIcons.cameraOff,
                                color:
                                    Colors.white.withValues(alpha: 0.08),
                                size: 48),
                            const SizedBox(height: 8),
                            Text(
                              'NO EVIDENCE CAPTURED',
                              style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.15),
                                  fontFamily: 'monospace',
                                  fontSize: 10,
                                  letterSpacing: 1.5),
                            ),
                          ],
                        ),
                      ),
              ),
            ),
            Padding(
              padding:
                  const EdgeInsets.only(left: 12, right: 12, bottom: 12),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _openCamera,
                      icon: const Icon(LucideIcons.camera, size: 14),
                      label: const Text('CAPTURE',
                          style: TextStyle(
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                              fontSize: 11)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: MuhafizTheme.sovereignGreen,
                        foregroundColor: Colors.black,
                        padding:
                            const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(7)),
                        elevation: 0,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  OutlinedButton(
                    onPressed: _openGallery,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: MuhafizTheme.textSecondary,
                      side:
                          const BorderSide(color: MuhafizTheme.surfaceBorder),
                      padding: const EdgeInsets.symmetric(
                          vertical: 10, horizontal: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(7)),
                    ),
                    child: const Icon(LucideIcons.image, size: 18),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAgentTraceLogs() {
    if (traceLogs.isEmpty) return const SizedBox.shrink();
    return FadeInUp(
      delay: const Duration(milliseconds: 120),
      child: Container(
        decoration: BoxDecoration(
          color: MuhafizTheme.tacticalGray,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: MuhafizTheme.surfaceBorder),
        ),
        child: Column(
          children: [
            GestureDetector(
              onTap: () =>
                  setState(() => _logsExpanded = !_logsExpanded),
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  border: Border(
                      bottom: BorderSide(
                          color: _logsExpanded
                              ? MuhafizTheme.surfaceBorder
                              : Colors.transparent)),
                  color: Colors.black.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.activity,
                        color: MuhafizTheme.cautionAmber, size: 14),
                    const SizedBox(width: 8),
                    const Text('AGENT TRACE LOGS',
                        style: TextStyle(
                            color: Colors.white,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                            letterSpacing: 1)),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: MuhafizTheme.cautionAmber
                            .withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: MuhafizTheme.cautionAmber
                                .withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        '${traceLogs.length}',
                        style: const TextStyle(
                            color: MuhafizTheme.cautionAmber,
                            fontSize: 9,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Icon(
                      _logsExpanded
                          ? LucideIcons.chevronUp
                          : LucideIcons.chevronDown,
                      color: MuhafizTheme.textSecondary,
                      size: 16,
                    ),
                  ],
                ),
              ),
            ),
            if (_logsExpanded)
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.all(12),
                itemCount: traceLogs.length,
                separatorBuilder: (_, __) =>
                    const Divider(color: MuhafizTheme.surfaceBorder, height: 8),
                itemBuilder: (_, i) {
                  final log = traceLogs[i];
                  final bool success =
                      (log['outcome'] ?? '').toString().toLowerCase() ==
                          'success';
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        success
                            ? LucideIcons.checkCircle
                            : LucideIcons.xCircle,
                        color: success
                            ? MuhafizTheme.sovereignGreen
                            : MuhafizTheme.crisisRed,
                        size: 13,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              log['agent']?.toString() ?? 'SYSTEM',
                              style: const TextStyle(
                                  color: MuhafizTheme.cautionAmber,
                                  fontFamily: 'monospace',
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              log['message']?.toString() ?? '',
                              style: const TextStyle(
                                  color: Colors.white70, fontSize: 11, height: 1.3),
                            ),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerdictSection() {
    return FadeInUp(
      delay: const Duration(milliseconds: 160),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Padding(
            padding: EdgeInsets.only(bottom: 10),
            child: Text(
              'AUDIT VERDICT',
              style: TextStyle(
                color: MuhafizTheme.textSecondary,
                fontFamily: 'monospace',
                fontWeight: FontWeight.bold,
                fontSize: 10,
                letterSpacing: 1.5,
              ),
            ),
          ),

          _verdictButton(
            icon: LucideIcons.xOctagon,
            label: 'FALSE ALARM',
            sublabel: 'No crisis detected — retract alert immediately',
            color: MuhafizTheme.cautionAmber,
            onPressed: () =>
                _handleRetract('False Alarm / Sensor Mismatch'),
          ),
          const SizedBox(height: 10),
          _verdictButton(
            icon: LucideIcons.checkSquare,
            label: 'ROAD CLEAR',
            sublabel: 'Area secured — close and archive incident',
            color: MuhafizTheme.sovereignGreen,
            onPressed: () =>
                _handleRetract('Road Re-opened / Water Cleared'),
          ),
        ],
      ),
    );
  }

  Widget _verdictButton({
    required IconData icon,
    required String label,
    required String sublabel,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      height: 68,
      child: OutlinedButton(
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: color.withValues(alpha: 0.4)),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          backgroundColor: color.withValues(alpha: 0.06),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        onPressed: isSubmitting ? null : onPressed,
        child: Row(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(
                          color: color,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          fontFamily: 'monospace',
                          letterSpacing: 0.5)),
                  const SizedBox(height: 2),
                  Text(sublabel,
                      style: const TextStyle(
                          color: MuhafizTheme.textSecondary, fontSize: 10)),
                ],
              ),
            ),
            Icon(LucideIcons.chevronRight,
                color: color.withValues(alpha: 0.4), size: 18),
          ],
        ),
      ),
    );
  }
}
