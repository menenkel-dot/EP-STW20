import React, { useState, useMemo, useEffect } from 'react';
import { AuthContext } from './hooks/useAuth';
import type { User, Notification, Child, UserRole } from './types';
import { supabase } from './src/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import Login from './components/Login';
import Layout from './components/Layout';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setCurrentUser(null);
        setActiveChild(null);
        setIsLoading(false);
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const setupUser = async () => {
      if (session?.user) {
        setIsLoading(true);
        try {
          // Fetch profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, name, role, avatar_url, assigned_group_id')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;

          // Fetch children for the user
          const { data: childrenData, error: childrenError } = await supabase
            .from('children')
            .select('*')
            .eq('parent_id', session.user.id);

          if (childrenError) throw childrenError;

          const children: Child[] = childrenData.map(c => ({
            id: c.id,
            name: c.name,
            groupId: c.group_id,
            avatarUrl: c.avatar_url || '',
          }));

          const user: User = {
            id: session.user.id,
            username: profile.username || session.user.email || '',
            name: profile.name || profile.username || 'Admin',
            role: profile.role as UserRole,
            avatarUrl: profile.avatar_url || '',
            assignedGroupId: profile.assigned_group_id,
            children: children,
          };

          setCurrentUser(user);
          if (children.length > 0) {
            setActiveChild(children[0]);
          }
        } catch (error) {
          console.error('Fehler beim Laden des Benutzerprofils:', error);
          await supabase.auth.signOut();
        } finally {
          setIsLoading(false);
        }
      }
    };

    setupUser();
  }, [session]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (currentUser) {
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setNotifications(data as Notification[]);
        } catch (error) {
          console.error('Fehler beim Laden der Benachrichtigungen:', error);
        }
      }
    };
    loadNotifications();
    const intervalId = setInterval(loadNotifications, 30000);
    return () => clearInterval(intervalId);
  }, [currentUser]);

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveChild(null);
    setNotifications([]);
  };

  const handleSetActiveChild = (child: Child) => {
    setActiveChild(child);
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      // Optimistic UI update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        // Revert on error
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
        throw error;
      }
    } catch (error) {
      console.error('Fehler beim Markieren der Benachrichtigung:', error);
    }
  };

  const addNotification = async (message: string, type: Notification['type'] = 'info') => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({ user_id: currentUser.id, message, type })
        .select()
        .single();
      
      if (error) throw error;

      setNotifications(prev => [data as Notification, ...prev]);
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Benachrichtigung:', error);
    }
  };

  const authContextValue = useMemo(() => ({
    user: currentUser,
    activeChild: activeChild,
    logout,
    setActiveChild: handleSetActiveChild,
  }), [currentUser, activeChild]);

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
    return <Login />;
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