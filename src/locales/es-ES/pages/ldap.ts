export default {
  'pages.ldap.title': 'Configuración LDAP',
  'pages.ldap.description':
    'Configura la autenticación con LDAP/Active Directory. Si está activada, los usuarios se autenticarán automáticamente mediante LDAP.',
  'pages.ldap.urls': 'URL de los servidores',
  'pages.ldap.urlsRequired': 'Introduce al menos una URL de servidor LDAP',
  'pages.ldap.urlPlaceholder': 'p. ej. ldaps://ad.example.com:636',
  'pages.ldap.addUrl': 'Añadir URL de servidor',
  'pages.ldap.bindDN': 'DN de enlace (Bind DN)',
  'pages.ldap.bindDNRequired':
    'Introduce el DN de enlace de la cuenta de servicio',
  'pages.ldap.bindDNPlaceholder':
    'p. ej. CN=svc-ldap,OU=ServiceAccounts,DC=example,DC=com',
  'pages.ldap.bindCredentials': 'Contraseña de enlace',
  'pages.ldap.bindCredentialsRequired':
    'Introduce la contraseña de la cuenta de servicio',
  'pages.ldap.bindCredentialsPlaceholder':
    'Introduce la contraseña de la cuenta de servicio',
  'pages.ldap.searchBase': 'DN base de búsqueda',
  'pages.ldap.searchBaseRequired': 'Introduce el DN base de búsqueda',
  'pages.ldap.searchBasePlaceholder': 'p. ej. DC=example,DC=com',
  'pages.ldap.searchFilter': 'Filtro de búsqueda',
  'pages.ldap.searchFilterRequired': 'Introduce el filtro de búsqueda',
  'pages.ldap.searchFilterHelp':
    'Usa {{username}} para indicar el nombre de usuario. AD: (sAMAccountName={{username}}), OpenLDAP: (uid={{username}})',
  'pages.ldap.searchFilterPlaceholder': 'p. ej. (sAMAccountName={{username}})',
  'pages.ldap.searchAttributes': 'Atributos de búsqueda',
  'pages.ldap.searchAttributePlaceholder':
    'p. ej. dn, sAMAccountName, mail, displayName',
  'pages.ldap.addAttribute': 'Añadir atributo',
  'pages.ldap.groupSearchBase': 'DN base de búsqueda de grupos',
  'pages.ldap.groupSearchBasePlaceholder': 'p. ej. OU=Groups,DC=example,DC=com',
  'pages.ldap.groupSearchFilter': 'Filtro de búsqueda de grupos',
  'pages.ldap.groupSearchFilterHelp':
    'Usa {{dn}} para indicar el DN del usuario. P. ej. (member={{dn}})',
  'pages.ldap.groupSearchFilterPlaceholder': 'p. ej. (member={{dn}})',
  'pages.ldap.adminGroups': 'Grupos de administradores',
  'pages.ldap.adminGroupsHelp':
    'Los usuarios de estos grupos LDAP serán administradores (sin distinguir mayúsculas y minúsculas)',
  'pages.ldap.adminGroupPlaceholder':
    'p. ej. CN=Admins,OU=Groups,DC=example,DC=com',
  'pages.ldap.addAdminGroup': 'Añadir grupo de administradores',
  'pages.ldap.tlsOptions': 'Opciones de TLS',
  'pages.ldap.tlsCa': 'Certificado de CA (PEM)',
  'pages.ldap.tlsCaPlaceholder': '-----BEGIN CERTIFICATE-----\n...',
  'pages.ldap.tlsCert': 'Certificado de cliente (PEM)',
  'pages.ldap.tlsCertPlaceholder': '-----BEGIN CERTIFICATE-----\n...',
  'pages.ldap.tlsKey': 'Clave privada de cliente (PEM)',
  'pages.ldap.tlsKeyPlaceholder': '-----BEGIN PRIVATE KEY-----\n...',
  'pages.ldap.tlsServername': 'Nombre del servidor SNI',
  'pages.ldap.tlsServernamePlaceholder':
    'Indicación del nombre del servidor (SNI) para TLS',
  'pages.ldap.enabled': 'Activar autenticación LDAP',
  'pages.ldap.enabledHelp':
    'Si está activada, los usuarios se autenticarán con el servidor LDAP. Los usuarios ya vinculados a LDAP siempre usarán la autenticación LDAP, independientemente de este ajuste.',
  'pages.ldap.testConnection': 'Probar conexión',
  'pages.ldap.testSuccess':
    'La prueba de conexión LDAP se ha realizado correctamente',
  'pages.ldap.testFailed': 'La prueba de conexión LDAP ha fallado',
  'pages.ldap.saveSuccess': 'Configuración LDAP guardada correctamente',
  'pages.ldap.saveFailed': 'No se pudo guardar la configuración LDAP',
  'pages.ldap.createdAt': 'Fecha de creación',
  'pages.ldap.updatedAt': 'Fecha de actualización',
};
