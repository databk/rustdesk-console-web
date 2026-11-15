export default {
  'pages.webClientSettings.title': 'Cliente Web',
  'pages.webClientSettings.description':
    'Configure o cliente de controle remoto baseado em navegador exposto pelo gateway do console',
  'pages.webClientSettings.enabled': 'Ativar Cliente Web',
  'pages.webClientSettings.enabledHelp':
    'Quando ativado, a configuração abaixo deve estar completa e válida',
  'pages.webClientSettings.allowedOrigin': 'Origem Permitida',
  'pages.webClientSettings.allowedOriginRequired': 'Informe a origem permitida',
  'pages.webClientSettings.allowedOriginInvalid':
    'Deve ser uma origem HTTPS exata, ex.: https://console.example.com',
  'pages.webClientSettings.allowedOriginHelp':
    'Origem HTTPS exata do site autorizado a abrir o cliente web, ex.: https://console.example.com',
  'pages.webClientSettings.idServerUrl': 'URL do Servidor ID',
  'pages.webClientSettings.idServerUrlRequired': 'Informe a URL do servidor ID',
  'pages.webClientSettings.idServerUrlInvalid': 'Deve ser uma URL wss://',
  'pages.webClientSettings.idServerUrlHelp':
    'URL WebSocket pública do servidor ID, ex.: wss://console.example.com/ws/id',
  'pages.webClientSettings.relayServerUrl': 'URL do Servidor de Relay',
  'pages.webClientSettings.relayServerUrlRequired':
    'Informe a URL do servidor de relay',
  'pages.webClientSettings.relayServerUrlInvalid': 'Deve ser uma URL wss://',
  'pages.webClientSettings.relayServerUrlHelp':
    'URL WebSocket pública do servidor de relay, ex.: wss://console.example.com/ws/relay',
  'pages.webClientSettings.serverPublicKey': 'Chave Pública do Servidor',
  'pages.webClientSettings.serverPublicKeyRequired':
    'Informe a chave pública do servidor',
  'pages.webClientSettings.serverPublicKeyInvalid':
    'Deve ser uma chave de 32 bytes codificada em base64 (igual ao par de chaves do hbbs/hbbr)',
  'pages.webClientSettings.serverPublicKeyHelp':
    'Chave pública de 32 bytes codificada em base64 gerada pelo hbbs/hbbr (conteúdo do arquivo id_ed25519.pub)',
  'pages.webClientSettings.upstreamTitle': 'Upstreams Internos (Opcional)',
  'pages.webClientSettings.upstreamHelp':
    'Endpoints WebSocket internos para os quais o gateway faz proxy. Deixe em branco para usar os padrões do gateway do console.',
  'pages.webClientSettings.idUpstreamUrl': 'URL de Upstream ID',
  'pages.webClientSettings.idUpstreamUrlInvalid':
    'Deve ser uma URL ws:// ou wss://',
  'pages.webClientSettings.relayUpstreamUrl': 'URL de Upstream de Relay',
  'pages.webClientSettings.relayUpstreamUrlInvalid':
    'Deve ser uma URL ws:// ou wss://',
  'pages.webClientSettings.saveSuccess':
    'Configuração do cliente web salva com sucesso',
  'pages.webClientSettings.saveFailed':
    'Falha ao salvar a configuração do cliente web',
  'pages.webClientSettings.loadFailed':
    'Falha ao carregar a configuração do cliente web',
  'pages.webClientSettings.createdAt': 'Criado em',
  'pages.webClientSettings.updatedAt': 'Atualizado em',
  'pages.webClientSettings.validation.idServerUrl':
    'URL do servidor ID inválida',
  'pages.webClientSettings.validation.relayServerUrl':
    'URL do servidor de relay inválida',
  'pages.webClientSettings.validation.serverPublicKey':
    'Chave pública do servidor inválida',
  'pages.webClientSettings.validation.allowedOrigin':
    'Origem permitida inválida',
  'pages.webClientSettings.validation.idUpstreamUrl':
    'URL de upstream ID inválida',
  'pages.webClientSettings.validation.relayUpstreamUrl':
    'URL de upstream de relay inválida',
};
