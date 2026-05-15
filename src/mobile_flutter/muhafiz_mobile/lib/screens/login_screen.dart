import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dashboard_screen.dart';
import '../theme/theme.dart';


class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _nicController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              const _MuhafizLogo(),
              const SizedBox(height: 16),
              Text(
                'Muhafiz-Link',
                style: MuhafizTheme.darkTheme.textTheme.headlineLarge,
              ),
              Text(
                'SOVEREIGN GATE: IDENTITY PORTAL',
                style: MuhafizTheme.darkTheme.textTheme.labelSmall?.copyWith(
                  color: MuhafizTheme.emerald400,
                ),
              ),
              const SizedBox(height: 48),

              // Form
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'NIC NUMBER',
                  style: MuhafizTheme.darkTheme.textTheme.labelSmall,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _nicController,
                keyboardType: TextInputType.number,
                style: const TextStyle(
                  fontFamily: 'JetBrains Mono',
                  fontSize: 18,
                  color: MuhafizTheme.darkText,
                ),
                decoration: InputDecoration(
                  hintText: 'XXXXX-XXXXXXX-X',
                  hintStyle: const TextStyle(color: MuhafizTheme.darkTextMuted),
                  filled: true,
                  fillColor: MuhafizTheme.darkCard,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: MuhafizTheme.darkBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: MuhafizTheme.darkBorder),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Login Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const DashboardScreen()),
                    );
                  },
                  style: ElevatedButton.styleFrom(

                    backgroundColor: MuhafizTheme.emerald600,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 8,
                    shadowColor: MuhafizTheme.emerald500.withOpacity(0.5),
                  ),
                  child: const Text(
                    'Request OTP',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 48),

              // Biometric
              Opacity(
                opacity: 0.7,
                child: Column(
                  children: [
                    const Icon(
                      Icons.face_unlock_outlined,
                      color: MuhafizTheme.emerald500,
                      size: 48,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Sign in with FaceID',
                      style: MuhafizTheme.darkTheme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MuhafizLogo extends StatelessWidget {
  const _MuhafizLogo();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: MuhafizTheme.emerald500, width: 3),
      ),
      child: Stack(
        children: [
          Center(
            child: Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: MuhafizTheme.darkBg,
              ),
              margin: const EdgeInsets.only(left: 15),
            ),
          ),
          Positioned(
            top: 15,
            right: 20,
            child: Transform.rotate(
              angle: 45 * 3.14159 / 180,
              child: Container(
                width: 10,
                height: 10,
                color: MuhafizTheme.emerald500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
