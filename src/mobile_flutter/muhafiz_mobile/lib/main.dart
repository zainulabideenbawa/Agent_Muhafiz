import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme/theme.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        // We will add providers here later
      ],
      child: const MuhafizApp(),
    ),
  );
}

class MuhafizApp extends StatelessWidget {
  const MuhafizApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Muhafiz-Link',
      debugShowCheckedModeBanner: false,
      theme: MuhafizTheme.darkTheme,
      home: const LoginScreen(),
    );
  }
}
