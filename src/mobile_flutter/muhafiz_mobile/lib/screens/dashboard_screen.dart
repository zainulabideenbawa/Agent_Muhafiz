import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:animate_do/animate_do.dart';
import 'voice_report_screen.dart';
import 'council_hub_screen.dart';
import 'gov_services_screen.dart';
import 'profile_screen.dart';

import '../services/socket_service.dart';
import '../widgets/feedback_widgets.dart';
import '../theme/theme.dart';

class DashboardScreen extends StatefulWidget {
  final Map<String, dynamic>? user;
  const DashboardScreen({super.key, this.user});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;
  Map<String, dynamic>? areaData;
  List<Map<String, dynamic>> liveTraces = [];
  String currentStatus = "CONNECTING";
  final ScrollController _traceScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _connectToPulse();
  }

  void _connectToPulse() {
    final host = Platform.isAndroid ? '10.0.2.2' : 'localhost';
    SocketService.connect('http://$host:3001', (data) {
      if (mounted) {
        setState(() {
          liveTraces.insert(0, data);
          currentStatus = "LIVE";
          if (liveTraces.length > 20) liveTraces.removeLast();
        });
      }
    });

    _fetchAreaVitals();
  }


  void _fetchAreaVitals() async {
    final sector = widget.user?['living_sector'] ?? 'GULSHAN';
    final host = Platform.isAndroid ? '10.0.2.2' : 'localhost';
    try {
      final res = await http.get(Uri.parse('http://$host:3001/api/area/pulse/$sector'));
      if (res.statusCode == 200) {
        setState(() => areaData = jsonDecode(res.body));
      }
    } catch (e) {
      print("Vitals Error: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MuhafizTheme.darkBg,
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          _HomeTab(user: widget.user, areaData: areaData, liveTraces: liveTraces, currentStatus: currentStatus),
          CouncilHubScreen(user: widget.user),
          const GovServicesScreen(),
          ProfileScreen(user: widget.user),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: MuhafizTheme.darkBorder, width: 0.5)),
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: (index) => setState(() => _selectedIndex = index),
          backgroundColor: MuhafizTheme.darkBg,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: MuhafizTheme.emerald400,
          unselectedItemColor: MuhafizTheme.darkTextMuted,
          selectedLabelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
          unselectedLabelStyle: const TextStyle(fontSize: 10),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.analytics_outlined), label: 'PULSE'),
            BottomNavigationBarItem(icon: Icon(Icons.gavel_outlined), label: 'COUNCIL'),
            BottomNavigationBarItem(icon: Icon(Icons.grid_view_outlined), label: 'SERVICES'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'PROFILE'),
          ],
        ),
      ),
      floatingActionButton: _selectedIndex == 0 ? FloatingActionButton(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const VoiceReportScreen())),
        backgroundColor: MuhafizTheme.emerald500,
        child: const Icon(Icons.mic, color: Colors.white),
      ) : null,
    );
  }
}

class _HomeTab extends StatelessWidget {
  final Map<String, dynamic>? user;
  final Map<String, dynamic>? areaData;
  final List<Map<String, dynamic>> liveTraces;
  final String currentStatus;

  const _HomeTab({this.user, this.areaData, required this.liveTraces, required this.currentStatus});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 140,
          backgroundColor: MuhafizTheme.darkBg,
          floating: true,
          flexibleSpace: FlexibleSpaceBar(
            titlePadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            title: FadeInDown(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('GOOD MORNING,', style: TextStyle(color: MuhafizTheme.emerald400, fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.bold)),
                  Text(user?['name']?.toUpperCase() ?? 'CITIZEN', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 24, top: 16),
              child: _StatusBadge(status: currentStatus),
            ),
          ],
        ),

        const SliverPadding(
          padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          sliver: SliverToBoxAdapter(child: _SectionTitle(title: 'CITY VITALS')),
        ),

        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          sliver: areaData == null 
            ? SliverToBoxAdapter(
                child: SizedBox(
                  height: 120,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: List.generate(4, (i) => MuhafizFeedback.skeletonCard()),
                  ),
                ),
              )
            : SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 1.4,
                ),
                delegate: SliverChildListDelegate([
                  _VitalsCard(label: 'Water Supply', value: areaData?['vitals']?['water_timing'] ?? '--:--', icon: Icons.water_drop, color: Colors.blue),
                  _VitalsCard(label: 'Road Status', value: 'Clear', icon: Icons.traffic, color: Colors.orange),
                  _VitalsCard(label: 'Air Quality', value: '74 AQI', icon: Icons.air, color: Colors.green),
                  _VitalsCard(label: 'Power Grid', value: 'Stable', icon: Icons.bolt, color: Colors.amber),
                ]),
              ),
        ),

        const SliverPadding(
          padding: EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          sliver: SliverToBoxAdapter(child: _SectionTitle(title: 'LIVE AGENT REASONING')),
        ),

        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          sliver: SliverToBoxAdapter(
            child: Container(
              height: 300,
              decoration: BoxDecoration(
                color: MuhafizTheme.darkCard,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: MuhafizTheme.darkBorder),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 40, offset: const Offset(0, 20)),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: liveTraces.isEmpty
                  ? _EmptyTraces()
                  : ListView.builder(
                      padding: const EdgeInsets.all(20),
                      itemCount: liveTraces.length,
                      itemBuilder: (context, index) => FadeInLeft(
                        delay: Duration(milliseconds: index * 50),
                        child: _TraceItem(trace: liveTraces[index]),
                      ),
                    ),
              ),
            ),
          ),
        ),
        
        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ],
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: MuhafizTheme.emerald500.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: MuhafizTheme.emerald500.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(color: MuhafizTheme.emerald500, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Text(status, style: const TextStyle(color: MuhafizTheme.emerald500, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
        ],
      ),
    );
  }
}

class _VitalsCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _VitalsCard({required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: MuhafizTheme.darkCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: MuhafizTheme.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const Spacer(),
          Text(label, style: const TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 10, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

class _TraceItem extends StatelessWidget {
  final Map<String, dynamic> trace;
  const _TraceItem({required this.trace});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '[${trace['agent']?.toString().toUpperCase() ?? 'SYS'}]',
            style: const TextStyle(color: MuhafizTheme.emerald400, fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: FontWeight.bold),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              trace['message'] ?? '...',
              style: const TextStyle(color: Colors.white, fontSize: 11, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(title, style: const TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.bold));
  }
}

class _EmptyTraces extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.sensors_outlined, color: MuhafizTheme.darkBorder, size: 40),
          const SizedBox(height: 16),
          const Text('LISTENING FOR COUNCIL TRACES...', style: TextStyle(color: MuhafizTheme.darkBorder, fontSize: 10, letterSpacing: 1)),
        ],
      ),
    );
  }
}
