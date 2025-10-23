import React, { useState, useMemo, useEffect } from 'react';
import { AuthContext } from './hooks/useAuth';
import type { User, Notification, Child } from './types';
import { authAPI, notificationsAPI, type LoginResponse } from './lib/client';
import Login from './components/Login';
import Layout from './components/Layout';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Beim App-Start: Prüfe ob User eingeloggt ist
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // User-Daten aus localStorage laden
          const user = JSON.parse(savedUser) as LoginResponse['user'];
          
          // Konvertiere Backend-User zu Frontend-User
          const frontendUser: User = {
            id: user.id,
            username: user.username,
            name: user.name,
            password: '', // Passwort nicht im Frontend speichern
            role: user.role as any,
            avatarUrl: user.avatarUrl || '',
            children: user.children.map(child => ({
              id: child.id,
              name: child.name,
              groupId: child.groupId || 0,
              avatarUrl: child.avatarUrl || '',
            })),
          };

          setCurrentUser(frontendUser);
          
          if (frontendUser.children && frontendUser.children.length > 0) {
            setActiveChild(frontendUser.children[0]);
          }
        } catch (error) {
          console.error('Fehler beim Laden des Benutzers:', error);
          authAPI.logout();
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Benachrichtigungen laden, wenn User eingeloggt ist
  useEffect(() => {
    const loadNotifications = async () => {
      if (currentUser) {
        try {
          const data = await notificationsAPI.getAll();
          setNotifications(data);
        } catch (error) {
          console.error('Fehler beim Laden der Benachrichtigungen:', error);
        }
      }
    };

    loadNotifications();

    // Poll for new notifications every 30 seconds
    const intervalId = setInterval(() => {
      if (currentUser) {
        loadNotifications();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [currentUser]);

  const login = async (username: string, pass: string): Promise<boolean> => {
    try {
      const response = await authAPI.login({ username, password: pass });
      
      // Token speichern
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Konvertiere Backend-User zu Frontend-User
      const frontendUser: User = {
        id: response.user.id,
        username: response.user.username,
        name: response.user.name,
        password: '', // Passwort nicht im Frontend speichern
        role: response.user.role as any,
        avatarUrl: response.user.avatarUrl || '',
        children: response.user.children.map(child => ({
          id: child.id,
          name: child.name,
          groupId: child.groupId || 0,
          avatarUrl: child.avatarUrl || '',
        })),
      };

      setCurrentUser(frontendUser);
      
      if (frontendUser.children && frontendUser.children.length > 0) {
        setActiveChild(frontendUser.children[0]);
      }

      return true;
    } catch (error: any) {
      console.error('Login fehlgeschlagen:', error);
      return false;
    }
  };

  const logout = () => {
    authAPI.logout();
    setCurrentUser(null);
    setActiveChild(null);
    setNotifications([]);
  };

  const handleSetActiveChild = (child: Child) => {
    setActiveChild(child);
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Fehler beim Markieren der Benachrichtigung:', error);
    }
  };

  const reloadNotifications = async () => {
    if (currentUser) {
      try {
        const data = await notificationsAPI.getAll();
        setNotifications(data);
      } catch (error) {
        console.error('Fehler beim Laden der Benachrichtigungen:', error);
      }
    }
  };

  const addNotification = (message: string) => {
    // Create local notification for immediate user feedback
    // (for success messages like "Abwesenheit erfolgreich gemeldet")
    const newNotification: Notification = {
      id: Date.now(),
      message,
      read: false,
      type: 'info'
    };
    setNotifications(prev => [newNotification, ...prev]);
    
    // Server-generated notifications (for other users) will be fetched
    // by the 30-second polling interval automatically
  };

  const authContextValue = useMemo(() => ({
    user: currentUser,
    activeChild: activeChild,
    login,
    logout,
    setActiveChild: handleSetActiveChild,
  }), [currentUser, activeChild]);

  // Zeige Loading-Screen während Auth-Check
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-100 to-cyan-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthContext.Provider value={authContextValue}>
        <Login />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <Layout 
        user={currentUser} 
        notifications={notifications}
        markNotificationAsRead={markNotificationAsRead}
        addNotification={addNotification}
      />
    </AuthContext.Provider>
  );
};

export default App;
