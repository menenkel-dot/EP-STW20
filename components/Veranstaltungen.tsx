import React, { useState } from 'react';
import { MOCK_EVENTS, MOCK_GROUPS } from '../constants';
import type { Event } from '../types';
import { UserRole } from '../types';
import Card from './Card';
import Button from './Button';
import Modal from './Modal';
import { useAuth } from '../hooks/useAuth';

const Veranstaltungen: React.FC = () => {
  const { user, activeChild } = useAuth();
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  
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
    } else {
      setEditingEvent(null);
      setTitle('');
      setDate('');
      setTime('');
      setLocation('');
      setDescription('');
      setSelectedGroupIds([]);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSaveEvent = () => {
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

    if (editingEvent) {
        setEvents(events.map(e => e.id === editingEvent.id ? { ...e, title, date: formattedDate, time: `${time} Uhr`, location, description, groupIds: selectedGroupIds } : e));
    } else {
        const newEvent: Event = {
            id: Date.now(),
            title,
            date: formattedDate,
            time: `${time} Uhr`,
            location,
            description,
            groupIds: selectedGroupIds,
        };
        setEvents([newEvent, ...events]);
    }
    handleCloseModal();
  };

  const handleDeleteEvent = (eventId: number) => {
    if (window.confirm("Sind Sie sicher, dass Sie diese Veranstaltung löschen möchten?")) {
        setEvents(events.filter(e => e.id !== eventId));
    }
  };

  const handleSelectAllGroups = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedGroupIds(MOCK_GROUPS.map(g => g.id));
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
    : events.filter(event => 
        !event.groupIds || event.groupIds.length === 0 || (activeChild && event.groupIds.includes(activeChild.groupId))
    );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Kommende Veranstaltungen</h1>
        {user?.role === UserRole.ADMIN && (
          <Button onClick={() => handleOpenModal()}>+ Neue Veranstaltung</Button>
        )}
      </div>
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
                      {event.groupIds.map(id => MOCK_GROUPS.find(g=>g.id === id)?.name).join(', ')}
                    </span>
                  </div>
                )}
                <p className="text-gray-600 mt-2">Ort: {event.location}</p>
                <p className="text-gray-700 mt-4">{event.description}</p>
              </div>
              {user?.role === UserRole.ADMIN && (
                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t mt-auto">
                    <Button onClick={() => handleOpenModal(event)} variant="secondary">Bearbeiten</Button>
                    <Button onClick={() => handleDeleteEvent(event.id)} variant="danger">Löschen</Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEvent ? "Veranstaltung bearbeiten" : "Neue Veranstaltung erstellen"}>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titel</label>
            <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
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
           <div>
            <label className="block text-sm font-medium text-gray-700">Sichtbar für Gruppen (leer lassen für alle)</label>
            <div className="mt-2 space-y-2 border border-gray-300 rounded-md p-4 max-h-48 overflow-y-auto">
              <div className="flex items-center">
                <input
                  id="all-groups-event"
                  type="checkbox"
                  checked={selectedGroupIds.length === MOCK_GROUPS.length}
                  onChange={handleSelectAllGroups}
                  className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                />
                <label htmlFor="all-groups-event" className="ml-3 block text-sm font-medium text-gray-900">
                  Alle Gruppen
                </label>
              </div>
              <hr className="my-2" />
              {MOCK_GROUPS.map(group => (
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
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveEvent}>{editingEvent ? 'Änderungen speichern' : 'Erstellen'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Veranstaltungen;