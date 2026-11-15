export default {
  'pages.settings.save': '保存设置',
  'pages.settings.general': '常规设置',
  'pages.settings.fetchFailed': '加载设置失败',
  'pages.settings.saveSuccess': '设置保存成功',
  'pages.settings.saveFailed': '保存设置失败',
  'pages.settings.generalSection.watermark': '用户名水印',
  'pages.settings.generalSection.watermarkExtra':
    '在每个页面叠加显示当前用户名，便于追溯问责。',
  'pages.settings.generalSection.language': '默认语言',
  'pages.settings.generalSection.languageExtra':
    '新访客的默认界面语言。已登录用户保留其个人偏好。',
  'pages.settings.generalSection.languagePlaceholder': '请选择默认语言',
  'pages.settings.generalSection.site': '站点',
  'pages.settings.generalSection.frontendUrl': '前端地址',
  'pages.settings.generalSection.frontendUrlPlaceholder':
    'https://console.example.com',
  'pages.settings.generalSection.backendUrl': '后端地址',
  'pages.settings.generalSection.backendUrlExtra': '留空则使用与前端相同的源。',
  'pages.settings.generalSection.backendUrlPlaceholder':
    'https://api.example.com',
  'pages.settings.generalSection.urlInvalid': '请输入合法的 URL',
  'pages.settings.generalSection.webauthn': 'WebAuthn / 通行密钥',
  'pages.settings.generalSection.webauthnEnabled': '启用 WebAuthn',
  'pages.settings.generalSection.webauthnEnabledExtra':
    '允许用户注册并使用通行密钥登录。',
  'pages.settings.generalSection.webauthnUnsupported':
    '当前浏览器不支持 WebAuthn。在不支持的客户端上，通行密钥登录将不可用。',
  'pages.settings.generalSection.rpName': '依赖方名称',
  'pages.settings.generalSection.rpNameExtra': '通行密钥提示中展示的友好名称。',
  'pages.settings.generalSection.rpNamePlaceholder': 'RustDesk Console',
  'pages.settings.generalSection.security': '安全与维护',
  'pages.settings.generalSection.jwtExpiryDays': 'JWT Token 有效期（天）',
  'pages.settings.generalSection.jwtExpiryDaysExtra':
    '登录用户 Token 的有效天数，最小为 1。',
  'pages.settings.generalSection.jwtExpiryDaysRequired': '请输入正整数',
  'pages.settings.generalSection.auditRetentionDays': '审计日志保留（天）',
  'pages.settings.generalSection.auditRetentionDaysExtra':
    '审计日志保留天数，到期后自动清理。设为 0 表示不自动清理。',
  'pages.settings.generalSection.auditRetentionDaysRequired': '请输入非负整数',
  'pages.settings.generalSection.deviceCloneIsolation': '设备克隆隔离',
  'pages.settings.generalSection.deviceCloneIsolationWarning':
    '启用后请勿随意关闭。旧模式无法解析派生记录，可能导致设备重复或合并。启用前请备份数据库。详见 docs/clone-isolation.md。',
  'pages.settings.generalSection.deviceCloneIsolationExtra':
    '隔离共享 UUID 但具有不同 RustDesk ID 的克隆客户端。默认关闭。',
};
