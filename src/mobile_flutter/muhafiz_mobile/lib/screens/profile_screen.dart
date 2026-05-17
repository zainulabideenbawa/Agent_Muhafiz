import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/theme.dart';
import 'login_screen.dart';
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
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('IDENTITY VAULT', style: Theme.of(context).textTheme.labelLarge),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            _buildTrustScore(),
            const SizedBox(height: 40),
            _buildProfileHeader(),
            const SizedBox(height: 32),
            _buildDataBlade('CITIZENSHIP DATA', [
              {'label': 'LEGAL NAME', 'value': widget.user?['name'] ?? 'SOVEREIGN CITIZEN'},
              {'label': 'NIC NUMBER', 'value': _showNIC ? '42101-1234567-1' : 'XXXXX-XXXXXXX-X', 'action': () => setState(() => _showNIC = !_showNIC)},
              {'label': 'ACCOUNT ID', 'value': 'MUH-9928-AX'},
            ]),
            const SizedBox(height: 24),
            _buildDataBlade('GEOSPATIAL ANCHOR', [
              {'label': 'ASSIGNED SECTOR', 'value': 'GULSHAN-E-IQBAL, BLOCK 13'},
              {'label': 'COUNCIL HUB', 'value': 'DISTRICT EAST - HUB 4'},
            ]),
            const SizedBox(height: 40),
            _buildMenuSection(),
            const SizedBox(height: 40),
            _buildLogoutButton(),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildTrustScore() {
    return FadeInDown(
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: MuhafizTheme.surfaceSlate,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 80,
                  height: 80,
                  child: CircularProgressIndicator(
                    value: 0.85,
                    strokeWidth: 8,
                    backgroundColor: MuhafizTheme.backgroundSlate,
                    valueColor: const AlwaysStoppedAnimation<Color>(MuhafizTheme.primaryEmerald),
                  ),
                ),
                Text(
                  '85',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: MuhafizTheme.primaryEmerald,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 24),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('TRUST SCORE', style: Theme.of(context).textTheme.labelLarge),
                  const SizedBox(height: 4),
                  Text(
                    'REPUTATION LEVEL: VETERAN',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(color: MuhafizTheme.primaryEmerald),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Higher scores grant priority in crisis resource allocation.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader() {
    return FadeIn(
      child: Column(
        children: [
          CircleAvatar(
            radius: 50,
            backgroundColor: MuhafizTheme.primaryEmerald.withOpacity(0.1),
            child: Icon(LucideIcons.user2, size: 40, color: MuhafizTheme.primaryEmerald),
          ),
          const SizedBox(height: 16),
          Text(
            widget.user?['name']?.toUpperCase() ?? 'CITIZEN',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          Text(
            'ACTIVE SINCE MAY 2024',
            style: Theme.of(context).textTheme.labelSmall,
          ),
        ],
      ),
    );
  }

  Widget _buildDataBlade(String title, List<Map<String, dynamic>> items) {
    return FadeInUp(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(title, style: Theme.of(context).textTheme.labelSmall?.copyWith(letterSpacing: 2)),
          ),
          Container(
            decoration: BoxDecoration(
              color: MuhafizTheme.surfaceSlate,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: MuhafizTheme.mutedSlate.withOpacity(0.1)),
            ),
            child: Column(
              children: items.map((item) => Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: MuhafizTheme.mutedSlate.withOpacity(0.05))),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item['label'] as String, style: Theme.of(context).textTheme.labelSmall),
                        const SizedBox(height: 4),
                        Text(
                          item['value'] as String,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontFamily: 'JetBrains Mono',
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    if (item['action'] != null)
                      IconButton(
                        icon: const Icon(LucideIcons.eye, size: 18, color: MuhafizTheme.primaryEmerald),
                        onPressed: item['action'] as VoidCallback,
                      ),
                  ],
                ),
              )).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuSection() {
    final menuItems = [
      {'label': 'BIO-SECURITY LOGS', 'icon': LucideIcons.fingerprint},
      {'label': 'COUNCIL PERMISSIONS', 'icon': LucideIcons.key},
      {'label': 'ENCRYPTION SETTINGS', 'icon': LucideIcons.lock},
    ];

    return Column(
      children: menuItems.map((item) => ListTile(
        leading: Icon(item['icon'] as IconData, size: 20, color: MuhafizTheme.mutedSlate),
        title: Text(item['label'] as String, style: Theme.of(context).textTheme.labelMedium),
        trailing: const Icon(LucideIcons.chevronRight, size: 16),
        onTap: () {},
      )).toList(),
    );
  }

  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () {
          MuhafizFeedback.showToast("SESSION TERMINATED");
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (context) => const LoginScreen()),
            (route) => false,
          );
        },
        icon: const Icon(LucideIcons.logOut, size: 18),
        label: const Text('TERMINATE SESSION'),
        style: OutlinedButton.styleFrom(
          foregroundColor: MuhafizTheme.errorRed,
          side: const BorderSide(color: MuhafizTheme.errorRed),
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }
}
