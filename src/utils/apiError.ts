type UnknownRecord = Record<string, unknown>;

const GENERIC_ERROR_MESSAGES = new Set([
  'Request failed',
  'Network Error',
  'Unknown error occurred',
]);

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const normalizeMessage = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (GENERIC_ERROR_MESSAGES.has(trimmed)) return null;
  if (trimmed.startsWith('Request failed with status code')) return null;
  return trimmed;
};

const findMessage = (value: unknown, seen: WeakSet<object>): string | null => {
  const stringMessage = normalizeMessage(value);
  if (stringMessage) return stringMessage;

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = findMessage(item, seen);
      if (message) return message;
    }
    return null;
  }

  if (!isRecord(value)) return null;
  if (seen.has(value)) return null;
  seen.add(value);

  const primaryKeys = ['message', 'msg', 'errorMessage', 'error_description', 'detail', 'reason'];
  for (const key of primaryKeys) {
    const message = findMessage(value[key], seen);
    if (message) return message;
  }

  const nestedKeys = ['error', 'errors', 'details', 'data', 'response'];
  for (const key of nestedKeys) {
    const message = findMessage(value[key], seen);
    if (message) return message;
  }

  for (const item of Object.values(value)) {
    const message = findMessage(item, seen);
    if (message) return message;
  }

  return null;
};

export const extractApiMessageFromPayload = (payload: unknown): string | null => {
  return findMessage(payload, new WeakSet<object>());
};

export const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  if (isRecord(error)) {
    const detailMessage = findMessage(error.details, new WeakSet<object>());
    if (detailMessage) return detailMessage;

    const responseData =
      isRecord(error.response) && 'data' in error.response ? error.response.data : undefined;
    const responseMessage = findMessage(responseData, new WeakSet<object>());
    if (responseMessage) return responseMessage;

    const dataMessage = findMessage(error.data, new WeakSet<object>());
    if (dataMessage) return dataMessage;

    const directMessage = normalizeMessage(error.message);
    if (directMessage) return directMessage;
  }

  if (error instanceof Error) {
    const instanceMessage = normalizeMessage(error.message);
    if (instanceMessage) return instanceMessage;
  }

  return fallback;
};
