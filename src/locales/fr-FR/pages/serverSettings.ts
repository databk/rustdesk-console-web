export default {
  'pages.smtp.title': 'Configuration SMTP',
  'pages.smtp.description':
    "Configurer le serveur de messagerie SMTP pour l'envoi des e-mails de notification système",
  'pages.smtp.host': 'Adresse du serveur',
  'pages.smtp.hostPlaceholder': "Veuillez saisir l'adresse du serveur SMTP",
  'pages.smtp.port': 'Port',
  'pages.smtp.portPlaceholder': 'Veuillez saisir le numéro de port',
  'pages.smtp.secure': 'Utiliser SSL/TLS',
  'pages.smtp.secureHelp':
    'Activer la connexion sécurisée (généralement le port 465 utilise SSL, le port 587 utilise TLS)',
  'pages.smtp.user': "Nom d'utilisateur",
  'pages.smtp.userPlaceholder':
    "Veuillez saisir le nom d'utilisateur d'authentification SMTP",
  'pages.smtp.password': 'Mot de passe',
  'pages.smtp.passwordPlaceholder':
    "Veuillez saisir le mot de passe d'authentification SMTP",
  'pages.smtp.from': "E-mail de l'expéditeur",
  'pages.smtp.fromPlaceholder':
    "Veuillez saisir l'adresse e-mail de l'expéditeur",
  'pages.smtp.enabled': 'Activer la configuration',
  'pages.smtp.enabledHelp':
    "Lorsqu'elle est activée, cette configuration sera utilisée pour envoyer les e-mails système",
  'pages.smtp.testConnection': 'Tester la connexion',
  'pages.smtp.testSuccess': 'Test de connexion SMTP réussi',
  'pages.smtp.testFailed': 'Échec du test de connexion SMTP',
  'pages.smtp.saveSuccess': 'Configuration SMTP enregistrée avec succès',
  'pages.smtp.saveFailed': "Échec de l'enregistrement de la configuration SMTP",
  'pages.smtp.createdAt': 'Créé le',
  'pages.smtp.updatedAt': 'Mis à jour le',
  'pages.serverManagementSettings.title': 'Gestion des serveurs',
  'pages.serverManagementSettings.description':
    "Configurez la connexion de la console à l'API de gestion hbbs/hbbr",
  'pages.serverManagementSettings.url': "URL de l'API de gestion",
  'pages.serverManagementSettings.urlInvalid':
    'Doit être une origine HTTP(S) sans chemin, p. ex. http://hbbs:21120',
  'pages.serverManagementSettings.urlHelp':
    "Origine HTTP(S) de l'API de gestion hbbs. Laissez vide pour désactiver la gestion des serveurs.",
  'pages.serverManagementSettings.token': 'Jeton de gestion',
  'pages.serverManagementSettings.tokenRequired':
    "Un jeton de gestion est requis lorsqu'une URL est définie",
  'pages.serverManagementSettings.tokenTooShort':
    'Le jeton doit contenir au moins 32 caractères',
  'pages.serverManagementSettings.tokenHelp':
    'Secret partagé configuré sur hbbs/hbbr (RD_MANAGEMENT_TOKEN). Saisissez ****** pour conserver le jeton stocké.',
  'pages.serverManagementSettings.nodeId': 'ID du nœud',
  'pages.serverManagementSettings.nodeIdRequired':
    'Veuillez saisir un ID de nœud',
  'pages.serverManagementSettings.nodeIdInvalid':
    'Lettres, chiffres, tirets et traits de soulignement uniquement (64 caractères max)',
  'pages.serverManagementSettings.nodeIdHelp':
    'Identifiant de ce nœud de console, p. ex. rustdesk',
  'pages.serverManagementSettings.nodeName': 'Nom du nœud',
  'pages.serverManagementSettings.nodeNameRequired':
    'Veuillez saisir un nom de nœud',
  'pages.serverManagementSettings.nodeNameHelp':
    'Nom affiché de ce nœud de console, p. ex. RustDesk',
  'pages.serverManagementSettings.tokenSyncWarning':
    'Après avoir modifié le jeton, mettez à jour SERVER_MANAGEMENT_TOKEN dans le fichier .env de hbbs/hbbr et redémarrez-les afin que les deux côtés utilisent le même jeton.',
  'pages.serverManagementSettings.saveSuccess':
    'Configuration de la gestion des serveurs enregistrée avec succès',
  'pages.serverManagementSettings.saveFailed':
    "Échec de l'enregistrement de la configuration de la gestion des serveurs",
  'pages.serverManagementSettings.loadFailed':
    'Échec du chargement de la configuration de la gestion des serveurs',
  'pages.serverManagementSettings.createdAt': 'Créé le',
  'pages.serverManagementSettings.updatedAt': 'Mis à jour le',
};
