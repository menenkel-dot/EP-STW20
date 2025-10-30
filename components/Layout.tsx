import React, { useState } from 'react';
import type { User, View, Notification } from '../types';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import Elternpost from './Elternpost';
import Veranstaltungen from './Veranstaltungen';
import Feriendienst from './Feriendienst';
import Dokumente from './Dokumente';
import Nachrichten from './Nachrichten';
import Verwaltung from './Verwaltung';
import Abwesenheit from './Abwesenheit';
import WeitereInfos from './WeitereInfos';
import Datenschutz from './Datenschutz';
import Impressum from './Impressum';

interface LayoutProps {
  user: User;
  notifications: Notification[];
  markNotificationAsRead: (id: number) => void;
  addNotification: (message: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, notifications, markNotificationAsRead, addNotification }) => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard setActiveView={setActiveView} />;
      case 'elternpost':
        return <Elternpost addNotification={addNotification} />;
      case 'veranstaltungen':
        return <Veranstaltungen />;
      case 'abwesenheit':
        return <Abwesenheit addNotification={addNotification} />;
      case 'feriendienst':
        return <Feriendienst addNotification={addNotification} />;
      case 'dokumente':
        return <Dokumente />;
      case 'nachrichten':
        return <Nachrichten user={user} />;
      case 'verwaltung':
        return <Verwaltung />;
      case 'weitereInfos':
        return <WeitereInfos />;
      case 'datenschutz':
        return <Datenschutz />;
      case 'impressum':
        return <Impressum />;
      default:
        return <Dashboard setActiveView={setActiveView} />;
    }
  };

  const handleSetView = (view: View) => {
    setActiveView(view);
    setSidebarOpen(false); // Close sidebar on mobile navigation
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        user={user} 
        activeView={activeView} 
        setActiveView={handleSetView} 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          notifications={notifications} 
          markNotificationAsRead={markNotificationAsRead} 
          onMenuClick={() => setSidebarOpen(true)} 
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
          <div className="container mx-auto px-2 sm:px-4">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;