import 'package:flutter/material.dart';

class MuhafizTheme {
  // Brand Colors
  static const Color nightOpsBlack = Color(0xFF09090B);
  static const Color tacticalGray = Color(0xFF18181B);
  static const Color sovereignGreen = Color(0xFF10B981);
  static const Color intelligenceViolet = Color(0xFF818CF8);
  static const Color crisisRed = Color(0xFFEF4444);
  static const Color cautionAmber = Color(0xFFF59E0B);
  
  static const Color surfaceBorder = Color(0xFF27272A);
  static const Color textSecondary = Color(0xFFA1A1AA);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: nightOpsBlack,
      primaryColor: sovereignGreen,
      colorScheme: const ColorScheme.dark(
        primary: sovereignGreen,
        secondary: intelligenceViolet,
        error: crisisRed,
        surface: tacticalGray,
      ),
      cardTheme: CardTheme(
        color: tacticalGray,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: surfaceBorder),
        ),
        elevation: 0,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: nightOpsBlack,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.5,
        ),
      ),
      textTheme: const TextTheme(
        headlineMedium: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1),
        bodyLarge: TextStyle(color: Colors.white),
        bodyMedium: TextStyle(color: textSecondary),
      ),
    );
  }
}
