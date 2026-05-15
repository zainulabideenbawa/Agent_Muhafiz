import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../theme/theme.dart';

class VoiceReportScreen extends StatefulWidget {
  const VoiceReportScreen({super.key});

  @override
  State<VoiceReportScreen> createState() => _VoiceReportScreenState();
}

class _VoiceReportScreenState extends State<VoiceReportScreen> with TickerProviderStateMixin {
  bool isRecording = false;
  String transcription = '';
  late AnimationController _waveController;

  @override
  void initState() {
    super.initState();
    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _waveController.dispose();
    super.dispose();
  }

  void _toggleRecording() {
    setState(() {
      isRecording = !isRecording;
      if (isRecording) {
        _simulateTranscription();
      } else {
        transcription = '';
      }
    });
  }

  void _simulateTranscription() async {
    const mockText = "NIPA Chowrangi ke paas bohat pani jama hai, gaarian phasi hui hain...";
    for (int i = 0; i < mockText.length; i++) {
      if (!isRecording) break;
      await Future.delayed(const Duration(milliseconds: 100));
      setState(() {
        transcription += mockText[i];
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Voice Report', style: TextStyle(color: Colors.white)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const SizedBox(height: 48),
            // Status Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: MuhafizTheme.darkCard,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: MuhafizTheme.darkBorder),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isRecording ? MuhafizTheme.emerald500 : MuhafizTheme.darkTextMuted,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    isRecording ? 'Listening...' : 'Ready to record',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 64),

            // Waveform
            SizedBox(
              height: 100,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(20, (index) {
                  return AnimatedBuilder(
                    animation: _waveController,
                    builder: (context, child) {
                      double randomHeight = isRecording 
                          ? (math.Random().nextDouble() * 60 + 20) 
                          : 10;
                      return Container(
                        width: 4,
                        height: randomHeight,
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        decoration: BoxDecoration(
                          color: isRecording ? MuhafizTheme.emerald500 : MuhafizTheme.darkBorder,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      );
                    },
                  );
                }),
              ),
            ),
            const SizedBox(height: 64),

            // Transcription Card
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: MuhafizTheme.darkCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: MuhafizTheme.darkBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'AI LIVE TRANSCRIPTION',
                      style: TextStyle(
                        color: MuhafizTheme.emerald500,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      transcription.isEmpty 
                          ? (isRecording ? 'Waiting for voice...' : 'Your report will appear here as you speak.')
                          : transcription,
                      style: const TextStyle(
                        color: Colors.white,
                        fontFamily: 'JetBrains Mono',
                        fontSize: 16,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Supported languages: English, Roman Urdu, Sindhi',
              style: TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 12, fontStyle: FontStyle.italic),
            ),
            const SizedBox(height: 48),

            // Record Button
            GestureDetector(
              onTapDown: (_) => _toggleRecording(),
              onTapUp: (_) => _toggleRecording(),
              onTapCancel: () => _toggleRecording(),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isRecording ? MuhafizTheme.emerald500 : MuhafizTheme.darkCard,
                  border: Border.all(color: MuhafizTheme.emerald500, width: 2),
                  boxShadow: isRecording ? [
                    BoxShadow(
                      color: MuhafizTheme.emerald500.withOpacity(0.5),
                      blurRadius: 20,
                      spreadRadius: 5,
                    )
                  ] : [],
                ),
                child: const Icon(Icons.mic, size: 36, color: Colors.white),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Hold to Record Signal',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
