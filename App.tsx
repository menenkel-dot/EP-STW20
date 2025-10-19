import React, { useState, useMemo } from 'react';
import { AuthContext } from './hooks/useAuth';
import type { User, Notification, Child } from './types';
import { MOCK_USERS, MOCK_NOTIFICATIONS } from './constants';
import Login from './components/Login';
import Layout from './components/Layout';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const login = (username: string, pass: string): boolean => {
    const user = MOCK_USERS.find(u => u.username === username && u.password === pass);
    if (user) {
      setCurrentUser(user);
      if (user.children && user.children.length > 0) {
        setActiveChild(user.children[0]);
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveChild(null);
  };

  const handleSetActiveChild = (child: Child) => {
    setActiveChild(child);
  };

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const addNotification = (message: string) => {
    const newNotification: Notification = {
      id: Date.now(),
      message,
      read: false,
      type: 'info'
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const authContextValue = useMemo(() => ({
    user: currentUser,
    activeChild: activeChild,
    login,
    logout,
    setActiveChild: handleSetActiveChild,
  }), [currentUser, activeChild]);

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