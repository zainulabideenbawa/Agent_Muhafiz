import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'theme/theme.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/onboarding_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();

  final String? token = prefs.getString('auth_token');
  final bool locationDone = prefs.getBool('location_onboarded') ?? false;

  Widget home;
  if (token != null && token.isNotEmpty) {
    // Restore user data from prefs
    final Map<String, dynamic> user = {
      'name': prefs.getString('user_name') ?? 'Citizen',
      'nic': prefs.getString('user_nic') ?? '',
      'sector': prefs.getString('user_sector') ?? '',
      'token': token,
      'location': locationDone
          ? {
              'province': prefs.getString('province'),
              'city': prefs.getString('city'),
              'district': prefs.getString('district'),
              'area': prefs.getString('area'),
              'landmark': prefs.getString('landmark'),
            }
          : null,
    };

    if (!locationDone) {
      home = OnboardingScreen(user: user);
    } else {
      home = DashboardScreen(user: user);
    }
  } else {
    home = const LoginScreen();
  }

  runApp(MuhafizApp(home: home));
}

class MuhafizApp extends StatelessWidget {
  final Widget home;
  const MuhafizApp({super.key, required this.home});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Muhafiz-Link',
      debugShowCheckedModeBanner: false,
      theme: MuhafizTheme.darkTheme,
      home: home,
    );
  }
}
