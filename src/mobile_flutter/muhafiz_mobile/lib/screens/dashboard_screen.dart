import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/theme.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
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

class _SentinelPulseTab extends StatefulWidget {
  final Map<String, dynamic>? user;
  const _SentinelPulseTab({super.key, this.user});

  @override
  State<_SentinelPulseTab> createState() => _SentinelPulseTabState();
}

class _SentinelPulseTabState extends State<_SentinelPulseTab> {
  final List<Map<String, String>> _logs = [
    {'agent': 'SYS', 'msg': 'PROTOCOL MUHAFIZ-X ACTIVE.'},
    {'agent': 'SENTNL', 'msg': 'SENTINEL ENGINE RUNNING. STANDBY FOR TELEMETRY...'},
  ];

  Map<String, dynamic>? _activeAlert;
  bool _showAlert = false;

  @override
  void initState() {
    super.initState();
    // Connect to standard WebSockets using ApiService dynamic wsUrl
    SocketService.connect(ApiService.wsUrl);
    SocketService.addListener(_handleSocketMessage);
  }

  @override
  void dispose() {
    SocketService.removeListener(_handleSocketMessage);
    super.dispose();
  }

  void _handleSocketMessage(Map<String, dynamic> message) {
    if (!mounted) return;

    final type = message['type'];
    if (type == 'TRACE_LOG') {
      final log = message['log'];
      if (log != null) {
        final String agent = log['agent']?.toString().toUpperCase() ?? 'AGENT';
        String shortAgent = agent;
        if (agent.contains('ANALYST')) shortAgent = 'ANALST';
        if (agent.contains('ORACLE')) shortAgent = 'ORACLE';
        if (agent.contains('COMMUNICATOR')) shortAgent = 'COMM';
        if (agent.contains('DISPATCHER')) shortAgent = 'DISP';

        setState(() {
          _logs.insert(0, {
            'agent': shortAgent,
            'msg': log['message']?.toString().toUpperCase() ?? '',
          });
          if (_logs.length > 25) {
            _logs.removeLast();
          }
        });
      }
    } else if (type == 'COMMUNICATION_ALERT') {
      final data = message['data'];
      final assignedDept = message['assigned_department'] ?? 'GOVERNMENT DEFENSE';
      if (data != null) {
        setState(() {
          _activeAlert = {
            'dept': assignedDept,
            'scope': data['scope'] ?? 'LOCAL',
            'push_en': data['push_notification']?['en'] ?? 'Emergency crisis alert broadcasted near your sector.',
            'push_ur': data['push_notification']?['ur'] ?? 'آپ کے علاقے میں ہنگامی صورتحال کا الرٹ جاری کیا گیا ہے۔',
            'whatsapp_en': data['whatsapp_draft']?['en'] ?? '',
            'whatsapp_ur': data['whatsapp_draft']?['ur'] ?? '',
          };
          _showAlert = true;
        });
      }
    }
  }

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
                if (_showAlert && _activeAlert != null) ...[
                  _buildGovernmentAlertCard(),
                  const SizedBox(height: 24),
                ],
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

  Widget _buildGovernmentAlertCard() {
    final alert = _activeAlert!;
    return FadeInDown(
      duration: const Duration(milliseconds: 500),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.red.withOpacity(0.15),
              Colors.orange.withOpacity(0.05),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: Colors.red.withOpacity(0.5), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.red.withOpacity(0.15),
              blurRadius: 16,
              spreadRadius: 2,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Pulse(
                  infinite: true,
                  duration: const Duration(seconds: 2),
                  child: const Icon(LucideIcons.alertTriangle, color: Colors.red, size: 20),
                ),
                const SizedBox(width: 10),
                const Text(
                  'CRISIS ALERT',
                  style: TextStyle(
                    color: Colors.red,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                    fontSize: 12,
                    fontFamily: 'JetBrains Mono',
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(2),
                  ),
                  child: Text(
                    alert['scope'].toString().toUpperCase(),
                    style: const TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              alert['push_en'] ?? '',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 15,
                height: 1.3,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
                border: Border.all(color: Colors.red.withOpacity(0.15)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(LucideIcons.volume2, color: Colors.redAccent, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      alert['push_ur'] ?? '',
                      textDirection: TextDirection.rtl,
                      style: const TextStyle(
                        color: Colors.redAccent,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        height: 1.6,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'DEPT: ${alert['dept'].toString().toUpperCase()}',
                    style: const TextStyle(
                      color: MuhafizTheme.darkTextMuted,
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Row(
                  children: [
                    TextButton(
                      onPressed: () {
                        setState(() => _showAlert = false);
                      },
                      child: const Text(
                        'DISMISS',
                        style: TextStyle(
                          color: MuhafizTheme.darkTextMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'JetBrains Mono',
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    ElevatedButton.icon(
                      onPressed: () {
                        _showWhatsAppDraftDialog(context, alert);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      icon: const Icon(LucideIcons.messageSquare, size: 12),
                      label: const Text(
                        'VIEW WIRE',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'JetBrains Mono',
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showWhatsAppDraftDialog(BuildContext context, Map<String, dynamic> alert) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0C162D),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
          side: const BorderSide(color: Colors.redAccent, width: 1.5),
        ),
        title: const Row(
          children: [
            Icon(LucideIcons.messageSquare, color: Colors.greenAccent, size: 20),
            SizedBox(width: 10),
            Text(
              'OFFICIAL GOVT WIRE',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
                fontFamily: 'JetBrains Mono',
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'ENGLISH BROADCAST:',
                style: TextStyle(
                  color: Colors.greenAccent,
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono',
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                alert['whatsapp_en'] ?? '',
                style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.4),
              ),
              const Divider(color: Colors.white10, height: 24),
              const Text(
                'URDU BROADCAST (اردو نشریات):',
                style: TextStyle(
                  color: Colors.greenAccent,
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono',
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                alert['whatsapp_ur'] ?? '',
                textDirection: TextDirection.rtl,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  height: 1.6,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'CLOSE',
              style: TextStyle(
                color: Colors.greenAccent,
                fontFamily: 'JetBrains Mono',
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
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
                widget.user?['name']?.toUpperCase() ?? 'CITIZEN',
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
    final hasAlert = _showAlert && _activeAlert != null;
    final vitals = [
      {
        'label': 'AIR QUALITY',
        'value': hasAlert ? '142 AQI (POOR)' : '74 AQI',
        'icon': LucideIcons.wind,
        'color': hasAlert ? Colors.orange : Colors.green
      },
      {
        'label': 'POWER GRID',
        'value': hasAlert ? 'GRID PRESSURE' : 'STABLE',
        'icon': LucideIcons.zap,
        'color': hasAlert ? Colors.redAccent : Colors.amber
      },
      {
        'label': 'WATER LEVEL',
        'value': 'OPTIMAL',
        'icon': LucideIcons.droplets,
        'color': Colors.blue
      },
      {
        'label': 'SECURITY',
        'value': hasAlert ? 'HIGH ALERT' : 'SECURE',
        'icon': hasAlert ? LucideIcons.shieldAlert : LucideIcons.shieldCheck,
        'color': hasAlert ? Colors.red : MuhafizTheme.primaryEmerald
      },
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
                border: Border.all(
                  color: hasAlert && (item['label'] == 'SECURITY' || item['label'] == 'POWER GRID')
                      ? Colors.red.withOpacity(0.3)
                      : MuhafizTheme.primaryEmerald.withOpacity(0.1),
                ),
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
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF060E20),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.2)),
      ),
      child: Column(
        children: _logs.map((log) => Padding(
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
