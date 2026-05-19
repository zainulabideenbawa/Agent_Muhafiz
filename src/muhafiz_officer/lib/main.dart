import 'package:flutter/material.dart';
import 'theme.dart';
import 'screens/login_screen.dart';
import 'screens/dispatch_inbox_screen.dart';
import 'screens/quests_screen.dart';
import 'screens/audit_screen.dart';
import 'services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final session = await OfficerAuthService.getSavedSession();

  runApp(MuhafizOfficerApp(isLoggedIn: session != null));
}

class MuhafizOfficerApp extends StatelessWidget {
  final bool isLoggedIn;
  const MuhafizOfficerApp({super.key, required this.isLoggedIn});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Muhafiz-X Officer',
      debugShowCheckedModeBanner: false,
      theme: MuhafizTheme.darkTheme,
      initialRoute: isLoggedIn ? '/shell' : '/login',
      routes: {
        '/login': (_) => const LoginScreen(),
        '/shell': (_) => const OfficerShell(),
      },
    );
  }
}

class OfficerShell extends StatefulWidget {
  const OfficerShell({super.key});

  @override
  State<OfficerShell> createState() => _OfficerShellState();
}

class _OfficerShellState extends State<OfficerShell> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: const [
          DispatchInboxScreen(),
          QuestsScreen(),
          AuditScreen(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: MuhafizTheme.surfaceBorder)),
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: (i) => setState(() => _selectedIndex = i),
          type: BottomNavigationBarType.fixed,
          backgroundColor: MuhafizTheme.nightOpsBlack,
          selectedItemColor: MuhafizTheme.sovereignGreen,
          unselectedItemColor: MuhafizTheme.textSecondary,
          selectedLabelStyle: const TextStyle(
            fontFamily: 'monospace',
            fontSize: 9,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
          unselectedLabelStyle: const TextStyle(
            fontFamily: 'monospace',
            fontSize: 9,
          ),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.inbox_outlined, size: 22),
              activeIcon: Icon(Icons.inbox, size: 22),
              label: 'DISPATCH',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.shield_outlined, size: 22),
              activeIcon: Icon(Icons.shield, size: 22),
              label: 'QUESTS',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.fact_check_outlined, size: 22),
              activeIcon: Icon(Icons.fact_check, size: 22),
              label: 'AUDIT',
            ),
          ],
        ),
      ),
    );
  }
}

