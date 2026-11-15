export default {
  'pages.smtp.title': 'SMTP 配置',
  'pages.smtp.description': '配置 SMTP 邮件服务器用于发送系统通知邮件',
  'pages.smtp.host': '服务器地址',
  'pages.smtp.hostPlaceholder': '请输入 SMTP 服务器地址',
  'pages.smtp.port': '端口',
  'pages.smtp.portPlaceholder': '请输入端口号',
  'pages.smtp.secure': '使用 SSL/TLS',
  'pages.smtp.secureHelp':
    '启用安全连接（通常端口 465 使用 SSL，端口 587 使用 TLS）',
  'pages.smtp.user': '用户名',
  'pages.smtp.userPlaceholder': '请输入 SMTP 认证用户名',
  'pages.smtp.password': '密码',
  'pages.smtp.passwordPlaceholder': '请输入 SMTP 认证密码',
  'pages.smtp.from': '发件人邮箱',
  'pages.smtp.fromPlaceholder': '请输入发件人邮箱地址',
  'pages.smtp.enabled': '启用配置',
  'pages.smtp.enabledHelp': '启用后将使用此配置发送系统邮件',
  'pages.smtp.testConnection': '测试连接',
  'pages.smtp.testSuccess': 'SMTP 连接测试成功',
  'pages.smtp.testFailed': 'SMTP 连接测试失败',
  'pages.smtp.saveSuccess': 'SMTP 配置保存成功',
  'pages.smtp.saveFailed': 'SMTP 配置保存失败',
  'pages.smtp.createdAt': '创建时间',
  'pages.smtp.updatedAt': '更新时间',
  'pages.serverManagementSettings.title': '服务器管理连接',
  'pages.serverManagementSettings.description':
    '配置控制台与 hbbs/hbbr 管理接口的连接方式',
  'pages.serverManagementSettings.url': '管理接口地址',
  'pages.serverManagementSettings.urlInvalid':
    '必须是不带路径的 HTTP(S) origin，例如 http://hbbs:21120',
  'pages.serverManagementSettings.urlHelp':
    'hbbs 管理接口的 HTTP(S) origin，留空表示禁用服务器管理。',
  'pages.serverManagementSettings.token': '管理令牌',
  'pages.serverManagementSettings.tokenRequired': '设置地址时必须填写管理令牌',
  'pages.serverManagementSettings.tokenTooShort': '令牌长度至少 32 个字符',
  'pages.serverManagementSettings.tokenHelp':
    '与 hbbs/hbbr 一致的共享密钥（RD_MANAGEMENT_TOKEN），输入 ****** 表示保持已存储的令牌不变。',
  'pages.serverManagementSettings.nodeId': '节点 ID',
  'pages.serverManagementSettings.nodeIdRequired': '请输入节点 ID',
  'pages.serverManagementSettings.nodeIdInvalid':
    '仅允许字母、数字、连字符和下划线（最长 64 个字符）',
  'pages.serverManagementSettings.nodeIdHelp':
    '当前控制台节点的标识，例如 rustdesk',
  'pages.serverManagementSettings.nodeName': '节点名称',
  'pages.serverManagementSettings.nodeNameRequired': '请输入节点名称',
  'pages.serverManagementSettings.nodeNameHelp':
    '当前控制台节点的显示名称，例如 RustDesk',
  'pages.serverManagementSettings.tokenSyncWarning':
    '修改令牌后，请同步更新 hbbs/hbbr 的 .env 文件中的 SERVER_MANAGEMENT_TOKEN 并重启服务，确保两侧令牌一致。',
  'pages.serverManagementSettings.saveSuccess': '服务器管理配置保存成功',
  'pages.serverManagementSettings.saveFailed': '服务器管理配置保存失败',
  'pages.serverManagementSettings.loadFailed': '加载服务器管理配置失败',
  'pages.serverManagementSettings.createdAt': '创建时间',
  'pages.serverManagementSettings.updatedAt': '更新时间',
};
