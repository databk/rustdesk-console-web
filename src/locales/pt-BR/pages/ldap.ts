export default {
  'pages.ldap.title': 'Configuração LDAP',
  'pages.ldap.description':
    'Configure a autenticação LDAP/Active Directory. Quando ativado, os usuários serão autenticados automaticamente via LDAP.',
  'pages.ldap.urls': 'URLs do Servidor',
  'pages.ldap.urlsRequired': 'Informe pelo menos uma URL de servidor LDAP',
  'pages.ldap.urlPlaceholder': 'ex.: ldaps://ad.exemplo.com:636',
  'pages.ldap.addUrl': 'Adicionar URL do Servidor',
  'pages.ldap.bindDN': 'DN de Vinculação',
  'pages.ldap.bindDNRequired': 'Informe o DN da conta de serviço',
  'pages.ldap.bindDNPlaceholder':
    'ex.: CN=svc-ldap,OU=ServiceAccounts,DC=example,DC=com',
  'pages.ldap.bindCredentials': 'Senha de Vinculação',
  'pages.ldap.bindCredentialsRequired': 'Informe a senha da conta de serviço',
  'pages.ldap.bindCredentialsPlaceholder':
    'Informe a senha da conta de serviço',
  'pages.ldap.searchBase': 'DN Base de Pesquisa',
  'pages.ldap.searchBaseRequired': 'Informe o DN base de pesquisa',
  'pages.ldap.searchBasePlaceholder': 'ex.: DC=example,DC=com',
  'pages.ldap.searchFilter': 'Filtro de Pesquisa',
  'pages.ldap.searchFilterRequired': 'Informe o filtro de pesquisa',
  'pages.ldap.searchFilterHelp':
    'Use {{username}} como marcador do nome de usuário. AD: (sAMAccountName={{username}}), OpenLDAP: (uid={{username}})',
  'pages.ldap.searchFilterPlaceholder': 'ex.: (sAMAccountName={{username}})',
  'pages.ldap.searchAttributes': 'Atributos de Pesquisa',
  'pages.ldap.searchAttributePlaceholder':
    'ex.: dn, sAMAccountName, mail, displayName',
  'pages.ldap.addAttribute': 'Adicionar Atributo',
  'pages.ldap.groupSearchBase': 'DN Base de Pesquisa de Grupos',
  'pages.ldap.groupSearchBasePlaceholder': 'ex.: OU=Groups,DC=example,DC=com',
  'pages.ldap.groupSearchFilter': 'Filtro de Pesquisa de Grupo',
  'pages.ldap.groupSearchFilterHelp':
    'Use {{dn}} como marcador do DN do usuário. Ex.: (member={{dn}})',
  'pages.ldap.groupSearchFilterPlaceholder': 'ex.: (member={{dn}})',
  'pages.ldap.adminGroups': 'Grupos Administradores',
  'pages.ldap.adminGroupsHelp':
    'Usuários desses grupos LDAP serão mapeados como administradores (comparação sem diferenciar maiúsculas e minúsculas)',
  'pages.ldap.adminGroupPlaceholder':
    'ex.: CN=Admins,OU=Groups,DC=example,DC=com',
  'pages.ldap.addAdminGroup': 'Adicionar Grupo Administrador',
  'pages.ldap.tlsOptions': 'Opções TLS',
  'pages.ldap.tlsCa': 'Certificado CA (PEM)',
  'pages.ldap.tlsCaPlaceholder': '-----BEGIN CERTIFICATE-----\n...',
  'pages.ldap.tlsCert': 'Certificado do Cliente (PEM)',
  'pages.ldap.tlsCertPlaceholder': '-----BEGIN CERTIFICATE-----\n...',
  'pages.ldap.tlsKey': 'Chave Privada do Cliente (PEM)',
  'pages.ldap.tlsKeyPlaceholder': '-----BEGIN PRIVATE KEY-----\n...',
  'pages.ldap.tlsServername': 'Nome do Servidor SNI',
  'pages.ldap.tlsServernamePlaceholder':
    'Indicação do Nome do Servidor para TLS',
  'pages.ldap.enabled': 'Ativar Autenticação LDAP',
  'pages.ldap.enabledHelp':
    'Quando ativado, os usuários serão autenticados no servidor LDAP. Usuários já vinculados ao LDAP sempre utilizarão autenticação LDAP independentemente desta configuração.',
  'pages.ldap.testConnection': 'Testar Conexão',
  'pages.ldap.testSuccess': 'Teste de conexão LDAP realizado com sucesso',
  'pages.ldap.testFailed': 'Falha no teste de conexão LDAP',
  'pages.ldap.saveSuccess': 'Configuração LDAP salva com sucesso',
  'pages.ldap.saveFailed': 'Falha ao salvar configuração LDAP',
  'pages.ldap.createdAt': 'Criado em',
  'pages.ldap.updatedAt': 'Atualizado em',
};
