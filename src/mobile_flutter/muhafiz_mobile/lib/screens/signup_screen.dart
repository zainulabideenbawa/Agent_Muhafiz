import 'package:flutter/material.dart';
import '../theme/theme.dart';
import '../services/auth_service.dart';
import 'login_screen.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final TextEditingController _nicController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _sectorController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  void _handleSignup() async {
    final response = await AuthService.signup(
      nic: _nicController.text,
      name: _nameController.text,
      sector: _sectorController.text,
      password: _passwordController.text,
    );

    if (response['success']) {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(response['error'] ?? 'Signup Failed')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Join the Council', style: MuhafizTheme.darkTheme.textTheme.headlineLarge),
            Text('Register as a Citizen of Sindh', style: MuhafizTheme.darkTheme.textTheme.bodySmall),
            const SizedBox(height: 32),
            
            _InputField(label: 'Full Name', controller: _nameController),
            const SizedBox(height: 16),
            _InputField(label: 'NIC Number', controller: _nicController, hint: 'XXXXX-XXXXXXX-X'),
            const SizedBox(height: 16),
            _InputField(label: 'Sector/Neighborhood', controller: _sectorController, hint: 'e.g. Gulshan Block 13'),
            const SizedBox(height: 16),
            _InputField(label: 'Password', controller: _passwordController, obscure: true),
            
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _handleSignup,
                style: ElevatedButton.styleFrom(backgroundColor: MuhafizTheme.emerald600),
                child: const Text('Create Sovereign Account'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  final String label;
  final String? hint;
  final bool obscure;
  final TextEditingController controller;

  const _InputField({required this.label, this.hint, this.obscure = false, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: MuhafizTheme.darkTheme.textTheme.labelSmall),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: obscure,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: MuhafizTheme.darkCard,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ],
    );
  }
}
