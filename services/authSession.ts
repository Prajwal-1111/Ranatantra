export const AUTH_TOKEN_KEY = 'vaibhav2k26_token';
export const AUTH_CHANGED_EVENT = 'vaibhav2k26_auth_changed';

export type AuthUser = {
  name: string;
  email: string;
  picture: string;
};

const decodeJwtToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT', error);
    return null;
  }
};

const notifyAuthChanged = () => {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const getStoredAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const persistAuthToken = (token: string) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  notifyAuthChanged();
};

export const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  notifyAuthChanged();
};

export const getAuthUserFromToken = (token: string): AuthUser | null => {
  const payload = decodeJwtToken(token);
  if (!payload) {
    return null;
  }

  return {
    name: payload.name || '',
    email: payload.email || '',
    picture: payload.picture || '',
  };
};

export const getStoredAuthUser = (): AuthUser | null => {
  const token = getStoredAuthToken();
  if (!token) {
    return null;
  }

  return getAuthUserFromToken(token);
};
