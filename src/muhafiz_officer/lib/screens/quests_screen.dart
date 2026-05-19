import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';
import '../services/api_service.dart';
import 'ground_truth_screen.dart';

class QuestsScreen extends StatefulWidget {
  const QuestsScreen({super.key});

  @override
  State<QuestsScreen> createState() => _QuestsScreenState();
}

class _QuestsScreenState extends State<QuestsScreen> {
  List<Map<String, dynamic>> _quests = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final all = await ApiService.getIncidents();
      // Quests = incidents that are actively being investigated or need attention
      final quests = all.where((inc) {
        final status = (inc['status'] ?? '').toString().toUpperCase();
        return status == 'INVESTIGATING' ||
            status == 'PROCESSING' ||
            status == 'CONFIRMED' ||
            status == 'PENDING';
      }).toList();
      if (mounted) setState(() { _quests = quests; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _isLoading = false; _error = e.toString(); });
    }
  }

  Future<void> _acceptQuest(String incidentId) async {
    try {
      final ok = await ApiService.acceptQuest(incidentId);
      if (ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('QUEST ACCEPTED — STATUS: EN ROUTE',
              style: TextStyle(fontFamily: 'monospace')),
          backgroundColor: MuhafizTheme.sovereignGreen,
        ));
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('ERROR: $e', style: const TextStyle(fontFamily: 'monospace')),
          backgroundColor: MuhafizTheme.crisisRed,
        ));
      }
    }
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'CONFIRMED': return MuhafizTheme.crisisRed;
      case 'INVESTIGATING': return MuhafizTheme.sovereignGreen;
      case 'PROCESSING': return MuhafizTheme.cautionAmber;
      default: return MuhafizTheme.textSecondary;
    }
  }

  IconData _statusIcon(String status) {
    switch (status.toUpperCase()) {
      case 'CONFIRMED': return LucideIcons.alertOctagon;
      case 'INVESTIGATING': return LucideIcons.search;
      case 'PROCESSING': return LucideIcons.cpu;
      default: return LucideIcons.clock;
    }
  }

  String _timeAgo(String? iso) {
    if (iso == null) return '';
    try {
      final diff = DateTime.now().difference(DateTime.parse(iso));
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
    } catch (_) { return ''; }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MuhafizTheme.nightOpsBlack,
      body: Column(
        children: [
          SafeArea(
            bottom: false,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF0D182E),
                border: Border(
                  bottom: BorderSide(
                      color: MuhafizTheme.cautionAmber.withValues(alpha: 0.25)),
                ),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.shield,
                      color: MuhafizTheme.cautionAmber, size: 18),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('VERIFICATION QUESTS',
                            style: TextStyle(
                                color: Colors.white,
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                letterSpacing: 1)),
                        Text('Active field assignments',
                            style: TextStyle(
                                color: MuhafizTheme.textSecondary,
                                fontSize: 10)),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.refreshCw,
                        color: MuhafizTheme.cautionAmber, size: 18),
                    onPressed: _load,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                        color: MuhafizTheme.cautionAmber, strokeWidth: 2))
                : _error != null
                    ? _buildError()
                    : _quests.isEmpty
                        ? _buildEmpty()
                        : RefreshIndicator(
                            color: MuhafizTheme.cautionAmber,
                            onRefresh: _load,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(14),
                              itemCount: _quests.length,
                              itemBuilder: (_, i) => FadeInUp(
                                delay: Duration(milliseconds: i * 60),
                                child: _buildQuestCard(_quests[i]),
                              ),
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestCard(Map<String, dynamic> inc) {
    final status = (inc['status'] ?? 'PENDING').toString();
    final color = _statusColor(status);
    final conf = ((inc['confidence'] ?? 0.0) as num).toDouble();
    final dynamic data = inc['data'];
    final String summary = (data is Map
            ? (data['communication']?['push_notification']?['en'] ??
                data['raw_input'] ??
                '')
            : '')
        .toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: MuhafizTheme.tacticalGray,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.06),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(10)),
              border: Border(
                  bottom: BorderSide(color: MuhafizTheme.surfaceBorder)),
            ),
            child: Row(
              children: [
                Icon(_statusIcon(status), color: color, size: 15),
                const SizedBox(width: 8),
                Text(inc['incident_id'] ?? 'MHFZ-???',
                    style: TextStyle(
                        color: color,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                        fontSize: 13)),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                    border:
                        Border.all(color: color.withValues(alpha: 0.4)),
                  ),
                  child: Text(status,
                      style: TextStyle(
                          color: color,
                          fontSize: 8,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          // Body
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(LucideIcons.zap,
                        color: MuhafizTheme.cautionAmber, size: 12),
                    const SizedBox(width: 6),
                    Text(
                      (inc['type'] ?? 'UNKNOWN').toString().toUpperCase(),
                      style: const TextStyle(
                          color: Colors.white,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                          fontSize: 14),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(LucideIcons.mapPin,
                        color: MuhafizTheme.crisisRed, size: 12),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(inc['location'] ?? 'ANALYZING...',
                          style: const TextStyle(
                              color: MuhafizTheme.textSecondary,
                              fontSize: 12)),
                    ),
                  ],
                ),
                if (summary.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(summary,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                          height: 1.4)),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    if (conf > 0) ...[
                      const Icon(LucideIcons.radio,
                          color: MuhafizTheme.sovereignGreen, size: 11),
                      const SizedBox(width: 4),
                      Text('${(conf * 100).toInt()}% CONF',
                          style: const TextStyle(
                              color: MuhafizTheme.sovereignGreen,
                              fontSize: 10,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold)),
                      const SizedBox(width: 12),
                    ],
                    Text(_timeAgo(inc['created_at']?.toString()),
                        style: const TextStyle(
                            color: MuhafizTheme.textSecondary,
                            fontSize: 9,
                            fontFamily: 'monospace')),
                    const Spacer(),
                    // Accept quest if not yet investigating
                    if (status.toUpperCase() != 'INVESTIGATING')
                      SizedBox(
                        height: 30,
                        child: ElevatedButton.icon(
                          onPressed: () =>
                              _acceptQuest(inc['incident_id'] ?? ''),
                          icon: const Icon(LucideIcons.checkCircle, size: 12),
                          label: const Text('ACCEPT',
                              style: TextStyle(
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: MuhafizTheme.cautionAmber,
                            foregroundColor: Colors.black,
                            padding:
                                const EdgeInsets.symmetric(horizontal: 10),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(6)),
                            elevation: 0,
                          ),
                        ),
                      ),
                    const SizedBox(width: 8),
                    SizedBox(
                      height: 30,
                      child: OutlinedButton.icon(
                        onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) =>
                                    GroundTruthScreen(incident: inc))),
                        icon: const Icon(LucideIcons.externalLink, size: 12),
                        label: const Text('AUDIT',
                            style: TextStyle(
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                                fontSize: 10)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: MuhafizTheme.sovereignGreen,
                          side: const BorderSide(
                              color: MuhafizTheme.sovereignGreen),
                          padding:
                              const EdgeInsets.symmetric(horizontal: 10),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(6)),
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

  Widget _buildEmpty() {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(LucideIcons.shieldCheck,
              color: MuhafizTheme.cautionAmber, size: 48),
          SizedBox(height: 16),
          Text('NO ACTIVE QUESTS',
              style: TextStyle(
                  color: MuhafizTheme.cautionAmber,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  letterSpacing: 1.5)),
          SizedBox(height: 8),
          Text('All incidents are resolved or unassigned.',
              style: TextStyle(
                  color: MuhafizTheme.textSecondary, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(LucideIcons.wifiOff,
              color: MuhafizTheme.crisisRed, size: 36),
          const SizedBox(height: 12),
          const Text('SERVER UNREACHABLE',
              style: TextStyle(
                  color: MuhafizTheme.crisisRed,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: _load,
            icon: const Icon(LucideIcons.refreshCw, size: 14),
            label: const Text('RETRY'),
            style: ElevatedButton.styleFrom(
              backgroundColor: MuhafizTheme.cautionAmber,
              foregroundColor: Colors.black,
            ),
          ),
        ],
      ),
    );
  }
}
