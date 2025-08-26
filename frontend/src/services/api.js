import axios from 'axios';

// Configuração base do axios
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (email, password, name) => {
    const response = await api.post('/auth/register', { email, password, name });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data.user;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

// Serviços de ferramentas
export const toolsService = {
  getAll: async () => {
    const response = await api.get('/tools');
    return response.data;
  },

  create: async (toolData) => {
    const response = await api.post('/tools', toolData);
    return response.data;
  },

  updateProduction: async (toolId, pieces) => {
    const response = await api.put(`/tools/${toolId}/production`, { pieces });
    return response.data;
  },

  swapTool: async (toolId) => {
    const response = await api.put(`/tools/${toolId}/swap`);
    return response.data;
  },

  delete: async (toolId) => {
    const response = await api.delete(`/tools/${toolId}`);
    return response.data;
  },

  getSwapHistory: async () => {
    const response = await api.get('/tools/swap-history');
    return response.data;
  },

  addMoldComment: async (moldId, comment) => {
    const response = await api.post('/tools/mold-comments', { moldId, comment });
    return response.data;
  },

  getMoldComments: async (moldId) => {
    const response = await api.get(`/tools/mold-comments/${moldId}`);
    return response.data;
  },

  addScrap: async (moldId, monthYear, quantity) => {
    const response = await api.post('/tools/scrap', { moldId, monthYear, quantity });
    return response.data;
  },

  getScrapData: async () => {
    const response = await api.get('/tools/scrap');
    return response.data;
  }
};

// Serviços do dashboard
export const dashboardService = {
  getData: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },

  getKPIs: async () => {
    const response = await api.get('/dashboard/kpis');
    return response.data;
  },

  getCharts: async () => {
    const response = await api.get('/dashboard/charts');
    return response.data;
  }
};

// Serviço de health check
export const healthService = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

export default api;
