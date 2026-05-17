import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:pinput/pinput.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';
import '../theme/theme.dart';
import 'dashboard_screen.dart';
import 'signup_screen.dart';
import '../widgets/feedback_widgets.dart';
import '../services/auth_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'onboarding_screen.dart';


class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nicController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  
  final nicFormatter = MaskTextInputFormatter(
    mask: '#####-#######-#',
    filter: {"#": RegExp(r'[0-9]')},
  );

  bool _isOtpSent = false;
  bool _isLoading = false;

  void _handleRequestOtp() async {
    if (_nicController.text.length < 15) {
      MuhafizFeedback.showToast("INVALID CNIC STRUCTURE");
      return;
    }

    setState(() => _isLoading = true);
    
    try {
      final res = await AuthService.requestOtp(_nicController.text);
      if (res['success'] == true) {
        setState(() {
          _isOtpSent = true;
          _isLoading = false;
        });
        MuhafizFeedback.showToast("ENCRYPTED OTP DISPATCHED");
      } else {
        setState(() => _isLoading = false);
        MuhafizFeedback.showToast(res['message'] ?? "AUTHENTICATION REQUEST FAILED");
      }
    } catch (e) {
      setState(() => _isLoading = false);
      MuhafizFeedback.showToast("COUNCIL SERVER OFFLINE");
    }
  }

  void _handleVerifyOtp() async {
    if (_otpController.text.length < 6) {
      MuhafizFeedback.showToast("INCOMPLETE AUTH CODE");
      return;
    }

    setState(() => _isLoading = true);
    
    try {
      final res = await AuthService.verifyOtp(_nicController.text, _otpController.text);
      if (res['success'] == true) {
        setState(() => _isLoading = false);
        MuhafizFeedback.showToast("IDENTITY VERIFIED. ACCESS GRANTED.");
        
        final user = res['user'] ?? {'name': 'Sovereign Citizen'};
        final mapUser = Map<String, dynamic>.from(user);

        final prefs = await SharedPreferences.getInstance();

        // ── PERSIST SESSION ──────────────────────────────────
        final String token = (res['token'] ?? '').toString();
        await prefs.setString('auth_token', token);
        await prefs.setString('user_name', (mapUser['name'] ?? '').toString());
        await prefs.setString('user_nic', _nicController.text);
        await prefs.setString('user_sector', (mapUser['sector'] ?? '').toString());
        // ─────────────────────────────────────────────────────

        final bool isLocationOnboarded = prefs.getBool('location_onboarded') ?? false;

        if (mounted) {
          if (isLocationOnboarded) {
            mapUser['location'] = {
              'province': prefs.getString('province'),
              'city': prefs.getString('city'),
              'district': prefs.getString('district'),
              'area': prefs.getString('area'),
              'landmark': prefs.getString('landmark'),
            };
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => DashboardScreen(user: mapUser)),
            );
          } else {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => OnboardingScreen(user: mapUser)),
            );
          }
        }
      } else {
        setState(() => _isLoading = false);
        MuhafizFeedback.showToast(res['message'] ?? "INVALID AUTH CODE");
      }
    } catch (e) {
      setState(() => _isLoading = false);
      MuhafizFeedback.showToast("VERIFICATION PROTOCOL FAILURE");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background Glow
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: MuhafizTheme.primaryEmerald.withOpacity(0.05),
              ),
            ),
          ),
          
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const SizedBox(height: 40),
                    
                    // Logo
                    FadeInDown(
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.2)),
                        ),
                        child: Image.asset(
                          'assets/images/logo.png',
                          height: 80,
                          width: 80,
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 32),
                    
                    FadeInDown(
                      delay: const Duration(milliseconds: 200),
                      child: Text(
                        'MUHAFIZ-LINK',
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: MuhafizTheme.primaryEmerald,
                          letterSpacing: 8,
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 8),
                    
                    FadeInDown(
                      delay: const Duration(milliseconds: 400),
                      child: Text(
                        'SOVEREIGN GATE',
                        style: Theme.of(context).textTheme.headlineLarge,
                      ),
                    ),
                    
                    const SizedBox(height: 12),
                    
                    FadeInDown(
                      delay: const Duration(milliseconds: 600),
                      child: Text(
                        'SECURE PROTOCOL V1.0.4',
                        style: Theme.of(context).textTheme.labelSmall,
                      ),
                    ),
                    
                    const SizedBox(height: 64),
                    
                    // NIC Input
                    if (!_isOtpSent)
                      FadeInUp(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'CITIZEN IDENTITY (CNIC)',
                              style: Theme.of(context).textTheme.labelSmall?.copyWith(color: MuhafizTheme.primaryEmerald),
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _nicController,
                              inputFormatters: [nicFormatter],
                              keyboardType: TextInputType.number,
                              style: GoogleFonts.jetBrainsMono(
                                fontSize: 18,
                                letterSpacing: 2,
                                color: MuhafizTheme.onSurface,
                              ),
                              decoration: InputDecoration(
                                hintText: 'XXXXX-XXXXXXX-X',
                                prefixIcon: const Icon(LucideIcons.shieldCheck, size: 20),
                                counterText: '',
                              ),
                            ),
                          ],
                        ),
                      ),
                    
                    // OTP Input
                    if (_isOtpSent)
                      FadeInUp(
                        child: Column(
                          children: [
                            Text(
                              'VERIFICATION CODE',
                              style: Theme.of(context).textTheme.labelSmall?.copyWith(color: MuhafizTheme.primaryEmerald),
                            ),
                            const SizedBox(height: 24),
                            Pinput(
                              controller: _otpController,
                              length: 6,
                              defaultPinTheme: PinTheme(
                                width: 50,
                                height: 60,
                                textStyle: GoogleFonts.jetBrainsMono(
                                  fontSize: 24,
                                  color: MuhafizTheme.primaryEmerald,
                                  fontWeight: FontWeight.bold,
                                ),
                                decoration: BoxDecoration(
                                  color: MuhafizTheme.surfaceSlate,
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: MuhafizTheme.mutedSlate.withOpacity(0.3)),
                                ),
                              ),
                              focusedPinTheme: PinTheme(
                                width: 50,
                                height: 60,
                                textStyle: GoogleFonts.jetBrainsMono(
                                  fontSize: 24,
                                  color: MuhafizTheme.primaryEmerald,
                                  fontWeight: FontWeight.bold,
                                ),
                                decoration: BoxDecoration(
                                  color: MuhafizTheme.surfaceSlate,
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: MuhafizTheme.primaryEmerald),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            TextButton(
                              onPressed: () => setState(() => _isOtpSent = false),
                              child: Text(
                                'RE-ENTER IDENTITY',
                                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: MuhafizTheme.primaryEmerald,
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    
                    const SizedBox(height: 48),
                    
                    // Action Button
                    FadeInUp(
                      delay: const Duration(milliseconds: 800),
                      child: SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : (_isOtpSent ? _handleVerifyOtp : _handleRequestOtp),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: MuhafizTheme.primaryEmerald,
                            elevation: 8,
                            shadowColor: MuhafizTheme.primaryEmerald.withOpacity(0.3),
                          ),
                          child: _isLoading
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  color: Color(0xFF003824),
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                _isOtpSent ? 'AUTHORIZE ACCESS' : 'REQUEST AUTHENTICATION',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Biometric Option (Simulated)
                    if (!_isOtpSent)
                      FadeInUp(
                        delay: const Duration(milliseconds: 1000),
                        child: OutlinedButton.icon(
                          onPressed: () => MuhafizFeedback.showToast("SCANNING BIOMETRICS..."),
                          icon: const Icon(LucideIcons.fingerprint, size: 18),
                          label: const Text('RAPID REPORTING MODE'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: MuhafizTheme.mutedSlate,
                            side: BorderSide(color: MuhafizTheme.mutedSlate.withOpacity(0.3)),
                            textStyle: Theme.of(context).textTheme.labelSmall,
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                          ),
                        ),
                      ),
                    
                    const SizedBox(height: 64),
                    
                    // Signup Link
                    FadeIn(
                      delay: const Duration(milliseconds: 1200),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'NEW CITIZEN?',
                            style: Theme.of(context).textTheme.labelSmall,
                          ),
                          TextButton(
                            onPressed: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => const SignupScreen()),
                            ),
                            child: Text(
                              'APPLY FOR SOVEREIGNTY',
                              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: MuhafizTheme.primaryEmerald,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
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
