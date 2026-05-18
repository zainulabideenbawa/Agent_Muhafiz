import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class ApiService {
  static const String _macLanIp = '192.168.18.41';
  static final String _host = Platform.isAndroid ? '10.0.2.2' : _macLanIp;
  static final String baseUrl = 'http://$_host:3001/api';
  static String get wsUrl => 'ws://$_host:3001';

  // Fetch active incidents from the real database
  static Future<List<Map<String, dynamic>>> getIncidents() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/incidents'));
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(json.decode(response.body));
      }
    } catch (e) {
      print('Error fetching incidents: $e');
    }
    // Fallback/Mock data if server is down
    return [
      {
        'incident_id': 'MHFZ-9021',
        'type': 'URBAN_FLOOD',
        'location': 'NIPA Chowrangi',
        'status': 'ANALYZING',
        'data': {'raw_input': 'NIPA doob gaya!'},
        'created_at': DateTime.now().subtract(const Duration(minutes: 5)).toIso8601String()
      }
    ];
  }

  static Future<bool> retractAlert(String incidentId, String reason) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/incidents/retract-alert'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'incidentId': incidentId, 'reason': reason}),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Error retracting alert: $e');
      return false;
    }
  }

  static Future<bool> confirmCrisis(String incidentId, String note) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/incidents/confirm-crisis'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'incidentId': incidentId, 'note': note}),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Error confirming crisis: $e');
      return false;
    }
  }

  static Future<bool> acceptQuest(String incidentId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/incidents/accept-quest'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'incidentId': incidentId}),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Error accepting quest: $e');
      return false;
    }
  }

  // Mock Technical Briefings (Simulated Communicator Agent Data)
  static Map<String, dynamic> getTechnicalBrief(String type) {
    if (type == 'fire') {
      return {
        'equipment': 'Fire Truck B-12, Oxygen Tanks, Thermal Imaging',
        'instructions': 'Prioritize factory perimeter. Prevent spread to adjacent textile unit.',
        'analyst_prediction': 'Spread risk: High (Wind 12km/h SE)',
        'confidence': 0.82
      };
    }
    return {
      'equipment': 'High-Volume Pump, 4WD Rescue, Portable Lighting',
      'instructions': 'Block access to Karsaz road. Deploy pumps at NIPA depression point.',
      'analyst_prediction': 'Water level increase: +10cm in 30 mins',
      'confidence': 0.94
    };
  }
}
