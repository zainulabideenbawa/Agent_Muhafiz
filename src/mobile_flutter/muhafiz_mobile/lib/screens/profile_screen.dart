import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'login_screen.dart';
import '../theme/theme.dart';
import '../widgets/feedback_widgets.dart';

class ProfileScreen extends StatefulWidget {
  final Map<String, dynamic>? user;
  const ProfileScreen({super.key, this.user});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _showNIC = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MuhafizTheme.darkBg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FadeInDown(
                child: const Text('SOVEREIGN IDENTITY', style: TextStyle(color: MuhafizTheme.emerald400, letterSpacing: 2, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 8),
              FadeInDown(
                delay: const Duration(milliseconds: 200),
                child: const Text('Digital Vault', style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
              ),
              
              const SizedBox(height: 48),
              
              // PROFILE AVATAR SECTION
              Center(
                child: ZoomIn(
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(colors: [MuhafizTheme.emerald500, Colors.blue]),
                    ),
                    child: CircleAvatar(
                      radius: 50,
                      backgroundColor: MuhafizTheme.darkBg,
                      child: Text(
                        widget.user?['name']?[0]?.toUpperCase() ?? 'C',
                        style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 48),
              
              // IDENTITY CARD
              FadeInUp(
                delay: const Duration(milliseconds: 400),
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: MuhafizTheme.darkCard,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: MuhafizTheme.darkBorder),
                  ),
                  child: Column(
                    children: [
                      _ProfileDetail(label: 'CITIZEN NAME', value: widget.user?['name'] ?? 'Unknown Citizen'),
                      const Divider(color: MuhafizTheme.darkBorder, height: 32),
                      _ProfileDetail(label: 'ASSIGNED SECTOR', value: widget.user?['living_sector'] ?? 'Not Set'),
                      const Divider(color: MuhafizTheme.darkBorder, height: 32),
                      
                      // SECURE NIC TOGGLE
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('VERIFIED NIC', style: TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text(
                                _showNIC ? (widget.user?['nic_number'] ?? 'N/A') : 'XXXXX-XXXXXXX-X',
                                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'JetBrains Mono'),
                              ),
                            ],
                          ),
                          IconButton(
                            onPressed: () => setState(() => _showNIC = !_showNIC),
                            icon: Icon(_showNIC ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: MuhafizTheme.emerald400),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 48),
              
              // ACTION MENU
              FadeInUp(
                delay: const Duration(milliseconds: 600),
                child: Column(
                  children: [
                    _MenuButton(label: 'Security Settings', icon: Icons.security_outlined, onTap: () {}),
                    _MenuButton(label: 'Language: English', icon: Icons.language_outlined, onTap: () {}),
                    _MenuButton(label: 'Audit Privacy Policy', icon: Icons.help_outline_rounded, onTap: () {}),
                    const SizedBox(height: 24),
                    _MenuButton(
                      label: 'Terminate Session', 
                      icon: Icons.logout_rounded, 
                      color: Colors.redAccent,
                      onTap: () {
                        MuhafizFeedback.showToast("Session Terminated Safely");
                        Navigator.pushAndRemoveUntil(
                          context, 
                          MaterialPageRoute(builder: (context) => const LoginScreen()),
                          (route) => false,
                        );
                      }
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

class _ProfileDetail extends StatelessWidget {
  final String label;
  final String value;
  const _ProfileDetail({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 10, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
      ],
    );
  }
}

class _MenuButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final Color? color;

  const _MenuButton({required this.label, required this.icon, required this.onTap, this.color});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: (color ?? MuhafizTheme.emerald400).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: color ?? MuhafizTheme.emerald400, size: 20),
      ),
      title: Text(label, style: TextStyle(color: color ?? Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
      trailing: const Icon(Icons.arrow_forward_ios, color: MuhafizTheme.darkBorder, size: 12),
    );
  }
}
