import React, { useState } from 'react';
import type { Notification } from '../types';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';
import { usersAPI } from '../lib/client';

interface HeaderProps {
  notifications: Notification[];
  markNotificationAsRead: (id: number) => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ notifications, markNotificationAsRead, onMenuClick }) => {
  const { user, activeChild, setActiveChild, logout } = useAuth();
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isChildMenuOpen, setChildMenuOpen] = useState(false);

  if (!user) {
    return null;
  }

  const hasMultipleChildren = user.children && user.children.length > 1;
  const avatarUrl = activeChild?.avatarUrl || user.avatarUrl;
  
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="flex items-center justify-between h-20 px-6 bg-white border-b-2 border-gray-200">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="md:hidden text-gray-500 focus:outline-none focus:text-gray-700 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
      </div>
      <div className="flex items-center">
        <NotificationBell notifications={notifications} markAsRead={markNotificationAsRead} />
        <div className="relative ml-4">
          <button
            onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center focus:outline-none"
            aria-haspopup="true"
            aria-expanded={isProfileMenuOpen}
          >
            <span className="hidden md:inline-block mr-3 text-right">
                <span className="font-semibold text-gray-700">{user.name}</span>
                <br/>
                <span className="text-sm text-gray-500">{activeChild ? `Kind: ${activeChild.name}` : user.role === 'admin' ? 'Verwaltung' : ''}</span>
            </span>
            {user.role === 'admin' && avatarUrl ? (
              <img
                className="h-12 w-12 rounded-full object-cover"
                src={avatarUrl}
                alt="Avatar"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-cyan-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {getInitials(user.name)}
                </span>
              </div>
            )}
          </button>
          {isProfileMenuOpen && (
            <div 
              onMouseLeave={() => setProfileMenuOpen(false)}
              className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl z-20"
              role="menu"
            >
              <a
                href="#"
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    await usersAPI.exportData(user.id);
                    setProfileMenuOpen(false);
                  } catch (error) {
                    console.error('Fehler beim Datenexport:', error);
                    alert('Fehler beim Datenexport. Bitte versuchen Sie es erneut.');
                  }
                }}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-cyan-500 hover:text-white"
                role="menuitem"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Daten exportieren
                </div>
              </a>
              <div className="border-t border-gray-200"></div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  logout();
                }}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-cyan-500 hover:text-white rounded-b-md"
                role="menuitem"
              >
                Abmelden
              </a>
            </div>
          )}
        </div>
        {hasMultipleChildren && (
            <div className="relative ml-2">
                <button 
                  onClick={() => setChildMenuOpen(!isChildMenuOpen)} 
                  className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                  aria-label="Kind wechseln"
                  aria-haspopup="true"
                  aria-expanded={isChildMenuOpen}
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
                {isChildMenuOpen && (
                    <div 
                      onMouseLeave={() => setChildMenuOpen(false)} 
                      className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl z-20"
                      role="menu"
                    >
                        <div className="py-2 px-4 text-gray-700 font-semibold bg-gray-50">Kind wechseln</div>
                        {user.children.map(child => (
                            <a
                                key={child.id}
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveChild(child);
                                    setChildMenuOpen(false);
                                }}
                                className={`flex items-center px-4 py-3 hover:bg-gray-100 transition-colors duration-150 ${activeChild?.id === child.id ? 'bg-cyan-50' : ''}`}
                                role="menuitem"
                            >
                                <div className="h-8 w-8 rounded-full bg-cyan-600 flex items-center justify-center mr-3">
                                  <span className="text-white font-bold text-sm">
                                    {getInitials(child.name)}
                                  </span>
                                </div>
                                <span className={`text-sm ${activeChild?.id === child.id ? 'font-semibold text-cyan-800' : 'text-gray-700'}`}>{child.name}</span>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>
    </header>
  );
};

export default Header;