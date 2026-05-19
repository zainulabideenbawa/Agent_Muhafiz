import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

class GeocodingService {
  static final Map<String, LatLng> _cache = {};

  // Expanded local map for instant resolution of common Karachi landmarks
  static const Map<String, LatLng> _localMap = {
    'nipa': LatLng(24.9184, 67.0971),
    'gulshan': LatLng(24.9180, 67.0971),
    'gulistan': LatLng(24.9123, 67.1234),
    'jauhar': LatLng(24.9126, 67.1226),
    'nazimabad': LatLng(24.9150, 67.0450),
    'liaquatabad': LatLng(24.9100, 67.0350),
    'saddar': LatLng(24.8607, 67.0104),
    'clifton': LatLng(24.8138, 67.0336),
    'defence': LatLng(24.8029, 67.0597),
    'dha': LatLng(24.8029, 67.0597),
    'korangi': LatLng(24.8390, 67.1273),
    'malir': LatLng(24.8936, 67.2038),
    'orangi': LatLng(24.9479, 66.9996),
    'landhi': LatLng(24.8579, 67.1823),
    'karsaz': LatLng(24.9063, 67.1100),
    'north nazimabad': LatLng(24.9367, 67.0508),
    'north karachi': LatLng(24.9680, 67.0430),
    'new karachi': LatLng(24.9680, 67.0120),
    'surjani': LatLng(24.9920, 67.0480),
    'lyari': LatLng(24.8579, 66.9940),
    'keamari': LatLng(24.8120, 66.9940),
    'site': LatLng(24.8900, 67.0180),
    'baldia': LatLng(24.8930, 67.0040),
    'manghopir': LatLng(24.9800, 66.9850),
    'shah faisal': LatLng(24.8820, 67.1560),
    'bin qasim': LatLng(24.7950, 67.3120),
    'karachi': LatLng(24.9000, 67.0900),
  };

  /// Returns a LatLng for the given location string.
  /// Order: memory cache → local hardcoded map → Nominatim API → hash fallback
  static Future<LatLng> geocode(String locationName) async {
    final key = locationName.trim().toLowerCase();

    if (key.isEmpty || key == 'analyzing' || key == 'unknown') {
      return const LatLng(24.9000, 67.0900);
    }

    if (_cache.containsKey(key)) return _cache[key]!;

    // Local map — fast, no network
    for (final entry in _localMap.entries) {
      if (key.contains(entry.key)) {
        _cache[key] = entry.value;
        return entry.value;
      }
    }

    // Nominatim OpenStreetMap — free, no API key required
    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/search'
        '?q=${Uri.encodeComponent('$locationName, Karachi, Pakistan')}'
        '&format=json&limit=1&countrycodes=pk',
      );
      final response = await http.get(uri, headers: {
        'User-Agent': 'MuhafizOfficerApp/1.0 (emergency-response)',
        'Accept-Language': 'en',
      }).timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final List data = json.decode(response.body) as List;
        if (data.isNotEmpty) {
          final lat = double.parse(data[0]['lat'].toString());
          final lng = double.parse(data[0]['lon'].toString());
          // Sanity-check: must be within Karachi bounding box
          if (lat > 24.6 && lat < 25.3 && lng > 66.7 && lng < 67.5) {
            final result = LatLng(lat, lng);
            _cache[key] = result;
            return result;
          }
        }
      }
    } catch (_) {
      // Network unavailable — fall through to hash fallback
    }

    // Deterministic hash fallback — always within Karachi
    final int h = locationName.hashCode.abs();
    final result = LatLng(
      24.8600 + (h % 120) / 2000.0,
      66.9800 + ((h >> 4) % 120) / 2000.0,
    );
    _cache[key] = result;
    return result;
  }

  /// Synchronous version using only the local map and cache (no network).
  /// Use this when you can't await (e.g. inside build methods).
  static LatLng geocodeSync(String locationName) {
    final key = locationName.trim().toLowerCase();
    if (_cache.containsKey(key)) return _cache[key]!;
    for (final entry in _localMap.entries) {
      if (key.contains(entry.key)) return entry.value;
    }
    final int h = locationName.hashCode.abs();
    return LatLng(
      24.8600 + (h % 120) / 2000.0,
      66.9800 + ((h >> 4) % 120) / 2000.0,
    );
  }
}
