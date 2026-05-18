import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../theme.dart';
import '../services/api_service.dart';
import '../widgets/agent_trace_hud.dart';

class GroundTruthScreen extends StatefulWidget {
  final Map<String, dynamic> incident;
  const GroundTruthScreen({super.key, required this.incident});

  @override
  State<GroundTruthScreen> createState() => _GroundTruthScreenState();
}

class _GroundTruthScreenState extends State<GroundTruthScreen> {
  bool isSubmitting = false;
  File? _capturedImage;
  final ImagePicker _picker = ImagePicker();

  late List<Map<String, dynamic>> traceLogs;

  @override
  void initState() {
    super.initState();
    traceLogs = [];
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
          });
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('CAMERA ERROR: $e'),
            backgroundColor: MuhafizTheme.crisisRed,
          ),
        );
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
          });
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('GALLERY ERROR: $e'),
            backgroundColor: MuhafizTheme.crisisRed,
          ),
        );
      }
    }
  }

  Future<void> _handleConfirm(String note) async {
    setState(() => isSubmitting = true);
    final success = await ApiService.confirmCrisis(
      widget.incident['incident_id'] ?? '',
      note,
    );
    if (!mounted) return;
    if (success) {
      setState(() {
        traceLogs.add({
          'agent': 'The Auditor',
          'message': 'CRISIS CONFIRMED: $note',
          'outcome': 'Success',
        });
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'AUDITOR: Crisis confirmed — ${widget.incident['incident_id']}',
          ),
          backgroundColor: MuhafizTheme.sovereignGreen,
        ),
      );
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) Navigator.pop(context);
    } else {
      setState(() => isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('CONFIRMATION FAILED — CHECK SERVER'),
          backgroundColor: MuhafizTheme.crisisRed,
        ),
      );
    }
  }

  Future<void> _handleRetract(String reason) async {
    setState(() => isSubmitting = true);
    final success = await ApiService.retractAlert(
      widget.incident['incident_id'] ?? '',
      reason,
    );
    if (!mounted) return;
    if (success) {
      setState(() {
        traceLogs.add({
          'agent': 'The Auditor',
          'message': 'RETRACTION TRIGGERED: $reason',
          'outcome': 'Success',
        });
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'AUDITOR: Alert retracted — ${widget.incident['incident_id']}',
          ),
          backgroundColor: MuhafizTheme.sovereignGreen,
        ),
      );
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) Navigator.pop(context);
    } else {
      setState(() => isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('RETRACTION FAILED — CHECK SERVER'),
          backgroundColor: MuhafizTheme.crisisRed,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'AUDIT // ${widget.incident['incident_id'] ?? 'UNKNOWN'}',
          style: const TextStyle(fontSize: 14, letterSpacing: 1.5),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Incident location chip
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: MuhafizTheme.tacticalGray,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: MuhafizTheme.surfaceBorder),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.location_on,
                          color: MuhafizTheme.crisisRed,
                          size: 16,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            widget.incident['location'] ?? 'LOCATION UNKNOWN',
                            style: const TextStyle(
                              color: Colors.white,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: MuhafizTheme.crisisRed.withValues(
                              alpha: 0.1,
                            ),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: MuhafizTheme.crisisRed.withValues(
                                alpha: 0.4,
                              ),
                            ),
                          ),
                          child: Text(
                            widget.incident['status'] ?? 'ACTIVE',
                            style: const TextStyle(
                              color: MuhafizTheme.crisisRed,
                              fontSize: 9,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // ── FIELD EVIDENCE CAMERA ────────────────────────────
                  const Text(
                    'FIELD EVIDENCE',
                    style: TextStyle(
                      color: MuhafizTheme.textSecondary,
                      fontFamily: 'monospace',
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    height: 220,
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: _capturedImage != null
                            ? MuhafizTheme.sovereignGreen
                            : MuhafizTheme.surfaceBorder,
                        width: _capturedImage != null ? 1.5 : 1,
                      ),
                    ),
                    child: Stack(
                      children: [
                        // Preview or placeholder
                        ClipRRect(
                          borderRadius: BorderRadius.circular(13),
                          child: _capturedImage != null
                              ? Image.file(
                                  _capturedImage!,
                                  width: double.infinity,
                                  height: double.infinity,
                                  fit: BoxFit.cover,
                                )
                              : Center(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.camera_enhance_outlined,
                                        color: Colors.white.withValues(
                                          alpha: 0.08,
                                        ),
                                        size: 64,
                                      ),
                                      const SizedBox(height: 10),
                                      Text(
                                        'NO EVIDENCE CAPTURED',
                                        style: TextStyle(
                                          color: Colors.white.withValues(
                                            alpha: 0.15,
                                          ),
                                          fontFamily: 'monospace',
                                          fontSize: 10,
                                          letterSpacing: 1.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                        ),

                        // Status badge top-left
                        Positioned(
                          top: 10,
                          left: 12,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: _capturedImage != null
                                    ? MuhafizTheme.sovereignGreen
                                    : MuhafizTheme.crisisRed,
                              ),
                              borderRadius: BorderRadius.circular(4),
                              color: Colors.black.withValues(alpha: 0.6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: BoxDecoration(
                                    color: _capturedImage != null
                                        ? MuhafizTheme.sovereignGreen
                                        : MuhafizTheme.crisisRed,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  _capturedImage != null
                                      ? 'EVIDENCE LOGGED'
                                      : 'AWAITING CAPTURE',
                                  style: TextStyle(
                                    color: _capturedImage != null
                                        ? MuhafizTheme.sovereignGreen
                                        : MuhafizTheme.crisisRed,
                                    fontSize: 9,
                                    fontFamily: 'monospace',
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        // Camera / Gallery buttons at bottom
                        Align(
                          alignment: Alignment.bottomCenter,
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              children: [
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: _openCamera,
                                    icon: const Icon(
                                      Icons.camera_alt,
                                      size: 16,
                                    ),
                                    label: const Text(
                                      'CAPTURE EVIDENCE',
                                      style: TextStyle(
                                        fontFamily: 'monospace',
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor:
                                          MuhafizTheme.sovereignGreen,
                                      foregroundColor: Colors.black,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 10,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      elevation: 0,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                OutlinedButton(
                                  onPressed: _openGallery,
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: MuhafizTheme.textSecondary,
                                    side: const BorderSide(
                                      color: MuhafizTheme.surfaceBorder,
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 10,
                                      horizontal: 12,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  child: const Icon(
                                    Icons.photo_library_outlined,
                                    size: 20,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),

                  // ── VERDICT BUTTONS ──────────────────────────────────
                  const Text(
                    'AUDIT VERDICT',
                    style: TextStyle(
                      color: MuhafizTheme.textSecondary,
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 14),

                  _buildVerdictButton(
                    label: 'CONFIRM CRISIS',
                    sublabel: 'Situation active — alert remains live',
                    color: MuhafizTheme.crisisRed,
                    icon: Icons.check_circle_outline,
                    onPressed: () => _handleConfirm(
                      'Crisis confirmed active by Sindh Police field units.',
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildVerdictButton(
                    label: 'FALSE ALARM',
                    sublabel: 'No crisis found — retract alert system-wide',
                    color: MuhafizTheme.cautionAmber,
                    icon: Icons.error_outline,
                    onPressed: () =>
                        _handleRetract('False Alarm / Sensor Mismatch'),
                  ),
                  const SizedBox(height: 12),
                  _buildVerdictButton(
                    label: 'ROAD CLEAR',
                    sublabel: 'Area secured — close and archive incident',
                    color: MuhafizTheme.sovereignGreen,
                    icon: Icons.map_outlined,
                    onPressed: () =>
                        _handleRetract('Road Re-opened / Water Cleared'),
                  ),
                ],
              ),
            ),
          ),

          // Pinned agent trace HUD
          AgentTraceHud(logs: traceLogs),
        ],
      ),
    );
  }

  Widget _buildVerdictButton({
    required String label,
    required String sublabel,
    required Color color,
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      height: 72,
      child: OutlinedButton(
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: color.withValues(alpha: 0.5)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          backgroundColor: color.withValues(alpha: 0.05),
          padding: const EdgeInsets.symmetric(horizontal: 20),
        ),
        onPressed: isSubmitting ? null : onPressed,
        child: Row(
          children: [
            Icon(icon, color: color, size: 26),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      letterSpacing: 1,
                      fontFamily: 'monospace',
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    sublabel,
                    style: const TextStyle(
                      color: MuhafizTheme.textSecondary,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            if (isSubmitting)
              SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(color: color, strokeWidth: 2),
              )
            else
              Icon(
                Icons.chevron_right,
                color: color.withValues(alpha: 0.5),
                size: 20,
              ),
          ],
        ),
      ),
    );
  }
}
