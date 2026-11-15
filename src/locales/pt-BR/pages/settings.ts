export default {
  'pages.settings.save': 'Salvar Configurações',
  'pages.settings.general': 'Configurações Gerais',
  'pages.settings.fetchFailed': 'Falha ao carregar configurações',
  'pages.settings.saveSuccess': 'Configurações salvas com sucesso',
  'pages.settings.saveFailed': 'Falha ao salvar configurações',
  'pages.settings.generalSection.watermark': "Marca d'água do usuário",
  'pages.settings.generalSection.watermarkExtra':
    'Sobrepõe o nome de usuário atual em cada página para responsabilidade.',
  'pages.settings.generalSection.language': 'Idioma Padrão',
  'pages.settings.generalSection.languageExtra':
    'Idioma padrão da interface para novos visitantes. Usuários autenticados mantêm sua própria preferência.',
  'pages.settings.generalSection.languagePlaceholder':
    'Selecione o idioma padrão',
  'pages.settings.generalSection.site': 'Site',
  'pages.settings.generalSection.frontendUrl': 'URL do Frontend',
  'pages.settings.generalSection.frontendUrlPlaceholder':
    'https://console.example.com',
  'pages.settings.generalSection.backendUrl': 'URL do Backend',
  'pages.settings.generalSection.backendUrlExtra':
    'Deixe em branco para usar a mesma origem do frontend.',
  'pages.settings.generalSection.backendUrlPlaceholder':
    'https://api.example.com',
  'pages.settings.generalSection.urlInvalid': 'Informe uma URL válida',
  'pages.settings.generalSection.webauthn': 'WebAuthn / Passkeys',
  'pages.settings.generalSection.webauthnEnabled': 'Ativar WebAuthn',
  'pages.settings.generalSection.webauthnEnabledExtra':
    'Permite que usuários se registrem e entrem com passkeys.',
  'pages.settings.generalSection.webauthnUnsupported':
    'Este navegador não suporta WebAuthn. O login por passkey ficará indisponível para usuários em clientes sem suporte.',
  'pages.settings.generalSection.rpName': 'Nome da Parte Confiável',
  'pages.settings.generalSection.rpNameExtra':
    'Nome amigável exibido no prompt de passkey.',
  'pages.settings.generalSection.rpNamePlaceholder': 'RustDesk Console',
  'pages.settings.generalSection.security': 'Segurança e Manutenção',
  'pages.settings.generalSection.jwtExpiryDays':
    'Expiração do Token JWT (Dias)',
  'pages.settings.generalSection.jwtExpiryDaysExtra':
    'Número de dias antes que os tokens de usuários expirem. Deve ser pelo menos 1.',
  'pages.settings.generalSection.jwtExpiryDaysRequired':
    'Informe um número inteiro positivo',
  'pages.settings.generalSection.auditRetentionDays':
    'Retenção de Logs de Auditoria (Dias)',
  'pages.settings.generalSection.auditRetentionDaysExtra':
    'Número de dias para manter os logs de auditoria antes da limpeza automática. Defina como 0 para desativar.',
  'pages.settings.generalSection.auditRetentionDaysRequired':
    'Informe um número inteiro não negativo',
  'pages.settings.generalSection.deviceCloneIsolation':
    'Isolamento de Clones de Dispositivos',
  'pages.settings.generalSection.deviceCloneIsolationWarning':
    'Não desative casualmente após habilitar. O modo legado não consegue resolver os registros derivados e pode criar dispositivos duplicados ou mesclados. Faça backup do banco de dados antes de habilitar. Veja docs/clone-isolation.md.',
  'pages.settings.generalSection.deviceCloneIsolationExtra':
    'Separar clientes clonados que compartilham um UUID mas têm diferentes IDs RustDesk. Desativado por padrão.',
};
