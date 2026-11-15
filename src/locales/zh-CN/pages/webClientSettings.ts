export default {
  'pages.webClientSettings.title': '网页客户端',
  'pages.webClientSettings.description':
    '配置控制台网关对外提供的浏览器远控客户端',
  'pages.webClientSettings.enabled': '启用网页客户端',
  'pages.webClientSettings.enabledHelp': '启用后，下方配置必须完整且有效',
  'pages.webClientSettings.allowedOrigin': '允许的来源（Origin）',
  'pages.webClientSettings.allowedOriginRequired': '请输入允许的来源',
  'pages.webClientSettings.allowedOriginInvalid':
    '必须是精确的 HTTPS origin，例如 https://console.example.com',
  'pages.webClientSettings.allowedOriginHelp':
    '允许打开网页客户端的站点 HTTPS origin，例如 https://console.example.com',
  'pages.webClientSettings.idServerUrl': 'ID 服务器地址',
  'pages.webClientSettings.idServerUrlRequired': '请输入 ID 服务器地址',
  'pages.webClientSettings.idServerUrlInvalid': '必须是 wss:// 地址',
  'pages.webClientSettings.idServerUrlHelp':
    'ID 服务器的公网 WebSocket 地址，例如 wss://console.example.com/ws/id',
  'pages.webClientSettings.relayServerUrl': '中继服务器地址',
  'pages.webClientSettings.relayServerUrlRequired': '请输入中继服务器地址',
  'pages.webClientSettings.relayServerUrlInvalid': '必须是 wss:// 地址',
  'pages.webClientSettings.relayServerUrlHelp':
    '中继服务器的公网 WebSocket 地址，例如 wss://console.example.com/ws/relay',
  'pages.webClientSettings.serverPublicKey': '服务器公钥',
  'pages.webClientSettings.serverPublicKeyRequired': '请输入服务器公钥',
  'pages.webClientSettings.serverPublicKeyInvalid':
    '必须是 base64 编码的 32 字节密钥（与 hbbs/hbbr 密钥对一致）',
  'pages.webClientSettings.serverPublicKeyHelp':
    'hbbs/hbbr 生成的 base64 编码 32 字节公钥（id_ed25519.pub 文件内容）',
  'pages.webClientSettings.upstreamTitle': '内部上游端点（可选）',
  'pages.webClientSettings.upstreamHelp':
    '网关代理转发的内部 WebSocket 端点，留空则使用控制台网关默认值。',
  'pages.webClientSettings.iceTitle': 'WebRTC ICE 服务器（可选）',
  'pages.webClientSettings.iceServers': 'ICE 服务器',
  'pages.webClientSettings.iceServersHelp':
    '每行一个，用于浏览器 WebRTC P2P 的 STUN/TURN 服务器，例如 "stun:stun.example.com:3478" 或 "turn:turn.example.com:3478 用户名 凭据"。留空则使用内置默认值。仅保存在当前浏览器中。',
  'pages.webClientSettings.idUpstreamUrl': 'ID 上游地址',
  'pages.webClientSettings.idUpstreamUrlInvalid': '必须是 ws:// 或 wss:// 地址',
  'pages.webClientSettings.relayUpstreamUrl': '中继上游地址',
  'pages.webClientSettings.relayUpstreamUrlInvalid':
    '必须是 ws:// 或 wss:// 地址',
  'pages.webClientSettings.saveSuccess': '网页客户端配置保存成功',
  'pages.webClientSettings.saveFailed': '网页客户端配置保存失败',
  'pages.webClientSettings.loadFailed': '加载网页客户端配置失败',
  'pages.webClientSettings.createdAt': '创建时间',
  'pages.webClientSettings.updatedAt': '更新时间',
  'pages.webClientSettings.validation.idServerUrl': 'ID 服务器地址无效',
  'pages.webClientSettings.validation.relayServerUrl': '中继服务器地址无效',
  'pages.webClientSettings.validation.serverPublicKey': '服务器公钥无效',
  'pages.webClientSettings.validation.allowedOrigin': '允许的来源无效',
  'pages.webClientSettings.validation.idUpstreamUrl': 'ID 上游地址无效',
  'pages.webClientSettings.validation.relayUpstreamUrl': '中继上游地址无效',
};
