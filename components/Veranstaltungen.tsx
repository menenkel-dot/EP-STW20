import React, { useState, useEffect } from 'react';
import type { Event, Group, EventType } from '../types';
import { UserRole } from '../types';
import Card from './Card';
import Button from './Button';
import Modal from './Modal';
import Calendar from './Calendar';
import { useAuth } from '../hooks/useAuth';
import { eventsAPI, groupsAPI } from '../lib/client';

const Veranstaltungen: React.FC = () => {
  const { user, activeChild } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [isViewModalOpen, setViewModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [eventType, setEventType] = useState<EventType>('event');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [eventsData, groupsData] = await Promise.all([
          eventsAPI.getAll(),
          groupsAPI.getAll()
        ]);
        const parsedEvents = eventsData.map((event: any) => ({
          ...event,
          groupIds: typeof event.groupIds === 'string' ? JSON.parse(event.groupIds) : event.groupIds
        }));
        setEvents(parsedEvents);
        setGroups(groupsData);
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  
  const handleOpenModal = (event: Event | null = null) => {
    if (event) {
      setEditingEvent(event);
      setTitle(event.title);
      // Assuming date is 'DD. MMMM YYYY', converting to 'YYYY-MM-DD' for input
      const dateParts = event.date.split(' ');
      const day = dateParts[0].replace('.', '');
      const monthName = dateParts[1];
      const year = dateParts[2];
      const monthMap: { [key: string]: string } = { "Januar": "01", "Februar": "02", "März": "03", "April": "04", "Mai": "05", "Juni": "06", "Juli": "07", "August": "08", "September": "09", "Oktober": "10", "November": "11", "Dezember": "12" };
      const month = monthMap[monthName] || '01';
      setDate(`${year}-${month}-${day.padStart(2, '0')}`);
      setTime(event.time.replace(' Uhr', ''));
      setLocation(event.location);
      setDescription(event.description);
      setSelectedGroupIds(event.groupIds || []);
      setEventType(event.eventType || 'event');
    } else {
      setEditingEvent(null);
      setTitle('');
      setDate('');
      setTime('');
      setLocation('');
      setDescription('');
      setEventType('event');
      // Gruppenleitung: Automatically pre-select their assigned group
      if (user?.role === UserRole.GRUPPENLEITUNG && user.assignedGroupId) {
        setSelectedGroupIds([user.assignedGroupId]);
      } else {
        setSelectedGroupIds([]);
      }
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleEventClick = (event: Event) => {
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.GRUPPENLEITUNG) {
      handleOpenModal(event);
    } else {
      setViewingEvent(event);
      setViewModalOpen(true);
    }
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setViewingEvent(null);
  };

  const handleSaveEvent = async () => {
    if (!title || !date || !time || !location || !description) {
        alert("Bitte alle Felder ausfüllen.");
        return;
    }
    
    // Format date back to 'DD. MMMM YYYY' for display
    const formattedDate = new Date(date).toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    setIsLoading(true);
    try {
      if (editingEvent) {
        const updated = await eventsAPI.update(editingEvent.id, { 
          title, 
          date: formattedDate, 
          time: `${time} Uhr`, 
          location, 
          description, 
          groupIds: selectedGroupIds,
          eventType
        });
        const parsedEvent = {
          ...updated,
          groupIds: typeof updated.groupIds === 'string' ? JSON.parse(updated.groupIds) : updated.groupIds
        };
        setEvents(events.map(e => e.id === editingEvent.id ? parsedEvent : e));
      } else {
        const newEvent = await eventsAPI.create({
          title,
          date: formattedDate,
          time: `${time} Uhr`,
          location,
          description,
          groupIds: selectedGroupIds,
          eventType,
        });
        const parsedEvent = {
          ...newEvent,
          groupIds: typeof newEvent.groupIds === 'string' ? JSON.parse(newEvent.groupIds) : newEvent.groupIds
        };
        setEvents([parsedEvent, ...events]);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Fehler beim Speichern der Veranstaltung:', error);
      alert('Fehler beim Speichern der Veranstaltung. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (window.confirm("Sind Sie sicher, dass Sie diese Veranstaltung löschen möchten?")) {
      setIsLoading(true);
      try {
        await eventsAPI.delete(eventId);
        setEvents(events.filter(e => e.id !== eventId));
      } catch (error) {
        console.error('Fehler beim Löschen der Veranstaltung:', error);
        alert('Fehler beim Löschen der Veranstaltung. Bitte versuchen Sie es erneut.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectAllGroups = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedGroupIds(groups.map(g => g.id));
    } else {
      setSelectedGroupIds([]);
    }
  };

  const handleGroupCheckboxChange = (groupId: number) => {
    setSelectedGroupIds(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const visibleEvents = user?.role === UserRole.ADMIN 
    ? events 
    : user?.role === UserRole.GRUPPENLEITUNG
    ? events.filter(event => event.groupIds && user.assignedGroupId && event.groupIds.includes(user.assignedGroupId))
    : events.filter(event => 
        !event.groupIds || event.groupIds.length === 0 || (activeChild && event.groupIds.includes(activeChild.groupId))
    );
  
  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Veranstaltungen</h1>
          {(user?.role === UserRole.ADMIN || user?.role === UserRole.GRUPPENLEITUNG) && (
            <Button onClick={() => handleOpenModal()}>+ Neue Veranstaltung</Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Alle Veranstaltungen</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleEvents.map((event) => (
            <Card key={event.id}>
              <div className="p-6 flex flex-col h-full">
                <div>
                  <p className="text-sm font-semibold text-cyan-600">{event.date} - {event.time}</p>
                  <h2 className="text-xl font-bold text-gray-800 mt-2">{event.title}</h2>
                   {event.groupIds && event.groupIds.length > 0 && (
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span className="flex items-center bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                        {event.groupIds.map(id => groups.find(g=>g.id === id)?.name).join(', ')}
                      </span>
                    </div>
                  )}
                  <p className="text-gray-600 mt-2">Ort: {event.location}</p>
                  <p className="text-gray-700 mt-4">{event.description}</p>
                </div>
                {((user?.role === UserRole.ADMIN) || 
                  (user?.role === UserRole.GRUPPENLEITUNG && event.groupIds && user.assignedGroupId && event.groupIds.includes(user.assignedGroupId))) && (
                  <div className="flex justify-end space-x-2 mt-4 pt-4 border-t mt-auto">
                      <Button onClick={() => handleOpenModal(event)} variant="secondary">Bearbeiten</Button>
                      <Button onClick={() => handleDeleteEvent(event.id)} variant="danger">Löschen</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Kalenderansicht</h2>
              <Calendar 
                events={visibleEvents} 
                onEventClick={handleEventClick}
                userRole={user?.role || UserRole.PARENT}
              />
            </div>
          </>
        )}
      </div>
      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEvent ? "Veranstaltung bearbeiten" : "Neue Veranstaltung erstellen"}>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titel</label>
            <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
          </div>
          <div>
            <label htmlFor="eventType" className="block text-sm font-medium text-gray-700">Typ</label>
            <select 
              id="eventType" 
              value={eventType} 
              onChange={e => setEventType(e.target.value as EventType)} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="event">Veranstaltung</option>
              <option value="holiday">Ferien</option>
              <option value="closure">Schließtag</option>
            </select>
          </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Datum</label>
              <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
            </div>
             <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700">Uhrzeit</label>
              <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
            </div>
           </div>
           <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Ort</label>
            <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Beschreibung</label>
            <textarea id="description" rows={3} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"></textarea>
          </div>
           {user?.role !== UserRole.GRUPPENLEITUNG && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Sichtbar für Gruppen (leer lassen für alle)</label>
              <div className="mt-2 space-y-2 border border-gray-300 rounded-md p-4 max-h-48 overflow-y-auto">
                <div className="flex items-center">
                  <input
                    id="all-groups-event"
                    type="checkbox"
                    checked={selectedGroupIds.length === groups.length}
                    onChange={handleSelectAllGroups}
                    className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                  />
                  <label htmlFor="all-groups-event" className="ml-3 block text-sm font-medium text-gray-900">
                    Alle Gruppen
                  </label>
                </div>
                <hr className="my-2" />
                {groups.map(group => (
                  <div key={group.id} className="flex items-center">
                    <input
                      id={`event-group-${group.id}`}
                      type="checkbox"
                      checked={selectedGroupIds.includes(group.id)}
                      onChange={() => handleGroupCheckboxChange(group.id)}
                      className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                    />
                    <label htmlFor={`event-group-${group.id}`} className="ml-3 block text-sm text-gray-700">
                      {group.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
           )}
           {user?.role === UserRole.GRUPPENLEITUNG && (
             <div className="bg-cyan-50 border border-cyan-200 rounded-md p-3">
               <p className="text-sm text-gray-700">
                 Veranstaltung wird automatisch für Ihre zugewiesene Gruppe erstellt: <strong>{groups.find(g => g.id === user.assignedGroupId)?.name}</strong>
               </p>
             </div>
           )}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveEvent}>{editingEvent ? 'Änderungen speichern' : 'Erstellen'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={handleCloseViewModal} title="Veranstaltungsdetails">
        {viewingEvent && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{viewingEvent.title}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Datum</label>
                <p className="mt-1 text-gray-800">{viewingEvent.date}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Uhrzeit</label>
                <p className="mt-1 text-gray-800">{viewingEvent.time}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Ort</label>
              <p className="mt-1 text-gray-800">{viewingEvent.location}</p>
            </div>
            {viewingEvent.groupIds && viewingEvent.groupIds.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-600">Gruppen</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {viewingEvent.groupIds.map(id => {
                    const group = groups.find(g => g.id === id);
                    return group ? (
                      <span key={id} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                        {group.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-600">Beschreibung</label>
              <p className="mt-1 text-gray-800 whitespace-pre-wrap">{viewingEvent.description}</p>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={handleCloseViewModal} variant="secondary">Schließen</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Veranstaltungen;