declare namespace API {
  type CurrentUser = {
    name?: string;
    display_name?: string;
    email?: string;
    note?: string;
    avatar?: string;
    status?: number;
    is_admin?: boolean;
    third_auth_type?: string;
    info?: {
      has_password?: boolean;
      has_totp?: boolean;
      email_verification?: boolean;
      email_alarm_notification?: boolean;
      other?: Record<string, any>;
    };
  };

  type ChangePasswordParams = {
    current_password: string;
    new_password: string;
  };

  type UpdateProfileParams = {
    display_name?: string;
    email?: string;
    note?: string;
  };

  type Setup2FAResponse = {
    secret: string;
    otpauth_url: string;
  };

  type Verify2FAParams = {
    code: string;
  };

  type Setup2FAParams = {
    current_code?: string;
  };

  type Disable2FAParams = {
    code: string;
  };

  type DeviceInfo = {
    os?: string;
    type?: string;
    name?: string;
  };

  type LoginParams = {
    username?: string;
    password?: string;
    type?: 'email_code' | 'tfa_code' | 'sms_code';
    verificationCode?: string;
    tfaCode?: string;
    secret?: string;
    id?: string;
    uuid?: string;
    autoLogin?: boolean;
    deviceInfo?: DeviceInfo;
  };

  type LoginResponse = {
    access_token?: string;
    type?: 'access_token' | 'email_check' | 'tfa_check' | 'passkey_check';
    tfa_type?: 'email_check' | 'tfa_check';
    secret?: string;
    passkey_options?: PublicKeyCredentialRequestOptionsJSON;
    user?: CurrentUser;
  };

  // --- WebAuthn JSON types (base64url-encoded, as returned by the server) ---

  type PublicKeyCredentialCreationOptionsJSON = {
    rp: { name: string; id?: string };
    user: { id: string; name: string; displayName: string };
    challenge: string;
    pubKeyCredParams: Array<{ type: 'public-key'; alg: number }>;
    authenticatorSelection?: {
      authenticatorAttachment?: string;
      residentKey?: string;
      userVerification?: string;
    };
    excludeCredentials?: Array<{
      id: string;
      type: 'public-key';
      transports?: string[];
    }>;
    timeout?: number;
    attestation?: string;
  };

  type PublicKeyCredentialRequestOptionsJSON = {
    challenge: string;
    rpId?: string;
    timeout?: number;
    allowCredentials?: Array<{
      id: string;
      type: 'public-key';
      transports?: string[];
    }>;
    userVerification?: string;
  };

  type RegistrationResponseJSON = {
    id: string;
    rawId: string;
    response: {
      attestationObject: string;
      clientDataJSON: string;
      transports?: string[];
    };
    authenticatorAttachment?: string;
    clientExtensionResults: Record<string, any>;
    type: 'public-key';
  };

  type AuthenticationResponseJSON = {
    id: string;
    rawId: string;
    response: {
      authenticatorData: string;
      clientDataJSON: string;
      signature: string;
      userHandle?: string;
    };
    authenticatorAttachment?: string;
    clientExtensionResults: Record<string, any>;
    type: 'public-key';
  };

  // --- Passkey API types ---

  type PasskeyAuthBeginResponse = {
    secret: string;
    options: PublicKeyCredentialRequestOptionsJSON;
  };

  type PasskeyRegistrationVerifyParams = {
    response: RegistrationResponseJSON;
    name?: string;
  };

  type PasskeyAuthVerifyParams = {
    secret: string;
    response: AuthenticationResponseJSON;
    id?: string;
    uuid?: string;
    deviceInfo?: DeviceInfo;
  };

  type PasskeyCredential = {
    guid: string;
    userGuid: string;
    credentialId: string;
    counter: number;
    transports: string;
    deviceType: string;
    backedUp: boolean;
    name: string;
    createdAt: string;
    updatedAt: string;
  };

  type PasskeyTfaToggleParams = {
    enabled: boolean;
  };

  type SessionItem = {
    jti: string;
    deviceId?: string | null;
    deviceUuid?: string | null;
    deviceOs?: string;
    deviceType?: 'browser' | 'client';
    deviceName?: string;
    createdAt?: string;
    expiresAt?: string;
  };

  type OidcLoginInfo = {
    name: string;
    icon?: string;
  };

  type OidcAuthParams = {
    op: string;
    deviceInfo: DeviceInfo;
    callbackUrl: string;
    id?: string;
    uuid?: string;
  };

  type OidcAuthResponse = {
    code?: string;
    url?: string;
  };

  type PageParams = {
    current?: number;
    pageSize?: number;
  };

  type PaginatedResult<T> = {
    data: T[];
    total: number;
  };

  type ResponseResult = {
    succ?: boolean;
    [key: string]: any;
  };

  type UserItem = {
    guid: string;
    name: string;
    display_name?: string;
    email: string;
    note: string;
    status: number; // -1=未验证, 0=禁用, 1=正常
    is_admin: boolean;
    third_auth_type?: string;
    strategy_guid?: string;
    strategy_name?: string;
    user_group_guid?: string;
    user_group_name?: string;
    avatar?: string;
    created_at?: string;
    updated_at?: string;
  };

  type CreateUserParams = {
    name: string;
    password: string;
    display_name?: string;
    email?: string;
    note?: string;
    user_group_guid?: string;
  };

  type InviteUserParams = {
    email: string;
    name: string;
    display_name?: string;
    note?: string;
    user_group_guid?: string;
  };

  type UpdateUserParams = {
    name?: string;
    display_name?: string;
    email?: string;
    note?: string;
    status?: number;
    is_admin?: boolean;
    user_group_guid?: string;
  };

  type BatchUpdateUserStatusParams = {
    user_guids: string[];
    status: number; // -1=未验证, 0=禁用, 1=正常
  };

  type BatchUpdateUserSecurityParams = {
    user_guids: string[];
    tfa_enforce?: boolean;
    email_verification?: boolean;
  };

  type BatchForceLogoutParams = {
    user_guids: string[];
  };

  type UpdateUserSecurityParams = {
    tfa_enforce?: boolean;
    email_verification?: boolean;
  };

  type BatchResult = {
    succeeded: string[];
    failed: Array<{ guid: string; reason: string }>;
    total: number;
    succeededCount: number;
    failedCount: number;
  };

  type AdminUserListParams = {
    current: number;
    pageSize: number;
    status?: number;
    name?: string;
    email?: string;
    is_admin?: 0 | 1;
    third_auth_type?: string;
    strategy_name?: string;
    user_group_guid?: string;
    user_group_name?: string;
  };

  type DeviceItem = {
    id: string;
    guid: string;
    info?: {
      device_name?: string;
      username?: string;
      os?: string;
      version?: string;
      cpu?: string;
      memory?: string;
      ip?: string;
    };
    status?: number;
    is_online?: boolean;
    last_online?: string;
    user?: string;
    user_name?: string;
    device_group?: string;
    device_group_name?: string;
    strategy_name?: string;
    note?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  };

  type UpdateDeviceParams = {
    userName?: string | null;
    deviceGroupName?: string | null;
    strategyName?: string | null;
    note?: string | null;
  };

  type DeviceGroupItem = {
    guid: string;
    name: string;
    note?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  };

  type CreateDeviceGroupParams = {
    name: string;
    note?: string;
  };

  type UpdateDeviceGroupParams = {
    name?: string;
    note?: string;
  };

  type AddressBookProfile = {
    guid: string;
    name: string;
    note?: string;
    is_personal?: boolean;
  };

  type SharedAddressBook = {
    guid: string;
    name: string;
    owner?: string;
    note?: string;
    rule?: 1 | 2 | 3;
    is_owner?: boolean;
    info?: Record<string, any>;
    [key: string]: any;
  };

  type AddSharedAddressBookParams = {
    name: string;
    note?: string;
    password?: string;
  };

  type UpdateSharedAddressBookParams = {
    guid: string;
    name?: string;
    note?: string;
  };

  type PeerItem = {
    id: string;
    hostname?: string;
    os?: string;
    os_version?: string;
    status?: string;
    note?: string;
    tags?: string[];
    [key: string]: any;
  };

  type AddPeerParams = {
    id: string;
    alias?: string;
    hash?: string;
    password?: string;
    hostname?: string;
    platform?: string;
    note?: string;
    tags?: string[];
  };

  type UpdatePeerParams = {
    id?: string;
    alias?: string;
    hash?: string;
    password?: string;
    hostname?: string;
    platform?: string;
    note?: string;
    tags?: string[];
  };

  type TagItem = {
    name: string;
    color?: number;
    peer_count?: number;
  };

  type AddTagParams = {
    name: string;
    color?: number;
  };

  type RenameTagParams = {
    old: string;
    new: string;
  };

  type UpdateTagParams = {
    name: string;
    color: number;
  };

  type RuleItem = {
    guid: string;
    addressBook: {
      guid: string;
      name?: string;
    };
    user?: string;
    group?: string;
    rule: 1 | 2 | 3;
    ruleType: 'user' | 'group' | 'everyone';
    createdAt?: string;
    updatedAt?: string;
  };

  type CreateRuleParams = {
    guid: string;
    user?: string;
    group?: string;
    rule?: 1 | 2 | 3;
  };

  type UpdateRuleParams = {
    guid: string;
    rule: 1 | 2 | 3;
  };

  type ConnectionAuditItem = {
    id?: number;
    deviceId?: string;
    deviceUuid?: string;
    connId?: string;
    ip?: string;
    action?: string;
    peerId?: string;
    peerName?: string;
    type?: number;
    note?: string;
    createdAt?: string;
    requestedAt?: string;
    establishedAt?: string;
    closedAt?: string;
    [key: string]: any;
  };

  type FileAuditItem = {
    id?: number;
    deviceId?: string;
    deviceUuid?: string;
    peerId?: string;
    type?: number;
    path?: string;
    isFile?: boolean;
    clientIp?: string;
    clientName?: string;
    fileCount?: number;
    files?: Array<[string, number]>;
    createdAt?: string;
    [key: string]: any;
  };

  type AlarmAuditItem = {
    id?: number;
    deviceId?: string;
    deviceUuid?: string;
    typ?: number;
    infoId?: string;
    infoIp?: string;
    infoName?: string;
    createdAt?: string;
    [key: string]: any;
  };

  type ConsoleAuditItem = {
    id?: string;
    user?: string;
    action?: string;
    detail?: string;
    time?: string;
    [key: string]: any;
  };

  type AddressBookSettings = {
    max_peer_one_ab?: number;
    [key: string]: any;
  };

  type SystemInfo = {
    version?: string;
    [key: string]: any;
  };

  type UpdateCheckParams = {
    frontend_version: string;
  };

  type UpdateCheckComponent = {
    has_update: boolean;
    version?: string;
    release_url?: string;
    release_note?: string;
    published_at?: string;
  };

  type UpdateCheckResult = {
    backend: API.UpdateCheckComponent;
    frontend: API.UpdateCheckComponent;
  };

  type LicenseInfo = {
    currentDevices?: number;
    maxDevices?: number | string;
    expireTime?: string;
    warning?: string;
    [key: string]: any;
  };

  type RoleItem = {
    guid: string;
    name: string;
    note?: string;
    permission_count?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  };

  type CreateRoleParams = {
    name: string;
    note?: string;
    permissions?: string[];
  };

  type UpdateRoleParams = {
    name?: string;
    note?: string;
    permissions?: string[];
  };

  type PermissionItem = {
    id: string;
    name: string;
    description?: string;
    module?: string;
    [key: string]: any;
  };

  type StrategyItem = {
    guid: string;
    name: string;
    note?: string;
    config_options?: Record<string, string>;
    updated_at?: string;
    [key: string]: any;
  };

  type CreateStrategyParams = {
    name: string;
    note?: string;
    config_options?: Record<string, string>;
  };

  type UpdateStrategyParams = {
    name?: string;
    note?: string;
    config_options?: Record<string, string>;
  };

  type StrategyAssignParams = {
    target_type: 'device' | 'user' | 'device_group';
    target_guids: string[];
  };

  type StrategyBatchResult = {
    success: string[];
    errors: Array<{
      target_guid: string;
      reason: string;
    }>;
  };

  type StrategyAssignmentDeviceItem = {
    uuid: string;
    id: string;
    status: number;
  };

  type StrategyAssignmentUserItem = {
    guid: string;
    username: string;
    email: string;
    status: number;
    is_admin: boolean;
  };

  type StrategyAssignmentDeviceGroupItem = {
    guid: string;
    name: string;
    note: string;
  };

  type StrategyAssignmentParams = {
    target_type: 'device' | 'user' | 'device_group';
    current: number;
    pageSize: number;
  };

  type UserGroupItem = {
    guid: string;
    name: string;
    note?: string;
    user_count?: number;
    is_default?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  };

  type CreateUserGroupParams = {
    name: string;
    note?: string;
  };

  type UpdateUserGroupParams = {
    name?: string;
    note?: string;
  };

  type UserGroupMoveResult = {
    message: string;
    moved_user_count: number;
  };

  type CustomClientItem = {
    guid: string;
    name: string;
    config?: Record<string, any>;
    download_url?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  };

  type CreateCustomClientParams = {
    name: string;
    config?: Record<string, any>;
  };

  type UpdateCustomClientParams = {
    name?: string;
    config?: Record<string, any>;
  };

  type SettingItem = {
    key: string;
    value: string | number | boolean;
    type?: string;
    description?: string;
    category?: string;
    [key: string]: any;
  };

  type DashboardOverview = {
    users: {
      total: number;
      active: number;
      online: number;
      newToday: number;
    };
    devices: {
      total: number;
      online: number;
      offline: number;
      groups: number;
    };
    connections: {
      active: number;
      today: number;
      avgDuration: number;
    };
    audits: {
      alarms: number;
      unreadAlarms: number;
      criticalAlarms: number;
    };
    files: {
      transferred: number;
      totalSize: string;
    };
  };

  type DashboardStatistics = {
    userDistribution: {
      byRole: {
        admin: number;
        user: number;
      };
      byStatus: {
        active: number;
        inactive: number;
        disabled: number;
        unverified: number;
      };
    };
    deviceDistribution: {
      byGroup: Array<{
        groupId: string;
        groupName: string;
        count: number;
      }>;
      byStatus: {
        online: number;
        offline: number;
      };
    };
    connectionAnalysis: {
      avgDuration: number;
      totalDuration: number;
      successRate: number;
      failureCount: number;
    };
    fileTransfer: {
      totalFiles: number;
      totalSize: number;
      uploadCount: number;
      downloadCount: number;
    };
  };

  type DashboardTrends = {
    connectionTrend?: Array<{
      date: string;
      count: number;
      avgDuration: number;
    }>;
    userActiveTrend?: Array<{
      date: string;
      newUsers: number;
      activeUsers: number;
    }>;
    alarmTrend?: Array<{
      date: string;
      critical: number;
      warning: number;
      info: number;
    }>;
  };

  type DashboardRealtime = {
    activeConnections: Array<{
      id: string;
      userId: string;
      userName: string;
      deviceId: string;
      deviceName: string;
      startTime: string;
      duration: number;
    }>;
    recentEvents: Array<{
      type: 'connection' | 'file' | 'alarm';
      action: string;
      user: string;
      target: string;
      timestamp: string;
      status: 'success' | 'failed' | 'warning';
    }>;
    systemStatus: {
      cpu: number | null;
      memory: number | null;
      disk: number | null;
      uptime: number | null;
    };
  };

  type GeneralSettings = {
    watermarkEnabled: boolean;
    defaultLanguage: string;
    site: {
      frontendUrl: string;
      backendUrl: string;
    };
    webauthn: {
      enabled: boolean;
      rpName: string;
    };
  };

  type FrontendSettings = {
    watermarkEnabled: boolean;
    defaultLanguage: string;
    webauthnEnabled: boolean;
  };

  type SMTPConfig = {
    host: string;
    port: number;
    secure: boolean;
    user?: string;
    pass?: string;
    from: string;
    enabled: boolean;
    createdAt?: string;
    updatedAt?: string;
  };

  type UpdateSMTPConfigParams = {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    from?: string;
    enabled?: boolean;
  };

  type TestSMTPConfigParams = {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    from?: string;
  };

  type TestSMTPResult = {
    success: boolean;
    message: string;
  };

  type OidcProviderType = 'oidc' | 'oauth2';

  type OidcProvider = {
    guid: string;
    type?: OidcProviderType;
    name: string;
    issuer: string;
    clientId: string;
    clientSecret?: string;
    scope?: string;
    authorizationEndpoint?: string;
    tokenEndpoint?: string;
    userinfoEndpoint?: string;
    jwksUri?: string;
    enabled: boolean;
    priority: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  };

  type CreateOidcProviderParams = {
    type?: OidcProviderType;
    name: string;
    issuer: string;
    clientId: string;
    clientSecret?: string;
    scope?: string;
    authorizationEndpoint?: string;
    tokenEndpoint?: string;
    userinfoEndpoint?: string;
    jwksUri?: string;
    enabled?: boolean;
  };

  type UpdateOidcProviderParams = {
    type?: OidcProviderType;
    name?: string;
    issuer?: string;
    clientId?: string;
    clientSecret?: string;
    scope?: string;
    authorizationEndpoint?: string;
    tokenEndpoint?: string;
    userinfoEndpoint?: string;
    jwksUri?: string;
    enabled?: boolean;
  };

  type ToggleOidcProviderParams = {
    enabled: boolean;
  };

  type OidcTestEndpoints = {
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint: string;
    jwks_uri: string;
  };

  type OidcTestResult = {
    success: boolean;
    message: string;
    endpoints?: OidcTestEndpoints;
  };

  type LdapTlsOptions = {
    ca?: string;
    cert?: string;
    key?: string;
    servername?: string;
  };

  type LdapConfig = {
    urls?: string[];
    bindDN?: string;
    bindCredentials?: string;
    searchBase?: string;
    searchFilter?: string;
    searchAttributes?: string[];
    groupSearchBase?: string;
    groupSearchFilter?: string;
    adminGroups?: string[];
    tlsOptions?: LdapTlsOptions;
    enabled?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };

  type UpdateLdapConfigParams = {
    urls?: string[];
    bindDN?: string;
    bindCredentials?: string;
    searchBase?: string;
    searchFilter?: string;
    searchAttributes?: string[];
    groupSearchBase?: string;
    groupSearchFilter?: string;
    adminGroups?: string[];
    tlsOptions?: LdapTlsOptions;
    enabled?: boolean;
  };

  type TestLdapConfigParams = {
    urls?: string[];
    bindDN?: string;
    bindCredentials?: string;
    searchBase?: string;
    searchFilter?: string;
  };

  type TestLdapResult = {
    success: boolean;
    message: string;
  };

  // Nexus types

  type NexusLoginResult = {
    login_id: string;
    auth_url: string;
    expires_in: number;
  };

  type NexusLoginStatus = {
    state: 'pending' | 'completed' | 'failed';
    nexus_username?: string;
    expires_in?: number;
    error?: string;
  };

  type NexusBindStatus = {
    bound: boolean;
    nexus_username?: string;
    expired?: boolean;
  };

  type BuildCustomConfig = {
    password?: string;
    salt?: string;
    'conn-type'?: 'incoming' | 'outgoing' | 'both';
    'disable-installation'?: 'Y' | 'N';
    'disable-settings'?: 'Y' | 'N';
    'disable-account'?: 'Y' | 'N';
    'disable-ab'?: 'Y' | 'N';
    'disable-tcp-listen'?: 'Y' | 'N';
    'app-name'?: string;
    'override-settings'?: Record<string, string>;
    'default-settings'?: Record<string, string>;
  };

  type SubmitBuildParams = {
    os: 'windows';
    arch: 'x64' | 'arm64' | 'x86';
    custom: BuildCustomConfig;
  };

  type SubmitBuildResult = {
    uuid: string;
    status: 'pending';
    message: string;
  };

  type BuildRecord = {
    uuid: string;
    userGuid: string;
    os: string;
    arch: string;
    appName: string;
    custom: string | null;
    status: 'pending' | 'building' | 'completed' | 'failed' | 'cancelled';
    files: string | null;
    message: string | null;
    createdAt: string;
    updatedAt: string;
  };

  type BuildStatusResponse = {
    uuid: string;
    status: 'pending' | 'building' | 'completed' | 'failed' | 'cancelled';
    files?: string[];
    message?: string;
  };
}
