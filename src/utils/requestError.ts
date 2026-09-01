const messageFromValue = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value) return value;
  if (Array.isArray(value)) {
    const messages = value.filter(
      (item): item is string => typeof item === 'string' && item.length > 0,
    );
    return messages.length ? messages.join('; ') : undefined;
  }
  return undefined;
};

export function getRequestErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const response = (error as { response?: { data?: unknown } })?.response;
  const data = response?.data as
    | { message?: unknown; error?: unknown }
    | undefined;
  return (
    messageFromValue(data?.message) ||
    messageFromValue(data?.error) ||
    messageFromValue((error as Error)?.message) ||
    fallback
  );
}
