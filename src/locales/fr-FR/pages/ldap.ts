export default {
  'pages.ldap.title': 'Configuration LDAP',
  'pages.ldap.description':
    "Configurer l'authentification LDAP / Active Directory. Les utilisateurs seront automatiquement authentifiés via LDAP lorsqu'elle est activée.",
  'pages.ldap.urls': 'URL des serveurs',
  'pages.ldap.urlsRequired': 'Veuillez saisir au moins une URL de serveur LDAP',
  'pages.ldap.urlPlaceholder': 'ex. ldaps://ad.exemple.com:636',
  'pages.ldap.addUrl': 'Ajouter une URL de serveur',
  'pages.ldap.bindDN': 'DN de liaison (Bind DN)',
  'pages.ldap.bindDNRequired':
    'Veuillez saisir le Bind DN du compte de service',
  'pages.ldap.bindDNPlaceholder':
    'ex. CN=svc-ldap,OU=ServiceAccounts,DC=exemple,DC=com',
  'pages.ldap.bindCredentials': 'Mot de passe de liaison',
  'pages.ldap.bindCredentialsRequired':
    'Veuillez saisir le mot de passe du compte de service',
  'pages.ldap.bindCredentialsPlaceholder':
    'Veuillez saisir le mot de passe du compte de service',
  'pages.ldap.searchBase': 'DN de base de recherche',
  'pages.ldap.searchBaseRequired': 'Veuillez saisir le DN de base de recherche',
  'pages.ldap.searchBasePlaceholder': 'ex. DC=exemple,DC=com',
  'pages.ldap.searchFilter': 'Filtre de recherche',
  'pages.ldap.searchFilterRequired': 'Veuillez saisir le filtre de recherche',
  'pages.ldap.searchFilterHelp':
    "Utilisez {{username}} comme espace réservé pour le nom d'utilisateur. AD : (sAMAccountName={{username}}), OpenLDAP : (uid={{username}})",
  'pages.ldap.searchFilterPlaceholder': 'ex. (sAMAccountName={{username}})',
  'pages.ldap.searchAttributes': 'Attributs de recherche',
  'pages.ldap.searchAttributePlaceholder':
    'ex. dn, sAMAccountName, mail, displayName',
  'pages.ldap.addAttribute': 'Ajouter un attribut',
  'pages.ldap.groupSearchBase': 'DN de base pour la recherche de groupes',
  'pages.ldap.groupSearchBasePlaceholder': 'ex. OU=Groups,DC=exemple,DC=com',
  'pages.ldap.groupSearchFilter': 'Filtre de recherche de groupes',
  'pages.ldap.groupSearchFilterHelp':
    "Utilisez {{dn}} comme espace réservé pour le DN d'utilisateur. ex. (member={{dn}})",
  'pages.ldap.groupSearchFilterPlaceholder': 'ex. (member={{dn}})',
  'pages.ldap.adminGroups': 'Groupes administrateurs',
  'pages.ldap.adminGroupsHelp':
    'Les utilisateurs appartenant à ces groupes LDAP seront définis comme administrateurs (insensible à la casse)',
  'pages.ldap.adminGroupPlaceholder':
    'ex. CN=Admins,OU=Groups,DC=exemple,DC=com',
  'pages.ldap.addAdminGroup': 'Ajouter un groupe administrateur',
  'pages.ldap.tlsOptions': 'Options TLS',
  'pages.ldap.tlsCa': 'Certificat CA (PEM)',
  'pages.ldap.tlsCaPlaceholder': '-----BEGIN CERTIFICATE-----\n...',
  'pages.ldap.tlsCert': 'Certificat client (PEM)',
  'pages.ldap.tlsCertPlaceholder': '-----BEGIN CERTIFICATE-----\n...',
  'pages.ldap.tlsKey': 'Clé privée client (PEM)',
  'pages.ldap.tlsKeyPlaceholder': '-----BEGIN PRIVATE KEY-----\n...',
  'pages.ldap.tlsServername': 'Nom de serveur SNI',
  'pages.ldap.tlsServernamePlaceholder':
    'Indication du nom de serveur pour TLS',
  'pages.ldap.enabled': "Activer l'authentification LDAP",
  'pages.ldap.enabledHelp':
    "Lorsqu'elle est activée, les utilisateurs seront authentifiés auprès du serveur LDAP. Les utilisateurs existants liés à LDAP utiliseront toujours l'authentification LDAP quel que soit ce paramètre.",
  'pages.ldap.testConnection': 'Tester la connexion',
  'pages.ldap.testSuccess': 'Test de connexion LDAP réussi',
  'pages.ldap.testFailed': 'Échec du test de connexion LDAP',
  'pages.ldap.saveSuccess': 'Configuration LDAP enregistrée avec succès',
  'pages.ldap.saveFailed': "Échec de l'enregistrement de la configuration LDAP",
  'pages.ldap.createdAt': 'Créé le',
  'pages.ldap.updatedAt': 'Mis à jour le',
};
