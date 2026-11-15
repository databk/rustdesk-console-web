export default {
  'pages.settings.save': 'Save Settings',
  'pages.settings.general': 'General Settings',
  'pages.settings.fetchFailed': 'Failed to load settings',
  'pages.settings.saveSuccess': 'Settings saved successfully',
  'pages.settings.saveFailed': 'Failed to save settings',
  'pages.settings.generalSection.watermark': 'Username Watermark',
  'pages.settings.generalSection.watermarkExtra':
    'Overlay the current username on each page for accountability.',
  'pages.settings.generalSection.language': 'Default Language',
  'pages.settings.generalSection.languageExtra':
    'Default UI language for new visitors. Signed-in users keep their own preference.',
  'pages.settings.generalSection.languagePlaceholder':
    'Select default language',
  'pages.settings.generalSection.site': 'Site',
  'pages.settings.generalSection.frontendUrl': 'Frontend URL',
  'pages.settings.generalSection.frontendUrlPlaceholder':
    'https://console.example.com',
  'pages.settings.generalSection.backendUrl': 'Backend URL',
  'pages.settings.generalSection.backendUrlExtra':
    'Leave blank to use the same origin as the frontend.',
  'pages.settings.generalSection.backendUrlPlaceholder':
    'https://api.example.com',
  'pages.settings.generalSection.urlInvalid': 'Please enter a valid URL',
  'pages.settings.generalSection.webauthn': 'WebAuthn / Passkeys',
  'pages.settings.generalSection.webauthnEnabled': 'Enable WebAuthn',
  'pages.settings.generalSection.webauthnEnabledExtra':
    'Allow users to register and sign in with passkeys.',
  'pages.settings.generalSection.webauthnUnsupported':
    'This browser does not support WebAuthn. Passkey login will be unavailable for users on unsupported clients.',
  'pages.settings.generalSection.rpName': 'Relying Party Name',
  'pages.settings.generalSection.rpNameExtra':
    'Human-friendly name shown in the passkey prompt.',
  'pages.settings.generalSection.rpNamePlaceholder': 'RustDesk Console',
  'pages.settings.generalSection.security': 'Security & Maintenance',
  'pages.settings.generalSection.jwtExpiryDays': 'JWT Token Expiry (Days)',
  'pages.settings.generalSection.jwtExpiryDaysExtra':
    'Number of days before signed-in user tokens expire. Must be at least 1.',
  'pages.settings.generalSection.jwtExpiryDaysRequired':
    'Please enter a positive integer',
  'pages.settings.generalSection.auditRetentionDays':
    'Audit Log Retention (Days)',
  'pages.settings.generalSection.auditRetentionDaysExtra':
    'Number of days to keep audit logs before automatic cleanup. Set to 0 to disable auto-cleanup.',
  'pages.settings.generalSection.auditRetentionDaysRequired':
    'Please enter a non-negative integer',
  'pages.settings.generalSection.deviceCloneIsolation':
    'Device Clone Isolation',
  'pages.settings.generalSection.deviceCloneIsolationWarning':
    'Do not toggle this off casually after enabling. Legacy mode cannot resolve the derived records and may create duplicate or merged devices. Back up the database before enabling. See docs/clone-isolation.md.',
  'pages.settings.generalSection.deviceCloneIsolationExtra':
    'Separate cloned clients that share a UUID but have different RustDesk IDs. Off by default.',
};
