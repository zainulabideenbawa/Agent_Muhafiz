import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  static IO.Socket? socket;

  static void connect(String baseUrl, Function(Map<String, dynamic>) onTrace) {
    socket = IO.io(baseUrl, IO.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect()
      .build());

    socket!.connect();

    socket!.onConnect((_) {
      print('📱 Mobile connected to Muhafiz-X Socket');
    });

    // Listen for real-time agent traces (Complaint status updates)
    socket!.on('agent_trace', (data) {
      onTrace(Map<String, dynamic>.from(data));
    });

    // Listen for localized government alerts
    socket!.on('gov_alert', (data) {
      // Handle alert banner
    });
  }

  static void disconnect() {
    socket?.disconnect();
  }
}
