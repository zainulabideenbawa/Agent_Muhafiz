import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../widgets/feedback_widgets.dart';

class ApiService {
  // --- HOST CONFIGURATION ---
  // For iOS Simulator: '127.0.0.1'
  // For Physical iPhone on same WiFi: use Mac's LAN IP (run `ipconfig getifaddr en0`)
  // For Android Emulator: '10.0.2.2'
  static const String _macLanIp = '192.168.18.56';
  static final String _host = Platform.isAndroid ? '10.0.2.2' : _macLanIp;
  static final String _baseUrl = 'http://$_host:3001/api';

  static String get wsUrl => 'ws://$_host:3001';

  static Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body,
  ) async {
    try {
      print("[API] POST $_baseUrl$path");
      final response = await http
          .post(
            Uri.parse('$_baseUrl$path'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 10));

      return _handleResponse(response);
    } on SocketException {
      MuhafizFeedback.showToast("Council Server Unreachable");
      return {'success': false, 'error': 'Network Error'};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> get(String path) async {
    try {
      print("[API] GET $_baseUrl$path");
      final response = await http
          .get(Uri.parse('$_baseUrl$path'))
          .timeout(const Duration(seconds: 10));

      return _handleResponse(response);
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  static Map<String, dynamic> _handleResponse(http.Response response) {
    final dynamic data = jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return {'success': true, 'data': data};
    } else {
      return {'success': false, 'error': data['error'] ?? 'Server Error'};
    }
  }
}
