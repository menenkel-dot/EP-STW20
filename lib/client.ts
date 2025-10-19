import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// API Base URL - Backend läuft auf Port 3000, Frontend auf Port 5000
// In Replit verwenden wir localhost, da beide auf demselben Host laufen
const API_URL = '/api';

// Axios Instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Token zu jedem Request hinzufügen
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Token-Refresh bei 401 Errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Wenn 401 und noch kein Retry, versuche Token-Refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('Kein Refresh Token vorhanden');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { token } = response.data;
        localStorage.setItem('authToken', token);

        // Wiederhole den ursprünglichen Request
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh fehlgeschlagen, logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// ==================== AUTH API ====================

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    name: string;
    email: string | null;
    role: string;
    avatarUrl: string | null;
    children: Array<{
      id: number;
      name: string;
      parentId: number;
      groupId: number | null;
      avatarUrl: string | null;
    }>;
  };
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: {
    username: string;
    password: string;
    name: string;
    email?: string;
    role?: string;
  }): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};

// ==================== USERS API ====================

export const usersAPI = {
  getAll: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },
};

// ==================== CHILDREN API ====================

export const childrenAPI = {
  getAll: async () => {
    const response = await apiClient.get('/children');
    return response.data;
  },
};

// ==================== GROUPS API ====================

export const groupsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/groups');
    return response.data;
  },
};

// ==================== DOCUMENTS API ====================

export const documentsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/documents');
    return response.data;
  },
};

// ==================== ABSENCES API ====================

export const absencesAPI = {
  getByChildId: async (childId: number) => {
    const response = await apiClient.get(`/absences/${childId}`);
    return response.data;
  },
};
