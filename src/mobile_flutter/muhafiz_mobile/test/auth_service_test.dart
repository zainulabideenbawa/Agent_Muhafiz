import 'package:flutter_test/flutter_test.dart';
import 'package:muhafiz_mobile/services/auth_service.dart';

void main() {
  group('AuthService API Endpoint Structure Tests', () {
    test('Base URL points to the production Render deployment', () {
      expect(AuthService.baseUrl, equals('https://muhafiz-backend-latest.onrender.com/api'));
    });
  });
}
