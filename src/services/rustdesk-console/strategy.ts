import { request } from '@umijs/max';

export async function getStrategyList(
  params?: API.PageParams & {
    name?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.StrategyItem>>('/api/strategies', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getStrategyCandidates(
  params?: API.PageParams & {
    name?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.PaginatedResult<API.StrategyCandidateItem>>(
    '/api/strategies/candidates',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

export async function getStrategy(guid: string) {
  return request<API.StrategyItem>(`/api/strategies/${guid}`, {
    method: 'GET',
  });
}

export async function createStrategy(data: API.CreateStrategyParams) {
  return request<API.StrategyItem>('/api/strategies', { method: 'POST', data });
}

export async function updateStrategy(guid: string, data: API.UpdateStrategyParams) {
  return request<API.StrategyItem>(`/api/strategies/${guid}`, { method: 'PATCH', data });
}

export async function deleteStrategy(guid: string) {
  return request(`/api/strategies/${guid}`, { method: 'DELETE' });
}

export async function assignStrategy(guid: string, data: API.StrategyAssignParams) {
  return request<API.StrategyBatchResult>(`/api/strategies/${guid}/assign`, {
    method: 'POST',
    data,
  });
}

export async function unassignStrategy(guid: string, data: API.StrategyAssignParams) {
  return request<API.StrategyBatchResult>(`/api/strategies/${guid}/unassign`, {
    method: 'POST',
    data,
  });
}

export async function getStrategyAssignments(
  guid: string,
  params: API.StrategyAssignmentParams & { target_type: 'device' },
): Promise<API.PaginatedResult<API.StrategyAssignmentDeviceItem>>;
export async function getStrategyAssignments(
  guid: string,
  params: API.StrategyAssignmentParams & { target_type: 'user' },
): Promise<API.PaginatedResult<API.StrategyAssignmentUserItem>>;
export async function getStrategyAssignments(
  guid: string,
  params: API.StrategyAssignmentParams & { target_type: 'device_group' },
): Promise<API.PaginatedResult<API.StrategyAssignmentDeviceGroupItem>>;
export async function getStrategyAssignments(
  guid: string,
  params: API.StrategyAssignmentParams,
) {
  return request<API.PaginatedResult<
    | API.StrategyAssignmentDeviceItem
    | API.StrategyAssignmentUserItem
    | API.StrategyAssignmentDeviceGroupItem
  >>(`/api/strategies/${guid}/assignments`, {
    method: 'GET',
    params,
  });
}

export async function getStrategyTargetCandidates(
  params: API.StrategyTargetCandidateParams & { target_type: 'device' },
): Promise<API.PaginatedResult<API.StrategyTargetDeviceCandidate>>;
export async function getStrategyTargetCandidates(
  params: API.StrategyTargetCandidateParams & { target_type: 'user' },
): Promise<API.PaginatedResult<API.StrategyTargetUserCandidate>>;
export async function getStrategyTargetCandidates(
  params: API.StrategyTargetCandidateParams,
) {
  return request<
    API.PaginatedResult<
      API.StrategyTargetDeviceCandidate | API.StrategyTargetUserCandidate
    >
  >('/api/strategies/target-candidates', {
    method: 'GET',
    params,
  });
}
