import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' hide Size;
import '../theme.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import 'ground_truth_screen.dart';
import 'verification_quest_screen.dart';

class DispatchInboxScreen extends StatefulWidget {
  const DispatchInboxScreen({super.key});

  @override
  State<DispatchInboxScreen> createState() => _DispatchInboxScreenState();
}

class _DispatchInboxScreenState extends State<DispatchInboxScreen> {
  List<Map<String, dynamic>> incidents = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
    OfficerSocketService.connect(ApiService.wsUrl);
    OfficerSocketService.addListener(_handleSocketMessage);
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
  }

  @override
  void dispose() {
    OfficerSocketService.removeListener(_handleSocketMessage);
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() => isLoading = true);
    final data = await ApiService.getIncidents();
    setState(() {
      incidents = data;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // Custom header row
          SafeArea(
            bottom: false,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: MuhafizTheme.surfaceBorder)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.inbox, color: MuhafizTheme.sovereignGreen, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'DISPATCH FEED',
                        style: TextStyle(
                          color: Colors.white,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          letterSpacing: 2,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.sync, color: MuhafizTheme.sovereignGreen, size: 20),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    tooltip: 'Refresh',
                    onPressed: _fetchData,
                  ),
                ],
              ),
            ),
          ),
          // Live Routing Map
          Container(
            height: 250,
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: MuhafizTheme.sovereignGreen, width: 2)),
            ),
            child: Stack(
              children: [
                MapWidget(
                  onMapCreated: (MapboxMap mapboxMap) {
                    // Map initialization
                  },
                ),
                // Overlay for the "Live Routing Map" HUD
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.7),
                      border: Border.all(color: MuhafizTheme.sovereignGreen),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.satellite_alt, color: MuhafizTheme.sovereignGreen, size: 14),
                        SizedBox(width: 6),
                        Text('ORACLE LIVE ROUTING', style: TextStyle(color: MuhafizTheme.sovereignGreen, fontSize: 10, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Dispatch Feed
          Expanded(
            child: Stack(
              children: [
                // Background Tactical Grid
                CustomPaint(
                  painter: TacticalGridPainter(),
                  child: Container(),
                ),
                
                if (isLoading)
                  const Center(child: CircularProgressIndicator(color: MuhafizTheme.sovereignGreen))
                else if (incidents.isEmpty)
                  const Center(child: Text('NO ACTIVE MISSIONS', style: TextStyle(color: MuhafizTheme.textSecondary)))
                else
                  ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                    itemCount: incidents.length,
                    itemBuilder: (context, index) {
                      final incident = incidents[index];
                      return _buildIncidentCard(incident);
                    },
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIncidentCard(Map<String, dynamic> incident) {
    final type = incident['type']?.toString().toLowerCase() ?? 'flood';
    final brief = ApiService.getTechnicalBrief(type);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: MuhafizTheme.tacticalGray.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: MuhafizTheme.surfaceBorder),
        boxShadow: [
          BoxShadow(
            color: MuhafizTheme.sovereignGreen.withValues(alpha: 0.05),
            blurRadius: 20,
            spreadRadius: 5,
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      incident['incident_id'] ?? 'MHFZ-NEW',
                      style: const TextStyle(
                        color: MuhafizTheme.sovereignGreen,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'STATUS: ${incident['status']}',
                      style: const TextStyle(color: MuhafizTheme.textSecondary, fontSize: 10),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: MuhafizTheme.sovereignGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: MuhafizTheme.sovereignGreen.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    'CONF: ${(brief['confidence'] * 100).toInt()}%',
                    style: const TextStyle(color: MuhafizTheme.sovereignGreen, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
          
          const Divider(color: MuhafizTheme.surfaceBorder, height: 1),
          
          // Body
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.location_on, color: MuhafizTheme.crisisRed, size: 14),
                    const SizedBox(width: 6),
                    Text(
                      incident['location'] ?? 'ANALYZING...',
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text(
                  'TECHNICAL BRIEFING',
                  style: TextStyle(color: MuhafizTheme.textSecondary, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1),
                ),
                const SizedBox(height: 6),
                Text(
                  brief['instructions'],
                  style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.4),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: MuhafizTheme.surfaceBorder),
                  ),
                  child: Column(
                    children: [
                      _buildBriefItem(Icons.settings, 'EQUIPMENT', brief['equipment']),
                      const SizedBox(height: 8),
                      _buildBriefItem(Icons.analytics, 'PREDICTION', brief['analyst_prediction']),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Action
          Padding(
            padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: MuhafizTheme.sovereignGreen,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => GroundTruthScreen(incident: incident),
                    ),
                  );
                },
                child: const Text(
                  'ACKNOWLEDGE & OPEN AUDIT',
                  style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBriefItem(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: MuhafizTheme.sovereignGreen, size: 12),
        const SizedBox(width: 8),
        Expanded(
          child: RichText(
            text: TextSpan(
              style: const TextStyle(fontSize: 11, fontFamily: 'monospace'),
              children: [
                TextSpan(text: '$label: ', style: const TextStyle(color: MuhafizTheme.textSecondary)),
                TextSpan(text: value, style: const TextStyle(color: Colors.white)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class TacticalGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = MuhafizTheme.sovereignGreen.withValues(alpha: 0.05)
      ..strokeWidth = 0.5;

    const spacing = 40.0;
    
    for (double i = 0; i < size.width; i += spacing) {
      canvas.drawLine(Offset(i, 0), Offset(i, size.height), paint);
    }
    for (double i = 0; i < size.height; i += spacing) {
      canvas.drawLine(Offset(0, i), Offset(size.width, i), paint);
    }
    
    // Glowing circles
    final circlePaint = Paint()
      ..color = MuhafizTheme.sovereignGreen.withValues(alpha: 0.02)
      ..style = PaintingStyle.fill;
      
    canvas.drawCircle(Offset(size.width * 0.5, size.height * 0.5), 150, circlePaint);
    canvas.drawCircle(Offset(size.width * 0.5, size.height * 0.5), 300, circlePaint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
