import 'dart:async';
import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../services/api_service.dart';
import '../widgets/feedback_widgets.dart';
import '../theme/theme.dart';

class VoiceReportScreen extends StatefulWidget {
  const VoiceReportScreen({super.key});

  @override
  State<VoiceReportScreen> createState() => _VoiceReportScreenState();
}

class _VoiceReportScreenState extends State<VoiceReportScreen>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _waveController;

  // STT engine
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _speechAvailable = false;
  bool _speechInitializing = false;

  // Mode Toggle: Voice vs Text
  bool _isTextMode = false;
  final TextEditingController _textController = TextEditingController();

  // Screen state
  String _status = 'AWAITING SIGNAL';
  bool _isRecording = false;
  bool _isSubmitting = false;
  bool _isLogged = false;

  // Transcription / Input
  String _transcribedText = '';
  String _lastWords = '';
  String _incidentId = '';
  double _confidence = 0.0;
  double _recordingDuration = 0.0;
  Timer? _durationTimer;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat(reverse: true);

    _initSpeech();
  }

  Future<void> _initSpeech() async {
    setState(() => _speechInitializing = true);
    try {
      _speechAvailable = await _speech.initialize(
        onError: (e) {
          debugPrint('[STT] Error: $e');
          setState(() {
            _isRecording = false;
            _status = 'STT ERROR – RETRY';
          });
        },
        onStatus: (status) {
          debugPrint('[STT] Status: $status');
          if (status == 'notListening' && _isRecording) {
            _stopAndSubmit();
          }
        },
      );
    } catch (e) {
      _speechAvailable = false;
    }
    setState(() => _speechInitializing = false);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _waveController.dispose();
    _durationTimer?.cancel();
    _speech.stop();
    _textController.dispose();
    super.dispose();
  }

  // ─── RECORDING ────────────────────────────────────────────────────────────

  Future<void> _startRecording() async {
    if (_isSubmitting || _isLogged) return;

    if (_speechInitializing) {
      MuhafizFeedback.showToast('STT initializing, please wait...');
      return;
    }

    if (!_speechAvailable) {
      MuhafizFeedback.showToast('Speech recognition unavailable. Switch to Text Mode.');
      return;
    }

    setState(() {
      _isRecording = true;
      _status = 'RECORDING';
      _transcribedText = '';
      _lastWords = '';
      _confidence = 0.0;
      _recordingDuration = 0.0;
    });

    _durationTimer = Timer.periodic(const Duration(milliseconds: 100), (_) {
      if (mounted && _isRecording) {
        setState(() => _recordingDuration += 0.1);
      }
    });

    await _speech.listen(
      onResult: (result) {
        if (mounted) {
          setState(() {
            _lastWords = result.recognizedWords;
            _transcribedText = result.recognizedWords;
            _confidence = result.confidence;
          });
        }
      },
      listenFor: const Duration(minutes: 2),
      pauseFor: const Duration(seconds: 8),
      partialResults: true,
      localeId: 'ur_PK',
      cancelOnError: false,
    );
  }

  Future<void> _stopAndSubmit() async {
    if (!_isRecording) return;

    _durationTimer?.cancel();
    await _speech.stop();

    setState(() {
      _isRecording = false;
      _status = 'ANALYZING SIGNAL';
      _isSubmitting = true;
    });

    final textToSubmit = _transcribedText.trim();

    if (textToSubmit.length < 2 && _recordingDuration < 1.5) {
      setState(() {
        _isSubmitting = false;
        _status = 'AWAITING SIGNAL';
      });
      MuhafizFeedback.showToast('Hold longer and speak clearly into the mic');
      return;
    }

    final String finalText = textToSubmit.isNotEmpty
        ? textToSubmit
        : '[Voice signal captured — transcription pending]';

    await _transmitSignal(finalText, 'citizen_voice_report', {
      'confidence': _confidence.toStringAsFixed(2),
      'duration_sec': _recordingDuration.toStringAsFixed(1),
      'locale': 'ur_PK',
    });
  }

  // ─── TEXT SUBMISSION ──────────────────────────────────────────────────────

  Future<void> _submitTextReport() async {
    final text = _textController.text.trim();
    if (text.isEmpty) {
      MuhafizFeedback.showToast('Please type your emergency description first.');
      return;
    }

    setState(() {
      _status = 'ANALYZING SIGNAL';
      _isSubmitting = true;
    });

    await _transmitSignal(text, 'citizen_text_report', {
      'input_method': 'keyboard',
    });
  }

  // ─── CENTRAL TRANSMISSION ─────────────────────────────────────────────────

  Future<void> _transmitSignal(String signalText, String type, Map<String, dynamic> extraMeta) async {
    try {
      final response = await ApiService.post('/report', {
        'signal': signalText,
        'metadata': {
          'type': type,
          'priority': 'high',
          ...extraMeta,
        }
      });

      if (response['success'] == true) {
        setState(() {
          _status = 'REPORT LOGGED';
          _incidentId = response['incidentId'] ?? response['data']?['incident_id'] ?? 'MHFZ-????';
          _isSubmitting = false;
          _isLogged = true;
        });
        MuhafizFeedback.showToast('Signal Transmitted to Sentinel Council');
      } else {
        setState(() {
          _status = 'TRANSMISSION FAILED';
          _isSubmitting = false;
        });
        MuhafizFeedback.showToast(response['error'] ?? 'Upload failed');
      }
    } catch (e) {
      setState(() {
        _status = 'UPLINK ERROR';
        _isSubmitting = false;
      });
      MuhafizFeedback.showToast('Critical uplink error — check connection');
    }
  }

  void _reset() {
    setState(() {
      _status = 'AWAITING SIGNAL';
      _isRecording = false;
      _isSubmitting = false;
      _isLogged = false;
      _transcribedText = '';
      _lastWords = '';
      _incidentId = '';
      _confidence = 0.0;
      _recordingDuration = 0.0;
      _textController.clear();
    });
  }

  // ─── BUILD ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MuhafizTheme.backgroundSlate,
      appBar: _buildAppBar(),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // STATUS BANNER
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: _buildStatusBanner(),
            ),

            // WORKSPACE (MIC or KEYBOARD MODE)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: _buildWorkspace(),
              ),
            ),

            // TRANSCRIPTION BOX
            _buildTranscriptionBox(),
          ],
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      leading: BackButton(
        color: MuhafizTheme.primaryEmerald,
        onPressed: () => Navigator.pop(context),
      ),
      title: const Text(
        'CRISIS INGESTION TERMINAL',
        style: TextStyle(
          color: Colors.white,
          fontFamily: 'JetBrains Mono',
          letterSpacing: 2,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
      actions: [
        if (!_isLogged && !_isSubmitting)
          IconButton(
            icon: Icon(
              _isTextMode ? LucideIcons.mic : LucideIcons.keyboard,
              color: MuhafizTheme.primaryEmerald,
            ),
            onPressed: () {
              setState(() {
                _isTextMode = !_isTextMode;
                _status = 'AWAITING SIGNAL';
              });
              MuhafizFeedback.showToast(
                _isTextMode ? "SWITCHED TO TEXT MODE" : "SWITCHED TO VOICE MODE",
              );
            },
          ),
      ],
    );
  }

  Widget _buildStatusBanner() {
    Color color = MuhafizTheme.primaryEmerald;
    IconData icon = LucideIcons.radio;
    bool pulse = false;

    if (_isRecording) {
      color = const Color(0xFFEF4444);
      icon = LucideIcons.mic;
      pulse = true;
    } else if (_isSubmitting) {
      color = Colors.amber;
      icon = LucideIcons.loader;
      pulse = true;
    } else if (_isLogged) {
      color = MuhafizTheme.primaryEmerald;
      icon = LucideIcons.checkCircle;
    } else if (_speechInitializing) {
      color = Colors.amber;
      icon = LucideIcons.cpu;
      pulse = true;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withOpacity(0.4), width: 1.5),
        boxShadow: [
          BoxShadow(color: color.withOpacity(0.08), blurRadius: 10, spreadRadius: 2),
        ],
      ),
      child: Row(
        children: [
          pulse ? _PulseDot(color: color) : Icon(icon, color: color, size: 16),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'MODE: ${_isTextMode ? "TEXT UPLINK" : "VOICE UPLINK"}',
                style: const TextStyle(
                  color: MuhafizTheme.mutedSlate,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 9,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                _speechInitializing ? 'INITIALIZING STT...' : _status,
                style: TextStyle(
                  color: color,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
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
          if (!_isRecording && _confidence > 0 && !_isTextMode)
            Text(
              '${(_confidence * 100).toStringAsFixed(0)}% CONF',
              style: const TextStyle(
                color: MuhafizTheme.primaryEmerald,
                fontFamily: 'JetBrains Mono',
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildWorkspace() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0D162B),
        border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.15)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Stack(
          children: [
            Positioned.fill(child: CustomPaint(painter: _HUDGridPainter())),
            Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: _isLogged
                    ? _buildSuccessView()
                    : (_isTextMode ? _buildTextView() : _buildMicView()),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextView() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Icon(
          LucideIcons.keyboard,
          color: MuhafizTheme.primaryEmerald,
          size: 32,
        ),
        const SizedBox(height: 12),
        const Text(
          'SECURE SIGNAL TEXT ENTRY',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white,
            fontFamily: 'JetBrains Mono',
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _textController,
          maxLines: 4,
          style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'JetBrains Mono'),
          decoration: InputDecoration(
            hintText: 'Enter incident details, location coordinates, or emergency descriptions here...',
            hintStyle: const TextStyle(color: MuhafizTheme.mutedSlate, fontSize: 11),
            fillColor: const Color(0xFF060E1A),
            filled: true,
            enabledBorder: OutlineInputBorder(
              borderSide: BorderSide(color: MuhafizTheme.primaryEmerald.withOpacity(0.3)),
              borderRadius: BorderRadius.circular(4),
            ),
            focusedBorder: OutlineInputBorder(
              borderSide: const BorderSide(color: MuhafizTheme.primaryEmerald),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ),
        const SizedBox(height: 18),
        ElevatedButton.icon(
          onPressed: _isSubmitting ? null : _submitTextReport,
          icon: const Icon(LucideIcons.send, size: 14),
          label: const Text(
            'TRANSMIT EMERGENCY SIGNAL',
            style: TextStyle(fontFamily: 'JetBrains Mono', fontWeight: FontWeight.bold, fontSize: 11),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: MuhafizTheme.primaryEmerald,
            foregroundColor: const Color(0xFF003824),
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          ),
        ),
      ],
    );
  }

  Widget _buildMicView() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (_isRecording) ...[
          _buildLiveWaveform(),
          const SizedBox(height: 36),
        ] else if (_isSubmitting) ...[
          SizedBox(
            width: 120,
            height: 120,
            child: Stack(
              alignment: Alignment.center,
              children: [
                const SizedBox(
                  width: 90,
                  height: 90,
                  child: CircularProgressIndicator(
                    color: Colors.amber,
                    strokeWidth: 3,
                  ),
                ),
                Icon(LucideIcons.binary,
                    color: Colors.amber.withOpacity(0.8), size: 32),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'COUNCIL INTELLIGENCE PARSING...',
            style: TextStyle(
              color: Colors.amber,
              fontFamily: 'JetBrains Mono',
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
        ] else ...[
          Icon(
            _speechAvailable ? LucideIcons.radioTower : LucideIcons.wifiOff,
            color: MuhafizTheme.mutedSlate,
            size: 36,
          ),
          const SizedBox(height: 16),
        ],

        if (!_isSubmitting)
          GestureDetector(
            onLongPressStart: (_) => _startRecording(),
            onLongPressEnd: (_) => _stopAndSubmit(),
            child: AnimatedScale(
              scale: _isRecording ? 1.12 : 1.0,
              duration: const Duration(milliseconds: 200),
              child: Container(
                width: 130,
                height: 130,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _isRecording
                      ? const Color(0xFFEF4444).withOpacity(0.12)
                      : MuhafizTheme.primaryEmerald.withOpacity(0.08),
                  border: Border.all(
                    color: _isRecording
                        ? const Color(0xFFEF4444)
                        : MuhafizTheme.primaryEmerald,
                    width: 2.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: _isRecording
                          ? const Color(0xFFEF4444).withOpacity(0.35)
                          : MuhafizTheme.primaryEmerald.withOpacity(0.2),
                      blurRadius: _isRecording ? 28 : 14,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Center(
                  child: Container(
                    width: 108,
                    height: 108,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _isRecording
                          ? const Color(0xFFEF4444)
                          : MuhafizTheme.primaryEmerald,
                    ),
                    child: Icon(
                      _isRecording ? LucideIcons.mic : LucideIcons.micOff,
                      color: _isRecording
                          ? Colors.white
                          : const Color(0xFF003824),
                      size: 40,
                    ),
                  ),
                ),
              ),
            ),
          ),

        if (!_isSubmitting) ...[
          const SizedBox(height: 24),
          Text(
            _isRecording
                ? 'RELEASE TO TRANSMIT'
                : _speechAvailable
                    ? 'HOLD TO RECORD EMERGENCY VOICE'
                    : 'MIC UNAVAILABLE — CHECK PERMISSIONS',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: _isRecording
                  ? const Color(0xFFEF4444)
                  : _speechAvailable
                      ? Colors.white
                      : Colors.amber,
              fontFamily: 'JetBrains Mono',
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _isRecording
                ? 'Speak clearly — Muhafiz STT is transcribing your signal in real-time.'
                : 'Speak in Urdu or English. Your voice is parsed by the Sentinel Reasoning Agent.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: MuhafizTheme.mutedSlate,
              fontSize: 11,
              height: 1.4,
            ),
          ),
          if (!_speechAvailable && !_speechInitializing) ...[
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: _initSpeech,
              icon: const Icon(LucideIcons.refreshCw, size: 14),
              label: const Text('RETRY INIT',
                  style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11)),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.amber,
                side: const BorderSide(color: Colors.amber),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
              ),
            ),
          ],
        ],
      ],
    );
  }

  Widget _buildLiveWaveform() {
    return AnimatedBuilder(
      animation: _waveController,
      builder: (context, _) {
        final bars = [18.0, 36.0, 60.0, 80.0, 55.0, 72.0, 38.0, 18.0];
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: bars.asMap().entries.map((e) {
            final double multiplier =
                0.35 + 0.65 * (e.key.isEven ? _waveController.value : 1.0 - _waveController.value);
            return Container(
              width: 6,
              height: e.value * multiplier,
              margin: const EdgeInsets.symmetric(horizontal: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444),
                borderRadius: BorderRadius.circular(3),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFEF4444).withOpacity(0.4),
                    blurRadius: 4,
                    spreadRadius: 1,
                  ),
                ],
              ),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildSuccessView() {
    return FadeIn(
      child: Column(
        mainAxisSize: MainAxisSize.min,
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
              size: 48,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'SIGNAL INGESTION SUCCESSFUL',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontFamily: 'JetBrains Mono',
              fontSize: 16,
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
                fontSize: 15,
                letterSpacing: 2,
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 8),
            child: Text(
              'The Sentinel Reasoning Agent has successfully parsed your signal. The 7-Agent Council is reviewing this dispatch in real-time.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: MuhafizTheme.mutedSlate,
                fontSize: 11,
                height: 1.5,
              ),
            ),
          ),
          const SizedBox(height: 28),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              OutlinedButton.icon(
                onPressed: _reset,
                icon: const Icon(LucideIcons.refreshCw, size: 14),
                label: const Text('NEW SIGNAL',
                    style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: MuhafizTheme.primaryEmerald,
                  side: const BorderSide(color: MuhafizTheme.primaryEmerald),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(LucideIcons.activity, size: 14),
                label: const Text('VIEW IN PULSE',
                    style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: MuhafizTheme.primaryEmerald,
                  foregroundColor: const Color(0xFF003824),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTranscriptionBox() {
    return Container(
      constraints: const BoxConstraints(minHeight: 100, maxHeight: 140),
      margin: const EdgeInsets.fromLTRB(20, 10, 20, 16),
      decoration: BoxDecoration(
        color: const Color(0xFF060E1A),
        border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.15)),
        borderRadius: BorderRadius.circular(4),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _isTextMode ? 'LIVE CONSOLE OUTPUT' : 'LIVE TRANSCRIPTION FEED',
                style: const TextStyle(
                  color: MuhafizTheme.primaryEmerald,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 9,
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
                  const SizedBox(width: 5),
                  Text(
                    _isRecording ? 'LIVE STT' : 'STANDBY',
                    style: TextStyle(
                      color: _isRecording ? Colors.red : MuhafizTheme.primaryEmerald,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Divider(color: Color(0xFF13233F), height: 1),
          const SizedBox(height: 8),
          Expanded(
            child: SingleChildScrollView(
              child: Text(
                _transcribedText.isNotEmpty
                    ? _transcribedText
                    : _isSubmitting
                        ? 'PARSING COGNITIVE SIGNAL...'
                        : _isLogged
                            ? 'Signal archived to Sentinel audit log.'
                            : _isTextMode
                                ? 'Type emergency details above and hit transmit to send directly to the Sentinel Council...'
                                : 'Hold the mic button and speak your emergency report in Urdu or English...',
                style: TextStyle(
                  color: _transcribedText.isNotEmpty ? Colors.white : MuhafizTheme.mutedSlate,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
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
  late AnimationController _c;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 800))
      ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: Tween(begin: 0.3, end: 1.0).animate(_c),
      child: Container(
        width: 10,
        height: 10,
        decoration: BoxDecoration(
          color: widget.color,
          shape: BoxShape.circle,
          boxShadow: [BoxShadow(color: widget.color, blurRadius: 5)],
        ),
      ),
    );
  }
}

class _HUDGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = MuhafizTheme.primaryEmerald.withOpacity(0.04)
      ..strokeWidth = 1;
    const step = 24.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), p);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), p);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}
