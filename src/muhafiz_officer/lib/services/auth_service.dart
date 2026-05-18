import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class OfficerAuthService {
  static const String _macLanIp = '192.168.18.41';
  static final String _host = Platform.isAndroid ? '10.0.2.2' : _macLanIp;
  static final String _baseUrl = 'http://$_host:3001/api';

  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final res = await http
          .post(
            Uri.parse('$_baseUrl/login'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(const Duration(seconds: 10));
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && data['success'] == true) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('officer_email', email);
        await prefs.setString('officer_name', data['user']?['name'] ?? 'Officer');
        await prefs.setString('officer_role', data['user']?['role'] ?? 'OFFICER');
      }
      return data;
    } catch (e) {
      return {'success': false, 'message': 'Server unreachable'};
    }
  }

  static Future<Map<String, dynamic>?> getSavedSession() async {
    final prefs = await SharedPreferences.getInstance();
    final email = prefs.getString('officer_email');
    if (email == null) return null;
    return {
      'email': email,
      'name': prefs.getString('officer_name') ?? 'Officer',
      'role': prefs.getString('officer_role') ?? 'OFFICER',
    };
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('officer_email');
    await prefs.remove('officer_name');
    await prefs.remove('officer_role');
  }
}
