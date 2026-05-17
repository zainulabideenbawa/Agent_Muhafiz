import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class AuthService {
  // 10.0.2.2 is the special alias for localhost in Android Emulators
  static final String baseUrl = Platform.isAndroid 
    ? 'http://10.0.2.2:3001/api/auth' 
    : 'http://localhost:3001/api/auth';

  static Future<Map<String, dynamic>> signup({
    required String nic,
    required String name,
    required String sector,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/signup'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'nic': nic,
        'name': name,
        'sector': sector,
        'password': password,
      }),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> requestOtp(String nic) async {
    final response = await http.post(
      Uri.parse('$baseUrl/citizen/request-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'nic': nic}),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> verifyOtp(String nic, String otp) async {
    final response = await http.post(
      Uri.parse('$baseUrl/citizen/verify-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'nic': nic, 'otp': otp}),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> login({
    required String nic,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'nic': nic,
        'password': password,
      }),
    );
    return jsonDecode(response.body);
  }
}
