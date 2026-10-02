declare namespace API {
  // ── Enum types (aligned with backend enums) ─────────────────────

  type UserStatus = -1 | 0 | 1;
  type PeerStatus = 0 | 1;
  type ConnType = -1 | 0 | 1 | 2 | 3 | 4;
  type PrimaryAuth = 0 | 1 | 2 | 3 | 4;
  type TwoFactorType = 0 | 1 | 2;
  type FileAuditType = 0 | 1;
  type AlarmType = 0 | 1 | 2 | 6 | 7 | 8 | 9 | 10;
  type ShareRule = 1 | 2 | 3;
  type BuildStatus = 'pending' | 'building' | 'completed' | 'failed' | 'cancelled';

  // ── Auth ────────────────────────────────────────────────────────

  type CurrentUser = {
    guid?: string;
    name?: string;
    display_name?: string;
    email?: string | null;
    note?: string;
    avatar?: string;
    status?: UserStatus;
    is_admin?: boolean;
    tfa_enabled?: boolean;
    third_auth_type?: string;
    has_password?: boolean;
    info?: {
      email_verification?: boolean;
      email_alarm_notification?: boolean;
      other?: Record<string, unknown>;
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
    type?: 'account' | 'mobile' | 'sms_code' | 'email_code' | 'tfa_code' | 'passkey_check';
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

  // ── WebAuthn JSON types (base64url-encoded) ─────────────────────

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
    clientExtensionResults: Record<string, unknown>;
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
    clientExtensionResults: Record<string, unknown>;
    type: 'public-key';
  };

  // ── Passkey ─────────────────────────────────────────────────────

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

  // ── Session ─────────────────────────────────────────────────────

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

  // ── OIDC ────────────────────────────────────────────────────────

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

  // ── Pagination ──────────────────────────────────────────────────

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
    message?: string;
    status?: string;
    data?: unknown;
  };

  // ── User ────────────────────────────────────────────────────────

  type UserItem = {
    guid: string;
    name: string;
    display_name?: string;
    email?: string | null;
    note?: string;
    status: UserStatus;
    is_admin: boolean;
    is_protected?: boolean;
    third_auth_type?: string;
    strategy_guid?: string;
    strategy_name?: string;
    user_group_guid?: string;
    user_group_name?: string;
    role_names?: string[];
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
    status?: UserStatus;
    is_admin?: boolean;
    user_group_guid?: string;
  };

  type BatchUpdateUserStatusParams = {
    user_guids: string[];
    status: UserStatus;
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
    new_password?: string;
  };

  type BatchResult = {
    succeeded: string[];
    failed: Array<{ guid: string; reason: string }>;
    total: number;
    succeededCount: number;
    failedCount: number;
  };

  type AdminUserListParams = PageParams & {
    status?: UserStatus;
    name?: string;
    email?: string;
    is_admin?: 0 | 1;
    third_auth_type?: string;
    strategy_name?: string;
    user_group_guid?: string;
    user_group_name?: string;
  };

  // ── Device ──────────────────────────────────────────────────────

  type DeviceSysInfo = {
    device_name?: string;
    username?: string;
    os?: string;
    version?: string;
    cpu?: string;
    memory?: string;
    ip?: string;
  };

  type DeviceItem = {
    guid: string;
    id: string;
    userGuid?: string | null;
    user?: string;
    user_name?: string;
    deviceGroupGuid?: string | null;
    device_group_name?: string;
    strategy_name?: string;
    note?: string;
    status?: PeerStatus;
    is_online?: boolean;
    last_online?: string | null;
    info?: DeviceSysInfo;
    created_at?: string;
    updated_at?: string;
  };

  type DeviceListParams = PageParams & {
    id?: string;
    status?: string;
    is_online?: string;
    user_name?: string;
    device_group_name?: string;
    device_group_guid?: string;
    os?: string;
  };

  type AdminDeviceListParams = PageParams & {
    id?: string;
    status?: string;
    is_online?: string;
    device_name?: string;
    user_name?: string;
    device_username?: string;
    os?: string;
    device_group_name?: string;
    device_group_guid?: string;
  };

  type UpdateDeviceParams = {
    userName?: string | null;
    deviceGroupName?: string | null;
    strategyName?: string | null;
    note?: string | null;
  };

  // ── Device Group ────────────────────────────────────────────────

  type DeviceGroupItem = {
    guid: string;
    name: string;
    note?: string;
    created_at?: string;
    updated_at?: string;
  };

  type CreateDeviceGroupParams = {
    name: string;
    note?: string;
  };

  type UpdateDeviceGroupParams = {
    name?: string;
    note?: string;
  };

  // ── Address Book ────────────────────────────────────────────────

  type AddressBookProfile = {
    guid: string;
    name: string;
    note?: string;
    is_personal?: boolean;
  };

  type AddressBookInfo = {
    password?: string;
  };

  type SharedAddressBook = {
    guid: string;
    name: string;
    owner?: string;
    note?: string;
    rule?: ShareRule;
    is_owner?: boolean;
    info?: AddressBookInfo;
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
    hash?: string | null;
    password?: string | null;
    username?: string;
    hostname?: string;
    platform?: string;
    alias?: string | null;
    note?: string | null;
    tags?: string[];
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
    user?: string | null;
    group?: string | null;
    target?: {
      name: string;
      display_name?: string;
    };
    rule: ShareRule;
    ruleType: 'user' | 'group' | 'everyone';
    createdAt?: string;
    updatedAt?: string;
  };

  type CreateRuleParams = {
    guid: string;
    user?: string;
    group?: string;
    rule?: ShareRule;
  };

  type UpdateRuleParams = {
    guid: string;
    rule: ShareRule;
  };

  type AddressBookShareCandidateUser = {
    guid: string;
    name: string;
    display_name?: string;
  };

  type AddressBookShareCandidateGroup = {
    guid: string;
    name: string;
  };

  type AddressBookShareCandidates = {
    users: AddressBookShareCandidateUser[];
    groups: AddressBookShareCandidateGroup[];
  };

  type AddressBookSettings = {
    max_peer_one_ab?: number;
  };

  // ── Audit ───────────────────────────────────────────────────────

  type ConnectionAuditItem = {
    id?: number;
    deviceId?: string;
    deviceUuid?: string;
    connId?: string | null;
    sessionId?: string | null;
    ip?: string;
    action?: string;
    peerId?: string | null;
    peerName?: string | null;
    type?: ConnType;
    note?: string | null;
    createdAt?: string;
    requestedAt?: string | null;
    establishedAt?: string | null;
    closedAt?: string | null;
    nonce?: string | null;
    connAuditRef?: string | null;
    primaryAuth?: PrimaryAuth | null;
    twoFactor?: TwoFactorType | null;
    can_disconnect: boolean;
  };

  type ActiveConnectionItem = {
    deviceId: string;
    deviceUuid: string;
    connId: number;
    can_disconnect: true;
  };

  type FileAuditItem = {
    id?: number;
    deviceId?: string;
    deviceUuid?: string;
    peerId?: string;
    connId?: string | null;
    type?: FileAuditType;
    path?: string | null;
    isFile?: boolean;
    clientIp?: string;
    clientName?: string;
    fileCount?: number;
    files?: Array<[string, number]>;
    createdAt?: string;
    nonce?: string | null;
  };

  type AlarmAuditItem = {
    id?: number;
    deviceId?: string;
    deviceUuid?: string;
    typ?: AlarmType;
    infoId?: string | null;
    infoIp?: string;
    infoName?: string | null;
    createdAt?: string;
    connId?: string | null;
    nonce?: string | null;
    connAuditRef?: string | null;
  };

  type ConsoleAuditItem = {
    guid: string;
    actor_user_guid?: string | null;
    actor_user_name?: string | null;
    action?: string;
    target_type?: string | null;
    target_guid?: string | null;
    result?: 'allowed' | 'denied';
    reason?: string | null;
    before_state?: string | null;
    after_state?: string | null;
    request_id?: string | null;
    created_at?: string | null;
  };

  type ConnectionAuditQueryParams = PageParams & {
    deviceId?: string;
    type?: ConnType;
    startTime?: string;
    endTime?: string;
  };

  type ActiveConnectionQueryParams = PageParams & {
    deviceId?: string;
  };

  type FileAuditQueryParams = PageParams & {
    deviceId?: string;
    type?: FileAuditType;
    startTime?: string;
    endTime?: string;
  };

  type AlarmAuditQueryParams = PageParams & {
    deviceId?: string;
    type?: AlarmType;
    startTime?: string;
    endTime?: string;
  };

  type ConsoleAuditQueryParams = PageParams & {
    operator?: string;
    action?: string;
    target_type?: string;
    result?: 'allowed' | 'denied';
    start_time?: string;
    end_time?: string;
  };

  // ── Update Check ────────────────────────────────────────────────

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
    backend: UpdateCheckComponent;
    frontend: UpdateCheckComponent;
  };

  // ── RBAC ────────────────────────────────────────────────────────

  type RoleItem = {
    guid: string;
    name: string;
    note: string;
    permissions: string[];
    protected_account?: boolean;
    member_count?: number;
    created_at: string;
    updated_at: string;
  };

  type CreateRoleParams = {
    name: string;
    note?: string;
    permissions: string[];
    protected_account?: boolean;
    confirm_protected_account_change?: boolean;
  };

  type UpdateRoleParams = {
    name?: string;
    note?: string;
    permissions?: string[];
    protected_account?: boolean;
    confirm_protected_account_change?: boolean;
  };

  type PermissionItem = {
    code: string;
    resource: string;
    action: string;
    name: string;
    description: string;
    assignable: boolean;
    system_only: boolean;
    scope: 'global' | 'device_group';
    requires?: string[];
  };

  type PermissionScopeType = 'global' | 'device_group';

  type EffectivePermissionScope = {
    scope_type: PermissionScopeType;
    device_group_guids: string[];
  };

  type EffectivePermissions = {
    permissions: string[];
    scopes: Record<string, EffectivePermissionScope>;
  };

  type UserRoleAssignment = {
    guid: string;
    role_guid: string;
    role_name: string;
    scope_type: 'global' | 'device_group';
    device_group_guids: string[];
    permissions: string[];
    created_at: string;
    updated_at: string;
  };

  type UserRoleEligibilityReason =
    | 'assign_not_allowed'
    | 'remove_not_allowed'
    | 'protected_role'
    | 'protected_target'
    | 'self_target'
    | 'missing_caller_scope'
    | 'scope_exceeds_caller';

  type UserRoleEligibility = {
    guid: string;
    name: string;
    protected_account: boolean;
    assigned: boolean;
    can_assign: boolean;
    can_remove: boolean;
    allowed_scope_types: PermissionScopeType[];
    assignable_device_groups: Array<Pick<DeviceGroupItem, 'guid' | 'name'>>;
    reason_code?: UserRoleEligibilityReason | 'missing_permission' | 'role_grants_roles_assign' | null;
  };

  type UserRoleEligibilityResponse = {
    data: UserRoleEligibility[];
  };

  type UserRolesResponse = {
    data: UserRoleAssignment[];
    effective_scope: Record<string, EffectivePermissionScope>;
  };

  type UserRoleAssignmentParams = {
    role_guid: string;
    scope_type: 'global' | 'device_group';
    device_group_guids?: string[];
  };

  type ReplaceUserRolesParams = {
    assignments: UserRoleAssignmentParams[];
  };

  // ── Strategy ────────────────────────────────────────────────────

  type StrategyItem = {
    guid: string;
    name: string;
    note?: string;
    config_options?: Record<string, string>;
    updated_at?: string;
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
  };

  type StrategyAssignmentUserItem = {
    guid: string;
    name: string;
    is_protected?: boolean;
  };

  type StrategyAssignmentDeviceGroupItem = {
    guid: string;
    name: string;
  };

  type StrategyTargetDeviceCandidate = {
    uuid: string;
    id: string;
  };

  type StrategyTargetUserCandidate = {
    guid: string;
    name: string;
    is_protected?: boolean;
  };

  type StrategyTargetCandidateParams = PageParams & {
    target_type: 'device' | 'user';
  };

  type StrategyAssignmentParams = PageParams & {
    target_type: 'device' | 'user' | 'device_group';
  };

  type StrategyCandidateItem = {
    guid: string;
    name: string;
    note: string;
  };

  // ── User Group ──────────────────────────────────────────────────

  type UserGroupItem = {
    guid: string;
    name: string;
    note?: string;
    user_count?: number;
    is_default?: boolean;
    created_at?: string;
    updated_at?: string;
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

  // ── Settings ────────────────────────────────────────────────────

  type SettingItem = {
    key: string;
    value: string;
    category: string;
    description?: string;
    isSensitive?: boolean;
    created_at?: string;
    updated_at?: string;
  };

  type GeneralSettings = {
    watermarkEnabled: boolean;
    defaultLanguage: string;
    jwtExpiryDays: number;
    auditRetentionDays: number;
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

  // ── SMTP ────────────────────────────────────────────────────────

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

  // ── OIDC Provider ───────────────────────────────────────────────

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
    icon?: string;
    enabled: boolean;
    priority: number;
    created_at?: string;
    updated_at?: string;
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
    icon?: string;
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
    icon?: string;
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

  // ── LDAP ────────────────────────────────────────────────────────

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

  // ── Dashboard ───────────────────────────────────────────────────

  type DashboardData = {
    users: {
      total: number;
      admin: number;
      normal: number;
    };
    devices: {
      total: number;
      online: number;
      offline: number;
    };
    connections: {
      today: number;
      successCount: number;
      failureCount: number;
    };
    files: {
      transferredToday: number;
      uploadToday: number;
      downloadToday: number;
    };
    counts: {
      addressBooks: number;
      groups: number;
      roles: number;
      strategies: number;
    };
    systemStatus: {
      cpu: number | null;
      memory: number | null;
      disk: number | null;
      uptime: number | null;
    };
  };

  type DashboardTrends = {
    connectionTrend?: Array<{
      date: string;
      count: number;
    }>;
    newUserTrend?: Array<{
      date: string;
      newUsers: number;
    }>;
    alarmTrend?: Array<{
      date: string;
      count: number;
    }>;
  };

  // ── Nexus ───────────────────────────────────────────────────────

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
    'override-settings'?: Record<string, unknown>;
    'default-settings'?: Record<string, unknown>;
  };

  type SubmitBuildParams = {
    os: 'windows';
    arch: 'x86_64' | 'aarch64' | 'x86';
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
    status: BuildStatus;
    files: string | null;
    message: string | null;
    createdAt: string;
    updatedAt: string;
  };
}
