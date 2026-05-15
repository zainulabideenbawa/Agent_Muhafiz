import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';

import '../services/api_service.dart';
import '../widgets/feedback_widgets.dart';
import '../theme/theme.dart';


class CouncilHubScreen extends StatefulWidget {
  final Map<String, dynamic>? user;
  const CouncilHubScreen({super.key, this.user});

  @override
  State<CouncilHubScreen> createState() => _CouncilHubScreenState();
}

class _CouncilHubScreenState extends State<CouncilHubScreen> {
  List<dynamic> incidents = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchIncidents();
  }

  void _fetchIncidents() async {
    final nic = widget.user?['nic_number'] ?? 'global';
    final response = await ApiService.get('/incidents/$nic');
    
    if (response['success']) {
      setState(() {
        incidents = response['data']['incidents'] ?? [];
        isLoading = false;
      });
    } else {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MuhafizTheme.darkBg,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('COUNCIL HUB', style: TextStyle(color: MuhafizTheme.emerald400, letterSpacing: 2, fontSize: 12, fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Text('Active Audit Trails', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            
            Expanded(
              child: isLoading 
                ? const Center(child: CircularProgressIndicator(color: MuhafizTheme.emerald500))
                : incidents.isEmpty 
                  ? _EmptyState()
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      itemCount: incidents.length,
                      itemBuilder: (context, index) => FadeInUp(
                        delay: Duration(milliseconds: index * 100),
                        child: _IncidentCard(incident: incidents[index]),
                      ),
                    ),

            ),
          ],
        ),
      ),
    );
  }
}

class _IncidentCard extends StatelessWidget {
  final Map<String, dynamic> incident;
  const _IncidentCard({required this.incident});

  @override
  Widget build(BuildContext context) {
    final status = incident['status'] ?? 'ANALYZING';
    final isResolved = status == 'RESOLVED';
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: MuhafizTheme.darkCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: MuhafizTheme.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('ID: ${incident['id'].toString().substring(0, 8)}', style: const TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 10, fontFamily: 'JetBrains Mono')),
              _StatusChip(status: status, isResolved: isResolved),
            ],
          ),
          const SizedBox(height: 12),
          Text(incident['description'] ?? 'Crisis Report', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(
            'LAST ACTION: ${incident['last_agent'] ?? 'SENTINEL'} Verified Signal',
            style: const TextStyle(color: MuhafizTheme.emerald400, fontSize: 10),
          ),
          const Divider(color: MuhafizTheme.darkBorder, height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _formatDate(incident['created_at']),
                style: const TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 10),
              ),
              const Icon(Icons.arrow_forward_ios, color: MuhafizTheme.darkTextMuted, size: 12),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(String? date) {
    if (date == null) return "Just now";
    return date.split('T')[0];
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  final bool isResolved;
  const _StatusChip({required this.status, required this.isResolved});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isResolved ? MuhafizTheme.emerald500.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: isResolved ? MuhafizTheme.emerald500 : Colors.orange, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.assignment_outlined, color: MuhafizTheme.darkTextMuted.withOpacity(0.2), size: 80),
          const SizedBox(height: 16),
          const Text('No Active Reports', style: TextStyle(color: MuhafizTheme.darkTextMuted)),
        ],
      ),
    );
  }
}
