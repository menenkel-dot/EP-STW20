
import React, { useState } from 'react';
import type { Notification } from '../types';

interface NotificationBellProps {
  notifications: Notification[];
  markAsRead: (id: number) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, markAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIconForType = (type: Notification['type']) => {
    switch (type) {
        case 'info': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
        case 'alert': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.27-1.21 2.906 0l4.357 8.322c.636 1.21-.24 2.718-1.453 2.718H5.353c-1.213 0-2.09-1.508-1.453-2.718l4.357-8.322zM10 14a1 1 0 100-2 1 1 0 000 2zm-1-5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
        case 'success': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:bg-gray-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          onMouseLeave={() => setIsOpen(false)}
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-20"
        >
          <div className="py-2 px-4 text-gray-700 font-semibold bg-gray-50">Benachrichtigungen</div>
          <div className="divide-y divide-gray-100">
            {notifications.length > 0 ? notifications.map(n => (
              <a
                key={n.id}
                href="#"
                onClick={(e) => { e.preventDefault(); markAsRead(n.id); }}
                className={`flex items-start px-4 py-3 hover:bg-gray-100 transition ease-in-out duration-150 ${!n.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex-shrink-0 mt-1">{getIconForType(n.type)}</div>
                <div className="ml-3">
                    <p className={`text-sm leading-5 ${!n.read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                        {n.message}
                    </p>
                </div>
              </a>
            )) : <p className="p-4 text-sm text-gray-500">Keine neuen Benachrichtigungen.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
