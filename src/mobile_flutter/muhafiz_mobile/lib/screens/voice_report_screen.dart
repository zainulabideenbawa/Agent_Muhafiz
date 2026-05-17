import 'dart:async';
import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/api_service.dart';
import '../widgets/feedback_widgets.dart';
import '../theme/theme.dart';

class VoiceReportScreen extends StatefulWidget {
  const VoiceReportScreen({super.key});

  @override
  State<VoiceReportScreen> createState() => _VoiceReportScreenState();
}

class _VoiceReportScreenState extends State<VoiceReportScreen> with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _waveController;
  
  // State variables
  String _status = "Awaiting Signal..."; // "Awaiting Signal...", "Recording...", "Analyzing Signal...", "Report Logged"
  bool _isRecording = false;
  bool _isSubmitting = false;
  String _transcribedText = "";
  String _incidentId = "";
  
  // Scenarios to simulate speech-to-text
  final List<Map<String, String>> _scenarios = [
    {
      "title": "FIRE OUTBREAK",
      "text": "Gulshan Block 4 me commercial market k kareeb aag lag gayi hai, Rescue 1122 aur fire brigade ko foran bhejein. Zakhmiyon ki zaroorat par sakti hai."
    },
    {
      "title": "ARMED ROBBERY",
      "text": "Main boulevard bank k bahar dacoity ho rahi hai, firing ki awazein suni gayi hain, bohot afra-tafri machi hui hai. Police dispatch jaldi chahiye."
    },
    {
      "title": "FLOOD & GRIDLOCK",
      "text": "University Road par pani ki bari line burst ho gayi hai jis se poora rasta block ho gaya hai, traffic jam hai aur gariyan phasi hui hain."
    },
    {
      "title": "GAS EXPLOSION",
      "text": "Local sector shop me gas cylinder blast hua hai, chhat gir gayi hai aur kuch log dabay hue lagte hain. Immediate emergency response foran chahiye."
    }
  ];

  int _selectedScenarioIndex = 0;
  Timer? _transcriptionTimer;
  int _charIndex = 0;
  double _recordingDuration = 0.0;
  Timer? _durationTimer;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 15),
    )..repeat();
    
    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _waveController.dispose();
    _transcriptionTimer?.cancel();
    _durationTimer?.cancel();
    super.dispose();
  }

  void _startRecording() {
    if (_isSubmitting || _status == "Report Logged") return;
    
    setState(() {
      _isRecording = true;
      _status = "Recording...";
      _transcribedText = "";
      _charIndex = 0;
      _recordingDuration = 0.0;
    });

    // Start timer for duration
    _durationTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      setState(() {
        _recordingDuration += 0.1;
      });
    });

    // Start typing effect simulation
    final fullText = _scenarios[_selectedScenarioIndex]["text"]!;
    final words = fullText.split(" ");
    
    _transcriptionTimer = Timer.periodic(const Duration(milliseconds: 150), (timer) {
      if (_charIndex < words.length) {
        setState(() {
          _transcribedText += "${words[_charIndex]} ";
          _charIndex++;
        });
      } else {
        _transcriptionTimer?.cancel();
      }
    });
  }

  void _stopRecordingAndSubmit() async {
    if (!_isRecording) return;
    
    _durationTimer?.cancel();
    _transcriptionTimer?.cancel();
    
    setState(() {
      _isRecording = false;
      _status = "Analyzing Signal...";
      _isSubmitting = true;
    });

    // If they released too quickly, complete the transcription text
    final fullText = _scenarios[_selectedScenarioIndex]["text"]!;
    if (_transcribedText.trim().isEmpty || _recordingDuration < 1.0) {
      setState(() {
        _transcribedText = fullText;
      });
    }

    try {
      final response = await ApiService.post('/report', {
        'signal': _transcribedText.trim(),
        'metadata': {
          'type': 'citizen_report',
          'priority': 'high',
          'scenario': _scenarios[_selectedScenarioIndex]["title"],
          'duration': _recordingDuration.toStringAsFixed(1)
        }
      });

      if (response['success']) {
        setState(() {
          _status = "Report Logged";
          _incidentId = response['incidentId'] ?? "MHFZ-9821";
          _isSubmitting = false;
        });
        
        MuhafizFeedback.showToast("Signal Transmitted Successfully");
      } else {
        setState(() {
          _status = "Awaiting Signal...";
          _isSubmitting = false;
        });
        MuhafizFeedback.showToast(response['error'] ?? "Transmission Failed");
      }
    } catch (e) {
      setState(() {
        _status = "Awaiting Signal...";
        _isSubmitting = false;
      });
      MuhafizFeedback.showToast("Critical Uplink Error");
    }
  }

  void _resetScreen() {
    setState(() {
      _status = "Awaiting Signal...";
      _isRecording = false;
      _isSubmitting = false;
      _transcribedText = "";
      _incidentId = "";
      _recordingDuration = 0.0;
    });
  }

  Widget _buildWaveformBar(double baseHeight, int index) {
    return AnimatedBuilder(
      animation: _waveController,
      builder: (context, child) {
        final double multiplier = 0.3 + 0.7 * (0.5 + 0.5 * (index % 2 == 0 
          ? _waveController.value 
          : 1.0 - _waveController.value));
        return Container(
          width: 6,
          height: baseHeight * multiplier,
          margin: const EdgeInsets.symmetric(horizontal: 3),
          decoration: BoxDecoration(
            color: MuhafizTheme.primaryEmerald,
            borderRadius: BorderRadius.circular(3),
            boxShadow: [
              BoxShadow(
                color: MuhafizTheme.primaryEmerald.withOpacity(0.3),
                blurRadius: 4,
                spreadRadius: 1,
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isLogged = _status == "Report Logged";
    
    return Scaffold(
      backgroundColor: MuhafizTheme.backgroundSlate,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'CRISIS INGESTION TERMINAL',
          style: TextStyle(
            color: Colors.white,
            fontFamily: 'JetBrains Mono',
            letterSpacing: 2,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: BackButton(
          color: MuhafizTheme.primaryEmerald,
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. STATUS BANNER
              _buildStatusBanner(),
              
              const SizedBox(height: 20),
              
              // 2. SCENARIO SELECTOR (only if not recording / submitting / logged)
              if (!_isRecording && !_isSubmitting && !isLogged) ...[
                FadeInDown(
                  duration: const Duration(milliseconds: 400),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'SELECT SIMULATED INCIDENT WAVEFORM',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: MuhafizTheme.primaryEmerald,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 10),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: List.generate(_scenarios.length, (index) {
                            final bool isSelected = _selectedScenarioIndex == index;
                            return GestureDetector(
                              onTap: () => setState(() => _selectedScenarioIndex = index),
                              child: Container(
                                margin: const EdgeInsets.only(right: 10),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isSelected 
                                      ? MuhafizTheme.primaryEmerald.withOpacity(0.15) 
                                      : MuhafizTheme.surfaceSlate,
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(
                                    color: isSelected 
                                        ? MuhafizTheme.primaryEmerald 
                                        : MuhafizTheme.primaryEmerald.withOpacity(0.15),
                                    width: 1,
                                  ),
                                ),
                                child: Text(
                                  _scenarios[index]["title"]!,
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : MuhafizTheme.mutedSlate,
                                    fontFamily: 'JetBrains Mono',
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            );
                          }),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 24),
              
              // 3. CENTRAL WORKSPACE (Mic, Waveform or Success Card)
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF0D162B),
                    border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.15)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Stack(
                      children: [
                        // HUD Grid Background
                        _buildGridBg(),
                        
                        // Main Display
                        Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Center(
                            child: isLogged
                                ? _buildSuccessView()
                                : _buildVoiceCaptureView(),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 24),
              
              // 4. TRANSCRIPTION TELEMETRY BOX
              _buildTelemetryBox(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBanner() {
    Color bannerColor = MuhafizTheme.primaryEmerald;
    Color borderColor = MuhafizTheme.primaryEmerald.withOpacity(0.3);
    IconData icon = LucideIcons.radio;
    bool pulsing = false;

    if (_isRecording) {
      bannerColor = const Color(0xFFEF4444);
      borderColor = const Color(0xFFEF4444).withOpacity(0.3);
      icon = LucideIcons.dot;
      pulsing = true;
    } else if (_isSubmitting) {
      bannerColor = Colors.amber;
      borderColor = Colors.amber.withOpacity(0.3);
      icon = LucideIcons.loader2;
      pulsing = true;
    } else if (_status == "Report Logged") {
      bannerColor = MuhafizTheme.primaryEmerald;
      borderColor = MuhafizTheme.primaryEmerald;
      icon = LucideIcons.checkCircle;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withOpacity(0.8),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: borderColor, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: bannerColor.withOpacity(0.08),
            blurRadius: 10,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Row(
        children: [
          if (pulsing)
            _PulseDot(color: bannerColor)
          else
            Icon(icon, color: bannerColor, size: 16),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'CONNECTION PROTOCOL: ON',
                style: TextStyle(
                  color: MuhafizTheme.mutedSlate,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 9,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                _status.toUpperCase(),
                style: TextStyle(
                  color: bannerColor,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
          const Spacer(),
          if (_isRecording)
            Text(
              '${_recordingDuration.toStringAsFixed(1)}s',
              style: const TextStyle(
                color: Color(0xFFEF4444),
                fontFamily: 'JetBrains Mono',
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildGridBg() {
    return Positioned.fill(
      child: CustomPaint(
        painter: _HUDGridPainter(),
      ),
    );
  }

  Widget _buildVoiceCaptureView() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (_isRecording) ...[
          // Bouncing Audio Bars
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildWaveformBar(20, 0),
              _buildWaveformBar(40, 1),
              _buildWaveformBar(70, 2),
              _buildWaveformBar(90, 3),
              _buildWaveformBar(60, 4),
              _buildWaveformBar(80, 5),
              _buildWaveformBar(40, 6),
              _buildWaveformBar(20, 7),
            ],
          ),
          const SizedBox(height: 40),
        ] else if (_isSubmitting) ...[
          // Scanning Radar Ring
          SizedBox(
            width: 140,
            height: 140,
            child: Stack(
              alignment: Alignment.center,
              children: [
                const SizedBox(
                  width: 100,
                  height: 100,
                  child: CircularProgressIndicator(
                    color: Colors.amber,
                    strokeWidth: 3,
                  ),
                ),
                Icon(LucideIcons.binary, color: Colors.amber.withOpacity(0.8), size: 36),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'COUNCIL INTELLIGENCE ANALYZING EVENT...',
            style: TextStyle(
              color: Colors.amber,
              fontFamily: 'JetBrains Mono',
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
        ] else ...[
          // Standard Awaiting View
          const Icon(
            LucideIcons.radioTower,
            color: MuhafizTheme.mutedSlate,
            size: 40,
          ),
          const SizedBox(height: 20),
        ],
        
        if (!_isSubmitting) ...[
          // GIANT MIC GESTURE BUTTON
          GestureDetector(
            onLongPressStart: (_) => _startRecording(),
            onLongPressEnd: (_) => _stopRecordingAndSubmit(),
            child: AnimatedScale(
              scale: _isRecording ? 1.15 : 1.0,
              duration: const Duration(milliseconds: 200),
              child: Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _isRecording 
                      ? const Color(0xFFEF4444).withOpacity(0.15) 
                      : MuhafizTheme.primaryEmerald.withOpacity(0.08),
                  border: Border.all(
                    color: _isRecording ? const Color(0xFFEF4444) : MuhafizTheme.primaryEmerald,
                    width: 2.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: _isRecording 
                          ? const Color(0xFFEF4444).withOpacity(0.4) 
                          : MuhafizTheme.primaryEmerald.withOpacity(0.2),
                      blurRadius: _isRecording ? 30 : 15,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Center(
                  child: Container(
                    width: 116,
                    height: 116,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _isRecording ? const Color(0xFFEF4444) : MuhafizTheme.primaryEmerald,
                    ),
                    child: Icon(
                      _isRecording ? LucideIcons.mic : LucideIcons.micOff,
                      color: _isRecording ? Colors.white : const Color(0xFF003824),
                      size: 44,
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),
          
          Text(
            _isRecording ? 'RELEASE TO TRANSMIT CRITICAL SIGNAL' : 'HOLD TO INGEST EMERGENCY VOICE',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: _isRecording ? const Color(0xFFEF4444) : Colors.white,
              fontFamily: 'JetBrains Mono',
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _isRecording 
                ? 'Your voice signal is being streaming directly into Sentinel-1 Reasoning Node.'
                : 'Muhafiz-X requires continuous physical press to secure emergency satellite channel.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: MuhafizTheme.mutedSlate,
              fontSize: 11,
              height: 1.4,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildSuccessView() {
    return FadeIn(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: MuhafizTheme.primaryEmerald.withOpacity(0.1),
              border: Border.all(color: MuhafizTheme.primaryEmerald, width: 2),
            ),
            child: const Icon(
              LucideIcons.shieldAlert,
              color: MuhafizTheme.primaryEmerald,
              size: 54,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'SIGNAL INGESTION SUCCESSFUL',
            style: TextStyle(
              color: Colors.white,
              fontFamily: 'JetBrains Mono',
              fontSize: 18,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            decoration: BoxDecoration(
              color: MuhafizTheme.primaryEmerald.withOpacity(0.08),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.3)),
            ),
            child: Text(
              'INCIDENT ID: $_incidentId',
              style: const TextStyle(
                color: MuhafizTheme.primaryEmerald,
                fontFamily: 'JetBrains Mono',
                fontWeight: FontWeight.bold,
                fontSize: 16,
                letterSpacing: 2,
              ),
            ),
          ),
          const SizedBox(height: 20),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0),
            child: Text(
              'The Sentinel Reasoning Agent has successfully parsed your signal. The 7-Agent Council is reviewing this dispatch in real-time.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: MuhafizTheme.mutedSlate,
                fontSize: 12,
                height: 1.5,
              ),
            ),
          ),
          const SizedBox(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              OutlinedButton.icon(
                onPressed: _resetScreen,
                icon: const Icon(LucideIcons.refreshCw, size: 16),
                label: const Text('TRANSMIT NEW'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: MuhafizTheme.primaryEmerald,
                  side: const BorderSide(color: MuhafizTheme.primaryEmerald),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
              ),
              const SizedBox(width: 16),
              ElevatedButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(LucideIcons.activity, size: 16),
                label: const Text('VIEW IN PULSE'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: MuhafizTheme.primaryEmerald,
                  foregroundColor: const Color(0xFF003824),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTelemetryBox() {
    return Container(
      height: 130,
      decoration: BoxDecoration(
        color: const Color(0xFF060E1A),
        border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.15)),
        borderRadius: BorderRadius.circular(4),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'LIVE TRANSCRIPTION FEED',
                style: TextStyle(
                  color: MuhafizTheme.primaryEmerald,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
              Row(
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: _isRecording ? Colors.red : MuhafizTheme.primaryEmerald,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _isRecording ? 'STREAMING...' : 'STANDBY',
                    style: TextStyle(
                      color: _isRecording ? Colors.red : MuhafizTheme.primaryEmerald,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Divider(color: Color(0xFF13233F), height: 1),
          const SizedBox(height: 10),
          Expanded(
            child: SingleChildScrollView(
              child: Text(
                _transcribedText.isEmpty 
                    ? (_isSubmitting ? 'SECURE COGNITIVE PARSING EN ROUTE...' : 'HOLD PRESS TO INITIALIZE EMISSIVE SPEECH TRANSCRIBER...')
                    : _transcribedText,
                style: TextStyle(
                  color: _transcribedText.isEmpty ? MuhafizTheme.mutedSlate : Colors.white,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 12,
                  height: 1.5,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PulseDot extends StatefulWidget {
  final Color color;
  const _PulseDot({required this.color});

  @override
  State<_PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<_PulseDot> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 1))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: Tween(begin: 0.3, end: 1.0).animate(_controller),
      child: Container(
        width: 10,
        height: 10,
        decoration: BoxDecoration(
          color: widget.color,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(color: widget.color, blurRadius: 4),
          ],
        ),
      ),
    );
  }
}

class _HUDGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final Paint gridPaint = Paint()
      ..color = MuhafizTheme.primaryEmerald.withOpacity(0.04)
      ..strokeWidth = 1.0;

    const double step = 24.0;
    
    // Vertical lines
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    
    // Horizontal lines
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

