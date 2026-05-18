import 'dart:convert';
import 'dart:io';
import 'dart:async';

class SocketService {
  static WebSocket? _socket;
  static final List<Function(Map<String, dynamic>)> _messageListeners = [];
  static bool _isConnected = false;

  static bool get isConnected => _isConnected;

  static void connect(String wsUrl) async {
    if (_socket != null && _isConnected) return;
    
    print("🔌 Attempting WebSocket connection to: $wsUrl");
    try {
      _socket = await WebSocket.connect(wsUrl).timeout(const Duration(seconds: 5));
      _isConnected = true;
      print("📱 Mobile connected to Muhafiz-X standard WebSocket!");

      _socket!.listen(
        (data) {
          try {
            final Map<String, dynamic> decoded = jsonDecode(data);
            print("📩 Received WebSocket data: $decoded");
            for (var listener in _messageListeners) {
              listener(decoded);
            }
          } catch (e) {
            print("⚠️ Error decoding WebSocket message: $e");
          }
        },
        onError: (err) {
          print("⚠️ WebSocket connection error: $err");
          _isConnected = false;
          _reconnect(wsUrl);
        },
        onDone: () {
          print("🔌 WebSocket connection closed");
          _isConnected = false;
          _reconnect(wsUrl);
        },
        cancelOnError: true,
      );
    } catch (e) {
      print("⚠️ WebSocket connect failed: $e");
      _isConnected = false;
      _reconnect(wsUrl);
    }
  }

  static void addListener(Function(Map<String, dynamic>) listener) {
    if (!_messageListeners.contains(listener)) {
      _messageListeners.add(listener);
    }
  }

  static void removeListener(Function(Map<String, dynamic>) listener) {
    _messageListeners.remove(listener);
  }

  static void _reconnect(String wsUrl) {
    Future.delayed(const Duration(seconds: 5), () {
      if (!_isConnected) {
        connect(wsUrl);
      }
    });
  }

  static void disconnect() {
    _socket?.close();
    _socket = null;
    _isConnected = false;
  }
}
