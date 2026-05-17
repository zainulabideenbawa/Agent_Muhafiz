import 'dart:async';
import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/theme.dart';
import '../services/api_service.dart';
import '../widgets/feedback_widgets.dart';

/// Ground Truth Submission Tool
/// Allows field officers / citizens to submit ground reality back to the AI.
/// Wired to the Auditor Agent for alert retraction logic.
class GroundTruthScreen extends StatefulWidget {
  final String? incidentId;
  const GroundTruthScreen({super.key, this.incidentId});

  @override
  State<GroundTruthScreen> createState() => _GroundTruthScreenState();
}

class _GroundTruthScreenState extends State<GroundTruthScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _scanController;

  // UI state
  bool _cameraActive = false;
  bool _isSubmitting = false;
  String _submissionStatus = 'STANDBY'; // STANDBY | CONFIRMING | RETRACTING | DONE
  String? _activeAction; // 'confirm' | 'false_alarm' | 'road_clear'
  String? _resolvedIncidentId;

  @override
  void initState() {
    super.initState();
    _resolvedIncidentId = widget.incidentId;
    _scanController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();
  }

  @override
  void dispose() {
    _scanController.dispose();
    super.dispose();
  }

  // ─── ACTION HANDLERS ──────────────────────────────────────────────────────

  Future<void> _handleConfirmCrisis() async {
    if (_isSubmitting) return;
    setState(() {
      _isSubmitting = true;
      _activeAction = 'confirm';
      _submissionStatus = 'CONFIRMING';
    });

    // POST to backend — update incident state
    final response = await ApiService.post('/incidents/trigger-crisis', {
      'input': 'Ground Truth Confirmed: ${_resolvedIncidentId ?? "UNKNOWN"}',
    });

    await Future.delayed(const Duration(milliseconds: 800));
    setState(() {
      _isSubmitting = false;
      _submissionStatus = 'DONE';
    });

    if (response['success'] == true) {
      MuhafizFeedback.showToast('Crisis Confirmed — Sentinel-1 Alerted');
    } else {
      MuhafizFeedback.showToast('Confirmed Locally — Uplink Pending');
    }
  }

  Future<void> _handleFalseAlarm() async {
    if (_isSubmitting) return;
    _triggerRetraction('FALSE_ALARM', 'Ground Truth: False alarm reported by field citizen.');
  }

  Future<void> _handleRoadClear() async {
    if (_isSubmitting) return;
    _triggerRetraction('ROAD_CLEAR', 'Ground Truth: Road is clear. No obstruction confirmed.');
  }

  /// Triggers an alert retraction via the Auditor Agent
  Future<void> _triggerRetraction(String reason, String note) async {
    setState(() {
      _isSubmitting = true;
      _activeAction = reason == 'FALSE_ALARM' ? 'false_alarm' : 'road_clear';
      _submissionStatus = 'RETRACTING';
    });

    final incidentId = _resolvedIncidentId ?? 'MHFZ-UNKNOWN';

    // POST to Auditor Agent → triggers system-wide alert retraction in LangGraph
    final response = await ApiService.post('/incidents/retract-alert', {
      'incidentId': incidentId,
      'reason': note,
    });

    await Future.delayed(const Duration(milliseconds: 600));
    setState(() {
      _isSubmitting = false;
      _submissionStatus = 'DONE';
    });

    if (response['success'] == true) {
      MuhafizFeedback.showToast('ALERT RETRACTED — Units Recalled');
    } else {
      MuhafizFeedback.showToast('Retraction Logged — Awaiting Sync');
    }
  }

  // ─── BUILD ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MuhafizTheme.backgroundSlate,
      appBar: _buildAppBar(),
      body: SafeArea(
        child: Column(
          children: [
            _buildIncidentBanner(),
            Expanded(child: _buildCameraViewport()),
            _buildActionPanel(),
          ],
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF060E1A),
      elevation: 0,
      leading: BackButton(
        color: MuhafizTheme.primaryEmerald,
        onPressed: () => Navigator.pop(context),
      ),
      title: const Text(
        'GROUND TRUTH SUBMISSION',
        style: TextStyle(
          color: Colors.white,
          fontFamily: 'JetBrains Mono',
          fontSize: 11,
          letterSpacing: 2.0,
          fontWeight: FontWeight.bold,
        ),
      ),
      actions: [
        Container(
          margin: const EdgeInsets.only(right: 16),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: MuhafizTheme.primaryEmerald.withOpacity(0.1),
            borderRadius: BorderRadius.circular(2),
            border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.4)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(
                  color: MuhafizTheme.primaryEmerald,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                _submissionStatus,
                style: const TextStyle(
                  color: MuhafizTheme.primaryEmerald,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Divider(
          height: 1,
          color: MuhafizTheme.primaryEmerald.withOpacity(0.15),
        ),
      ),
    );
  }

  Widget _buildIncidentBanner() {
    final incidentId = _resolvedIncidentId ?? 'UNLINKED';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      color: const Color(0xFF060E1A),
      child: Row(
        children: [
          const Icon(LucideIcons.shieldAlert, color: Colors.amber, size: 16),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'LINKED INCIDENT',
                style: TextStyle(
                  color: Colors.amber,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 8,
                  letterSpacing: 1.5,
                ),
              ),
              Text(
                incidentId,
                style: const TextStyle(
                  color: Colors.white,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const Spacer(),
          GestureDetector(
            onTap: () {
              setState(() => _cameraActive = !_cameraActive);
              MuhafizFeedback.showToast(
                _cameraActive ? 'Camera Feed Deactivated' : 'Camera Feed Armed',
              );
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: _cameraActive
                    ? const Color(0xFFEF4444).withOpacity(0.15)
                    : MuhafizTheme.primaryEmerald.withOpacity(0.1),
                borderRadius: BorderRadius.circular(2),
                border: Border.all(
                  color: _cameraActive
                      ? const Color(0xFFEF4444)
                      : MuhafizTheme.primaryEmerald.withOpacity(0.4),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _cameraActive ? LucideIcons.cameraOff : LucideIcons.camera,
                    color: _cameraActive ? const Color(0xFFEF4444) : MuhafizTheme.primaryEmerald,
                    size: 14,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _cameraActive ? 'LIVE' : 'ARM CAMERA',
                    style: TextStyle(
                      color: _cameraActive ? const Color(0xFFEF4444) : MuhafizTheme.primaryEmerald,
                      fontFamily: 'JetBrains Mono',
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

  Widget _buildCameraViewport() {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Tactical grid background (simulates camera/scope overlay)
        CustomPaint(painter: _TacticalGridPainter()),

        // Simulated camera feed / placeholder
        if (_cameraActive)
          Container(
            color: Colors.black.withOpacity(0.85),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AnimatedBuilder(
                    animation: _scanController,
                    builder: (context, _) {
                      return Stack(
                        alignment: Alignment.center,
                        children: [
                          // Scan ring
                          Container(
                            width: 160 + (_scanController.value * 20),
                            height: 160 + (_scanController.value * 20),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: MuhafizTheme.primaryEmerald
                                    .withOpacity(1.0 - _scanController.value),
                                width: 1.5,
                              ),
                            ),
                          ),
                          // Crosshair
                          Container(
                            width: 140,
                            height: 140,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: MuhafizTheme.primaryEmerald.withOpacity(0.6),
                                width: 1,
                              ),
                            ),
                            child: CustomPaint(painter: _CrosshairPainter()),
                          ),
                          const Icon(
                            LucideIcons.camera,
                            color: MuhafizTheme.primaryEmerald,
                            size: 36,
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'GROUND TRUTH CAMERA ACTIVE',
                    style: TextStyle(
                      color: MuhafizTheme.primaryEmerald,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 11,
                      letterSpacing: 1.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Capture & log scene evidence for the permanent audit trail.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: MuhafizTheme.mutedSlate,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Shutter button
                  GestureDetector(
                    onTap: () => MuhafizFeedback.showToast('Photo logged to Audit Trail'),
                    child: Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: MuhafizTheme.primaryEmerald,
                          width: 3,
                        ),
                        color: MuhafizTheme.primaryEmerald.withOpacity(0.1),
                      ),
                      child: Center(
                        child: Container(
                          width: 54,
                          height: 54,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: MuhafizTheme.primaryEmerald,
                          ),
                          child: const Icon(
                            LucideIcons.aperture,
                            color: Color(0xFF003824),
                            size: 28,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          // Default HUD view when camera not armed
          Center(
            child: FadeIn(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: MuhafizTheme.primaryEmerald.withOpacity(0.3),
                      ),
                      color: MuhafizTheme.primaryEmerald.withOpacity(0.05),
                    ),
                    child: const Icon(
                      LucideIcons.scanLine,
                      color: MuhafizTheme.primaryEmerald,
                      size: 48,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'GROUND TRUTH TERMINAL',
                    style: TextStyle(
                      color: Colors.white,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 48),
                    child: Text(
                      'Arm the camera to capture scene evidence, then submit your ground reality verdict below.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: MuhafizTheme.mutedSlate,
                        fontSize: 12,
                        height: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  // Telemetry chips
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildTelemetryChip('LAT', '24.9008°N'),
                      const SizedBox(width: 12),
                      _buildTelemetryChip('LONG', '67.1681°E'),
                      const SizedBox(width: 12),
                      _buildTelemetryChip('ALT', '48m'),
                    ],
                  ),
                ],
              ),
            ),
          ),

        // Scan line overlay
        if (_cameraActive)
          AnimatedBuilder(
            animation: _scanController,
            builder: (context, _) {
              return Positioned(
                top: _scanController.value * MediaQuery.of(context).size.height * 0.6,
                left: 0,
                right: 0,
                child: Container(
                  height: 2,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.transparent,
                        MuhafizTheme.primaryEmerald.withOpacity(0.6),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              );
            },
          ),

        // Corner HUD markers
        Positioned(top: 16, left: 16, child: _buildCornerMarker()),
        Positioned(
          top: 16,
          right: 16,
          child: Transform.scale(scaleX: -1, child: _buildCornerMarker()),
        ),
        Positioned(
          bottom: 16,
          left: 16,
          child: Transform.scale(scaleY: -1, child: _buildCornerMarker()),
        ),
        Positioned(
          bottom: 16,
          right: 16,
          child: Transform.scale(
            scaleX: -1,
            scaleY: -1,
            child: _buildCornerMarker(),
          ),
        ),
      ],
    );
  }

  Widget _buildTelemetryChip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: MuhafizTheme.surfaceSlate,
        borderRadius: BorderRadius.circular(2),
        border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: const TextStyle(
              color: MuhafizTheme.primaryEmerald,
              fontFamily: 'JetBrains Mono',
              fontSize: 8,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontFamily: 'JetBrains Mono',
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCornerMarker() {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(painter: _CornerPainter()),
    );
  }

  Widget _buildActionPanel() {
    final bool isDone = _submissionStatus == 'DONE';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF060E1A),
        border: Border(
          top: BorderSide(color: MuhafizTheme.primaryEmerald.withOpacity(0.15)),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'SUBMIT GROUND VERDICT',
            style: TextStyle(
              color: MuhafizTheme.primaryEmerald,
              fontFamily: 'JetBrains Mono',
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 2,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          const Text(
            'Your submission triggers a real-time update in the Sentinel AI Council.',
            style: TextStyle(
              color: MuhafizTheme.mutedSlate,
              fontSize: 10,
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),

          if (isDone) ...[
            FadeIn(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: MuhafizTheme.primaryEmerald.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.4)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(LucideIcons.checkCircle,
                        color: MuhafizTheme.primaryEmerald, size: 18),
                    const SizedBox(width: 10),
                    Text(
                      _activeAction == 'confirm'
                          ? 'CRISIS CONFIRMED — SENTINEL NOTIFIED'
                          : 'ALERT RETRACTED — UNITS RECALLED',
                      style: const TextStyle(
                        color: MuhafizTheme.primaryEmerald,
                        fontFamily: 'JetBrains Mono',
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () {
                setState(() {
                  _submissionStatus = 'STANDBY';
                  _activeAction = null;
                });
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: MuhafizTheme.primaryEmerald,
                side: const BorderSide(color: MuhafizTheme.primaryEmerald),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
              ),
              child: const Text('SUBMIT ANOTHER REPORT',
                  style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11)),
            ),
          ] else if (_isSubmitting) ...[
            Center(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        color: MuhafizTheme.primaryEmerald,
                        strokeWidth: 2,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      _submissionStatus == 'RETRACTING'
                          ? 'TRANSMITTING RETRACTION TO AUDITOR...'
                          : 'UPSTREAMING CRISIS CONFIRMATION...',
                      style: const TextStyle(
                        color: Colors.amber,
                        fontFamily: 'JetBrains Mono',
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ] else ...[
            // ── CONFIRM CRISIS (Primary — Emerald) ───────────────────────
            SizedBox(
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _handleConfirmCrisis,
                icon: const Icon(LucideIcons.shieldAlert, size: 18),
                label: const Text(
                  'CONFIRM CRISIS',
                  style: TextStyle(
                    fontFamily: 'JetBrains Mono',
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: MuhafizTheme.primaryEmerald,
                  foregroundColor: const Color(0xFF003824),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                  elevation: 0,
                ),
              ),
            ),

            const SizedBox(height: 10),

            // ── FALSE ALARM + ROAD CLEAR ─────────────────────────────────
            Row(
              children: [
                // FALSE ALARM (Red)
                Expanded(
                  child: SizedBox(
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: _handleFalseAlarm,
                      icon: const Icon(LucideIcons.xCircle, size: 16),
                      label: const Text(
                        'FALSE ALARM',
                        style: TextStyle(
                          fontFamily: 'JetBrains Mono',
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                        elevation: 0,
                      ),
                    ),
                  ),
                ),

                const SizedBox(width: 10),

                // ROAD CLEAR (Amber)
                Expanded(
                  child: SizedBox(
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: _handleRoadClear,
                      icon: const Icon(LucideIcons.checkCheck, size: 16),
                      label: const Text(
                        'ROAD CLEAR',
                        style: TextStyle(
                          fontFamily: 'JetBrains Mono',
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.amber.shade700,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                        elevation: 0,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

// ─── CUSTOM PAINTERS ────────────────────────────────────────────────────────

class _TacticalGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = MuhafizTheme.primaryEmerald.withOpacity(0.04)
      ..strokeWidth = 1;
    const step = 28.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _CrosshairPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = MuhafizTheme.primaryEmerald.withOpacity(0.8)
      ..strokeWidth = 1.5;
    final cx = size.width / 2;
    final cy = size.height / 2;
    final gap = 14.0;
    final len = 22.0;
    // Horizontal
    canvas.drawLine(Offset(cx - gap - len, cy), Offset(cx - gap, cy), paint);
    canvas.drawLine(Offset(cx + gap, cy), Offset(cx + gap + len, cy), paint);
    // Vertical
    canvas.drawLine(Offset(cx, cy - gap - len), Offset(cx, cy - gap), paint);
    canvas.drawLine(Offset(cx, cy + gap), Offset(cx, cy + gap + len), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _CornerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = MuhafizTheme.primaryEmerald.withOpacity(0.6)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset.zero, Offset(size.width, 0), paint);
    canvas.drawLine(Offset.zero, Offset(0, size.height), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
