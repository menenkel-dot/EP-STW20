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
    assignedGroupId: number | null;
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
    assignedGroupId?: number | null;
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
  getStaff: async () => {
    const response = await apiClient.get('/users/staff');
    return response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
  exportData: async (id: number) => {
    const response = await apiClient.get(`/users/${id}/export`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `datenexport-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// ==================== CHILDREN API ====================

export const childrenAPI = {
  getAll: async () => {
    const response = await apiClient.get('/children');
    return response.data;
  },
  
  create: async (childData: {
    name: string;
    parentId: number;
    groupId?: number;
    avatarUrl?: string;
  }) => {
    const response = await apiClient.post('/children', childData);
    return response.data;
  },

  update: async (id: number, updates: {
    name?: string;
    groupId?: number;
    avatarUrl?: string;
  }) => {
    const response = await apiClient.put(`/children/${id}`, updates);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/children/${id}`);
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

  upload: async (documentData: {
    name: string;
    childId: number | null;
    fileData: string;
  }) => {
    const response = await apiClient.post('/documents', documentData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/documents/${id}`);
    return response.data;
  },
};

// ==================== ABSENCES API ====================

export const absencesAPI = {
  getAll: async () => {
    const response = await apiClient.get('/absences');
    return response.data;
  },

  getByChildId: async (childId: number) => {
    const response = await apiClient.get(`/absences/${childId}`);
    return response.data;
  },

  create: async (absenceData: {
    childId: number;
    startDate: string;
    endDate: string;
    reason: string;
    symptoms?: string;
  }) => {
    const response = await apiClient.post('/absences', absenceData);
    return response.data;
  },

  update: async (id: number, updates: any) => {
    const response = await apiClient.put(`/absences/${id}`, updates);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/absences/${id}`);
    return response.data;
  },
};

// ==================== EVENTS API ====================

export const eventsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/events');
    return response.data;
  },

  create: async (eventData: {
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    groupIds?: number[];
  }) => {
    const response = await apiClient.post('/events', eventData);
    return response.data;
  },

  update: async (id: number, updates: any) => {
    const response = await apiClient.put(`/events/${id}`, updates);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/events/${id}`);
    return response.data;
  },
};

// ==================== POSTS API ====================

export const postsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/posts');
    return response.data;
  },

  create: async (postData: {
    title: string;
    content: string;
    author: string;
    date: string;
    imageUrl?: string;
    groupIds?: number[];
  }) => {
    const response = await apiClient.post('/posts', postData);
    return response.data;
  },

  update: async (id: number, updates: any) => {
    const response = await apiClient.put(`/posts/${id}`, updates);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/posts/${id}`);
    return response.data;
  },
};

// ==================== HOLIDAY PERIODS API ====================

export const holidayPeriodsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/holiday-periods');
    return response.data;
  },

  create: async (periodData: {
    name: string;
    startDate: string;
    endDate: string;
    deadline: string;
  }) => {
    const response = await apiClient.post('/holiday-periods', periodData);
    return response.data;
  },

  update: async (id: number, updates: any) => {
    const response = await apiClient.put(`/holiday-periods/${id}`, updates);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/holiday-periods/${id}`);
    return response.data;
  },
};

// ==================== HOLIDAY BOOKINGS API ====================

export const holidayBookingsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/holiday-bookings');
    return response.data;
  },

  getByPeriodId: async (periodId: number) => {
    const response = await apiClient.get(`/holiday-bookings/period/${periodId}`);
    return response.data;
  },

  getByChildId: async (childId: number) => {
    const response = await apiClient.get(`/holiday-bookings/child/${childId}`);
    return response.data;
  },

  create: async (bookingData: {
    periodId: number;
    childId: number;
    needsCare: boolean;
    fromDate?: string;
    toDate?: string;
    fromTime?: string;
    toTime?: string;
    withLunch?: boolean;
    earlyService?: boolean;
  }) => {
    const response = await apiClient.post('/holiday-bookings', bookingData);
    return response.data;
  },

  update: async (id: number, updates: any) => {
    const response = await apiClient.put(`/holiday-bookings/${id}`, updates);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/holiday-bookings/${id}`);
    return response.data;
  },
};

// ==================== CONVERSATIONS API ====================

export const conversationsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/conversations');
    return response.data;
  },

  create: async (participantIds: number[]) => {
    const response = await apiClient.post('/conversations', { participantIds });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/conversations/${id}`);
    return response.data;
  },
};

// ==================== MESSAGES API ====================

export const messagesAPI = {
  getByConversationId: async (conversationId: number) => {
    const response = await apiClient.get(`/messages/${conversationId}`);
    return response.data;
  },

  create: async (messageData: {
    conversationId: number;
    content: string;
  }) => {
    const response = await apiClient.post('/messages', messageData);
    return response.data;
  },

  markAsRead: async (id: number) => {
    const response = await apiClient.put(`/messages/${id}/read`);
    return response.data;
  },
};

// ==================== CONTACTS API ====================

export const contactsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/contacts');
    return response.data;
  },

  create: async (contactData: {
    name: string;
    role: string;
    phone: string;
    email: string;
  }) => {
    const response = await apiClient.post('/contacts', contactData);
    return response.data;
  },

  update: async (id: number, updates: any) => {
    const response = await apiClient.put(`/contacts/${id}`, updates);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/contacts/${id}`);
    return response.data;
  },
};

// ==================== NOTIFICATIONS API ====================

export const notificationsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },

  create: async (notificationData: {
    userId: number;
    message: string;
    type?: string;
  }) => {
    const response = await apiClient.post('/notifications', notificationData);
    return response.data;
  },

  markAsRead: async (id: number) => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAsUnread: async (id: number) => {
    const response = await apiClient.put(`/notifications/${id}/unread`);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },
};

// ==================== SETTINGS API ====================

export const settingsAPI = {
  get: async (key: string) => {
    const response = await apiClient.get(`/settings/${key}`);
    return response.data;
  },

  update: async (key: string, value: string) => {
    const response = await apiClient.put(`/settings/${key}`, { value });
    return response.data;
  },
};
