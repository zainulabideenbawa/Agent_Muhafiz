import 'package:flutter/material.dart';

class MuhafizTheme {
  static const Color emerald500 = Color(0xFF10B981);
  static const Color emerald400 = Color(0xFF34D399);
  static const Color emerald600 = Color(0xFF059669);
  static const Color emerald900 = Color(0xFF064E3B);
  static const Color emerald950 = Color(0xFF022C22);

  static const Color darkBg = Color(0xFF0A0A0A);
  static const Color darkCard = Color(0xFF161616);
  static const Color darkBorder = Color(0xFF262626);
  static const Color darkText = Colors.white;
  static const Color darkTextMuted = Color(0xFFA3A3A3);

  static const Color amber = Color(0xFFF59E0B);

  static ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: darkBg,
    primaryColor: emerald500,
    colorScheme: const ColorScheme.dark(
      primary: emerald500,
      secondary: emerald400,
      surface: darkCard,
      onSurface: darkText,
    ),
    cardTheme: CardThemeData(
      color: darkCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: darkBorder),
      ),
    ),

    textTheme: const TextTheme(
      headlineLarge: TextStyle(
        color: darkText,
        fontWeight: FontWeight.bold,
        fontSize: 32,
      ),
      headlineMedium: TextStyle(
        color: darkText,
        fontWeight: FontWeight.bold,
        fontSize: 24,
      ),
      bodyMedium: TextStyle(
        color: darkText,
        fontSize: 16,
      ),
      bodySmall: TextStyle(
        color: darkTextMuted,
        fontSize: 14,
      ),
      labelSmall: TextStyle(
        color: darkTextMuted,
        fontSize: 12,
        letterSpacing: 1,
        fontWeight: FontWeight.bold,
      ),
    ),
  );
}
