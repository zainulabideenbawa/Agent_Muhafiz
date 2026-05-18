import 'package:flutter/material.dart';
import '../theme.dart';
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
    final success = await ApiService.acceptQuest(widget.quest['incidentId'] ?? '');
    if (success && mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Quest Accepted. Officer status: EN ROUTE.'),
          backgroundColor: MuhafizTheme.sovereignGreen,
        ),
      );
    } else if (mounted) {
      setState(() => isAccepting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final double confidence = (widget.quest['confidence'] ?? 0.5).toDouble();
    final bool isLowConf = confidence < 0.7;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: MuhafizTheme.tacticalGray,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: const Border(top: BorderSide(color: MuhafizTheme.cautionAmber, width: 2)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: MuhafizTheme.cautionAmber, size: 32),
              const SizedBox(width: 12),
              const Text(
                'HIGH-PRIORITY QUEST',
                style: TextStyle(
                  color: MuhafizTheme.cautionAmber,
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                  letterSpacing: 1,
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            'DATA CONTEXT:',
            style: TextStyle(color: MuhafizTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1),
          ),
          const SizedBox(height: 8),
          Text(
            widget.quest['reason'] ?? 'Verification required at location.',
            style: const TextStyle(color: Colors.white, fontSize: 16, height: 1.4),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Text('AI Confidence Score: ', style: TextStyle(color: MuhafizTheme.textSecondary)),
              Text(
                '${(confidence * 100).toStringAsFixed(0)}%',
                style: TextStyle(
                  color: isLowConf ? MuhafizTheme.crisisRed : MuhafizTheme.cautionAmber,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              const Icon(Icons.location_on, color: MuhafizTheme.sovereignGreen, size: 16),
              const SizedBox(width: 8),
              Text(
                widget.quest['location'] ?? 'ANALYZING...',
                style: const TextStyle(color: MuhafizTheme.sovereignGreen, fontFamily: 'monospace'),
              ),
            ],
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: MuhafizTheme.cautionAmber,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                elevation: 0,
              ),
              onPressed: isAccepting ? null : _handleAccept,
              child: isAccepting
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2),
                    )
                  : const Text(
                      'ACCEPT QUEST',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 1, fontFamily: 'monospace'),
                    ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('DISMISS', style: TextStyle(color: MuhafizTheme.textSecondary, letterSpacing: 1)),
            ),
          ),
        ],
      ),
    );
  }
}
