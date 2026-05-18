import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _authenticate() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('EMAIL AND PASSWORD ARE REQUIRED'),
          backgroundColor: MuhafizTheme.crisisRed,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final result = await OfficerAuthService.login(email, password);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (result['success'] == true) {
      final user = result['user'] as Map<String, dynamic>? ?? {};
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('officer_name', user['name']?.toString() ?? 'Officer');
      await prefs.setString('officer_email', user['email']?.toString() ?? email);

      if (!mounted) return;

      // Navigate to OfficerShell, replacing the login route
      Navigator.of(context).pushReplacementNamed('/shell');
    } else {
      final msg = result['message']?.toString() ?? 'Authentication failed';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('AUTH FAILED: ${msg.toUpperCase()}'),
          backgroundColor: MuhafizTheme.crisisRed,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MuhafizTheme.nightOpsBlack,
      body: Stack(
        children: [
          // Tactical grid background
          CustomPaint(
            painter: _LoginGridPainter(),
            child: const SizedBox.expand(),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 40),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Shield icon
                    const Icon(
                      Icons.shield,
                      color: MuhafizTheme.sovereignGreen,
                      size: 72,
                    ),
                    const SizedBox(height: 20),

                    // Header
                    const Text(
                      'MUHAFIZ-X',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: MuhafizTheme.sovereignGreen,
                        fontFamily: 'monospace',
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 6,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'OFFICER PORTAL',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: MuhafizTheme.textSecondary,
                        fontFamily: 'monospace',
                        fontSize: 12,
                        letterSpacing: 4,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Divider line
                    Container(
                      height: 1,
                      margin: const EdgeInsets.symmetric(vertical: 16),
                      color: MuhafizTheme.surfaceBorder,
                    ),

                    // Hint
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: MuhafizTheme.sovereignGreen.withValues(alpha: 0.05),
                        border: Border.all(color: MuhafizTheme.sovereignGreen.withValues(alpha: 0.2)),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'Use admin@muhafiz.gov / sovereign for demo',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: MuhafizTheme.textSecondary,
                          fontFamily: 'monospace',
                          fontSize: 11,
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Email field
                    const Text(
                      'OFFICER EMAIL',
                      style: TextStyle(
                        color: MuhafizTheme.textSecondary,
                        fontFamily: 'monospace',
                        fontSize: 10,
                        letterSpacing: 1.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      autocorrect: false,
                      style: const TextStyle(
                        color: Colors.white,
                        fontFamily: 'monospace',
                        fontSize: 14,
                      ),
                      decoration: InputDecoration(
                        hintText: 'officer@muhafiz.gov',
                        hintStyle: TextStyle(
                          color: MuhafizTheme.textSecondary.withValues(alpha:0.5),
                          fontFamily: 'monospace',
                          fontSize: 14,
                        ),
                        prefixIcon: const Icon(Icons.email_outlined, color: MuhafizTheme.textSecondary, size: 18),
                        filled: true,
                        fillColor: MuhafizTheme.tacticalGray,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: MuhafizTheme.surfaceBorder),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: MuhafizTheme.surfaceBorder),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: MuhafizTheme.sovereignGreen),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Password field
                    const Text(
                      'ACCESS CODE',
                      style: TextStyle(
                        color: MuhafizTheme.textSecondary,
                        fontFamily: 'monospace',
                        fontSize: 10,
                        letterSpacing: 1.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      style: const TextStyle(
                        color: Colors.white,
                        fontFamily: 'monospace',
                        fontSize: 14,
                        letterSpacing: 3,
                      ),
                      onSubmitted: (_) => _authenticate(),
                      decoration: InputDecoration(
                        hintText: '••••••••',
                        hintStyle: TextStyle(
                          color: MuhafizTheme.textSecondary.withValues(alpha:0.5),
                          fontSize: 14,
                          letterSpacing: 3,
                        ),
                        prefixIcon: const Icon(Icons.lock_outline, color: MuhafizTheme.textSecondary, size: 18),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            color: MuhafizTheme.textSecondary,
                            size: 18,
                          ),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                        filled: true,
                        fillColor: MuhafizTheme.tacticalGray,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: MuhafizTheme.surfaceBorder),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: MuhafizTheme.surfaceBorder),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: MuhafizTheme.sovereignGreen),
                        ),
                      ),
                    ),
                    const SizedBox(height: 36),

                    // Authenticate button
                    SizedBox(
                      height: 56,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _authenticate,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: MuhafizTheme.sovereignGreen,
                          foregroundColor: Colors.black,
                          disabledBackgroundColor: MuhafizTheme.sovereignGreen.withValues(alpha:0.4),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  color: Colors.black,
                                  strokeWidth: 2.5,
                                ),
                              )
                            : const Text(
                                'AUTHENTICATE',
                                style: TextStyle(
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.w900,
                                  fontSize: 16,
                                  letterSpacing: 3,
                                ),
                              ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Footer
                    const Text(
                      'MUHAFIZ-X SECURE COMMAND INTERFACE\nAUTHORIZED PERSONNEL ONLY',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: MuhafizTheme.textSecondary,
                        fontFamily: 'monospace',
                        fontSize: 9,
                        letterSpacing: 1,
                        height: 1.8,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LoginGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = MuhafizTheme.sovereignGreen.withValues(alpha:0.04)
      ..strokeWidth = 0.5;

    const spacing = 40.0;

    for (double i = 0; i < size.width; i += spacing) {
      canvas.drawLine(Offset(i, 0), Offset(i, size.height), paint);
    }
    for (double i = 0; i < size.height; i += spacing) {
      canvas.drawLine(Offset(0, i), Offset(size.width, i), paint);
    }

    final circlePaint = Paint()
      ..color = MuhafizTheme.sovereignGreen.withValues(alpha:0.02)
      ..style = PaintingStyle.fill;

    canvas.drawCircle(Offset(size.width * 0.5, size.height * 0.4), 180, circlePaint);
    canvas.drawCircle(Offset(size.width * 0.5, size.height * 0.4), 320, circlePaint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
