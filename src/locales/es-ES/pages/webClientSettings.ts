export default {
  'pages.webClientSettings.title': 'Cliente web',
  'pages.webClientSettings.description':
    'Configura el cliente de control remoto basado en navegador que ofrece la pasarela de la consola',
  'pages.webClientSettings.enabled': 'Activar cliente web',
  'pages.webClientSettings.enabledHelp':
    'Si se activa, la configuración siguiente debe estar completa y ser válida',
  'pages.webClientSettings.allowedOrigin': 'Origen permitido',
  'pages.webClientSettings.allowedOriginRequired':
    'Introduce el origen permitido',
  'pages.webClientSettings.allowedOriginInvalid':
    'Debe ser un origen HTTPS exacto, p. ej. https://console.example.com',
  'pages.webClientSettings.allowedOriginHelp':
    'Origen HTTPS exacto del sitio autorizado para abrir el cliente web, p. ej. https://console.example.com',
  'pages.webClientSettings.idServerUrl': 'URL del servidor de ID',
  'pages.webClientSettings.idServerUrlRequired':
    'Introduce la URL del servidor de ID',
  'pages.webClientSettings.idServerUrlInvalid': 'Debe ser una URL wss://',
  'pages.webClientSettings.idServerUrlHelp':
    'URL WebSocket pública del servidor de ID, p. ej. wss://console.example.com/ws/id',
  'pages.webClientSettings.relayServerUrl': 'URL del servidor de retransmisión',
  'pages.webClientSettings.relayServerUrlRequired':
    'Introduce la URL del servidor de retransmisión',
  'pages.webClientSettings.relayServerUrlInvalid': 'Debe ser una URL wss://',
  'pages.webClientSettings.relayServerUrlHelp':
    'URL WebSocket pública del servidor de retransmisión, p. ej. wss://console.example.com/ws/relay',
  'pages.webClientSettings.serverPublicKey': 'Clave pública del servidor',
  'pages.webClientSettings.serverPublicKeyRequired':
    'Introduce la clave pública del servidor',
  'pages.webClientSettings.serverPublicKeyInvalid':
    'Debe ser una clave de 32 bytes codificada en base64 (la misma del par de claves de hbbs/hbbr)',
  'pages.webClientSettings.serverPublicKeyHelp':
    'Clave pública de 32 bytes codificada en base64 generada por hbbs/hbbr (contenido de id_ed25519.pub)',
  'pages.webClientSettings.upstreamTitle': 'Destinos internos (opcional)',
  'pages.webClientSettings.upstreamHelp':
    'Puntos de conexión WebSocket internos a los que la pasarela reenvía el tráfico. Déjalos vacíos para usar los valores predeterminados de la pasarela de la consola.',
  'pages.webClientSettings.iceTitle': 'Servidores ICE de WebRTC (opcional)',
  'pages.webClientSettings.iceServers': 'Servidores ICE',
  'pages.webClientSettings.iceServersHelp':
    'Uno por línea. Servidores STUN/TURN para WebRTC P2P en el navegador, p. ej. "stun:stun.example.com:3478" o "turn:turn.example.com:3478 usuario credencial". Déjalo vacío para usar los valores predeterminados integrados. Solo se guarda en este navegador.',
  'pages.webClientSettings.idUpstreamUrl': 'URL interna de ID',
  'pages.webClientSettings.idUpstreamUrlInvalid':
    'Debe ser una URL ws:// o wss://',
  'pages.webClientSettings.relayUpstreamUrl': 'URL interna de retransmisión',
  'pages.webClientSettings.relayUpstreamUrlInvalid':
    'Debe ser una URL ws:// o wss://',
  'pages.webClientSettings.saveSuccess':
    'Configuración del cliente web guardada correctamente',
  'pages.webClientSettings.saveFailed':
    'No se pudo guardar la configuración del cliente web',
  'pages.webClientSettings.loadFailed':
    'No se pudo cargar la configuración del cliente web',
  'pages.webClientSettings.createdAt': 'Fecha de creación',
  'pages.webClientSettings.updatedAt': 'Fecha de actualización',
  'pages.webClientSettings.validation.idServerUrl':
    'URL del servidor de ID no válida',
  'pages.webClientSettings.validation.relayServerUrl':
    'URL del servidor de retransmisión no válida',
  'pages.webClientSettings.validation.serverPublicKey':
    'Clave pública del servidor no válida',
  'pages.webClientSettings.validation.allowedOrigin':
    'Origen permitido no válido',
  'pages.webClientSettings.validation.idUpstreamUrl':
    'URL interna de ID no válida',
  'pages.webClientSettings.validation.relayUpstreamUrl':
    'URL interna de retransmisión no válida',
};
