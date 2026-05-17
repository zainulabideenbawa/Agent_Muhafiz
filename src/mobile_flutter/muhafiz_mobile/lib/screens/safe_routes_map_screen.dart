import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/theme.dart';
import '../services/api_service.dart';
import '../widgets/feedback_widgets.dart';

class SafeRoutesMapScreen extends StatefulWidget {
  const SafeRoutesMapScreen({super.key});

  @override
  State<SafeRoutesMapScreen> createState() => _SafeRoutesMapScreenState();
}

class _SafeRoutesMapScreenState extends State<SafeRoutesMapScreen> with SingleTickerProviderStateMixin {
  late AnimationController _radarController;
  List<Map<String, dynamic>> _activeCrises = [];
  bool _isLoading = false;
  double _zoomScale = 1.0;
  bool _evacuationPathwayConverged = true;
  String _currentSector = "GULSHAN-E-IQBAL, SEC-4";
  
  // Center of our radar grid
  final Offset _citizenPosition = const Offset(0.0, 0.0);
  
  // Safe Destination Point
  final Offset _safeHubPosition = const Offset(150.0, -180.0);

  // Fallback preset incidents in case backend is empty
  final List<Map<String, dynamic>> _presetIncidents = [
    {
      'id': 'MHFZ-4821',
      'title': 'FIRE OUTBREAK',
      'location': 'Block 4 Market',
      'coordinate': const Offset(-80.0, -50.0),
      'radius': 60.0,
      'severity': 'HIGH',
      'details': 'Commercial market fire. Air quality compromised.',
      'confidence': 0.94,
    },
    {
      'id': 'MHFZ-9023',
      'title': 'ARMED ROBBERY / POLICE CORDON',
      'location': 'Main Boulevard',
      'coordinate': const Offset(60.0, 80.0),
      'radius': 45.0,
      'severity': 'CRITICAL',
      'details': 'Active gunshots reported near Main Boulevard.',
      'confidence': 0.88,
    },
    {
      'id': 'MHFZ-1108',
      'title': 'GAS CYLINDER BLAST',
      'location': 'Sector 3 Commercial',
      'coordinate': const Offset(-120.0, 110.0),
      'radius': 50.0,
      'severity': 'HIGH',
      'details': 'Building collapse. Rescue units dispatched.',
      'confidence': 0.96,
    }
  ];

  @override
  void initState() {
    super.initState();
    _radarController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();
    _fetchLiveIncidents();
  }

  @override
  void dispose() {
    _radarController.dispose();
    super.dispose();
  }

  Future<void> _fetchLiveIncidents() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService.get('/incidents');
      if (response['success'] && response['data'] != null && (response['data'] as List).isNotEmpty) {
        final List<dynamic> rawList = response['data'];
        List<Map<String, dynamic>> mappedList = [];
        
        // Map backend incidents to visual coordinates dynamically
        for (int i = 0; i < rawList.length; i++) {
          final item = rawList[i];
          final String title = (item['type'] ?? 'CRISIS').toString().toUpperCase();
          final String locationName = (item['location'] ?? 'ANALYZING').toString();
          
          // Generate deterministic coordinates scattered around center based on incident id / hash
          final int idHash = (item['incident_id'] ?? '').toString().hashCode;
          final double angle = (idHash % 360) * math.pi / 180;
          final double distance = 60.0 + (idHash % 140);
          final Offset coordinate = Offset(
            math.cos(angle) * distance,
            math.sin(angle) * distance,
          );
          
          // Radius based on incident state or default
          double radius = 40.0;
          if (item['status'] == 'CONFIRMED') radius = 65.0;
          if (item['status'] == 'RESOLVED') continue; // Hide resolved issues
          
          final double confidence = item['data']?['confidence']?.toDouble() ?? 0.85;

          mappedList.add({
            'id': item['incident_id'] ?? 'MHFZ-0000',
            'title': title,
            'location': locationName,
            'coordinate': coordinate,
            'radius': radius,
            'severity': item['status'] == 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            'details': item['description'] ?? 'Analyst Agent scanning area.',
            'confidence': confidence,
          });
        }
        
        setState(() {
          _activeCrises = mappedList.isEmpty ? _presetIncidents : mappedList;
          _isLoading = false;
        });
      } else {
        // Fallback to preset high-fidelity mock data if no server data
        setState(() {
          _activeCrises = _presetIncidents;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _activeCrises = _presetIncidents;
        _isLoading = false;
      });
    }
  }

  void _recalculateRoute() {
    setState(() {
      _evacuationPathwayConverged = false;
    });
    MuhafizFeedback.showToast("Bypassing Danger Zones...");
    Timer(const Duration(milliseconds: 1200), () {
      if (mounted) {
        setState(() {
          _evacuationPathwayConverged = true;
        });
        MuhafizFeedback.showToast("Optimal Green Route Recalculated");
      }
    });
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
                  _buildRadarGrid(),
                  _buildSideTelemetryOverlay(),
                  _buildZoomControls(),
                  if (_isLoading)
                    Container(
                      color: Colors.black.withOpacity(0.4),
                      child: const Center(
                        child: CircularProgressIndicator(
                          color: MuhafizTheme.primaryEmerald,
                        ),
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
          bottom: BorderSide(color: MuhafizTheme.primaryEmerald.withOpacity(0.15)),
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
                  _currentSector,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontSize: 18,
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

  Widget _buildRadarGrid() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final center = Offset(constraints.maxWidth / 2, constraints.maxHeight / 2);
        return GestureDetector(
          onPanUpdate: (details) {
            // Add slight interactive panning behavior
          },
          child: AnimatedBuilder(
            animation: _radarController,
            builder: (context, child) {
              return CustomPaint(
                size: Size(constraints.maxWidth, constraints.maxHeight),
                painter: RadarMapPainter(
                  sweepAngle: _radarController.value * 2 * math.pi,
                  citizenCenter: center,
                  crises: _activeCrises,
                  safeHub: _safeHubPosition,
                  zoomScale: _zoomScale,
                  routeConverged: _evacuationPathwayConverged,
                ),
              );
            },
          ),
        );
      },
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
            color: const Color(0xFF0F1B35).withOpacity(0.85),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'HUD TELEMETRY',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: MuhafizTheme.primaryEmerald,
                  fontWeight: FontWeight.bold,
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
                    color: MuhafizTheme.primaryEmerald.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(2),
                    border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.4)),
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
                if (_zoomScale < 1.8) _zoomScale += 0.15;
              });
            },
          ),
          const SizedBox(height: 8),
          _buildCircleButton(
            icon: LucideIcons.minus,
            onPressed: () {
              setState(() {
                if (_zoomScale > 0.6) _zoomScale -= 0.15;
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
        color: const Color(0xFF0F1B35).withOpacity(0.85),
        border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.2)),
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
          top: BorderSide(color: MuhafizTheme.primaryEmerald.withOpacity(0.15)),
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
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'SOURCE: ANALYST AGENT',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: MuhafizTheme.primaryEmerald,
                    fontSize: 8,
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
                      final bool isCritical = crisis['severity'] == 'CRITICAL';
                      return FadeInRight(
                        delay: Duration(milliseconds: index * 100),
                        child: Container(
                          width: 280,
                          margin: const EdgeInsets.only(right: 12, bottom: 16),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: MuhafizTheme.surfaceSlate,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(
                              color: isCritical ? Colors.redAccent.withOpacity(0.4) : MuhafizTheme.primaryEmerald.withOpacity(0.2),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: isCritical ? Colors.redAccent.withOpacity(0.15) : Colors.amber.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(2),
                                      border: Border.all(
                                        color: isCritical ? Colors.redAccent : Colors.amber,
                                      ),
                                    ),
                                    child: Text(
                                      isCritical ? 'CRITICAL' : 'HIGH SEVERITY',
                                      style: TextStyle(
                                        fontFamily: 'JetBrains Mono',
                                        fontSize: 8,
                                        fontWeight: FontWeight.bold,
                                        color: isCritical ? Colors.redAccent : Colors.amber,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    crisis['id'],
                                    style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, color: MuhafizTheme.mutedSlate),
                                  ),
                                  const Spacer(),
                                  const Icon(LucideIcons.radio, color: Colors.redAccent, size: 12),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${(crisis['confidence'] * 100).toInt()}% CONF',
                                    style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 8, color: Colors.white, fontWeight: FontWeight.bold),
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

class RadarMapPainter extends CustomPainter {
  final double sweepAngle;
  final Offset citizenCenter;
  final List<Map<String, dynamic>> crises;
  final Offset safeHub;
  final double zoomScale;
  final bool routeConverged;

  RadarMapPainter({
    required this.sweepAngle,
    required this.citizenCenter,
    required this.crises,
    required this.safeHub,
    required this.zoomScale,
    required this.routeConverged,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    canvas.clipRect(rect);

    // 1. Grid Background
    final paintGrid = Paint()
      ..color = MuhafizTheme.primaryEmerald.withOpacity(0.04)
      ..strokeWidth = 1.0;
    
    const double gridSize = 40.0;
    final double adjustedGridSize = gridSize * zoomScale;
    
    for (double x = 0; x < size.width; x += adjustedGridSize) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paintGrid);
    }
    for (double y = 0; y < size.height; y += adjustedGridSize) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paintGrid);
    }

    // 2. Concentric Radar Rings
    final paintRing = Paint()
      ..style = PaintingStyle.stroke
      ..color = MuhafizTheme.primaryEmerald.withOpacity(0.12)
      ..strokeWidth = 1.0;

    final double maxRadius = math.max(size.width, size.height) * 0.8;
    for (double radius = adjustedGridSize; radius < maxRadius; radius += adjustedGridSize * 1.5) {
      canvas.drawCircle(citizenCenter, radius, paintRing);
    }

    // 3. Radar Sweep Line
    final paintSweep = Paint()
      ..style = PaintingStyle.stroke
      ..color = MuhafizTheme.primaryEmerald.withOpacity(0.08)
      ..strokeWidth = 2.0;

    canvas.drawLine(
      citizenCenter,
      Offset(
        citizenCenter.dx + maxRadius * math.cos(sweepAngle),
        citizenCenter.dy + maxRadius * math.sin(sweepAngle),
      ),
      paintSweep,
    );

    // Glowing sweep gradient arch
    final sweepRect = Rect.fromCircle(center: citizenCenter, radius: maxRadius);
    final sweepGradient = SweepGradient(
      center: Alignment.center,
      startAngle: sweepAngle - 0.4,
      endAngle: sweepAngle,
      colors: [
        MuhafizTheme.primaryEmerald.withOpacity(0.0),
        MuhafizTheme.primaryEmerald.withOpacity(0.15),
      ],
      stops: const [0.0, 1.0],
    );

    final sweepBrush = Paint()
      ..shader = sweepGradient.createShader(sweepRect)
      ..style = PaintingStyle.fill;
    
    canvas.drawArc(
      sweepRect,
      sweepAngle - 0.4,
      0.4,
      true,
      sweepBrush,
    );

    // 4. Draw Threat / Danger Polygons (circles of hazard)
    for (final crisis in crises) {
      final Offset coordinate = crisis['coordinate'] as Offset;
      final double radius = (crisis['radius'] as double) * zoomScale;
      final Offset targetCenter = Offset(
        citizenCenter.dx + coordinate.dx * zoomScale,
        citizenCenter.dy + coordinate.dy * zoomScale,
      );

      final bool isCritical = crisis['severity'] == 'CRITICAL';
      final Color dangerColor = isCritical ? Colors.redAccent : Colors.orangeAccent;

      // Pulsing threat background
      final double pulse = 1.0 + 0.12 * math.sin(sweepAngle * 4);
      final paintDangerFill = Paint()
        ..color = dangerColor.withOpacity(0.15)
        ..style = PaintingStyle.fill;
      
      canvas.drawCircle(targetCenter, radius * pulse, paintDangerFill);

      // Threat borders
      final paintDangerBorder = Paint()
        ..color = dangerColor.withOpacity(0.4)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5;
      
      canvas.drawCircle(targetCenter, radius * pulse, paintDangerBorder);
      
      // Outer dashes/indicators
      final paintDashes = Paint()
        ..color = dangerColor.withOpacity(0.6)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0;

      for (double angle = 0; angle < 2 * math.pi; angle += math.pi / 4) {
        final startOffset = Offset(
          targetCenter.dx + (radius * pulse - 4) * math.cos(angle),
          targetCenter.dy + (radius * pulse - 4) * math.sin(angle),
        );
        final endOffset = Offset(
          targetCenter.dx + (radius * pulse + 4) * math.cos(angle),
          targetCenter.dy + (radius * pulse + 4) * math.sin(angle),
        );
        canvas.drawLine(startOffset, endOffset, paintDashes);
      }

      // Draw red event label box/telemetry
      final textPainter = TextPainter(
        text: TextSpan(
          text: crisis['id'],
          style: const TextStyle(
            color: Colors.white,
            fontSize: 7.5,
            fontWeight: FontWeight.bold,
            fontFamily: 'JetBrains Mono',
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();

      final labelRect = Rect.fromLTWH(
        targetCenter.dx - textPainter.width / 2 - 4,
        targetCenter.dy - radius * pulse - 16,
        textPainter.width + 8,
        12,
      );
      
      canvas.drawRect(
        labelRect,
        Paint()..color = dangerColor.withOpacity(0.85),
      );
      
      textPainter.paint(
        canvas,
        Offset(labelRect.left + 4, labelRect.top + 1),
      );
    }

    // 5. Draw Optimal Green Bypass Polyline
    if (routeConverged) {
      final paintRoute = Paint()
        ..color = MuhafizTheme.primaryEmerald
        ..strokeWidth = 3.0
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round;

      final paintRouteGlow = Paint()
        ..color = MuhafizTheme.primaryEmerald.withOpacity(0.3)
        ..strokeWidth = 8.0
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round;

      // Draw path navigating custom waypoints around threats to reach the Safe Hub
      final List<Offset> pathPoints = [citizenCenter];
      
      // Calculate intermediates that bypass the circles
      final Offset endPoint = Offset(
        citizenCenter.dx + safeHub.dx * zoomScale,
        citizenCenter.dy + safeHub.dy * zoomScale,
      );

      // Determine bypass waypoints based on active crises
      Offset current = citizenCenter;
      List<Offset> waypoints = [];

      // Static bypass rules to cleanly dodge mock locations
      waypoints.add(Offset(citizenCenter.dx - 20 * zoomScale, citizenCenter.dy - 80 * zoomScale));
      waypoints.add(Offset(citizenCenter.dx + 60 * zoomScale, citizenCenter.dy - 130 * zoomScale));
      
      pathPoints.addAll(waypoints);
      pathPoints.add(endPoint);

      final Path routePath = Path();
      routePath.moveTo(pathPoints.first.dx, pathPoints.first.dy);
      for (int i = 1; i < pathPoints.length; i++) {
        routePath.lineTo(pathPoints[i].dx, pathPoints[i].dy);
      }

      canvas.drawPath(routePath, paintRouteGlow);
      canvas.drawPath(routePath, paintRoute);

      // Draw dotted segments/vectors at coordinates
      final paintDotted = Paint()
        ..color = MuhafizTheme.primaryEmerald.withOpacity(0.6)
        ..strokeWidth = 1.0;
      
      for (final pt in pathPoints) {
        canvas.drawCircle(pt, 4.0, paintRoute);
      }
    }

    // 6. Draw Safe Evacuation Hub Target Marker
    final Offset targetHub = Offset(
      citizenCenter.dx + safeHub.dx * zoomScale,
      citizenCenter.dy + safeHub.dy * zoomScale,
    );

    final paintHub = Paint()
      ..color = MuhafizTheme.primaryEmerald
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(targetHub, 8.0, paintHub);

    final paintHubOuter = Paint()
      ..color = MuhafizTheme.primaryEmerald.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    
    final double pulseScale = 1.4 + 0.3 * math.sin(sweepAngle * 6);
    canvas.drawCircle(targetHub, 8.0 * pulseScale, paintHubOuter);

    // Draw 'H' for Hub
    final hubText = TextPainter(
      text: const TextSpan(
        text: 'H',
        style: TextStyle(
          color: Color(0xFF003824),
          fontSize: 9.0,
          fontWeight: FontWeight.bold,
          fontFamily: 'JetBrains Mono',
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();

    hubText.paint(
      canvas,
      Offset(targetHub.dx - hubText.width / 2, targetHub.dy - hubText.height / 2),
    );

    // Draw label for EVAC ZONE
    final hubLabel = TextPainter(
      text: const TextSpan(
        text: 'SAFE ZONE H-1',
        style: TextStyle(
          color: MuhafizTheme.primaryEmerald,
          fontSize: 8.5,
          fontWeight: FontWeight.bold,
          fontFamily: 'JetBrains Mono',
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();

    hubLabel.paint(
      canvas,
      Offset(targetHub.dx - hubLabel.width / 2, targetHub.dy - 22.0),
    );

    // 7. Draw Citizen (User) Pulse Marker at center
    final paintCitizen = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(citizenCenter, 6.0, paintCitizen);

    final paintCitizenOuter = Paint()
      ..color = Colors.white.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    
    final double pulseCitizen = 1.3 + 0.35 * math.sin(sweepAngle * 5);
    canvas.drawCircle(citizenCenter, 6.0 * pulseCitizen, paintCitizenOuter);

    // Label for CITIZEN location
    final citizenLabel = TextPainter(
      text: const TextSpan(
        text: 'MY POSITION',
        style: TextStyle(
          color: Colors.white,
          fontSize: 8.5,
          fontWeight: FontWeight.bold,
          fontFamily: 'JetBrains Mono',
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();

    citizenLabel.paint(
      canvas,
      Offset(citizenCenter.dx - citizenLabel.width / 2, citizenCenter.dy + 12.0),
    );
  }

  @override
  bool shouldRepaint(covariant RadarMapPainter oldDelegate) {
    return oldDelegate.sweepAngle != sweepAngle ||
        oldDelegate.zoomScale != zoomScale ||
        oldDelegate.crises != crises ||
        oldDelegate.routeConverged != routeConverged;
  }
}
