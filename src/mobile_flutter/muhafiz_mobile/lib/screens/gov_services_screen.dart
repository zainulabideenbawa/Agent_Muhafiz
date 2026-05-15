import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../theme/theme.dart';

class GovServicesScreen extends StatelessWidget {
  const GovServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MuhafizTheme.darkBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FadeInDown(
                child: const Text('SOVEREIGN SERVICES', style: TextStyle(color: MuhafizTheme.emerald400, letterSpacing: 2, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 8),
              FadeInDown(
                delay: const Duration(milliseconds: 200),
                child: const Text('Government on Demand', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
              ),
              
              const SizedBox(height: 32),
              
              Expanded(
                child: GridView.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 1.1,
                  children: [
                    _AnimatedServiceCard(index: 0, label: 'Waste Pickup', icon: Icons.delete_outline, color: Colors.green, desc: 'Schedule Dispatch'),
                    _AnimatedServiceCard(index: 1, label: 'Water Tanker', icon: Icons.local_shipping_outlined, color: Colors.blue, desc: 'KWSB Booking'),
                    _AnimatedServiceCard(index: 2, label: 'Street Lights', icon: Icons.lightbulb_outline, color: Colors.amber, desc: 'Repair Request'),
                    _AnimatedServiceCard(index: 3, label: 'Birth Cert', icon: Icons.description_outlined, color: Colors.purple, desc: 'Apply for NIC'),
                    _AnimatedServiceCard(index: 4, label: 'Health Clinic', icon: Icons.medical_services_outlined, color: Colors.red, desc: 'Tele-Health'),
                    _AnimatedServiceCard(index: 5, label: 'Police Dispatch', icon: Icons.security, color: Colors.blueAccent, desc: 'Emergency Unit'),
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

class _AnimatedServiceCard extends StatelessWidget {
  final int index;
  final String label;
  final IconData icon;
  final Color color;
  final String desc;

  const _AnimatedServiceCard({required this.index, required this.label, required this.icon, required this.color, required this.desc});

  @override
  Widget build(BuildContext context) {
    return FadeInUp(
      delay: Duration(milliseconds: 400 + (index * 100)),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: MuhafizTheme.darkCard,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: MuhafizTheme.darkBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 24),
            ),
            const Spacer(),
            Text(label, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(desc, style: const TextStyle(color: MuhafizTheme.darkTextMuted, fontSize: 9)),
          ],
        ),
      ),
    );
  }
}
