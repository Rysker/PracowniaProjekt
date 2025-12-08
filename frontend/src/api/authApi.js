const API_URL = (process.env.REACT_APP_API_URL || 'https://localhost').replace(/\/$/, '');
const BASE_URL = `${API_URL}/api/v1`;

const getHeaders = (auth = false) => {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) 
    {
        const token = localStorage.getItem('accessToken');
        if (token) 
            headers['Authorization'] = `Bearer ${token}`;
    }
  return headers;
};

export const authApi = {
  login: async (payload) => {
    const res = await fetch(`${BASE_URL}/login/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  register: async (payload) => {
    const res = await fetch(`${BASE_URL}/register/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  verify2FA: async (tempToken, code) => {
    const res = await fetch(`${BASE_URL}/login/2fa/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ temp_token: tempToken, code }),
    });
    return res.json();
  },

  get2FaStatus: async () => {
    const res = await fetch(`${BASE_URL}/2fa/setup/`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  confirm2Fa: async (code, enable) => {
    const res = await fetch(`${BASE_URL}/2fa/confirm/`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ code, enable }),
    });
    return res.json();
  }
};