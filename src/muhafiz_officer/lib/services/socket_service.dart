import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';

class OfficerSocketService {
  static WebSocketChannel? _channel;
  static final List<Function(Map<String, dynamic>)> _listeners = [];
  static bool _isConnected = false;
  static String? _lastWsUrl;

  static bool get isConnected => _isConnected;

  static void connect(String wsUrl) {
    if (_isConnected) return;
    _lastWsUrl = wsUrl;
    try {
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      _isConnected = true;
      _channel!.stream.listen(
        (data) {
          try {
            final msg = jsonDecode(data as String) as Map<String, dynamic>;
            for (final listener in List.of(_listeners)) {
              listener(msg);
            }
          } catch (_) {}
        },
        onError: (_) {
          _isConnected = false;
          _reconnect();
        },
        onDone: () {
          _isConnected = false;
          _reconnect();
        },
        cancelOnError: true,
      );
    } catch (_) {
      _isConnected = false;
      _reconnect();
    }
  }

  static void addListener(Function(Map<String, dynamic>) fn) {
    if (!_listeners.contains(fn)) _listeners.add(fn);
  }

  static void removeListener(Function(Map<String, dynamic>) fn) {
    _listeners.remove(fn);
  }

  static void disconnect() {
    _channel?.sink.close();
    _channel = null;
    _isConnected = false;
  }

  static void _reconnect() {
    Future.delayed(const Duration(seconds: 5), () {
      if (!_isConnected && _lastWsUrl != null) connect(_lastWsUrl!);
    });
  }
}
