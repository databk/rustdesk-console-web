export default {
  'pages.servers.network.title': 'Configuración de red',
  'pages.servers.network.selection': 'Control de congestión TCP',
  'pages.servers.network.aboutTitle': 'Acerca del control de congestión TCP',
  'pages.servers.network.resultDetails':
    'Detalles de la identificación del algoritmo',
  'pages.servers.network.unknown': 'No se puede identificar',
  'pages.servers.network.loading': 'Identificando…',
  'pages.servers.network.multiple': 'Según la plantilla de red',
  'pages.servers.network.notConnected': 'Sin conectar',
  'pages.servers.network.notApplicable': 'No usa TCP',
  'pages.servers.network.about.system':
    'Configuración actual del control de congestión TCP en el ámbito de red observado. Algunas conexiones pueden usar otro algoritmo.',
  'pages.servers.network.about.entry':
    'El algoritmo de la conexión que envía los datos de pantalla al navegador. Si hay proxies, es el último proxy de entrada.',
  'pages.servers.network.about.relay':
    'El algoritmo de la conexión que envía los datos de pantalla desde hbbr a la pasarela web.',
  'pages.servers.network.about.modify':
    'El control de congestión TCP es un mecanismo de red del sistema. Esta vista solo muestra lo observado. Haz los cambios en el sistema, contenedor o aplicación correspondiente.',
  'pages.servers.network.currentConfiguration':
    'El algoritmo de control de congestión TCP que usa cada conexión puede ser distinto de la configuración del sistema.',
  'pages.servers.network.actualConnection':
    'Algoritmo real leído de esta conexión de envío.',
  'pages.servers.network.registeredAlgorithms':
    'Algoritmos disponibles actualmente',
  'pages.servers.network.commonAlgorithms':
    'Algoritmos habituales del sistema; no se ha confirmado su compatibilidad en esta máquina.',
  'pages.servers.network.algorithm': 'Algoritmo',
  'pages.servers.network.feature': 'Comportamiento',
  'pages.servers.network.suitable': 'Adecuado para (mide los resultados)',
  'pages.servers.network.system.linux': 'Linux',
  'pages.servers.network.system.windows': 'Windows',
  'pages.servers.network.system.macos': 'macOS',
  'pages.servers.network.system.unknown': 'Sistema desconocido',
  'pages.servers.network.deployment.native': 'Despliegue nativo',
  'pages.servers.network.deployment.container': 'Despliegue en contenedor',
  'pages.servers.network.deployment.kubernetes': 'Despliegue en Kubernetes',
  'pages.servers.network.deployment.unknown': 'Despliegue desconocido',
  'pages.servers.network.scope.host': 'Este sistema',
  'pages.servers.network.scope.container': 'Ámbito de red del contenedor',
  'pages.servers.network.scope.namespace': 'Ámbito de red aislado',
  'pages.servers.network.scope.unknown': 'Ámbito de observación desconocido',
  'pages.servers.network.reason.permission_denied':
    'El servicio no puede leer este ámbito de red.',
  'pages.servers.network.reason.tool_unavailable':
    'Las herramientas de diagnóstico del sistema no están disponibles.',
  'pages.servers.network.reason.source_unavailable':
    'No se pudo leer la información de algoritmos del sistema.',
  'pages.servers.network.reason.invalid_response':
    'La información del algoritmo está incompleta o no es válida.',
  'pages.servers.network.reason.platform_unobservable':
    'No se pudo leer el algoritmo de esta conexión en este sistema.',
  'pages.servers.network.reason.namespace_unobservable':
    'No se puede leer el ámbito de red del emisor.',
  'pages.servers.network.reason.proxy_unobservable':
    'El proxy de entrada no informa del algoritmo real de esta conexión.',
  'pages.servers.network.reason.connection_not_found':
    'No se encontró ninguna conexión de envío coincidente.',
  'pages.servers.network.reason.ambiguous_connection':
    'Coinciden varias conexiones; no se pudo identificar esta sesión.',
  'pages.servers.network.reason.not_connected':
    'La sesión no tiene ninguna conexión activa.',
  'pages.servers.network.reason.not_tcp': 'Esta ruta no usa TCP.',
  'pages.servers.network.reason.system_selected':
    'El sistema elige según la plantilla de red o la política de conexión; no se puede confirmar un único valor.',
  'pages.servers.network.guide.reno.feature':
    'Reduce la velocidad tras una pérdida de paquetes',
  'pages.servers.network.guide.reno.suitable':
    'Redes generales que priorizan la compatibilidad',
  'pages.servers.network.guide.cubic.feature':
    'Ajusta la velocidad con la ventana de congestión',
  'pages.servers.network.guide.cubic.suitable':
    'Redes públicas generales y de gran ancho de banda',
  'pages.servers.network.guide.bbr.feature':
    'Estima el ancho de banda y el retardo',
  'pages.servers.network.guide.bbr.suitable':
    'Rutas de larga distancia y alto retardo',
  'pages.servers.network.guide.hybrid.feature':
    'Combina señales de pérdida y de retardo',
  'pages.servers.network.guide.hybrid.suitable':
    'Equilibrar rendimiento y latencia',
  'pages.servers.network.guide.dctcp.feature':
    'Usa ECN para detectar la congestión de forma temprana',
  'pages.servers.network.guide.dctcp.suitable':
    'Redes de centros de datos con ECN',
  'pages.servers.network.guide.prague.feature':
    'Funciona con colas de bajo retardo L4S',
  'pages.servers.network.guide.prague.suitable': 'Redes y aplicaciones con L4S',
  'pages.servers.network.guide.delay.feature':
    'Responde al retardo de las colas',
  'pages.servers.network.guide.delay.suitable':
    'Redes que buscan colas más cortas',
  'pages.servers.network.guide.background.feature':
    'Cede ancho de banda a otro tráfico',
  'pages.servers.network.guide.background.suitable':
    'Descargas en segundo plano y transferencias de baja prioridad',
  'pages.servers.network.guide.other.feature':
    'Algoritmo proporcionado por este sistema',
  'pages.servers.network.guide.other.suitable':
    'Consulta la documentación de algoritmos del sistema',
  'pages.servers.network.scopeLabel': 'Ámbito de lectura: ',
  'pages.servers.network.scopeContext.console':
    'Ámbito de lectura: el entorno de red en el que se ejecuta la consola.',
  'pages.servers.network.scopeContext.node':
    'Ámbito de lectura: el entorno de red del nodo de gestión registrado.',
  'pages.servers.network.managementUnavailable':
    'La gestión de servidores no está conectada',
  'pages.servers.network.managementSetup':
    'Conecta la gestión para ver y administrar hbbs y hbbr. La información de red sigue disponible.',
};
