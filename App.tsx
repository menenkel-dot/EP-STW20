import React, { useState, useMemo, useEffect } from 'react';
import { AuthContext } from './hooks/useAuth';
import type { User, Notification, Child, UserRole } from './types';
import { supabase } from './src/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import Login from './components/Login';
import Layout from './components/Layout';
import { ThemeProvider } from './hooks/useTheme';
import PwaUpdater from './components/PwaUpdater';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

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
        setProfileError(null); // Clear previous errors
        try {
          // Fetch profile
          let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, name, role, avatar_url, assigned_group_id')
            .eq('id', session.user.id)
            .single();

          // Self-healing: if profile doesn't exist, create it.
          if (profileError && profileError.code === 'PGRST116') {
            console.warn('Profile not found for user, creating one...');
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                username: session.user.email,
                name: session.user.email,
              })
              .select('username, name, role, avatar_url, assigned_group_id')
              .single();

            if (insertError) {
              console.error('Error creating profile:', insertError.message);
              throw insertError;
            }
            profile = newProfile;
          } else if (profileError) {
            throw profileError;
          }
          
          if (!profile) {
            throw new Error('User profile could not be loaded or created.');
          }

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
            name: profile.name || profile.username || 'Benutzer',
            role: profile.role as UserRole,
            avatarUrl: profile.avatar_url || '',
            assignedGroupId: profile.assigned_group_id,
            children: children,
          };

          setCurrentUser(user);
          if (children.length > 0) {
            setActiveChild(children[0]);
          }
        } catch (error: any) {
          console.error('Full profile setup error:', error);
          // DO NOT SIGN OUT. Instead, set the error to be displayed.
          setProfileError(error.message || 'Ein unbekannter Fehler ist aufgetreten.');
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
    setProfileError(null); // Clear error on logout
  };

  const handleSetActiveChild = (child: Child) => {
    setActiveChild(child);
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
      if (error) {
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
      const { data, error } = await supabase.from('notifications').insert({ user_id: currentUser.id, message, type }).select().single();
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

  if (isLoading && !profileError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-100 to-cyan-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <PwaUpdater />
      {!currentUser ? (
        <Login error={profileError} />
      ) : (
        <AuthContext.Provider value={authContextValue}>
          <Layout 
            user={currentUser} 
            notifications={notifications}
            markNotificationAsRead={markNotificationAsRead}
            addNotification={addNotification}
          />
        </AuthContext.Provider>
      )}
    </ThemeProvider>
  );
};

export default App;