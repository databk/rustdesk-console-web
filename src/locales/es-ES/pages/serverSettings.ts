export default {
  'pages.smtp.title': 'Configuración SMTP',
  'pages.smtp.description':
    'Configura el servidor de correo SMTP para enviar los correos electrónicos de notificación del sistema',
  'pages.smtp.host': 'Dirección del servidor',
  'pages.smtp.hostPlaceholder': 'Introduce la dirección del servidor SMTP',
  'pages.smtp.port': 'Puerto',
  'pages.smtp.portPlaceholder': 'Introduce el número de puerto',
  'pages.smtp.secure': 'Usar SSL/TLS',
  'pages.smtp.secureHelp':
    'Activa la conexión segura (normalmente el puerto 465 usa SSL y el 587, TLS)',
  'pages.smtp.user': 'Nombre de usuario',
  'pages.smtp.userPlaceholder':
    'Introduce el nombre de usuario de autenticación SMTP',
  'pages.smtp.password': 'Contraseña',
  'pages.smtp.passwordPlaceholder':
    'Introduce la contraseña de autenticación SMTP',
  'pages.smtp.from': 'Correo del remitente',
  'pages.smtp.fromPlaceholder':
    'Introduce la dirección de correo electrónico del remitente',
  'pages.smtp.enabled': 'Activar configuración',
  'pages.smtp.enabledHelp':
    'Si está activada, esta configuración se usará para enviar los correos electrónicos del sistema',
  'pages.smtp.testConnection': 'Probar conexión',
  'pages.smtp.testSuccess':
    'La prueba de conexión SMTP se ha realizado correctamente',
  'pages.smtp.testFailed': 'La prueba de conexión SMTP ha fallado',
  'pages.smtp.saveSuccess': 'Configuración SMTP guardada correctamente',
  'pages.smtp.saveFailed': 'No se pudo guardar la configuración SMTP',
  'pages.smtp.createdAt': 'Fecha de creación',
  'pages.smtp.updatedAt': 'Fecha de actualización',
  'pages.serverManagementSettings.title': 'Gestión de servidores',
  'pages.serverManagementSettings.description':
    'Configura cómo se comunica la consola con la API de gestión de hbbs/hbbr',
  'pages.serverManagementSettings.url': 'URL de la API de gestión',
  'pages.serverManagementSettings.urlInvalid':
    'Debe ser un origen HTTP(S) sin ruta, p. ej. http://hbbs:21120',
  'pages.serverManagementSettings.urlHelp':
    'Origen HTTP(S) de la API de gestión de hbbs. Déjalo vacío para desactivar la gestión de servidores.',
  'pages.serverManagementSettings.token': 'Token de gestión',
  'pages.serverManagementSettings.tokenRequired':
    'Si se indica una URL, el token de gestión es obligatorio',
  'pages.serverManagementSettings.tokenTooShort':
    'El token debe tener al menos 32 caracteres',
  'pages.serverManagementSettings.tokenHelp':
    'Secreto compartido configurado en hbbs/hbbr (RD_MANAGEMENT_TOKEN). Introduce ****** para conservar el token guardado.',
  'pages.serverManagementSettings.nodeId': 'ID del nodo',
  'pages.serverManagementSettings.nodeIdRequired': 'Introduce un ID de nodo',
  'pages.serverManagementSettings.nodeIdInvalid':
    'Solo letras, números, guiones y guiones bajos (máximo 64 caracteres)',
  'pages.serverManagementSettings.nodeIdHelp':
    'Identificador de este nodo de la consola, p. ej. rustdesk',
  'pages.serverManagementSettings.nodeName': 'Nombre del nodo',
  'pages.serverManagementSettings.nodeNameRequired':
    'Introduce un nombre de nodo',
  'pages.serverManagementSettings.nodeNameHelp':
    'Nombre visible de este nodo de la consola, p. ej. RustDesk',
  'pages.serverManagementSettings.tokenSyncWarning':
    'Después de cambiar el token, actualiza SERVER_MANAGEMENT_TOKEN en el archivo .env de hbbs/hbbr y reinícialos para que ambos lados usen el mismo token.',
  'pages.serverManagementSettings.saveSuccess':
    'Configuración de gestión de servidores guardada correctamente',
  'pages.serverManagementSettings.saveFailed':
    'No se pudo guardar la configuración de gestión de servidores',
  'pages.serverManagementSettings.loadFailed':
    'No se pudo cargar la configuración de gestión de servidores',
  'pages.serverManagementSettings.createdAt': 'Fecha de creación',
  'pages.serverManagementSettings.updatedAt': 'Fecha de actualización',
};
