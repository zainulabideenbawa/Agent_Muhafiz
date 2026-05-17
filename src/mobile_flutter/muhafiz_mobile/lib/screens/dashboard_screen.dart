import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/theme.dart';
import 'voice_report_screen.dart';
import 'profile_screen.dart';
import 'council_hub_screen.dart';
import 'gov_services_screen.dart';
import 'safe_routes_map_screen.dart';

class DashboardScreen extends StatefulWidget {
  final Map<String, dynamic>? user;
  const DashboardScreen({super.key, this.user});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          _SentinelPulseTab(user: widget.user),
          const SafeRoutesMapScreen(),
          const CouncilHubScreen(),
          const GovServicesScreen(),
          ProfileScreen(user: widget.user),
        ],
      ),
      bottomNavigationBar: _buildBottomNav(),
      floatingActionButton: _selectedIndex == 0
          ? FloatingActionButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const VoiceReportScreen()),
              ),
              backgroundColor: MuhafizTheme.primaryEmerald,
              elevation: 12,
              child: const Icon(LucideIcons.mic, color: Color(0xFF003824)),
            )
          : null,
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: MuhafizTheme.primaryEmerald.withOpacity(0.1))),
      ),
      child: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        type: BottomNavigationBarType.fixed,
        backgroundColor: MuhafizTheme.backgroundSlate,
        selectedItemColor: MuhafizTheme.primaryEmerald,
        unselectedItemColor: MuhafizTheme.mutedSlate,
        selectedLabelStyle: Theme.of(context).textTheme.labelSmall?.copyWith(color: MuhafizTheme.primaryEmerald),
        unselectedLabelStyle: Theme.of(context).textTheme.labelSmall,
        items: const [
          BottomNavigationBarItem(icon: Icon(LucideIcons.activity, size: 20), label: 'PULSE'),
          BottomNavigationBarItem(icon: Icon(LucideIcons.navigation, size: 20), label: 'EVAC'),
          BottomNavigationBarItem(icon: Icon(LucideIcons.users, size: 20), label: 'COUNCIL'),
          BottomNavigationBarItem(icon: Icon(LucideIcons.layoutGrid, size: 20), label: 'HUB'),
          BottomNavigationBarItem(icon: Icon(LucideIcons.shield, size: 20), label: 'VAULT'),
        ],
      ),
    );
  }
}

class _SentinelPulseTab extends StatelessWidget {
  final Map<String, dynamic>? user;
  const _SentinelPulseTab({this.user});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        _buildAppBar(context),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionHeader(context, 'AREA VITALS', 'SECTOR: GULSHAN-E-IQBAL'),
                const SizedBox(height: 16),
                _buildVitalsScroll(),
                const SizedBox(height: 40),
                _buildSectionHeader(context, 'SOVEREIGN BROADCAST', 'LIVE AGENT TELEMETRY'),
                const SizedBox(height: 16),
                _buildTerminalFeed(),
                const SizedBox(height: 100),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return SliverAppBar(
      expandedHeight: 120,
      floating: true,
      backgroundColor: MuhafizTheme.backgroundSlate,
      flexibleSpace: FlexibleSpaceBar(
        background: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'WELCOME BACK,',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(color: MuhafizTheme.primaryEmerald),
              ),
              const SizedBox(height: 4),
              Text(
                user?['name']?.toUpperCase() ?? 'CITIZEN',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
            ],
          ),
        ),
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 24, top: 16),
          child: _StatusIndicator(),
        ),
      ],
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title, String subtitle) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.labelLarge),
            Text(subtitle, style: Theme.of(context).textTheme.labelSmall),
          ],
        ),
        Icon(LucideIcons.chevronRight, color: MuhafizTheme.primaryEmerald, size: 16),
      ],
    );
  }

  Widget _buildVitalsScroll() {
    final vitals = [
      {'label': 'AIR QUALITY', 'value': '74 AQI', 'icon': LucideIcons.wind, 'color': Colors.green},
      {'label': 'POWER GRID', 'value': 'STABLE', 'icon': LucideIcons.zap, 'color': Colors.amber},
      {'label': 'WATER LEVEL', 'value': 'OPTIMAL', 'icon': LucideIcons.droplets, 'color': Colors.blue},
      {'label': 'SECURITY', 'value': 'LOCKED', 'icon': LucideIcons.shieldCheck, 'color': MuhafizTheme.primaryEmerald},
    ];

    return SizedBox(
      height: 140,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: vitals.length,
        itemBuilder: (context, index) {
          final item = vitals[index];
          return FadeInRight(
            delay: Duration(milliseconds: index * 100),
            child: Container(
              width: 140,
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: MuhafizTheme.surfaceSlate,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.1)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(item['icon'] as IconData, color: item['color'] as Color, size: 20),
                  const Spacer(),
                  Text(item['label'] as String, style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 4),
                  Text(item['value'] as String, style: Theme.of(context).textTheme.labelLarge),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTerminalFeed() {
    final logs = [
      {'agent': 'ANALST', 'msg': 'DETECTED ABNORMAL HEAT SIGNATURE IN SECTOR 4.'},
      {'agent': 'ORACLE', 'msg': 'CROSS-REFERENCING WITH SOCIAL MEDIA TRENDS...'},
      {'agent': 'SENTNL', 'msg': 'DISPATCHING VERIFICATION QUEST TO NEARBY OFFICER.'},
      {'agent': 'SYS', 'msg': 'PROTOCOL MUHAFIZ-X ACTIVE.'},
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF060E20),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.2)),
      ),
      child: Column(
        children: logs.map((log) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '[${log['agent']}]',
                style: const TextStyle(
                  color: MuhafizTheme.primaryEmerald,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  log['msg']!,
                  style: const TextStyle(
                    color: MuhafizTheme.onSurface,
                    fontFamily: 'JetBrains Mono',
                    fontSize: 11,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        )).toList(),
      ),
    );
  }
}

class _StatusIndicator extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: MuhafizTheme.primaryEmerald.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(
              color: MuhafizTheme.primaryEmerald,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: MuhafizTheme.primaryEmerald, blurRadius: 4),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'SYSTEM LIVE',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: MuhafizTheme.primaryEmerald,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
