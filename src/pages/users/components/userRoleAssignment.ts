const DEVICE_SCOPED_PERMISSIONS = new Set([
  'devices.view',
  'devices.edit',
  'devices.status',
  'devices.delete',
  'devices.disconnect',
  'strategies.assign',
]);

export type AssignmentScopeType = 'global' | 'device_group';

export type RoleAssignmentDraft = {
  key: string;
  role_guid: string;
  scope_type: AssignmentScopeType;
  device_group_guids: string[];
};

export type AssignmentValidationError =
  | 'missing_role'
  | 'duplicate_role'
  | 'unsupported_device_group_scope'
  | 'missing_device_group';

export function roleSupportsDeviceGroupScope(role?: API.RoleItem): boolean {
  const permissions = role?.permissions || [];
  return (
    permissions.length > 0 &&
    permissions.every((permission) => DEVICE_SCOPED_PERMISSIONS.has(permission))
  );
}

export function changeAssignmentScope(
  draft: RoleAssignmentDraft,
  scopeType: AssignmentScopeType,
): RoleAssignmentDraft {
  return {
    ...draft,
    scope_type: scopeType,
    // Scope modes are alternatives. Never preserve group selections behind
    // the global tab or silently restore them when advanced mode is reopened.
    device_group_guids: [],
  };
}

export function validateAssignments(
  drafts: RoleAssignmentDraft[],
  roleByGuid: Map<string, API.RoleItem>,
): AssignmentValidationError | undefined {
  const seen = new Set<string>();
  for (const draft of drafts) {
    if (!draft.role_guid) return 'missing_role';
    if (seen.has(draft.role_guid)) return 'duplicate_role';
    seen.add(draft.role_guid);
    if (draft.scope_type !== 'device_group') continue;
    if (!roleSupportsDeviceGroupScope(roleByGuid.get(draft.role_guid))) {
      return 'unsupported_device_group_scope';
    }
    if (draft.device_group_guids.length === 0) {
      return 'missing_device_group';
    }
  }
  return undefined;
}

export function toReplaceUserRolesParams(
  drafts: RoleAssignmentDraft[],
): API.ReplaceUserRolesParams {
  return {
    assignments: drafts.map((draft) => ({
      role_guid: draft.role_guid,
      scope_type: draft.scope_type,
      device_group_guids:
        draft.scope_type === 'device_group'
          ? [...new Set(draft.device_group_guids)]
          : [],
    })),
  };
}
