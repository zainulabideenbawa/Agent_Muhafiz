import 'package:flutter/material.dart';
import 'voice_report_screen.dart';
import 'council_hub_screen.dart';
import '../theme/theme.dart';


class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              const Padding(
                padding: EdgeInsets.all(24.0),
                child: _DashboardHeader(),
              ),

              // Area Vitals
              const _SectionTitle(title: 'Area Vitals'),
              SizedBox(
                height: 160,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  children: const [
                    _VitalCard(
                      icon: '🌡️',
                      label: 'Temperature',
                      value: '34°C',
                      subtitle: 'Feels like 38°C',
                    ),
                    _VitalCard(
                      icon: '💧',
                      label: 'Water Timing',
                      value: '4:00 PM',
                      subtitle: 'Next Supply: Block 13',
                    ),
                    _VitalCard(
                      icon: '🚧',
                      label: 'Road Status',
                      value: 'Clear',
                      subtitle: 'Sharea Faisal',
                      statusColor: MuhafizTheme.emerald500,
                    ),
                  ],
                ),
              ),

              // Voice Report Hub
              const SizedBox(height: 32),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: MuhafizTheme.emerald900,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Need Assistance?',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Voice reports are processed instantly by the Muhafiz AI Council.',
                              style: TextStyle(
                                color: MuhafizTheme.emerald400.withOpacity(0.8),
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const VoiceReportScreen()),
                          );
                        },
                        child: Container(
                          width: 48,
                          height: 48,
                          decoration: const BoxDecoration(
                            color: MuhafizTheme.emerald500,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.mic, color: Colors.white),
                        ),
                      ),

                    ],
                  ),
                ),
              ),

              // Active Tracking
              const SizedBox(height: 32),
              const _SectionTitle(title: 'Active Report Tracking'),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const CouncilHubScreen()),
                    );
                  },
                  child: const _TrackingCard(),
                ),
              ),


              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.large(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const VoiceReportScreen()),
          );
        },
        backgroundColor: MuhafizTheme.emerald500,

        shape: const CircleBorder(),
        child: const Icon(Icons.mic, size: 36, color: Colors.white),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}

class _DashboardHeader extends StatelessWidget {
  const _DashboardHeader();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: MuhafizTheme.emerald500.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: MuhafizTheme.emerald500,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Agent Sentinel: Actively Monitoring Gulshan',
                style: TextStyle(
                  color: MuhafizTheme.emerald400,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Area Pulse',
          style: TextStyle(
            color: Colors.white,
            fontSize: 32,
            fontWeight: FontWeight.bold,
          ),
        ),
        const Text(
          'Karachi, East Sector',
          style: TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 16),
        ),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          color: MuhafizTheme.darkTextMuted,
          fontSize: 12,
          letterSpacing: 1.5,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _VitalCard extends StatelessWidget {
  final String icon;
  final String label;
  final String value;
  final String subtitle;
  final Color? statusColor;

  const _VitalCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.subtitle,
    this.statusColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 150,
      margin: const EdgeInsets.only(right: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: MuhafizTheme.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: MuhafizTheme.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(icon, style: const TextStyle(fontSize: 24)),
          const Spacer(),
          Text(
            label,
            style: const TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              color: statusColor ?? Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            subtitle,
            style: const TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 10),
          ),
        ],
      ),
    );
  }
}

class _TrackingCard extends StatelessWidget {
  const _TrackingCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: MuhafizTheme.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: MuhafizTheme.darkBorder),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '#MHFZ-2026-001',
                style: TextStyle(
                  color: Colors.white,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 12,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: MuhafizTheme.amber,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'Validating',
                  style: TextStyle(
                    color: Colors.black,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          // Simple horizontal stepper representation
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _Step(label: 'Reported', completed: true),
              _Step(label: 'Validating', active: true),
              _Step(label: 'Dispatched'),
              _Step(label: 'Resolved'),
            ],
          ),
        ],
      ),
    );
  }
}

class _Step extends StatelessWidget {
  final String label;
  final bool active;
  final bool completed;

  const _Step({required this.label, this.active = false, this.completed = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: completed ? MuhafizTheme.emerald500 : MuhafizTheme.darkBorder,
            border: active ? Border.all(color: MuhafizTheme.emerald500, width: 2) : null,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            color: active || completed ? Colors.white : MuhafizTheme.darkTextMuted,
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}
