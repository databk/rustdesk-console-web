export default {
  'pages.smtp.title': 'Configuração SMTP',
  'pages.smtp.description':
    'Configure o servidor SMTP para envio de e-mails de notificação do sistema',
  'pages.smtp.host': 'Endereço do Servidor',
  'pages.smtp.hostPlaceholder': 'Informe o endereço do servidor SMTP',
  'pages.smtp.port': 'Porta',
  'pages.smtp.portPlaceholder': 'Informe o número da porta',
  'pages.smtp.secure': 'Usar SSL/TLS',
  'pages.smtp.secureHelp':
    'Ativa conexão segura (normalmente a porta 465 usa SSL e a 587 usa TLS)',
  'pages.smtp.user': 'Nome de Usuário',
  'pages.smtp.userPlaceholder': 'Informe o usuário de autenticação SMTP',
  'pages.smtp.password': 'Senha',
  'pages.smtp.passwordPlaceholder': 'Informe a senha de autenticação SMTP',
  'pages.smtp.from': 'E-mail do Remetente',
  'pages.smtp.fromPlaceholder': 'Informe o endereço de e-mail do remetente',
  'pages.smtp.enabled': 'Ativar Configuração',
  'pages.smtp.enabledHelp':
    'Quando ativada, esta configuração será utilizada para enviar e-mails do sistema',
  'pages.smtp.testConnection': 'Testar Conexão',
  'pages.smtp.testSuccess': 'Teste de conexão SMTP realizado com sucesso',
  'pages.smtp.testFailed': 'Falha no teste de conexão SMTP',
  'pages.smtp.saveSuccess': 'Configuração SMTP salva com sucesso',
  'pages.smtp.saveFailed': 'Falha ao salvar configuração SMTP',
  'pages.smtp.createdAt': 'Criado em',
  'pages.smtp.updatedAt': 'Atualizado em',
  'pages.serverManagementSettings.title': 'Gerenciamento de Servidores',
  'pages.serverManagementSettings.description':
    'Configure como o console se conecta à API de gerenciamento do hbbs/hbbr',
  'pages.serverManagementSettings.url': 'URL da API de Gerenciamento',
  'pages.serverManagementSettings.urlInvalid':
    'Deve ser uma origem HTTP(S) sem caminho, ex.: http://hbbs:21120',
  'pages.serverManagementSettings.urlHelp':
    'Origem HTTP(S) da API de gerenciamento do hbbs. Deixe em branco para desativar o gerenciamento de servidores.',
  'pages.serverManagementSettings.token': 'Token de Gerenciamento',
  'pages.serverManagementSettings.tokenRequired':
    'Um token de gerenciamento é necessário quando uma URL é definida',
  'pages.serverManagementSettings.tokenTooShort':
    'O token deve conter pelo menos 32 caracteres',
  'pages.serverManagementSettings.tokenHelp':
    'Segredo compartilhado configurado no hbbs/hbbr (RD_MANAGEMENT_TOKEN). Digite ****** para manter o token armazenado inalterado.',
  'pages.serverManagementSettings.nodeId': 'ID do Nó',
  'pages.serverManagementSettings.nodeIdRequired': 'Informe um ID de nó',
  'pages.serverManagementSettings.nodeIdInvalid':
    'Apenas letras, números, hífens e sublinhados (máx. 64 caracteres)',
  'pages.serverManagementSettings.nodeIdHelp':
    'Identificador deste nó do console, ex.: rustdesk',
  'pages.serverManagementSettings.nodeName': 'Nome do Nó',
  'pages.serverManagementSettings.nodeNameRequired': 'Informe um nome de nó',
  'pages.serverManagementSettings.nodeNameHelp':
    'Nome de exibição deste nó do console, ex.: RustDesk',
  'pages.serverManagementSettings.tokenSyncWarning':
    'Após alterar o token, atualize o SERVER_MANAGEMENT_TOKEN no arquivo .env do hbbs/hbbr e reinicie-os para que ambos os lados usem o mesmo token.',
  'pages.serverManagementSettings.saveSuccess':
    'Configuração de gerenciamento de servidores salva com sucesso',
  'pages.serverManagementSettings.saveFailed':
    'Falha ao salvar a configuração de gerenciamento de servidores',
  'pages.serverManagementSettings.loadFailed':
    'Falha ao carregar a configuração de gerenciamento de servidores',
  'pages.serverManagementSettings.createdAt': 'Criado em',
  'pages.serverManagementSettings.updatedAt': 'Atualizado em',
};
