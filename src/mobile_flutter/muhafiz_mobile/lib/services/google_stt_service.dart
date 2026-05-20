import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class GoogleSttService {
  // Injected at build time via: flutter run --dart-define=GOOGLE_STT_KEY=<value>
  // Falls back to GOOGLE_API_KEY if dedicated STT key not set
  static const String _apiKey = String.fromEnvironment(
    'GOOGLE_STT_KEY',
    defaultValue:'AIzaSyDTwgei_fdUEdE3B1PXD5vZqdXef5J2HrM'//String.fromEnvironment('GOOGLE_API_KEY'),
  );
  static const String _sttEndpoint =
      'https://speech.googleapis.com/v1/speech:recognize';
  static const String _translateEndpoint =
      'https://translation.googleapis.com/language/translate/v2';

  /// Sends [filePath] (WAV, 16kHz, mono) to Google Cloud Speech-to-Text.
  /// Returns Urdu transcript text (Arabic script) or throws on failure.
  static Future<SttResult> transcribe(String filePath) async {
    if (_apiKey.isEmpty) {
      throw SttException(
        'GOOGLE_API_KEY not set. Run with: flutter run --dart-define=GOOGLE_API_KEY=<your_key>',
      );
    }
    final bytes = await File(filePath).readAsBytes();
    final base64Audio = base64Encode(bytes);

    final body = jsonEncode({
      'config': {
        'encoding': 'LINEAR16',
        'sampleRateHertz': 16000,
        'languageCode': 'ur-PK',        // Primary: Urdu Pakistan
        'alternativeLanguageCodes': ['en-US'], // Fallback: English words in speech
        'enableAutomaticPunctuation': true,
        'model': 'default',
      },
      'audio': {
        'content': base64Audio,
      },
    });

    final response = await http
        .post(
          Uri.parse('$_sttEndpoint?key=$_apiKey'),
          headers: {'Content-Type': 'application/json'},
          body: body,
        )
        .timeout(const Duration(seconds: 30));

    if (response.statusCode != 200) {
      final err = _parseApiError(response.body);
      throw SttException('Google STT API error ${response.statusCode}: $err');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final results = data['results'] as List<dynamic>?;

    if (results == null || results.isEmpty) {
      throw SttException('No speech detected in recording.');
    }

    final alternatives =
        results.first['alternatives'] as List<dynamic>? ?? [];
    if (alternatives.isEmpty) {
      throw SttException('Transcription returned empty alternatives.');
    }

    final urduTranscript = alternatives.first['transcript']?.toString() ?? '';
    final confidence =
        (alternatives.first['confidence'] as num?)?.toDouble() ?? 0.0;
    final detectedLanguage =
        results.first['languageCode']?.toString() ?? 'ur-PK';

    // Translate Urdu → English for crisis pipeline processing
    final englishTranslation = await _translate(urduTranscript);

    return SttResult(
      transcript: englishTranslation,   // English sent to server
      originalUrdu: urduTranscript,      // Urdu shown in UI
      confidence: confidence,
      detectedLanguage: detectedLanguage,
    );
  }

  static Future<String> _translate(String urduText) async {
    if (urduText.isEmpty) return urduText;
    try {
      final response = await http
          .post(
            Uri.parse('$_translateEndpoint?key=$_apiKey'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'q': urduText,
              'source': 'ur',
              'target': 'en',
              'format': 'text',
            }),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final translation = data['data']?['translations']?[0]?['translatedText']
            ?.toString();
        if (translation != null && translation.isNotEmpty) return translation;
      }
    } catch (e) {
      debugPrint('[Translate] failed: $e — sending original Urdu');
    }
    return urduText; // fallback: send original if translation fails
  }

  static String _parseApiError(String body) {
    try {
      final json = jsonDecode(body) as Map<String, dynamic>;
      return (json['error'] as Map?)?['message']?.toString() ?? body;
    } catch (_) {
      return body;
    }
  }
}

class SttResult {
  final String transcript;      // English translation — sent to server
  final String originalUrdu;    // Urdu Arabic script — shown in UI
  final double confidence;
  final String detectedLanguage;

  const SttResult({
    required this.transcript,
    required this.originalUrdu,
    required this.confidence,
    required this.detectedLanguage,
  });
}

class SttException implements Exception {
  final String message;
  const SttException(this.message);

  @override
  String toString() => message;
}
