export default {
  'pages.servers.network.title': 'Paramètres réseau',
  'pages.servers.network.selection': 'Contrôle de congestion TCP',
  'pages.servers.network.aboutTitle': 'À propos du contrôle de congestion TCP',
  'pages.servers.network.resultDetails': 'Détails de l’identification',
  'pages.servers.network.unknown': 'Identification impossible',
  'pages.servers.network.loading': 'Identification…',
  'pages.servers.network.multiple': 'Selon le modèle réseau',
  'pages.servers.network.notConnected': 'Non connecté',
  'pages.servers.network.notApplicable': 'TCP non utilisé',
  'pages.servers.network.about.system':
    'Configuration TCP actuelle dans le périmètre réseau observé. Une connexion peut utiliser un autre algorithme.',
  'pages.servers.network.about.entry':
    'Algorithme de la connexion qui envoie l’image au navigateur. Avec des proxys, il s’agit du dernier proxy d’entrée.',
  'pages.servers.network.about.relay':
    'Algorithme de la connexion qui envoie l’image de hbbr à la passerelle web.',
  'pages.servers.network.about.modify':
    'Le contrôle de congestion TCP relève du système réseau. Cet affichage est en lecture seule. Les modifications se font dans le système, le conteneur ou l’application concernés.',
  'pages.servers.network.currentConfiguration':
    'L’algorithme de contrôle de congestion TCP utilisé par une connexion peut différer de la configuration système.',
  'pages.servers.network.actualConnection':
    'Algorithme réel lu sur cette connexion d’envoi.',
  'pages.servers.network.registeredAlgorithms': 'Algorithmes disponibles',
  'pages.servers.network.commonAlgorithms':
    'Algorithmes courants ; prise en charge sur cette machine non confirmée.',
  'pages.servers.network.algorithm': 'Algorithme',
  'pages.servers.network.feature': 'Comportement',
  'pages.servers.network.suitable': 'Usage adapté (résultats à mesurer)',
  'pages.servers.network.system.linux': 'Linux',
  'pages.servers.network.system.windows': 'Windows',
  'pages.servers.network.system.macos': 'macOS',
  'pages.servers.network.system.unknown': 'Système inconnu',
  'pages.servers.network.deployment.native': 'Déploiement natif',
  'pages.servers.network.deployment.container': 'Déploiement en conteneur',
  'pages.servers.network.deployment.kubernetes': 'Déploiement Kubernetes',
  'pages.servers.network.deployment.unknown': 'Déploiement inconnu',
  'pages.servers.network.scope.host': 'Ce système',
  'pages.servers.network.scope.container': 'Réseau du conteneur',
  'pages.servers.network.scope.namespace': 'Périmètre réseau isolé',
  'pages.servers.network.scope.unknown': 'Périmètre observé inconnu',
  'pages.servers.network.reason.permission_denied':
    'Le service ne peut pas lire ce périmètre réseau.',
  'pages.servers.network.reason.tool_unavailable':
    'Outils de diagnostic système indisponibles.',
  'pages.servers.network.reason.source_unavailable':
    'Impossible de lire les informations du système.',
  'pages.servers.network.reason.invalid_response':
    'Informations incomplètes ou invalides.',
  'pages.servers.network.reason.platform_unobservable':
    'Impossible de lire l’algorithme de cette connexion sur ce système.',
  'pages.servers.network.reason.namespace_unobservable':
    'Le réseau de l’émetteur n’est pas accessible en lecture.',
  'pages.servers.network.reason.proxy_unobservable':
    'Le proxy d’entrée ne fournit pas l’algorithme réel de cette connexion.',
  'pages.servers.network.reason.connection_not_found':
    'Aucune connexion d’envoi correspondante.',
  'pages.servers.network.reason.ambiguous_connection':
    'Plusieurs connexions correspondent ; session non identifiée.',
  'pages.servers.network.reason.not_connected':
    'La session n’a pas de connexion active.',
  'pages.servers.network.reason.not_tcp': 'Ce chemin n’utilise pas TCP.',
  'pages.servers.network.reason.system_selected':
    'Le système choisit selon un modèle ou une politique de connexion ; valeur unique non confirmée.',
  'pages.servers.network.guide.reno.feature':
    'Ralentit après une perte de paquets',
  'pages.servers.network.guide.reno.suitable':
    'Réseaux privilégiant la compatibilité',
  'pages.servers.network.guide.cubic.feature':
    'Adapte le débit à la fenêtre de congestion',
  'pages.servers.network.guide.cubic.suitable':
    'Réseaux publics et à haut débit',
  'pages.servers.network.guide.bbr.feature': 'Estime le débit et le délai',
  'pages.servers.network.guide.bbr.suitable':
    'Longues distances, forte latence',
  'pages.servers.network.guide.hybrid.feature': 'Combine pertes et délai',
  'pages.servers.network.guide.hybrid.suitable': 'Équilibre débit et latence',
  'pages.servers.network.guide.dctcp.feature':
    'Détecte tôt la congestion avec ECN',
  'pages.servers.network.guide.dctcp.suitable': 'Centres de données avec ECN',
  'pages.servers.network.guide.prague.feature':
    'Utilise les files à faible délai L4S',
  'pages.servers.network.guide.prague.suitable':
    'Réseaux et applications compatibles L4S',
  'pages.servers.network.guide.delay.feature': 'Réagit au délai des files',
  'pages.servers.network.guide.delay.suitable':
    'Réseaux cherchant à réduire les files',
  'pages.servers.network.guide.background.feature':
    'Cède du débit aux autres flux',
  'pages.servers.network.guide.background.suitable':
    'Téléchargements de fond, faible priorité',
  'pages.servers.network.guide.other.feature':
    'Algorithme fourni par ce système',
  'pages.servers.network.guide.other.suitable':
    'Consulter la documentation du système',
  'pages.servers.network.scopeLabel': 'Périmètre de lecture : ',
  'pages.servers.network.scopeContext.console':
    'Périmètre de lecture : environnement réseau de Console.',
  'pages.servers.network.scopeContext.node':
    'Périmètre de lecture : environnement réseau du nœud de gestion enregistré.',
  'pages.servers.network.managementUnavailable':
    'La gestion du serveur n’est pas connectée',
  'pages.servers.network.managementSetup':
    'Connectez la gestion pour consulter et gérer hbbs et hbbr. Les informations réseau restent disponibles.',
};
