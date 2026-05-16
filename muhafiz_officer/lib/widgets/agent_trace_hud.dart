import 'package:flutter/material.dart';
import '../theme.dart';

class AgentTraceHud extends StatelessWidget {
  final List<Map<String, dynamic>> logs;
  
  const AgentTraceHud({super.key, required this.logs});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: MuhafizTheme.nightOpsBlack.withOpacity(0.85),
        border: const Border(top: BorderSide(color: MuhafizTheme.surfaceBorder)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.psychology, color: MuhafizTheme.intelligenceViolet, size: 16),
              const SizedBox(width: 8),
              Text(
                'AGENTIC REASONING TRACE',
                style: TextStyle(
                  color: MuhafizTheme.intelligenceViolet,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 120,
            child: ListView.builder(
              itemCount: logs.length,
              itemBuilder: (context, index) {
                final log = logs[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '[${log['agent']}] ',
                        style: const TextStyle(
                          color: MuhafizTheme.intelligenceViolet,
                          fontFamily: 'monospace',
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          log['message'],
                          style: const TextStyle(
                            color: Colors.white,
                            fontFamily: 'monospace',
                            fontSize: 11,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
