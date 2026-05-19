import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';
import '../services/api_service.dart';

class AuditScreen extends StatefulWidget {
  const AuditScreen({super.key});

  @override
  State<AuditScreen> createState() => _AuditScreenState();
}

class _AuditScreenState extends State<AuditScreen>
    with SingleTickerProviderStateMixin {
  List<Map<String, dynamic>> _tasks = [];
  bool _isLoading = true;
  String? _error;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final tasks = await ApiService.getTasks();
      if (mounted) setState(() { _tasks = tasks; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _isLoading = false; _error = e.toString(); });
    }
  }

  Future<void> _resolveTask(Map<String, dynamic> task) async {
    final summaryController = TextEditingController(
      text: 'Task completed by field officer.',
    );
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F1B35),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(
              color: MuhafizTheme.sovereignGreen.withValues(alpha: 0.4)),
        ),
        title: const Row(
          children: [
            Icon(LucideIcons.checkCircle,
                color: MuhafizTheme.sovereignGreen, size: 16),
            SizedBox(width: 8),
            Text('RESOLVE TASK',
                style: TextStyle(
                    color: MuhafizTheme.sovereignGreen,
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.bold,
                    fontSize: 13)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(task['mission_objective'] ?? 'Mission task',
                style: const TextStyle(
                    color: Colors.white70, fontSize: 12)),
            const SizedBox(height: 12),
            TextField(
              controller: summaryController,
              maxLines: 3,
              style: const TextStyle(
                  color: Colors.white, fontFamily: 'monospace', fontSize: 12),
              decoration: InputDecoration(
                hintText: 'Resolution summary...',
                hintStyle: const TextStyle(color: MuhafizTheme.textSecondary),
                filled: true,
                fillColor: Colors.black38,
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide:
                        const BorderSide(color: MuhafizTheme.surfaceBorder)),
                enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide:
                        const BorderSide(color: MuhafizTheme.surfaceBorder)),
                focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide: const BorderSide(
                        color: MuhafizTheme.sovereignGreen)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('CANCEL',
                style: TextStyle(color: MuhafizTheme.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: MuhafizTheme.sovereignGreen,
              foregroundColor: Colors.black,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('MARK RESOLVED',
                style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final messenger = ScaffoldMessenger.of(context);
      try {
        await ApiService.updateTaskStatus(
            task['task_id'] ?? '', 'RESOLVED', summaryController.text.trim());
        messenger.showSnackBar(const SnackBar(
          content: Text('TASK RESOLVED — ARCHIVED',
              style: TextStyle(fontFamily: 'monospace')),
          backgroundColor: MuhafizTheme.sovereignGreen,
        ));
        _load();
      } catch (e) {
        messenger.showSnackBar(SnackBar(
          content: Text('ERROR: $e',
              style: const TextStyle(fontFamily: 'monospace')),
          backgroundColor: MuhafizTheme.crisisRed,
        ));
      }
    }
  }

  List<Map<String, dynamic>> _filtered(String filter) {
    if (filter == 'ALL') return _tasks;
    return _tasks
        .where((t) =>
            (t['status'] ?? '').toString().toUpperCase() == filter)
        .toList();
  }

  Color _taskColor(String status) {
    switch (status.toUpperCase()) {
      case 'ON_SCENE': return MuhafizTheme.crisisRed;
      case 'RESOLVED': return MuhafizTheme.sovereignGreen;
      case 'ANALYSIS': return MuhafizTheme.cautionAmber;
      case 'ASSIGNED': return Colors.blueAccent;
      default: return MuhafizTheme.textSecondary;
    }
  }

  IconData _taskIcon(String status) {
    switch (status.toUpperCase()) {
      case 'ON_SCENE': return LucideIcons.siren;
      case 'RESOLVED': return LucideIcons.checkCircle;
      case 'ANALYSIS': return LucideIcons.barChart2;
      case 'ASSIGNED': return LucideIcons.userCheck;
      default: return LucideIcons.clock;
    }
  }

  @override
  Widget build(BuildContext context) {
    final active = _filtered('ON_SCENE').length + _filtered('ASSIGNED').length;

    return Scaffold(
      backgroundColor: MuhafizTheme.nightOpsBlack,
      body: Column(
        children: [
          SafeArea(
            bottom: false,
            child: Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              decoration: BoxDecoration(
                color: const Color(0xFF0D182E),
                border: Border(
                  bottom: BorderSide(
                      color: MuhafizTheme.sovereignGreen.withValues(alpha: 0.2)),
                ),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Icon(LucideIcons.clipboardList,
                          color: MuhafizTheme.sovereignGreen, size: 18),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('MISSION AUDIT',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontFamily: 'monospace',
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                    letterSpacing: 1)),
                            Text('$active active tasks · ${_tasks.length} total',
                                style: const TextStyle(
                                    color: MuhafizTheme.textSecondary,
                                    fontSize: 10)),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.refreshCw,
                            color: MuhafizTheme.sovereignGreen, size: 18),
                        onPressed: _load,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TabBar(
                    controller: _tabController,
                    indicatorColor: MuhafizTheme.sovereignGreen,
                    labelColor: MuhafizTheme.sovereignGreen,
                    unselectedLabelColor: MuhafizTheme.textSecondary,
                    labelStyle: const TextStyle(
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                        letterSpacing: 1),
                    tabs: [
                      Tab(text: 'ALL (${_tasks.length})'),
                      Tab(text: 'ACTIVE ($active)'),
                      Tab(
                          text:
                              'RESOLVED (${_filtered('RESOLVED').length})'),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                        color: MuhafizTheme.sovereignGreen, strokeWidth: 2))
                : _error != null
                    ? _buildError()
                    : TabBarView(
                        controller: _tabController,
                        children: [
                          _buildTaskList(_filtered('ALL')),
                          _buildTaskList([
                            ..._filtered('ON_SCENE'),
                            ..._filtered('ASSIGNED'),
                            ..._filtered('ANALYSIS'),
                          ]),
                          _buildTaskList(_filtered('RESOLVED')),
                        ],
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildTaskList(List<Map<String, dynamic>> tasks) {
    if (tasks.isEmpty) {
      return const Center(
        child: Text('NO TASKS IN THIS CATEGORY',
            style: TextStyle(
                color: MuhafizTheme.textSecondary,
                fontFamily: 'monospace',
                fontSize: 11)),
      );
    }
    return RefreshIndicator(
      color: MuhafizTheme.sovereignGreen,
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(14),
        itemCount: tasks.length,
        itemBuilder: (_, i) => FadeInUp(
          delay: Duration(milliseconds: i * 50),
          child: _buildTaskCard(tasks[i]),
        ),
      ),
    );
  }

  Widget _buildTaskCard(Map<String, dynamic> task) {
    final status = (task['status'] ?? 'INGESTED').toString();
    final color = _taskColor(status);
    final bool isResolved = status.toUpperCase() == 'RESOLVED';
    final int priority = (task['priority_level'] as num? ?? 1).toInt();

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: MuhafizTheme.tacticalGray,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
            color: isResolved
                ? MuhafizTheme.surfaceBorder
                : color.withValues(alpha: 0.35)),
        boxShadow: isResolved
            ? null
            : [
                BoxShadow(
                    color: color.withValues(alpha: 0.06),
                    blurRadius: 10,
                    spreadRadius: 2),
              ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(_taskIcon(status), color: color, size: 14),
                const SizedBox(width: 8),
                Text(task['task_id'] ?? 'TSK-???',
                    style: TextStyle(
                        color: color,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                        fontSize: 12)),
                const Spacer(),
                // Priority badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: _priorityColor(priority).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color:
                            _priorityColor(priority).withValues(alpha: 0.4)),
                  ),
                  child: Text('P$priority',
                      style: TextStyle(
                          color: _priorityColor(priority),
                          fontSize: 8,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 6),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
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
            const SizedBox(height: 10),
            Text(task['mission_objective'] ?? 'No objective specified',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    height: 1.3)),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(LucideIcons.link,
                    color: MuhafizTheme.textSecondary, size: 10),
                const SizedBox(width: 5),
                Text(task['incident_ref'] ?? '—',
                    style: const TextStyle(
                        color: MuhafizTheme.textSecondary,
                        fontFamily: 'monospace',
                        fontSize: 10)),
                const SizedBox(width: 12),
                const Icon(LucideIcons.user,
                    color: MuhafizTheme.textSecondary, size: 10),
                const SizedBox(width: 5),
                Text(task['assigned_agent'] ?? '—',
                    style: const TextStyle(
                        color: MuhafizTheme.textSecondary,
                        fontSize: 10)),
              ],
            ),
            if (task['resolution_summary'] != null &&
                (task['resolution_summary'] as String).isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.black26,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: MuhafizTheme.surfaceBorder),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(LucideIcons.fileText,
                        color: MuhafizTheme.sovereignGreen, size: 11),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(task['resolution_summary'].toString(),
                          style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                              height: 1.4)),
                    ),
                  ],
                ),
              ),
            ],
            if (!isResolved) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 36,
                child: ElevatedButton.icon(
                  onPressed: () => _resolveTask(task),
                  icon: const Icon(LucideIcons.checkSquare, size: 14),
                  label: const Text('MARK RESOLVED',
                      style: TextStyle(
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                          fontSize: 11)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        MuhafizTheme.sovereignGreen.withValues(alpha: 0.15),
                    foregroundColor: MuhafizTheme.sovereignGreen,
                    side: const BorderSide(
                        color: MuhafizTheme.sovereignGreen, width: 0.8),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(7)),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _priorityColor(int p) {
    if (p <= 1) return MuhafizTheme.crisisRed;
    if (p <= 3) return MuhafizTheme.cautionAmber;
    return MuhafizTheme.textSecondary;
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
              backgroundColor: MuhafizTheme.sovereignGreen,
              foregroundColor: Colors.black,
            ),
          ),
        ],
      ),
    );
  }
}
