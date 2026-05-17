import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class MuhafizTheme {
  static const Color primaryEmerald = Color(0xFF4EDEA3);
  static const Color primaryContainer = Color(0xFF10B981);
  static const Color backgroundSlate = Color(0xFF0B1326);
  static const Color surfaceSlate = Color(0xFF171F33);
  static const Color surfaceBright = Color(0xFF31394D);
  static const Color onSurface = Color(0xFFDAE2FD);
  static const Color mutedSlate = Color(0xFF86948A);
  static const Color errorRed = Color(0xFFFFB4AB);
  static const Color secondarySlate = Color(0xFFB9C7E0);

  // Missing colors required by screens
  static const Color emerald400 = Color(0xFF34D399);
  static const Color emerald500 = Color(0xFF10B981);
  static const Color emerald600 = Color(0xFF059669);
  static const Color darkBg = Color(0xFF0F172A);
  static const Color darkCard = Color(0xFF1E293B);
  static const Color darkBorder = Color(0xFF334155);
  static const Color darkTextMuted = Color(0xFF94A3B8);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: backgroundSlate,
      primaryColor: primaryEmerald,
      colorScheme: const ColorScheme.dark(
        primary: primaryEmerald,
        onPrimary: Color(0xFF003824),
        primaryContainer: primaryContainer,
        secondary: secondarySlate,
        surface: backgroundSlate,
        onSurface: onSurface,
        error: errorRed,
        outline: mutedSlate,
        surfaceContainerHighest: Color(0xFF2D3449),
      ),
      
      // Typography
      textTheme: TextTheme(
        displayLarge: GoogleFonts.jetBrainsMono(
          fontSize: 40,
          fontWeight: FontWeight.bold,
          color: onSurface,
          letterSpacing: -0.8,
        ),
        headlineLarge: GoogleFonts.jetBrainsMono(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: onSurface,
          letterSpacing: -0.32,
        ),
        headlineMedium: GoogleFonts.jetBrainsMono(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: onSurface,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.normal,
          color: onSurface,
          height: 1.6,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          color: onSurface,
          height: 1.5,
        ),
        bodySmall: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: mutedSlate,
          height: 1.5,
        ),
        labelLarge: GoogleFonts.jetBrainsMono(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: primaryEmerald,
          letterSpacing: 0.7,
        ),
        labelMedium: GoogleFonts.jetBrainsMono(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: mutedSlate,
          letterSpacing: 0.6,
        ),
        labelSmall: GoogleFonts.jetBrainsMono(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: mutedSlate,
          letterSpacing: 1.0,
        ),
      ),

      // Component Themes
      cardTheme: CardThemeData(
        color: surfaceSlate,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
          side: BorderSide(color: primaryEmerald.withOpacity(0.2)),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Color(0xFF131B2E),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(4),
          borderSide: BorderSide(color: mutedSlate.withOpacity(0.3)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(4),
          borderSide: BorderSide(color: mutedSlate.withOpacity(0.3)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(4),
          borderSide: const BorderSide(color: primaryEmerald, width: 1),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(4),
          borderSide: const BorderSide(color: errorRed),
        ),
        labelStyle: GoogleFonts.jetBrainsMono(color: mutedSlate, fontSize: 12),
        hintStyle: GoogleFonts.inter(color: mutedSlate.withOpacity(0.5), fontSize: 14),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryEmerald,
          foregroundColor: const Color(0xFF003824),
          textStyle: GoogleFonts.jetBrainsMono(
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(2)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        ),
      ),
    );
  }
}
