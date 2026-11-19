export default {
  'pages.settings.save': 'Guardar configuración',
  'pages.settings.general': 'Configuración general',
  'pages.settings.fetchFailed': 'No se pudo cargar la configuración',
  'pages.settings.saveSuccess': 'Configuración guardada correctamente',
  'pages.settings.saveFailed': 'No se pudo guardar la configuración',
  'pages.settings.generalSection.watermark':
    'Marca de agua con el nombre de usuario',
  'pages.settings.generalSection.watermarkExtra':
    'Superpone el nombre del usuario actual en todas las páginas para dejar constancia de quién las usa.',
  'pages.settings.generalSection.language': 'Idioma predeterminado',
  'pages.settings.generalSection.languageExtra':
    'Idioma de la interfaz predeterminado para los visitantes nuevos. Los usuarios que han iniciado sesión conservan su propia preferencia.',
  'pages.settings.generalSection.languagePlaceholder':
    'Selecciona el idioma predeterminado',
  'pages.settings.generalSection.site': 'Sitio',
  'pages.settings.generalSection.frontendUrl': 'URL de la interfaz web',
  'pages.settings.generalSection.frontendUrlPlaceholder':
    'https://console.example.com',
  'pages.settings.generalSection.backendUrl': 'URL del backend',
  'pages.settings.generalSection.backendUrlExtra':
    'Déjalo vacío para usar el mismo origen que la interfaz web.',
  'pages.settings.generalSection.backendUrlPlaceholder':
    'https://api.example.com',
  'pages.settings.generalSection.urlInvalid': 'Introduce una URL válida',
  'pages.settings.generalSection.webauthn': 'WebAuthn / llaves de acceso',
  'pages.settings.generalSection.webauthnEnabled': 'Activar WebAuthn',
  'pages.settings.generalSection.webauthnEnabledExtra':
    'Permite a los usuarios registrar llaves de acceso e iniciar sesión con ellas.',
  'pages.settings.generalSection.webauthnUnsupported':
    'Este navegador no es compatible con WebAuthn. El inicio de sesión con llave de acceso no estará disponible para los usuarios con clientes no compatibles.',
  'pages.settings.generalSection.rpName':
    'Nombre de la parte de confianza (RP)',
  'pages.settings.generalSection.rpNameExtra':
    'Nombre descriptivo que se muestra en la solicitud de la llave de acceso.',
  'pages.settings.generalSection.rpNamePlaceholder': 'RustDesk Console',
  'pages.settings.generalSection.security': 'Seguridad y mantenimiento',
  'pages.settings.generalSection.jwtExpiryDays':
    'Caducidad del token JWT (días)',
  'pages.settings.generalSection.jwtExpiryDaysExtra':
    'Número de días que tardan en caducar los tokens de los usuarios que han iniciado sesión. Debe ser al menos 1.',
  'pages.settings.generalSection.jwtExpiryDaysRequired':
    'Introduce un número entero positivo',
  'pages.settings.generalSection.auditRetentionDays':
    'Conservación de los registros de auditoría (días)',
  'pages.settings.generalSection.auditRetentionDaysExtra':
    'Número de días que se conservan los registros de auditoría antes de la limpieza automática. Pon 0 para desactivar la limpieza automática.',
  'pages.settings.generalSection.auditRetentionDaysRequired':
    'Introduce un número entero no negativo',
  'pages.settings.generalSection.deviceCloneIsolation':
    'Aislamiento de dispositivos clonados',
  'pages.settings.generalSection.deviceCloneIsolationWarning':
    'No lo desactives a la ligera una vez activado. El modo antiguo no puede resolver los registros derivados y puede crear dispositivos duplicados o fusionados. Haz una copia de seguridad de la base de datos antes de activarlo. Consulta docs/clone-isolation.md.',
  'pages.settings.generalSection.deviceCloneIsolationExtra':
    'Separa los clientes clonados que comparten un UUID pero tienen distintos ID de RustDesk. Desactivado de forma predeterminada.',
};
