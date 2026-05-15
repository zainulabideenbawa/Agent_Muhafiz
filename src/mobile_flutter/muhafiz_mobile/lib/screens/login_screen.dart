import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'dashboard_screen.dart';
import 'signup_screen.dart';
import '../widgets/feedback_widgets.dart';
import '../theme/theme.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nicController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;

  void _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    
    try {
      final response = await AuthService.login(
        nic: _nicController.text,
        password: _passwordController.text,
      );

      if (response['success']) {
        MuhafizFeedback.showToast("Identity Verified");
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => DashboardScreen(user: response['user'])),
          );
        }
      } else {
        MuhafizFeedback.showToast(response['error'] ?? 'Identity Verification Failed');
      }
    } catch (e) {
      MuhafizFeedback.showToast("Council Server Unreachable");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MuhafizTheme.darkBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Align(
                  alignment: Alignment.topRight,
                  child: TextButton(
                    onPressed: () => MuhafizFeedback.showToast("Urdu Language Selected"),
                    child: const Text('اردو', style: TextStyle(color: MuhafizTheme.emerald400, fontWeight: FontWeight.bold)),
                  ),
                ),
                const Spacer(),
                FadeInDown(
                  child: const Text('MUHAFIZ-LINK', style: TextStyle(color: MuhafizTheme.emerald400, letterSpacing: 4, fontWeight: FontWeight.bold, fontSize: 12)),
                ),
                FadeInDown(
                  delay: const Duration(milliseconds: 200),
                  child: const Text('CITIZEN PORTAL', style: TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 56),
                
                // NIC Field with Tactical Icon
                FadeInUp(
                  delay: const Duration(milliseconds: 400),
                  child: TextFormField(
                    controller: _nicController,
                    style: const TextStyle(color: Colors.white),
                    keyboardType: TextInputType.number,
                    decoration: MuhafizTheme.inputDecoration('CNIC (42101-XXXXXXX-X)').copyWith(
                      prefixIcon: const Icon(Icons.badge_outlined, color: MuhafizTheme.emerald400, size: 20),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) return 'Please enter your NIC';
                      if (!RegExp(r'^\d{5}-\d{7}-\d{1}$').hasMatch(value)) return 'Format: XXXXX-XXXXXXX-X';
                      return null;
                    },
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Password Field with Tactical Icon
                FadeInUp(
                  delay: const Duration(milliseconds: 600),
                  child: TextFormField(
                    controller: _passwordController,
                    style: const TextStyle(color: Colors.white),
                    obscureText: true,
                    decoration: MuhafizTheme.inputDecoration('PASSWORD').copyWith(
                      prefixIcon: const Icon(Icons.lock_outline, color: MuhafizTheme.emerald400, size: 20),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) return 'Please enter your password';
                      if (value.length < 6) return 'Minimum 6 characters';
                      return null;
                    },
                  ),
                ),
                
                const SizedBox(height: 48),
                
                // FIXED CONTRAST BUTTON
                FadeInUp(
                  delay: const Duration(milliseconds: 800),
                  child: SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: MuhafizTheme.emerald600,
                        foregroundColor: Colors.white, // CRISP WHITE TEXT
                        elevation: 8,
                        shadowColor: MuhafizTheme.emerald600.withOpacity(0.4),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: _isLoading 
                        ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                        : const Text('VERIFY IDENTITY', style: TextStyle(letterSpacing: 2, fontWeight: FontWeight.bold, fontSize: 14)),
                    ),
                  ),
                ),
                
                const Spacer(),
                
                FadeIn(
                  delay: const Duration(milliseconds: 1000),
                  child: Center(
                    child: TextButton(
                      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const SignupScreen())),
                      child: const Text('NEW CITIZEN? APPLY FOR ACCESS', style: TextStyle(color: MuhafizTheme.emerald400, fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
