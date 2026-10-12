export default {
  'pages.servers.network.title': 'Configurações de rede',
  'pages.servers.network.selection': 'Controle de congestionamento TCP',
  'pages.servers.network.aboutTitle':
    'Sobre o controle de congestionamento TCP',
  'pages.servers.network.resultDetails': 'Detalhes da identificação',
  'pages.servers.network.unknown': 'Não foi possível identificar',
  'pages.servers.network.loading': 'Identificando…',
  'pages.servers.network.multiple': 'Por modelo de rede',
  'pages.servers.network.notConnected': 'Não conectado',
  'pages.servers.network.notApplicable': 'TCP não utilizado',
  'pages.servers.network.about.system':
    'Configuração TCP atual no escopo de rede observado. Cada conexão pode usar outro algoritmo.',
  'pages.servers.network.about.entry':
    'Algoritmo da conexão que envia a imagem ao navegador. Com proxies, corresponde ao último proxy de entrada.',
  'pages.servers.network.about.relay':
    'Algoritmo da conexão que envia a imagem do hbbr ao gateway web.',
  'pages.servers.network.about.modify':
    'O controle de congestionamento TCP pertence à rede do sistema. Esta tela apenas mostra os resultados. Faça alterações no sistema, contêiner ou aplicativo correspondente.',
  'pages.servers.network.currentConfiguration':
    'O algoritmo de controle de congestionamento TCP usado por uma conexão pode diferir da configuração do sistema.',
  'pages.servers.network.actualConnection':
    'Algoritmo real lido nesta conexão de envio.',
  'pages.servers.network.registeredAlgorithms': 'Algoritmos disponíveis',
  'pages.servers.network.commonAlgorithms':
    'Algoritmos comuns; suporte nesta máquina não confirmado.',
  'pages.servers.network.algorithm': 'Algoritmo',
  'pages.servers.network.feature': 'Comportamento',
  'pages.servers.network.suitable': 'Indicado para (resultados a medir)',
  'pages.servers.network.system.linux': 'Linux',
  'pages.servers.network.system.windows': 'Windows',
  'pages.servers.network.system.macos': 'macOS',
  'pages.servers.network.system.unknown': 'Sistema desconhecido',
  'pages.servers.network.deployment.native': 'Implantação nativa',
  'pages.servers.network.deployment.container': 'Implantação em contêiner',
  'pages.servers.network.deployment.kubernetes': 'Implantação Kubernetes',
  'pages.servers.network.deployment.unknown': 'Implantação desconhecida',
  'pages.servers.network.scope.host': 'Este sistema',
  'pages.servers.network.scope.container': 'Rede do contêiner',
  'pages.servers.network.scope.namespace': 'Escopo de rede isolado',
  'pages.servers.network.scope.unknown': 'Escopo de leitura desconhecido',
  'pages.servers.network.reason.permission_denied':
    'O serviço não pode ler este escopo de rede.',
  'pages.servers.network.reason.tool_unavailable':
    'Ferramentas de diagnóstico indisponíveis.',
  'pages.servers.network.reason.source_unavailable':
    'Não foi possível ler as informações do sistema.',
  'pages.servers.network.reason.invalid_response':
    'Informações incompletas ou inválidas.',
  'pages.servers.network.reason.platform_unobservable':
    'Não foi possível ler o algoritmo desta conexão neste sistema.',
  'pages.servers.network.reason.namespace_unobservable':
    'Não é possível ler a rede do remetente.',
  'pages.servers.network.reason.proxy_unobservable':
    'O proxy de entrada não informa o algoritmo real desta conexão.',
  'pages.servers.network.reason.connection_not_found':
    'Nenhuma conexão de envio correspondente encontrada.',
  'pages.servers.network.reason.ambiguous_connection':
    'Várias conexões correspondem; sessão não identificada.',
  'pages.servers.network.reason.not_connected':
    'A sessão não tem conexão ativa.',
  'pages.servers.network.reason.not_tcp': 'Este caminho não usa TCP.',
  'pages.servers.network.reason.system_selected':
    'O sistema escolhe por modelo de rede ou política de conexão; não há um valor único confirmado.',
  'pages.servers.network.guide.reno.feature':
    'Reduz a velocidade após perda de pacotes',
  'pages.servers.network.guide.reno.suitable':
    'Redes que priorizam compatibilidade',
  'pages.servers.network.guide.cubic.feature':
    'Ajusta a taxa pela janela de congestionamento',
  'pages.servers.network.guide.cubic.suitable':
    'Redes públicas e de alta capacidade',
  'pages.servers.network.guide.bbr.feature': 'Estima capacidade e atraso',
  'pages.servers.network.guide.bbr.suitable':
    'Longas distâncias e alta latência',
  'pages.servers.network.guide.hybrid.feature': 'Combina perda e atraso',
  'pages.servers.network.guide.hybrid.suitable': 'Equilibrar vazão e latência',
  'pages.servers.network.guide.dctcp.feature':
    'Detecta congestionamento cedo com ECN',
  'pages.servers.network.guide.dctcp.suitable': 'Redes de data center com ECN',
  'pages.servers.network.guide.prague.feature':
    'Usa filas L4S de baixa latência',
  'pages.servers.network.guide.prague.suitable': 'Redes e aplicativos com L4S',
  'pages.servers.network.guide.delay.feature': 'Responde ao atraso nas filas',
  'pages.servers.network.guide.delay.suitable':
    'Redes que buscam filas menores',
  'pages.servers.network.guide.background.feature':
    'Cede capacidade a outros fluxos',
  'pages.servers.network.guide.background.suitable':
    'Downloads em segundo plano e baixa prioridade',
  'pages.servers.network.guide.other.feature':
    'Algoritmo fornecido pelo sistema',
  'pages.servers.network.guide.other.suitable':
    'Consulte a documentação do sistema',
  'pages.servers.network.scopeLabel': 'Escopo da leitura: ',
  'pages.servers.network.scopeContext.console':
    'Escopo da leitura: ambiente de rede que executa o Console.',
  'pages.servers.network.scopeContext.node':
    'Escopo da leitura: ambiente de rede do nó de gerenciamento cadastrado.',
  'pages.servers.network.managementUnavailable':
    'Gerenciamento do servidor não conectado',
  'pages.servers.network.managementSetup':
    'Conecte o gerenciamento para visualizar e gerenciar hbbs e hbbr. As informações de rede continuam disponíveis.',
};
