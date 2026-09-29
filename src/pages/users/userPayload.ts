type UserEditCapabilities = {
  canEditProfile: boolean;
  canEditStatus: boolean;
  canEditGroup: boolean;
};

export function buildCreateUserPayload(
  values: API.CreateUserParams,
  canEditGroup: boolean,
): API.CreateUserParams {
  const { user_group_guid, ...payload } = values;
  return canEditGroup && user_group_guid !== undefined
    ? { ...payload, user_group_guid }
    : payload;
}

export function buildInviteUserPayload(
  values: API.InviteUserParams,
  canEditGroup: boolean,
): API.InviteUserParams {
  const { user_group_guid, ...payload } = values;
  return canEditGroup && user_group_guid !== undefined
    ? { ...payload, user_group_guid }
    : payload;
}

export function buildUpdateUserPayload(
  values: API.UpdateUserParams,
  capabilities: UserEditCapabilities,
): API.UpdateUserParams {
  const payload: API.UpdateUserParams = {};

  if (capabilities.canEditProfile) {
    payload.name = values.name;
    payload.display_name = values.display_name;
    payload.email = values.email;
    payload.note = values.note;
  }
  if (capabilities.canEditStatus) payload.status = values.status;
  if (capabilities.canEditGroup) {
    payload.user_group_guid = values.user_group_guid;
  }

  return payload;
}
