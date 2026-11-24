export const TOKEN_KEY = 'kidneycare_token';
export const USER_KEY = 'kidneycare_user';

export const SESSION_EXPIRED_MESSAGE = 'Your session expired. Please sign in again.';

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
