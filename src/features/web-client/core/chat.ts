export const CHAT_LIMITS = { bytes: 4096, messages: 200, intervalMs: 250 };
export function validChat(text: unknown): text is string {
  return (
    typeof text === 'string' &&
    !!text.trim() &&
    new TextEncoder().encode(text).length <= CHAT_LIMITS.bytes
  );
}
export interface ChatEntry {
  id: number;
  text: string;
  incoming: boolean;
  time: number;
}
export function appendChat(
  entries: ChatEntry[],
  entry: ChatEntry,
): ChatEntry[] {
  return [...entries.slice(-(CHAT_LIMITS.messages - 1)), entry];
}
