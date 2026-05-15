import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../services/auth_service.dart';
import '../widgets/feedback_widgets.dart';
import '../theme/theme.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _nicController = TextEditingController();
  final TextEditingController _sectorController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;

  void _handleSignup() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final result = await AuthService.signup(
        name: _nameController.text,
        nic: _nicController.text,
        sector: _sectorController.text,
        password: _passwordController.text,
      );

      if (result['success']) {
        MuhafizFeedback.showToast("Enrollment Complete. Please Verify Identity.");
        if (mounted) Navigator.pop(context);
      } else {
        MuhafizFeedback.showToast(result['error'] ?? "Enrollment Rejected");
      }
    } catch (e) {
      MuhafizFeedback.showToast("Council Connection Failed");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MuhafizTheme.darkBg,
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0, leading: const BackButton(color: MuhafizTheme.emerald400)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 8.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FadeInDown(
                child: const Text('CITIZEN ENROLLMENT', style: TextStyle(color: MuhafizTheme.emerald400, letterSpacing: 2, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 12),
              FadeInDown(
                delay: const Duration(milliseconds: 200),
                child: const Text('Join the Sovereign\nDigital State.', style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, height: 1.2)),
              ),
              const SizedBox(height: 40),
              
              _AnimatedField(
                index: 0,
                controller: _nameController,
                label: 'FULL NAME (AS PER NIC)',
                icon: Icons.person_outline,
                validator: (value) => (value == null || value.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 20),
              
              _AnimatedField(
                index: 1,
                controller: _nicController,
                label: 'CNIC (42101-XXXXXXX-X)',
                icon: Icons.badge_outlined,
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Required';
                  if (!RegExp(r'^\d{5}-\d{7}-\d{1}$').hasMatch(value)) return 'Invalid Format';
                  return null;
                },
              ),
              const SizedBox(height: 20),
              
              _AnimatedField(
                index: 2,
                controller: _sectorController,
                label: 'LIVING SECTOR (e.g. GULSHAN)',
                icon: Icons.map_outlined,
                validator: (value) => (value == null || value.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 20),
              
              _AnimatedField(
                index: 3,
                controller: _passwordController,
                label: 'SECURE PASSWORD',
                icon: Icons.lock_outline,
                isPassword: true,
                validator: (value) => (value == null || value.length < 6) ? 'Min 6 characters' : null,
              ),
              
              const SizedBox(height: 48),
              
              // FIXED CONTRAST BUTTON
              FadeInUp(
                delay: const Duration(milliseconds: 1000),
                child: SizedBox(
                  width: double.infinity,
                  height: 60,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleSignup,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: MuhafizTheme.emerald600,
                      foregroundColor: Colors.white, // CRISP WHITE TEXT
                      elevation: 8,
                      shadowColor: MuhafizTheme.emerald600.withOpacity(0.4),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: _isLoading 
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                      : const Text('COMPLETE ENROLLMENT', style: TextStyle(letterSpacing: 2, fontWeight: FontWeight.bold)),
                  ),
                ),
              ),
              
              const SizedBox(height: 32),
              FadeIn(
                delay: const Duration(milliseconds: 1200),
                child: Center(
                  child: Column(
                    children: [
                      const Icon(Icons.shield_outlined, color: MuhafizTheme.darkTextMuted, size: 16),
                      const SizedBox(height: 8),
                      const Text(
                        'YOUR DATA IS END-TO-END ENCRYPTED\nMANAGED BY THE SOVEREIGN COUNCIL',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 8, letterSpacing: 1),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _AnimatedField extends StatelessWidget {
  final int index;
  final TextEditingController controller;
  final String label;
  final IconData icon;
  final bool isPassword;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;

  const _AnimatedField({
    required this.index,
    required this.controller,
    required this.label,
    required this.icon,
    this.isPassword = false,
    this.keyboardType,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return FadeInLeft(
      delay: Duration(milliseconds: 400 + (index * 150)),
      child: TextFormField(
        controller: controller,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        obscureText: isPassword,
        keyboardType: keyboardType,
        decoration: MuhafizTheme.inputDecoration(label).copyWith(
          prefixIcon: Icon(icon, color: MuhafizTheme.emerald400, size: 18),
        ),
        validator: validator,
      ),
    );
  }
}
