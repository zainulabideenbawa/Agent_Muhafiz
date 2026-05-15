import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/login_screen.dart';
import 'theme/theme.dart';

void main() {
  runApp(const MuhafizApp());
}

class MuhafizApp extends StatelessWidget {
  const MuhafizApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Muhafiz-Link',
      debugShowCheckedModeBanner: false,
      theme: MuhafizTheme.darkTheme.copyWith(
        textTheme: GoogleFonts.interTextTheme(MuhafizTheme.darkTheme.textTheme),
      ),
      home: const LoginScreen(),
    );
  }
}
