import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/theme.dart';
import 'dashboard_screen.dart';
import '../widgets/feedback_widgets.dart';

class OnboardingScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  const OnboardingScreen({super.key, required this.user});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  String? _selectedProvince;
  String? _selectedCity;
  String? _selectedDistrict;
  String? _selectedArea;
  String? _selectedLandmark;
  bool _isSaving = false;

  final Map<String, Map<String, Map<String, Map<String, List<String>>>>> _locationData = {
    'Sindh': {
      'Karachi': {
        'Karachi East': {
          'Gulshan-e-Iqbal': ['Nipa Chowk', 'Hassan Square Chowk', 'Disco Bakery Chowk'],
          'Gulistan-e-Jauhar': ['Jauhar Chowrangi', 'Kamran Chowrangi', 'Perfume Chowk'],
        },
        'Karachi South': {
          'Clifton': ['Teen Talwar', 'Do Talwar', 'Schon Circle'],
        },
      },
      'Hyderabad': {
        'Hyderabad District': {
          'Latifabad': ['Kohinoor Chowk', 'Unit 7 Chowk'],
        },
      },
    },
    'Punjab': {
      'Lahore': {
        'Lahore District': {
          'Gulberg': ['Liberty Chowk', 'Kalma Chowk', 'Hussain Chowk'],
          'DHA': ['Lalik Jan Chowk', 'Y-Block Chowk'],
        },
      },
      'Rawalpindi': {
        'Rawalpindi District': {
          'Saddar': ['Fawara Chowk', 'Committee Chowk'],
        },
      },
    },
    'KPK': {
      'Peshawar': {
        'Peshawar District': {
          'Hayatabad': ['Shalman Park Chowk', 'Phase 3 Chowk'],
        },
      },
    },
    'Balochistan': {
      'Quetta': {
        'Quetta District': {
          'Cantonment': ['Askari Chowk', 'Bacha Khan Chowk'],
        },
      },
    },
  };

  bool get _isFormValid =>
      _selectedProvince != null &&
      _selectedCity != null &&
      _selectedDistrict != null &&
      _selectedArea != null &&
      _selectedLandmark != null;

  void _handleConfirm() async {
    if (!_isFormValid) return;

    setState(() => _isSaving = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('province', _selectedProvince!);
      await prefs.setString('city', _selectedCity!);
      await prefs.setString('district', _selectedDistrict!);
      await prefs.setString('area', _selectedArea!);
      await prefs.setString('landmark', _selectedLandmark!);
      await prefs.setBool('location_onboarded', true);

      final updatedUser = Map<String, dynamic>.from(widget.user);
      updatedUser['location'] = {
        'province': _selectedProvince,
        'city': _selectedCity,
        'district': _selectedDistrict,
        'area': _selectedArea,
        'landmark': _selectedLandmark,
      };

      if (mounted) {
        MuhafizFeedback.showToast("SOVEREIGN COORDINATES INTEGRATED");
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => DashboardScreen(user: updatedUser),
          ),
        );
      }
    } catch (e) {
      MuhafizFeedback.showToast("FAILED TO BIND GEOLOCATION");
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Dropdown options based on hierarchy
    final provinces = _locationData.keys.toList();
    
    final cities = _selectedProvince != null 
        ? _locationData[_selectedProvince]!.keys.toList() 
        : <String>[];
        
    final districts = (_selectedProvince != null && _selectedCity != null)
        ? _locationData[_selectedProvince]![_selectedCity]!.keys.toList()
        : <String>[];
        
    final areas = (_selectedProvince != null && _selectedCity != null && _selectedDistrict != null)
        ? _locationData[_selectedProvince]![_selectedCity]![_selectedDistrict]!.keys.toList()
        : <String>[];
        
    final landmarks = (_selectedProvince != null && _selectedCity != null && _selectedDistrict != null && _selectedArea != null)
        ? _locationData[_selectedProvince]![_selectedCity]![_selectedDistrict]![_selectedArea]!
        : <String>[];

    return Scaffold(
      backgroundColor: MuhafizTheme.backgroundSlate,
      body: Stack(
        children: [
          // Tactical Background Grid and Glows
          Positioned(
            top: -150,
            left: -150,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: MuhafizTheme.primaryEmerald.withOpacity(0.03),
              ),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),
                  // App Branding Header
                  FadeInDown(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'GEOLOCATION ONBOARDING',
                              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                    color: MuhafizTheme.primaryEmerald,
                                    letterSpacing: 2,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'SECURE TELEMETRY BINDING',
                              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.2)),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Icon(LucideIcons.globe, color: MuhafizTheme.primaryEmerald, size: 20),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Progress indicator
                  FadeIn(
                    delay: const Duration(milliseconds: 100),
                    child: LinearProgressIndicator(
                      value: [
                        _selectedProvince != null,
                        _selectedCity != null,
                        _selectedDistrict != null,
                        _selectedArea != null,
                        _selectedLandmark != null,
                      ].where((e) => e).length / 5.0,
                      backgroundColor: MuhafizTheme.surfaceSlate,
                      valueColor: const AlwaysStoppedAnimation<Color>(MuhafizTheme.primaryEmerald),
                      minHeight: 2,
                    ),
                  ),
                  const SizedBox(height: 32),
                  // Technical info block
                  FadeIn(
                    delay: const Duration(milliseconds: 200),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: MuhafizTheme.surfaceSlate,
                        border: Border.all(color: MuhafizTheme.primaryEmerald.withOpacity(0.1)),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.shieldAlert, color: MuhafizTheme.primaryEmerald, size: 18),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'To synchronize with the Analyst Agent, your exact tactical operational node must be declared. All fields are mandatory.',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: MuhafizTheme.secondarySlate,
                                    fontSize: 12,
                                    height: 1.4,
                                  ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),

                  // DROPDOWNS LIST
                  // 1. Province Dropdown
                  FadeInUp(
                    delay: const Duration(milliseconds: 300),
                    child: _buildCascadingDropdown(
                      label: '1. SELECT PROVINCE',
                      value: _selectedProvince,
                      items: provinces,
                      hint: 'SELECT PROVINCE',
                      onChanged: (val) {
                        setState(() {
                          _selectedProvince = val;
                          _selectedCity = null;
                          _selectedDistrict = null;
                          _selectedArea = null;
                          _selectedLandmark = null;
                        });
                      },
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 2. City Dropdown
                  FadeInUp(
                    delay: const Duration(milliseconds: 400),
                    child: _buildCascadingDropdown(
                      label: '2. SELECT CITY',
                      value: _selectedCity,
                      items: cities,
                      hint: _selectedProvince == null 
                          ? 'AWAITING PROVINCE SELECTION' 
                          : 'SELECT CITY',
                      enabled: _selectedProvince != null,
                      onChanged: (val) {
                        setState(() {
                          _selectedCity = val;
                          _selectedDistrict = null;
                          _selectedArea = null;
                          _selectedLandmark = null;
                        });
                      },
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 3. District Dropdown
                  FadeInUp(
                    delay: const Duration(milliseconds: 500),
                    child: _buildCascadingDropdown(
                      label: '3. SELECT DISTRICT',
                      value: _selectedDistrict,
                      items: districts,
                      hint: _selectedCity == null 
                          ? 'AWAITING CITY SELECTION' 
                          : 'SELECT DISTRICT',
                      enabled: _selectedCity != null,
                      onChanged: (val) {
                        setState(() {
                          _selectedDistrict = val;
                          _selectedArea = null;
                          _selectedLandmark = null;
                        });
                      },
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 4. Area Dropdown
                  FadeInUp(
                    delay: const Duration(milliseconds: 600),
                    child: _buildCascadingDropdown(
                      label: '4. SELECT AREA / SECTOR',
                      value: _selectedArea,
                      items: areas,
                      hint: _selectedDistrict == null 
                          ? 'AWAITING DISTRICT SELECTION' 
                          : 'SELECT AREA',
                      enabled: _selectedDistrict != null,
                      onChanged: (val) {
                        setState(() {
                          _selectedArea = val;
                          _selectedLandmark = null;
                        });
                      },
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 5. Landmark (Chowk) Dropdown
                  FadeInUp(
                    delay: const Duration(milliseconds: 700),
                    child: _buildCascadingDropdown(
                      label: '5. SPECIFIC LANDMARK / CHOWK',
                      value: _selectedLandmark,
                      items: landmarks,
                      hint: _selectedArea == null 
                          ? 'AWAITING AREA SELECTION' 
                          : 'SELECT LANDMARK / CHOWK',
                      enabled: _selectedArea != null,
                      onChanged: (val) {
                        setState(() {
                          _selectedLandmark = val;
                        });
                      },
                    ),
                  ),
                  const SizedBox(height: 48),

                  // ACTION BUTTON
                  FadeInUp(
                    delay: const Duration(milliseconds: 800),
                    child: SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: (_isFormValid && !_isSaving) ? _handleConfirm : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: MuhafizTheme.primaryEmerald,
                          disabledBackgroundColor: MuhafizTheme.surfaceSlate.withOpacity(0.5),
                          elevation: _isFormValid ? 8 : 0,
                          shadowColor: MuhafizTheme.primaryEmerald.withOpacity(0.3),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(4),
                            side: BorderSide(
                              color: _isFormValid 
                                  ? Colors.transparent 
                                  : MuhafizTheme.primaryEmerald.withOpacity(0.1),
                            ),
                          ),
                        ),
                        child: _isSaving
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  color: Color(0xFF003824),
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                'CONFIRM TACTICAL NODE',
                                style: GoogleFonts.jetBrainsMono(
                                  fontWeight: FontWeight.bold,
                                  color: _isFormValid 
                                      ? const Color(0xFF003824) 
                                      : MuhafizTheme.mutedSlate,
                                ),
                              ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Diagnostic metadata printout at bottom
                  FadeIn(
                    delay: const Duration(milliseconds: 900),
                    child: Center(
                      child: Text(
                        'LATENCY: 14MS // PROTOCOL: ENCRYPTED_UDP // INTEGRITY: VERIFIED',
                        style: GoogleFonts.jetBrainsMono(
                          color: MuhafizTheme.mutedSlate.withOpacity(0.5),
                          fontSize: 8,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCascadingDropdown({
    required String label,
    required String? value,
    required List<String> items,
    required String hint,
    bool enabled = true,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: GoogleFonts.jetBrainsMono(
                fontSize: 10,
                color: enabled ? MuhafizTheme.primaryEmerald : MuhafizTheme.mutedSlate.withOpacity(0.5),
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
            if (value != null)
              const Icon(LucideIcons.checkCircle2, color: MuhafizTheme.primaryEmerald, size: 12),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: enabled ? MuhafizTheme.surfaceSlate : MuhafizTheme.surfaceSlate.withOpacity(0.3),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(
              color: value != null
                  ? MuhafizTheme.primaryEmerald.withOpacity(0.4)
                  : (enabled 
                      ? MuhafizTheme.primaryEmerald.withOpacity(0.15) 
                      : MuhafizTheme.mutedSlate.withOpacity(0.1)),
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: DropdownButtonHideUnderline(
            child: DropdownButtonFormField<String>(
              value: value,
              hint: Text(
                hint,
                style: GoogleFonts.inter(
                  color: MuhafizTheme.mutedSlate.withOpacity(enabled ? 0.6 : 0.3),
                  fontSize: 13,
                ),
              ),
              disabledHint: Text(
                hint,
                style: GoogleFonts.inter(
                  color: MuhafizTheme.mutedSlate.withOpacity(0.3),
                  fontSize: 13,
                ),
              ),
              isExpanded: true,
              dropdownColor: MuhafizTheme.surfaceSlate,
              icon: Icon(
                LucideIcons.chevronDown,
                color: enabled ? MuhafizTheme.primaryEmerald : MuhafizTheme.mutedSlate.withOpacity(0.3),
                size: 16,
              ),
              items: enabled
                  ? items.map((String item) {
                      return DropdownMenuItem<String>(
                        value: item,
                        child: Text(
                          item.toUpperCase(),
                          style: GoogleFonts.jetBrainsMono(
                            color: MuhafizTheme.onSurface,
                            fontSize: 13,
                          ),
                        ),
                      );
                    }).toList()
                  : null,
              onChanged: enabled ? onChanged : null,
              decoration: const InputDecoration(
                border: InputBorder.none,
                filled: false,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
