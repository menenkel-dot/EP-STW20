import React, { useState } from 'react';
import type { Event, EventType } from '../types';
import { UserRole } from '../types';

interface CalendarProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  userRole: UserRole;
}

const Calendar: React.FC<CalendarProps> = ({ events, onEventClick, userRole }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getEventTypeColor = (eventType: EventType): string => {
    switch (eventType) {
      case 'event':
        return 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200';
      case 'holiday':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'closure':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200';
    }
  };

  const parseEventDate = (dateString: string): Date | null => {
    const monthMap: { [key: string]: number } = {
      "Januar": 0, "Februar": 1, "März": 2, "April": 3, "Mai": 4, "Juni": 5,
      "Juli": 6, "August": 7, "September": 8, "Oktober": 9, "November": 10, "Dezember": 11
    };
    
    const parts = dateString.split(' ');
    if (parts.length === 3) {
      const day = parseInt(parts[0].replace('.', ''));
      const month = monthMap[parts[1]];
      const year = parseInt(parts[2]);
      
      if (!isNaN(day) && month !== undefined && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    return null;
  };

  const getEventsForDay = (day: number, month: number, year: number): Event[] => {
    return events.filter(event => {
      const eventStartDate = parseEventDate(event.date);
      if (!eventStartDate) return false;
      
      const currentDay = new Date(year, month, day);
      
      // If event has no end date, check if it matches the exact day
      if (!event.endDate) {
        return eventStartDate.getDate() === day &&
               eventStartDate.getMonth() === month &&
               eventStartDate.getFullYear() === year;
      }
      
      // If event has an end date, check if current day is within the range
      const eventEndDate = parseEventDate(event.endDate);
      if (!eventEndDate) {
        // If endDate parsing failed, treat it as a single day event
        return eventStartDate.getDate() === day &&
               eventStartDate.getMonth() === month &&
               eventStartDate.getFullYear() === year;
      }
      
      // Check if current day is within start and end date (inclusive)
      return currentDay >= eventStartDate && currentDay <= eventEndDate;
    });
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                         currentDate.getFullYear() === today.getFullYear();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={previousMonth}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Vorheriger Monat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-cyan-700 bg-cyan-50 rounded-md hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            Heute
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Nächster Monat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
        
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square"></div>;
          }

          const dayEvents = getEventsForDay(day, currentDate.getMonth(), currentDate.getFullYear());
          const isToday = isCurrentMonth && day === today.getDate();

          return (
            <div
              key={day}
              className={`aspect-square border rounded-lg p-1 ${
                isToday ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200'
              } hover:bg-gray-50 transition-colors`}
            >
              <div className="h-full flex flex-col">
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-cyan-700' : 'text-gray-700'}`}>
                  {day}
                </div>
                <div className="flex-1 overflow-y-auto space-y-0.5">
                  {dayEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`w-full text-left text-xs px-1 py-0.5 rounded transition-colors truncate ${getEventTypeColor(event.eventType)}`}
                      title={`${event.time} - ${event.title}`}
                    >
                      {event.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mb-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-cyan-100 rounded mr-2"></div>
            <span>Veranstaltung</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
            <span>Ferien</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 rounded mr-2"></div>
            <span>Schließtag</span>
          </div>
        </div>
        {userRole === UserRole.ADMIN || userRole === UserRole.GRUPPENLEITUNG ? (
          <span className="text-gray-500 italic text-sm">Klicken Sie auf einen Eintrag zum Bearbeiten</span>
        ) : (
          <span className="text-gray-500 italic text-sm">Klicken Sie auf einen Eintrag für Details</span>
        )}
      </div>
    </div>
  );
};

export default Calendar;
