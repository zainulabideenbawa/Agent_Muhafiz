import 'package:flutter/material.dart';
import '../services/api_service.dart';

class VerificationQuestScreen extends StatefulWidget {
  final Map<String, dynamic> quest;
  const VerificationQuestScreen({super.key, required this.quest});

  @override
  State<VerificationQuestScreen> createState() => _VerificationQuestScreenState();
}

class _VerificationQuestScreenState extends State<VerificationQuestScreen> {
  bool isAccepting = false;

  Future<void> _handleAccept() async {
    setState(() => isAccepting = true);
    final success = await ApiService.acceptQuest(widget.quest['incidentId']);
    if (success && mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Quest Accepted. Officer status: EN ROUTE.'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: Colors.orangeAccent, width: 2)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: Colors.orangeAccent, size: 32),
              const SizedBox(width: 12),
              const Text(
                'HIGH-PRIORITY QUEST',
                style: TextStyle(color: Colors.orangeAccent, fontWeight: FontWeight.bold, fontSize: 20, letterSpacing: 1),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            'DATA CONTEXT:',
            style: TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            widget.quest['reason'],
            style: const TextStyle(color: Colors.white, fontSize: 16, height: 1.4),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Text('AI Confidence Score: ', style: TextStyle(color: Colors.white70)),
              Text(
                '${(widget.quest['confidence'] * 100).toStringAsFixed(0)}%',
                style: TextStyle(
                  color: widget.quest['confidence'] < 0.7 ? Colors.redAccent : Colors.orangeAccent,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              const Icon(Icons.location_on, color: Colors.cyanAccent, size: 16),
              const SizedBox(width: 8),
              Text(widget.quest['location'], style: const TextStyle(color: Colors.cyanAccent)),
            ],
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orangeAccent,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: isAccepting ? null : _handleAccept,
              child: isAccepting
                  ? const CircularProgressIndicator(color: Colors.black)
                  : const Text('ACCEPT QUEST', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('DISMISS', style: TextStyle(color: Colors.white54)),
            ),
          ),
        ],
      ),
    );
  }
}
