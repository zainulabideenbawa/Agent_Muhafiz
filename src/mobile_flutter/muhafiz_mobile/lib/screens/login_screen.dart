import 'dashboard_screen.dart';
import 'signup_screen.dart';
import '../theme/theme.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _nicController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  void _handleLogin() async {
    final response = await AuthService.login(
      nic: _nicController.text,
      password: _passwordController.text,
    );

    if (response['success']) {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const DashboardScreen(user: response['user'])),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(response['error'] ?? 'Login Failed')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 64.0),
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
              _InputField(label: 'NIC NUMBER', controller: _nicController, hint: 'XXXXX-XXXXXXX-X'),
              const SizedBox(height: 24),
              _InputField(label: 'PASSWORD', controller: _passwordController, obscure: true),
              const SizedBox(height: 24),

              // Login Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _handleLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: MuhafizTheme.emerald600,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 8,
                    shadowColor: MuhafizTheme.emerald500.withOpacity(0.5),
                  ),
                  child: const Text(
                    'Access Council Hub',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 16),
              TextButton(
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (context) => const SignupScreen()));
                },
                child: const Text('New Citizen? Register Here', style: TextStyle(color: MuhafizTheme.emerald400)),
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
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: MuhafizTheme.darkTextMuted),
            filled: true,
            fillColor: MuhafizTheme.darkCard,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: MuhafizTheme.darkBorder),
            ),
          ),
        ),
      ],
    );
  }
}

