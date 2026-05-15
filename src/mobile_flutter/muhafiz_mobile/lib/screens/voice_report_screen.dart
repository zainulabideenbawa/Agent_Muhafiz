import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'dart:io';
import '../services/api_service.dart';
import '../widgets/feedback_widgets.dart';
import '../theme/theme.dart';

class VoiceReportScreen extends StatefulWidget {
  const VoiceReportScreen({super.key});

  @override
  State<VoiceReportScreen> createState() => _VoiceReportScreenState();
}

class _VoiceReportScreenState extends State<VoiceReportScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _controller = TextEditingController();
  bool _isSubmitting = false;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _handleSubmit() async {
    if (_controller.text.isEmpty) {
      MuhafizFeedback.showToast("Signal content required");
      return;
    }

    setState(() => _isSubmitting = true);
    
    try {
      final response = await ApiService.post('/report', {
        'signal': _controller.text,
        'metadata': {'type': 'citizen_report', 'priority': 'high'}
      });

      if (response['success']) {
        if (mounted) {
          Navigator.pop(context);
          MuhafizFeedback.showSuccess(
            context, 
            'The 7-Agent Council has received your signal. Monitor the Pulse dashboard for live reasoning logs.',
          );
        }
      } else {
        MuhafizFeedback.showToast(response['error'] ?? "Transmission Failed");
      }
    } catch (e) {
      MuhafizFeedback.showToast("Critical Uplink Error");
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MuhafizTheme.darkBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('SOVEREIGN INPUT', style: TextStyle(letterSpacing: 4, fontSize: 12, fontWeight: FontWeight.bold)),
        leading: const BackButton(color: MuhafizTheme.emerald400),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          children: [
            const SizedBox(height: 20),
            
            // PULSING MIC ANIMATION
            Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, child) {
                      return Container(
                        width: 120 + (40 * _pulseController.value),
                        height: 120 + (40 * _pulseController.value),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: MuhafizTheme.emerald500.withOpacity(0.2 * (1 - _pulseController.value)),
                        ),
                      );
                    },
                  ),
                  Container(
                    width: 100,
                    height: 100,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: MuhafizTheme.emerald600,
                      boxShadow: [
                        BoxShadow(color: MuhafizTheme.emerald600, blurRadius: 20, spreadRadius: 2),
                      ],
                    ),
                    child: const Icon(Icons.mic, color: Colors.white, size: 40),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 48),
            
            FadeInUp(
              child: const Text(
                'Tap to Speak to Muhafiz',
                style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 8),
            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: const Text(
                'Your voice is encrypted and analyzed by the 7-Agent Council.',
                textAlign: TextAlign.center,
                style: TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 12),
              ),
            ),
            
            const SizedBox(height: 48),
            
            FadeInUp(
              delay: const Duration(milliseconds: 400),
              child: Container(
                decoration: BoxDecoration(
                  color: MuhafizTheme.darkCard,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: MuhafizTheme.darkBorder),
                ),
                padding: const EdgeInsets.all(20),
                child: TextField(
                  controller: _controller,
                  maxLines: 4,
                  style: const TextStyle(color: Colors.white, fontSize: 16),
                  decoration: const InputDecoration(
                    hintText: 'Or describe the issue manually...',
                    hintStyle: TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 14),
                    border: InputBorder.none,
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 48),
            
            FadeInUp(
              delay: const Duration(milliseconds: 600),
              child: SizedBox(
                width: double.infinity,
                height: 64,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: MuhafizTheme.emerald600,
                    foregroundColor: Colors.white, // CRISP WHITE TEXT
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    elevation: 10,
                    shadowColor: MuhafizTheme.emerald600.withOpacity(0.5),
                  ),
                  child: _isSubmitting 
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('TRANSMIT SIGNAL', style: TextStyle(letterSpacing: 2, fontWeight: FontWeight.bold)),
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            const Text(
              'ACTIVATE VOICE SENSOR',
              style: TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
