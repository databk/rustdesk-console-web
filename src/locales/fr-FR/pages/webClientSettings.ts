export default {
  'pages.webClientSettings.title': 'Client Web',
  'pages.webClientSettings.description':
    'Configurez le client de contrôle à distance dans le navigateur exposé par la passerelle de la console',
  'pages.webClientSettings.enabled': 'Activer le client Web',
  'pages.webClientSettings.enabledHelp':
    'Une fois activé, la configuration ci-dessous doit être complète et valide',
  'pages.webClientSettings.allowedOrigin': 'Origine autorisée',
  'pages.webClientSettings.allowedOriginRequired':
    "Veuillez saisir l'origine autorisée",
  'pages.webClientSettings.allowedOriginInvalid':
    'Doit être une origine HTTPS exacte, p. ex. https://console.example.com',
  'pages.webClientSettings.allowedOriginHelp':
    'Origine HTTPS exacte du site autorisé à ouvrir le client Web, p. ex. https://console.example.com',
  'pages.webClientSettings.idServerUrl': 'URL du serveur ID',
  'pages.webClientSettings.idServerUrlRequired':
    "Veuillez saisir l'URL du serveur ID",
  'pages.webClientSettings.idServerUrlInvalid': 'Doit être une URL wss://',
  'pages.webClientSettings.idServerUrlHelp':
    'URL WebSocket publique du serveur ID, p. ex. wss://console.example.com/ws/id',
  'pages.webClientSettings.relayServerUrl': 'URL du serveur relais',
  'pages.webClientSettings.relayServerUrlRequired':
    "Veuillez saisir l'URL du serveur relais",
  'pages.webClientSettings.relayServerUrlInvalid': 'Doit être une URL wss://',
  'pages.webClientSettings.relayServerUrlHelp':
    'URL WebSocket publique du serveur relais, p. ex. wss://console.example.com/ws/relay',
  'pages.webClientSettings.serverPublicKey': 'Clé publique du serveur',
  'pages.webClientSettings.serverPublicKeyRequired':
    'Veuillez saisir la clé publique du serveur',
  'pages.webClientSettings.serverPublicKeyInvalid':
    'Doit être une clé de 32 octets encodée en base64 (identique à la paire de clés hbbs/hbbr)',
  'pages.webClientSettings.serverPublicKeyHelp':
    'Clé publique de 32 octets encodée en base64 générée par hbbs/hbbr (contenu du fichier id_ed25519.pub)',
  'pages.webClientSettings.upstreamTitle':
    'Points de sortie internes (facultatif)',
  'pages.webClientSettings.upstreamHelp':
    'Points de terminaison WebSocket internes vers lesquels la passerelle transfère les requêtes. Laissez vide pour utiliser les valeurs par défaut de la passerelle.',
  'pages.webClientSettings.idUpstreamUrl': 'URL de sortie ID',
  'pages.webClientSettings.idUpstreamUrlInvalid':
    'Doit être une URL ws:// ou wss://',
  'pages.webClientSettings.relayUpstreamUrl': 'URL de sortie relais',
  'pages.webClientSettings.relayUpstreamUrlInvalid':
    'Doit être une URL ws:// ou wss://',
  'pages.webClientSettings.saveSuccess':
    'Configuration du client Web enregistrée avec succès',
  'pages.webClientSettings.saveFailed':
    "Échec de l'enregistrement de la configuration du client Web",
  'pages.webClientSettings.loadFailed':
    'Échec du chargement de la configuration du client Web',
  'pages.webClientSettings.createdAt': 'Créé le',
  'pages.webClientSettings.updatedAt': 'Mis à jour le',
  'pages.webClientSettings.validation.idServerUrl':
    'URL du serveur ID invalide',
  'pages.webClientSettings.validation.relayServerUrl':
    'URL du serveur relais invalide',
  'pages.webClientSettings.validation.serverPublicKey':
    'Clé publique du serveur invalide',
  'pages.webClientSettings.validation.allowedOrigin':
    'Origine autorisée invalide',
  'pages.webClientSettings.validation.idUpstreamUrl':
    'URL de sortie ID invalide',
  'pages.webClientSettings.validation.relayUpstreamUrl':
    'URL de sortie relais invalide',
};
