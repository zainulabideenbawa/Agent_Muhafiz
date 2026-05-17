import 'package:flutter/material.dart';
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
  
  // Mock logs for the trace HUD
  late List<Map<String, dynamic>> traceLogs;

  @override
  void initState() {
    super.initState();
    traceLogs = [
      {'agent': 'The Sentinel', 'message': 'Signal clustered at ${widget.incident['location']}'},
      {'agent': 'The TruthEngine', 'message': 'Verification score: 0.88 via telemetry'},
    ];
  }

  Future<void> _handleRetract(String reason) async {
    setState(() => isSubmitting = true);
    final success = await ApiService.retractAlert(widget.incident['incident_id'], reason);
    if (success && mounted) {
      setState(() {
        traceLogs.add({'agent': 'The Auditor', 'message': 'RETRACTION TRIGGERED: $reason'});
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('AUDITOR: Alert retracted for ${widget.incident['incident_id']}'),
          backgroundColor: MuhafizTheme.sovereignGreen,
        ),
      );
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) {
          Navigator.pop(context);
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('GROUND TRUTH AUDIT')),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Tactical Camera HUD
                  Container(
                    height: 240,
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: MuhafizTheme.surfaceBorder),
                    ),
                    child: Stack(
                      children: [
                        Center(
                          child: Icon(Icons.videocam_off, color: Colors.white.withOpacity(0.05), size: 80),
                        ),
                        // HUD elements
                        Positioned(
                          top: 10, left: 10,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(border: Border.all(color: MuhafizTheme.crisisRed)),
                            child: const Text('REC ●', style: TextStyle(color: MuhafizTheme.crisisRed, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ),
                        const Center(child: Icon(Icons.add, color: Colors.white24)),
                        Align(
                          alignment: Alignment.bottomCenter,
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: ElevatedButton.icon(
                              onPressed: () {},
                              icon: const Icon(Icons.camera_alt),
                              label: const Text('CAPTURE EVIDENCE'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white10,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  const Text(
                    'AUDIT VERDICT',
                    style: TextStyle(color: MuhafizTheme.textSecondary, fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 1),
                  ),
                  const SizedBox(height: 16),
                  
                  _buildVerdictButton(
                    label: 'CONFIRM CRISIS',
                    color: MuhafizTheme.crisisRed,
                    icon: Icons.check_circle_outline,
                    onPressed: () => Navigator.pop(context),
                  ),
                  const SizedBox(height: 12),
                  _buildVerdictButton(
                    label: 'FALSE ALARM',
                    color: MuhafizTheme.cautionAmber,
                    icon: Icons.error_outline,
                    onPressed: () => _handleRetract('False Alarm / Sensor Mismatch'),
                  ),
                  const SizedBox(height: 12),
                  _buildVerdictButton(
                    label: 'ROAD CLEAR',
                    color: MuhafizTheme.sovereignGreen,
                    icon: Icons.map_outlined,
                    onPressed: () => _handleRetract('Road Re-opened / Water Cleared'),
                  ),
                ],
              ),
            ),
          ),
          
          // Agent Trace HUD at the bottom
          AgentTraceHud(logs: traceLogs),
        ],
      ),
    );
  }

  Widget _buildVerdictButton({
    required String label,
    required Color color,
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      height: 64,
      child: OutlinedButton(
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: color.withOpacity(0.5)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          backgroundColor: color.withOpacity(0.05),
        ),
        onPressed: isSubmitting ? null : onPressed,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 1),
            ),
          ],
        ),
      ),
    );
  }
}
