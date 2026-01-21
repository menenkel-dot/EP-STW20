import React, { useState } from 'react';
import type { Notification, View, Child } from '../types';
import { UserRole } from '../types';
import NotificationBell from './NotificationBell';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Sun, Moon, Menu, ChevronDown } from 'lucide-react';

interface HeaderProps {
  notifications: Notification[];
  markNotificationAsRead: (id: number) => void;
  onMenuClick: () => void;
  setActiveView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ notifications, markNotificationAsRead, onMenuClick, setActiveView }) => {
  const { user, activeChild, setActiveChild, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isChildMenuOpen, setChildMenuOpen] = useState(false);

  const handleChildSelect = (child: Child) => {
    setActiveChild(child);
    setChildMenuOpen(false);
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
        case UserRole.ADMIN: return 'Administrator';
        case UserRole.PARENT: return 'Eltern';
        case UserRole.GRUPPENLEITUNG: return 'Gruppenleitung';
        default: return role;
    }
  };

  return (
    <header className="flex items-center justify-between h-20 px-6 bg-white border-b-2 border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="text-gray-500 focus:outline-none md:hidden dark:text-gray-400">
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-800 ml-4 md:ml-0 dark:text-gray-100">Elternportal</h1>
      </div>

      <div className="flex items-center space-x-4">
        {user?.role === UserRole.PARENT && user.children.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setChildMenuOpen(!isChildMenuOpen)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <span className="font-semibold text-gray-700 dark:text-gray-200">{activeChild?.name}</span>
              <ChevronDown size={16} className="text-gray-600 dark:text-gray-400" />
            </button>
            {isChildMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 dark:bg-gray-800 dark:border dark:border-gray-700">
                {user.children.map(child => (
                  <a
                    key={child.id}
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleChildSelect(child); }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    {child.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:focus:bg-gray-700"
          aria-label="Toggle dark mode"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <NotificationBell notifications={notifications} markAsRead={markNotificationAsRead} />

        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(user?.name || '')
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{getRoleLabel(user?.role || '')}</p>
            </div>
          </button>
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 dark:bg-gray-800 dark:border dark:border-gray-700">
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('datenschutz'); setProfileMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">Datenschutz</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('impressum'); setProfileMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">Impressum</a>
              <div className="border-t border-gray-100 dark:border-gray-700"></div>
              <a href="#" onClick={(e) => { e.preventDefault(); logout(); }} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700">Abmelden</a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;