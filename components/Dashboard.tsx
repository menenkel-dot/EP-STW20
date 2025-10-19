import React, { useState, useEffect, useRef } from 'react';
import type { View } from '../types';
import { MOCK_POSTS, MOCK_EVENTS, MOCK_GROUPS } from '../constants';
import Card from './Card';
import { UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';

// --- Widget Components (Extracted from original render) ---

const LatestPostWidget: React.FC<{ setActiveView: (view: View) => void }> = ({ setActiveView }) => {
  const latestPost = MOCK_POSTS[0];
  return (
    <Card onClick={() => setActiveView('elternpost')} className="hover:scale-105 h-full">
      <div className="p-6">
        <h2 className="text-sm font-semibold text-cyan-600 uppercase tracking-wide">Neueste Elternpost</h2>
        <h3 className="text-xl font-bold text-gray-800 mt-2">{latestPost.title}</h3>
        <p className="text-gray-600 mt-2 truncate">{latestPost.content}</p>
        <div className="mt-4 text-cyan-700 font-semibold hover:text-cyan-800">
          Weiterlesen &rarr;
        </div>
      </div>
    </Card>
  );
};

const UpcomingEventWidget: React.FC<{ setActiveView: (view: View) => void }> = ({ setActiveView }) => {
  const upcomingEvent = MOCK_EVENTS[0];
  return (
    <Card onClick={() => setActiveView('veranstaltungen')} className="hover:scale-105 h-full">
      <div className="p-6">
        <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Nächste Veranstaltung</h2>
        <h3 className="text-xl font-bold text-gray-800 mt-2">{upcomingEvent.title}</h3>
        <p className="text-gray-600 mt-2">{upcomingEvent.date} um {upcomingEvent.time}</p>
         <div className="mt-4 text-amber-700 font-semibold hover:text-amber-800">
          Details anzeigen &rarr;
        </div>
      </div>
    </Card>
  );
};

const QuickActionsWidget: React.FC<{ setActiveView: (view: View) => void }> = ({ setActiveView }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Schnellzugriff</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div onClick={() => setActiveView('abwesenheit')} className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-lg hover:shadow-xl hover:bg-rose-50 transition cursor-pointer">
              <div className="p-3 bg-rose-100 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
              <p className="mt-2 font-semibold text-gray-700 text-center">Abwesenheit melden</p>
          </div>
         <div onClick={() => setActiveView('feriendienst')} className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-lg hover:shadow-xl hover:bg-teal-50 transition cursor-pointer">
              <div className="p-3 bg-teal-100 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
              <p className="mt-2 font-semibold text-gray-700">Feriendienst</p>
          </div>
          <div onClick={() => setActiveView('dokumente')} className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-lg hover:shadow-xl hover:bg-sky-50 transition cursor-pointer">
              <div className="p-3 bg-sky-100 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
              <p className="mt-2 font-semibold text-gray-700">Dokumente</p>
          </div>
           <div onClick={() => setActiveView('nachrichten')} className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-lg hover:shadow-xl hover:bg-indigo-50 transition cursor-pointer">
              <div className="p-3 bg-indigo-100 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></div>
              <p className="mt-2 font-semibold text-gray-700">Nachrichten</p>
          </div>
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---

interface DashboardProps {
  setActiveView: (view: View) => void;
}

const WIDGETS_CONFIG = {
    latestPost: { title: 'Neueste Elternpost', className: 'lg:col-span-1' },
    upcomingEvent: { title: 'Nächste Veranstaltung', className: 'lg:col-span-1' },
    quickActions: { title: 'Schnellzugriff', className: 'lg:col-span-2' },
};

const DEFAULT_ORDER = Object.keys(WIDGETS_CONFIG);
const DEFAULT_VISIBILITY = {
  latestPost: true,
  upcomingEvent: true,
  quickActions: true,
};


const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  const { user, activeChild } = useAuth();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState<string[]>(DEFAULT_ORDER);
  const [widgetVisibility, setWidgetVisibility] = useState<Record<string, boolean>>(DEFAULT_VISIBILITY);
  const draggedWidgetId = useRef<string | null>(null);
  
  useEffect(() => {
    if (user && user.role === UserRole.PARENT) {
      try {
        const savedOrder = localStorage.getItem(`dashboardOrder_${user.id}`);
        const savedVisibility = localStorage.getItem(`dashboardVisibility_${user.id}`);
        if (savedOrder) {
          const parsedOrder = JSON.parse(savedOrder);
          // Ensure saved order contains all widgets, in case new widgets are added later
          const fullOrder = [...new Set([...parsedOrder, ...DEFAULT_ORDER])];
          setWidgetOrder(fullOrder);
        }
        if (savedVisibility) {
           const parsedVisibility = JSON.parse(savedVisibility);
           // Merge with defaults to handle new widgets
           setWidgetVisibility({ ...DEFAULT_VISIBILITY, ...parsedVisibility });
        }
      } catch (error) {
        console.error("Failed to load dashboard layout from localStorage", error);
        setWidgetOrder(DEFAULT_ORDER);
        setWidgetVisibility(DEFAULT_VISIBILITY);
      }
    }
  }, [user]);

  const saveLayout = (order: string[], visibility: Record<string, boolean>) => {
    if (user && user.role === UserRole.PARENT) {
      try {
        localStorage.setItem(`dashboardOrder_${user.id}`, JSON.stringify(order));
        localStorage.setItem(`dashboardVisibility_${user.id}`, JSON.stringify(visibility));
      } catch (error) {
        console.error("Failed to save dashboard layout to localStorage", error);
      }
    }
  };

  const handleToggleEditMode = () => {
    if (isEditMode) {
      saveLayout(widgetOrder, widgetVisibility);
    }
    setIsEditMode(!isEditMode);
  };

  const handleToggleVisibility = (widgetId: string) => {
    setWidgetVisibility(prev => ({ ...prev, [widgetId]: !prev[widgetId] }));
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    draggedWidgetId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropTargetId: string) => {
    e.preventDefault();
    if (!draggedWidgetId.current || draggedWidgetId.current === dropTargetId) return;

    const newOrder = [...widgetOrder];
    const draggedIndex = newOrder.indexOf(draggedWidgetId.current);
    const dropIndex = newOrder.indexOf(dropTargetId);

    if (draggedIndex === -1 || dropIndex === -1) return;

    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed);

    setWidgetOrder(newOrder);
    draggedWidgetId.current = null;
  };
  
  if (!user) {
    return null; // Should not happen if rendered inside Layout
  }

  const getGroupName = (groupId: number): string => {
    return MOCK_GROUPS.find(g => g.id === groupId)?.name || 'Unbekannte Gruppe';
  }

  const greeting = `Willkommen zurück, ${user.name}!`;
  const subGreeting = user.role === UserRole.PARENT && activeChild
    ? `Hier ist eine Zusammenfassung für ${activeChild.name} aus der ${getGroupName(activeChild.groupId)}.`
    : `Sie sind als Administrator angemeldet.`;

  const widgets = {
    latestPost: <LatestPostWidget setActiveView={setActiveView} />,
    upcomingEvent: <UpcomingEventWidget setActiveView={setActiveView} />,
    quickActions: <QuickActionsWidget setActiveView={setActiveView} />,
  };
  
  const visibleWidgets = widgetOrder.filter(id => widgetVisibility[id]);

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">{greeting}</h1>
            <p className="text-gray-600 mt-1">{subGreeting}</p>
        </div>
        {user.role === UserRole.PARENT && (
            <Button onClick={handleToggleEditMode} variant={isEditMode ? 'secondary' : 'primary'}>
                {isEditMode ? 'Fertig' : 'Anpassen'}
            </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {isEditMode ? 
            // EDIT MODE VIEW
            widgetOrder.map(widgetId => {
                const config = WIDGETS_CONFIG[widgetId as keyof typeof WIDGETS_CONFIG];
                const isVisible = widgetVisibility[widgetId];
                return (
                    <div 
                        key={widgetId} 
                        className={`${config.className} relative border-2 border-dashed ${isVisible ? 'border-gray-300' : 'border-gray-200'} rounded-xl`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, widgetId)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, widgetId)}
                    >
                        <div className="absolute top-0 left-0 w-full p-2 bg-gray-200 rounded-t-lg flex justify-between items-center z-10 cursor-grab">
                            <span className="font-bold text-gray-700">{config.title}</span>
                            <button onClick={() => handleToggleVisibility(widgetId)} title={isVisible ? 'Ausblenden' : 'Einblenden'} className="p-1 rounded-full hover:bg-gray-300">
                                {isVisible ? 
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C3.732 4.943 7.523 3 10 3s6.268 1.943 9.542 7c-3.274 5.057-7.03 7-9.542 7S3.732 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg> :
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.27 8.138 15.824 5.865 13.333 4.43c-1.125-.547-2.29-.84-3.333-.84-.586 0-1.158.067-1.713.19l-1.29-1.29zM10 15c-3.446 0-6.237-2.31-7.952-4.542C3.12 9.208 4.79 7.742 6.32 6.744L4.99 5.414A12.016 12.016 0 00.458 10C3.732 15.057 7.523 17 10 17c.51 0 1.012-.04 1.503-.114l-1.38-1.38A3.997 3.997 0 0110 15z" clipRule="evenodd" /></svg>
                                }
                            </button>
                        </div>
                        <div className={`mt-10 ${!isVisible ? 'opacity-40' : ''}`}>
                             {widgets[widgetId as keyof typeof widgets]}
                        </div>
                    </div>
                );
            }) :
            // NORMAL VIEW
            visibleWidgets.map(widgetId => (
                <div key={widgetId} className={WIDGETS_CONFIG[widgetId as keyof typeof WIDGETS_CONFIG].className}>
                    {widgets[widgetId as keyof typeof widgets]}
                </div>
            ))
        }
        {(!isEditMode && user.role === UserRole.PARENT && visibleWidgets.length === 0) && (
            <div className="lg:col-span-2 text-center py-12 text-gray-500 bg-white rounded-xl shadow-lg">
                <p>Alle Widgets sind ausgeblendet.</p>
                <p className="mt-2">Klicken Sie auf "Anpassen", um sie wieder einzublenden.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
