import 'package:flutter/material.dart';
import 'theme.dart';
import 'screens/dispatch_inbox_screen.dart';

void main() {
  runApp(const MuhafizOfficerApp());
}

class MuhafizOfficerApp extends StatelessWidget {
  const MuhafizOfficerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Muhafiz-X Officer',
      debugShowCheckedModeBanner: false,
      theme: MuhafizTheme.darkTheme,
      home: const DispatchInboxScreen(),
    );
  }
}
