import React from 'react';
import type { View, User } from '../types';
import { UserRole } from '../types';


interface SidebarProps {
  user: User;
  activeView: View;
  setActiveView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

// FIX: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
const SidebarIcon: React.FC<{ icon: React.ReactElement, text: string }> = ({ icon, text }) => (
    <>
        {icon}
        <span className="mx-4 font-medium">{text}</span>
    </>
);

const Sidebar: React.FC<SidebarProps> = ({ user, activeView, setActiveView, isOpen, onClose }) => {
  // FIX: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
  const navItems: { view: View; text: string; icon: React.ReactElement }[] = [
    { view: 'dashboard', text: 'Übersicht', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { view: 'elternpost', text: 'Elternpost', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { view: 'abwesenheit', text: 'Abwesenheit', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>},
    { view: 'veranstaltungen', text: 'Veranstaltungen', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { view: 'feriendienst', text: 'Feriendienst', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { view: 'dokumente', text: 'Dokumente', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { view: 'nachrichten', text: 'Nachrichten', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg> },
    { view: 'weitereInfos', text: 'Weitere Infos', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex-shrink-0 w-64 bg-white shadow-lg transform transition-transform md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-20 shadow-md bg-cyan-600 text-white px-4">
            <h1 className="text-xl font-bold whitespace-nowrap">Kinderhaus St. Wolfgang</h1>
            <button onClick={onClose} className="md:hidden p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <nav className="flex-1 px-2 py-4">
          {navItems.map((item, index) => (
            <React.Fragment key={item.view}>
              <a
                className={`flex items-center px-4 py-3 mt-2 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200 ${
                  activeView === item.view ? 'bg-cyan-100 text-cyan-800' : ''
                }`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveView(item.view);
                }}
              >
                <SidebarIcon icon={item.icon} text={item.text} />
              </a>
              {index === 0 && (user.role === UserRole.ADMIN || user.role === UserRole.GRUPPENLEITUNG) && (
                <a
                  className={`flex items-center px-4 py-3 mt-2 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200 ${
                    activeView === 'wochenbericht' ? 'bg-cyan-100 text-cyan-800' : ''
                  }`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveView('wochenbericht');
                  }}
                >
                  <SidebarIcon icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} text="Wochenbericht" />
                </a>
              )}
            </React.Fragment>
          ))}
          {user.role === UserRole.ADMIN && (
             <a
              key="verwaltung"
              className={`flex items-center px-4 py-3 mt-2 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200 ${
                activeView === 'verwaltung' ? 'bg-cyan-100 text-cyan-800' : ''
              }`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('verwaltung');
              }}
            >
              <SidebarIcon icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.28-1.25-.743-1.679M12 12a3 3 0 100-6 3 3 0 000 6zm-2 4h4a2 2 0 012 2v2H8v-2c0-1.105.9-2 2-2z" /></svg>} text="Verwaltung" />
            </a>
          )}
          
          <div className="border-t border-gray-200 mt-4 pt-4">
            <p className="px-4 text-xs text-gray-500 uppercase font-semibold mb-2">Rechtliches</p>
            <a
              className={`flex items-center px-4 py-2 mt-1 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200 text-sm ${
                activeView === 'datenschutz' ? 'bg-cyan-100 text-cyan-800' : ''
              }`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('datenschutz');
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="mx-3 font-medium">Datenschutz</span>
            </a>
            <a
              className={`flex items-center px-4 py-2 mt-1 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200 text-sm ${
                activeView === 'impressum' ? 'bg-cyan-100 text-cyan-800' : ''
              }`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('impressum');
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="mx-3 font-medium">Impressum</span>
            </a>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;