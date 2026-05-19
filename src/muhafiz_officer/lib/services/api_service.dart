import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class ApiService {
  static const String _macLanIp = '192.168.18.4';
  static final String _host = Platform.isAndroid ? '10.0.2.2' : _macLanIp;
  static final String baseUrl = 'http://$_host:3001/api';
  static String get wsUrl => 'ws://$_host:3001';

  static Future<List<Map<String, dynamic>>> getIncidents() async {
    final response = await http
        .get(Uri.parse('$baseUrl/incidents'))
        .timeout(const Duration(seconds: 10));
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(json.decode(response.body));
    }
    throw HttpException('Server returned ${response.statusCode}');
  }

  static Future<bool> retractAlert(String incidentId, String reason) async {
    final response = await http
        .post(
          Uri.parse('$baseUrl/incidents/retract-alert'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({'incidentId': incidentId, 'reason': reason}),
        )
        .timeout(const Duration(seconds: 10));
    return response.statusCode == 200;
  }

  static Future<bool> acceptQuest(String incidentId) async {
    final response = await http
        .post(
          Uri.parse('$baseUrl/incidents/accept-quest'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({'incidentId': incidentId}),
        )
        .timeout(const Duration(seconds: 10));
    return response.statusCode == 200;
  }

  static Future<List<Map<String, dynamic>>> getTasks() async {
    final response = await http
        .get(Uri.parse('$baseUrl/tasks'))
        .timeout(const Duration(seconds: 10));
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(json.decode(response.body));
    }
    throw HttpException('Server returned ${response.statusCode}');
  }

  static Future<void> updateTaskStatus(
    String taskId,
    String status,
    String summary,
  ) async {
    final response = await http
        .post(
          Uri.parse('$baseUrl/tasks/$taskId/status'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({'status': status, 'summary': summary}),
        )
        .timeout(const Duration(seconds: 10));
    if (response.statusCode != 200) {
      throw HttpException('Server returned ${response.statusCode}');
    }
  }

  static Future<void> confirmCrisis(String incidentId, String note) async {
    final response = await http
        .post(
          Uri.parse('$baseUrl/incidents/confirm-crisis'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({'incidentId': incidentId, 'note': note}),
        )
        .timeout(const Duration(seconds: 10));
    if (response.statusCode != 200) {
      throw HttpException(
        'Server returned ${response.statusCode}: ${response.body}',
      );
    }
  }
}
