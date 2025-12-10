const API_URL = (process.env.REACT_APP_API_URL || 'https://localhost').replace(/\/$/, '');
const BASE_URL = `${API_URL}/api/v1`;

const getFetchOptions = (method = 'GET', body = null) => {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', 
  };

  if (body) 
  {
    options.body = JSON.stringify(body);
  }

  return options;
};

export const authApi = {
  login: async (payload) => {
    const res = await fetch(`${BASE_URL}/login/`, getFetchOptions('POST', payload));
    return res.json();
  },

  register: async (payload) => {
    const res = await fetch(`${BASE_URL}/register/`, getFetchOptions('POST', payload));
    return res.json();
  },

  verify2FA: async (ignoredToken, code) => {
    const res = await fetch(`${BASE_URL}/login/2fa/`, getFetchOptions('POST', { 
        code: code 
    }));
    return res.json();
  },

  logout: async () => {
    const res = await fetch(`${BASE_URL}/logout/`, getFetchOptions('POST', {}));
    return res.status; 
  },

  get2FaStatus: async () => {
    const res = await fetch(`${BASE_URL}/2fa/status/`, getFetchOptions('GET'));
    return res.json();
  },

  generate2FaConfig: async () => {
    const res = await fetch(`${BASE_URL}/2fa/setup/`, getFetchOptions('GET'));
    return res.json();
  },

  confirm2Fa: async (code, enable) => {
    const res = await fetch(`${BASE_URL}/2fa/confirm/`, getFetchOptions('POST', { code, enable }));
    return res.json();
  },

  changePassword: async (payload) => {
    const res = await fetch(`${BASE_URL}/change_password/`, getFetchOptions('POST', payload));
    return res.json();
  }
};