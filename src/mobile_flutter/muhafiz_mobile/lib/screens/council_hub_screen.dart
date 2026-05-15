import 'package:flutter/material.dart';
import '../theme/theme.dart';

class CouncilHubScreen extends StatelessWidget {
  const CouncilHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Council Hub',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Services & Governance',
                      style: TextStyle(color: MuhafizTheme.emerald400, fontSize: 16),
                    ),
                  ],
                ),
              ),

              // Events
              const _SectionTitle(title: 'City Pulse: Verified Events'),
              SizedBox(
                height: 220,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  children: const [
                    _EventCard(
                      title: 'Flower Show',
                      location: 'Frere Hall',
                      date: 'May 18',
                      emoji: '🌸',
                    ),
                    _EventCard(
                      title: 'Dengue Spray Drive',
                      location: 'Gulshan Sector',
                      date: 'May 19',
                      emoji: '🦟',
                      priority: true,
                    ),
                  ],
                ),
              ),

              // Booking Grid
              const SizedBox(height: 32),
              const _SectionTitle(title: 'Book Government Facilities'),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 1.2,
                  children: const [
                    _BookingTile(icon: '🏛️', label: 'Community Center'),
                    _BookingTile(icon: '⚽', label: 'Sports Ground'),
                    _BookingTile(icon: '🚛', label: 'Water Tanker', active: true),
                    _BookingTile(icon: '🚑', label: 'Emergency Health'),
                  ],
                ),
              ),

              // Quick Booking
              const SizedBox(height: 32),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: MuhafizTheme.darkCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: MuhafizTheme.darkBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Request Water Tanker',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: _PickerStub(label: 'Select Date', value: 'May 16, 2026'),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _PickerStub(label: 'Slot', value: '10 AM - 2 PM'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            backgroundColor: MuhafizTheme.emerald600,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: const Text(
                            'Confirm Booking',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
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

class _EventCard extends StatelessWidget {
  final String title;
  final String location;
  final String date;
  final String emoji;
  final bool priority;

  const _EventCard({
    required this.title,
    required this.location,
    required this.date,
    required this.emoji,
    this.priority = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 260,
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
        color: MuhafizTheme.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: priority ? MuhafizTheme.emerald500 : MuhafizTheme.darkBorder,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 120,
            width: double.infinity,
            decoration: const BoxDecoration(
              color: MuhafizTheme.emerald950,
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Center(
              child: Text(emoji, style: const TextStyle(fontSize: 50)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
                Text(
                  location,
                  style: const TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 12),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      date,
                      style: const TextStyle(
                        color: MuhafizTheme.emerald400,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: MuhafizTheme.emerald500.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        '✓ Truth-Engine',
                        style: TextStyle(
                          color: MuhafizTheme.emerald400,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BookingTile extends StatelessWidget {
  final String icon;
  final String label;
  final bool active;

  const _BookingTile({required this.icon, required this.label, this.active = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: MuhafizTheme.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: active ? MuhafizTheme.emerald500 : MuhafizTheme.darkBorder,
        ),
      ),
      child: Stack(
        children: [
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(icon, style: const TextStyle(fontSize: 24)),
                const SizedBox(height: 8),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          if (active)
            const Positioned(
              top: 0,
              right: 0,
              child: CircleAvatar(radius: 3, backgroundColor: MuhafizTheme.emerald500),
            ),
        ],
      ),
    );
  }
}

class _PickerStub extends StatelessWidget {
  final String label;
  final String value;
  const _PickerStub({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 10),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}
