import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';
import '../theme/theme.dart';
import '../widgets/feedback_widgets.dart';
import '../services/auth_service.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _nicController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _landmarkController = TextEditingController();

  final nicFormatter = MaskTextInputFormatter(
    mask: '#####-#######-#',
    filter: {"#": RegExp(r'[0-9]')},
  );

  String? _selectedProvince;
  String? _selectedCity;
  String? _selectedSector;

  final List<Map<String, String>> _dependents = [];

  bool _isLoading = false;

  final Map<String, List<String>> _cityData = {
    'Sindh': ['Karachi', 'Hyderabad', 'Sukkur'],
    'Punjab': ['Lahore', 'Faisalabad', 'Rawalpindi'],
    'KPK': ['Peshawar', 'Abbottabad'],
    'Balochistan': ['Quetta', 'Gwadar'],
  };

  void _addDependent() {
    showDialog(
      context: context,
      builder: (context) {
        String name = '';
        String relation = 'Child';
        return AlertDialog(
          backgroundColor: MuhafizTheme.surfaceSlate,
          title: Text('REGISTER DEPENDENT', style: Theme.of(context).textTheme.labelLarge),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                onChanged: (val) => name = val,
                decoration: const InputDecoration(labelText: 'FULL NAME'),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: relation,
                items: ['Child', 'Spouse', 'Parent', 'Other']
                    .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                    .toList(),
                onChanged: (val) => relation = val!,
                decoration: const InputDecoration(labelText: 'RELATIONSHIP'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('CANCEL'),
            ),
            ElevatedButton(
              onPressed: () {
                if (name.isNotEmpty) {
                  setState(() => _dependents.add({'name': name, 'relation': relation}));
                  Navigator.pop(context);
                }
              },
              child: const Text('ADD'),
            ),
          ],
        );
      },
    );
  }

  void _handleSignup() async {
    if (!_formKey.currentState!.validate()) return;
    if (_nicController.text.length < 15) {
      MuhafizFeedback.showToast("INVALID CNIC STRUCTURE");
      return;
    }
    
    setState(() => _isLoading = true);
    
    try {
      final res = await AuthService.signup(
        nic: _nicController.text,
        name: _nameController.text,
        sector: _landmarkController.text.isNotEmpty ? _landmarkController.text : (_selectedCity ?? 'GENERAL'),
        password: 'OIDC_VERIFIED',
      );
      
      if (res['success'] == true) {
        setState(() => _isLoading = false);
        MuhafizFeedback.showToast("ENROLLMENT PROTOCOL COMPLETED. IDENTITY VAULT CREATED.");
        Navigator.pop(context);
      } else {
        setState(() => _isLoading = false);
        MuhafizFeedback.showToast(res['message'] ?? "ENROLLMENT PROTOCOL FAILED");
      }
    } catch (e) {
      setState(() => _isLoading = false);
      MuhafizFeedback.showToast("COUNCIL SERVER OFFLINE");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('CITIZEN ENROLLMENT', style: Theme.of(context).textTheme.labelLarge),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FadeInDown(
                child: _buildSectionHeader(LucideIcons.user, 'PERSONAL IDENTITY'),
              ),
              const SizedBox(height: 24),
              _buildTextField(
                controller: _nameController,
                label: 'LEGAL NAME',
                icon: LucideIcons.user,
                hint: 'AS PER CNIC',
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _nicController,
                label: 'NATIONAL IDENTITY NUMBER',
                icon: LucideIcons.badgeCheck,
                hint: 'XXXXX-XXXXXXX-X',
                formatter: nicFormatter,
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _phoneController,
                label: 'SECURE MOBILE NUMBER',
                icon: LucideIcons.phone,
                hint: '+92 XXX XXXXXXX',
              ),
              
              const SizedBox(height: 40),
              FadeInDown(
                delay: const Duration(milliseconds: 200),
                child: _buildSectionHeader(LucideIcons.mapPin, 'GEOSPATIAL ANCHOR'),
              ),
              const SizedBox(height: 24),
              _buildDropdown(
                label: 'PROVINCE',
                value: _selectedProvince,
                items: _cityData.keys.toList(),
                onChanged: (val) => setState(() {
                  _selectedProvince = val;
                  _selectedCity = null;
                }),
              ),
              const SizedBox(height: 16),
              _buildDropdown(
                label: 'DISTRICT / CITY',
                value: _selectedCity,
                items: _selectedProvince != null ? _cityData[_selectedProvince]! : [],
                onChanged: (val) => setState(() => _selectedCity = val),
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _landmarkController,
                label: 'PRIMARY SECTOR / LANDMARK',
                icon: LucideIcons.navigation,
                hint: 'E.G. NEAR GULSHAN CHOWRANGI',
              ),
              
              const SizedBox(height: 40),
              FadeInDown(
                delay: const Duration(milliseconds: 400),
                child: _buildSectionHeader(LucideIcons.users, 'VULNERABILITY MATRIX'),
              ),
              const SizedBox(height: 12),
              Text(
                'REGISTER DEPENDENTS FOR PRIORITY RESCUE DURING CRISIS.',
                style: Theme.of(context).textTheme.labelSmall,
              ),
              const SizedBox(height: 16),
              _buildDependentList(),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _addDependent,
                icon: const Icon(LucideIcons.plusCircle, size: 16),
                label: const Text('ADD DEPENDENT'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: MuhafizTheme.primaryEmerald,
                  side: const BorderSide(color: MuhafizTheme.primaryEmerald),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                ),
              ),
              
              const SizedBox(height: 64),
              FadeInUp(
                delay: const Duration(milliseconds: 600),
                child: SizedBox(
                  width: double.infinity,
                  height: 60,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleSignup,
                    child: _isLoading 
                      ? const CircularProgressIndicator(color: Color(0xFF003824))
                      : const Text('COMMIT TO VAULT'),
                  ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, color: MuhafizTheme.primaryEmerald, size: 18),
        const SizedBox(width: 12),
        Text(
          title,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            letterSpacing: 2,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(child: Divider(color: MuhafizTheme.primaryEmerald.withOpacity(0.2))),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? hint,
    MaskTextInputFormatter? formatter,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelSmall),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          inputFormatters: formatter != null ? [formatter] : [],
          validator: (val) => val == null || val.trim().isEmpty ? 'FIELD REQUIRED' : null,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, size: 18),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required String label,
    required String? value,
    required List<String> items,
    required Function(String?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelSmall),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          initialValue: value,
          items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
          onChanged: onChanged,
          validator: (val) => val == null ? 'FIELD REQUIRED' : null,
          decoration: const InputDecoration(
            prefixIcon: Icon(LucideIcons.chevronDown, size: 18),
          ),
        ),
      ],
    );
  }

  Widget _buildDependentList() {
    if (_dependents.isEmpty) return const SizedBox.shrink();
    return Column(
      children: _dependents.map((d) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: MuhafizTheme.surfaceSlate,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: MuhafizTheme.mutedSlate.withOpacity(0.1)),
        ),
        child: Row(
          children: [
            const Icon(LucideIcons.user2, size: 16, color: MuhafizTheme.primaryEmerald),
            const SizedBox(width: 12),
            Text(d['name']!, style: Theme.of(context).textTheme.bodyMedium),
            const Spacer(),
            Text(
              d['relation']!.toUpperCase(),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(color: MuhafizTheme.primaryEmerald),
            ),
            const SizedBox(width: 12),
            GestureDetector(
              onTap: () => setState(() => _dependents.remove(d)),
              child: const Icon(LucideIcons.trash2, size: 16, color: MuhafizTheme.errorRed),
            ),
          ],
        ),
      )).toList(),
    );
  }
}
