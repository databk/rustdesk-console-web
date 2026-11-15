export default {
  'pages.ldap.title': 'LDAP Configuration',
  'pages.ldap.description':
    'Configure LDAP/Active Directory authentication. Users will be automatically authenticated via LDAP when enabled.',
  'pages.ldap.urls': 'Server URLs',
  'pages.ldap.urlsRequired': 'Please enter at least one LDAP server URL',
  'pages.ldap.urlPlaceholder': 'e.g. ldaps://ad.example.com:636',
  'pages.ldap.addUrl': 'Add Server URL',
  'pages.ldap.bindDN': 'Bind DN',
  'pages.ldap.bindDNRequired': 'Please enter the service account Bind DN',
  'pages.ldap.bindDNPlaceholder':
    'e.g. CN=svc-ldap,OU=ServiceAccounts,DC=example,DC=com',
  'pages.ldap.bindCredentials': 'Bind Password',
  'pages.ldap.bindCredentialsRequired':
    'Please enter the service account password',
  'pages.ldap.bindCredentialsPlaceholder':
    'Please enter the service account password',
  'pages.ldap.searchBase': 'Search Base DN',
  'pages.ldap.searchBaseRequired': 'Please enter the search base DN',
  'pages.ldap.searchBasePlaceholder': 'e.g. DC=example,DC=com',
  'pages.ldap.searchFilter': 'Search Filter',
  'pages.ldap.searchFilterRequired': 'Please enter the search filter',
  'pages.ldap.searchFilterHelp':
    'Use {{username}} as the username placeholder. AD: (sAMAccountName={{username}}), OpenLDAP: (uid={{username}})',
  'pages.ldap.searchFilterPlaceholder': 'e.g. (sAMAccountName={{username}})',
  'pages.ldap.searchAttributes': 'Search Attributes',
  'pages.ldap.searchAttributePlaceholder':
    'e.g. dn, sAMAccountName, mail, displayName',
  'pages.ldap.addAttribute': 'Add Attribute',
  'pages.ldap.groupSearchBase': 'Group Search Base DN',
  'pages.ldap.groupSearchBasePlaceholder': 'e.g. OU=Groups,DC=example,DC=com',
  'pages.ldap.groupSearchFilter': 'Group Search Filter',
  'pages.ldap.groupSearchFilterHelp':
    'Use {{dn}} as the user DN placeholder. e.g. (member={{dn}})',
  'pages.ldap.groupSearchFilterPlaceholder': 'e.g. (member={{dn}})',
  'pages.ldap.adminGroups': 'Admin Groups',
  'pages.ldap.adminGroupsHelp':
    'Users in these LDAP groups will be mapped as administrators (case-insensitive match)',
  'pages.ldap.adminGroupPlaceholder':
    'e.g. CN=Admins,OU=Groups,DC=example,DC=com',
  'pages.ldap.addAdminGroup': 'Add Admin Group',
  'pages.ldap.tlsOptions': 'TLS Options',
  'pages.ldap.tlsCa': 'CA Certificate (PEM)',
  'pages.ldap.tlsCaPlaceholder': '-----BEGIN CERTIFICATE-----\n...',
  'pages.ldap.tlsCert': 'Client Certificate (PEM)',
  'pages.ldap.tlsCertPlaceholder': '-----BEGIN CERTIFICATE-----\n...',
  'pages.ldap.tlsKey': 'Client Private Key (PEM)',
  'pages.ldap.tlsKeyPlaceholder': '-----BEGIN PRIVATE KEY-----\n...',
  'pages.ldap.tlsServername': 'SNI Server Name',
  'pages.ldap.tlsServernamePlaceholder': 'Server Name Indication for TLS',
  'pages.ldap.enabled': 'Enable LDAP Authentication',
  'pages.ldap.enabledHelp':
    'When enabled, users will be authenticated against the LDAP server. Existing LDAP-linked users will always use LDAP authentication regardless of this setting.',
  'pages.ldap.testConnection': 'Test Connection',
  'pages.ldap.testSuccess': 'LDAP connection test successful',
  'pages.ldap.testFailed': 'LDAP connection test failed',
  'pages.ldap.saveSuccess': 'LDAP configuration saved successfully',
  'pages.ldap.saveFailed': 'Failed to save LDAP configuration',
  'pages.ldap.createdAt': 'Created At',
  'pages.ldap.updatedAt': 'Updated At',
};
