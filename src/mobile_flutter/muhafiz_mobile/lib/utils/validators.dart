class MuhafizValidators {
  static String? validateName(String? value) {
    if (value == null || value.isEmpty) return 'Full identity name is required';
    if (value.length < 3) return 'Identity too short for sovereign records';
    return null;
  }

  static String? validateNIC(String? value) {
    if (value == null || value.isEmpty) return 'NIC is mandatory for state enrollment';
    if (!RegExp(r'^\d{5}-\d{7}-\d{1}$').hasMatch(value)) {
      return 'Format mismatch: XXXXX-XXXXXXX-X';
    }
    return null;
  }

  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) return 'Security protocol requires a password';
    if (value.length < 8) return 'Security breach: Min 8 characters required';
    if (!RegExp(r'[A-Z]').hasMatch(value)) return 'Must contain an uppercase signature';
    if (!RegExp(r'[0-9]').hasMatch(value)) return 'Must contain a numerical digit';
    return null;
  }

  static String? validateOtp(String? value) {
    if (value == null || value.length != 6) return 'Verification code must be 6 digits';
    if (!RegExp(r'^[0-9]+$').hasMatch(value)) return 'Numerical input only';
    return null;
  }
}
