import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { HolidayCareBooking, HolidayPeriod, Child, Group } from '../types';
import { UserRole } from '../types';
import Card from './Card';
import Button from './Button';
import Modal from './Modal';
import { supabase } from '../integrations/supabase/client';

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Top-level component to prevent re-mounting
const AdminView: React.FC<{
  isLoading: boolean;
  periods: HolidayPeriod[];
  selectedPeriod: HolidayPeriod | null;
  setSelectedPeriod: (period: HolidayPeriod | null) => void;
  handleOpenPeriodModal: (period?: HolidayPeriod | null) => void;
  handleDeletePeriod: (id: number) => void;
  bookings: HolidayCareBooking[];
  children: Child[];
  groups: Group[];
  filterName: string;
  setFilterName: (value: string) => void;
  filterGruppe: string;
  setFilterGruppe: (value: string) => void;
  filterBedarf: string;
  setFilterBedarf: (value: string) => void;
  filterMittagessen: string;
  setFilterMittagessen: (value: string) => void;
  filterFruehdienst: string;
  setFilterFruehdienst: (value: string) => void;
  resetFilters: () => void;
  filteredBookings: HolidayCareBooking[];
  getChildById: (id: number) => Child | undefined;
  getGroupName: (id: number) => string;
  isPeriodModalOpen: boolean;
  setPeriodModalOpen: (value: boolean) => void;
  editingPeriod: HolidayPeriod | null;
  newPeriodName: string;
  handleSetNewPeriodName: (value: string) => void;
  newPeriodStart: string;
  handleSetNewPeriodStart: (value: string) => void;
  newPeriodEnd: string;
  handleSetNewPeriodEnd: (value: string) => void;
  newPeriodDeadline: string;
  handleSetNewPeriodDeadline: (value: string) => void;
  handleSavePeriod: () => void;
}> = React.memo(({ 
  isLoading,
  periods,
  selectedPeriod,
  setSelectedPeriod,
  handleOpenPeriodModal,
  handleDeletePeriod,
  bookings,
  children,
  groups,
  filterName,
  setFilterName,
  filterGruppe,
  setFilterGruppe,
  filterBedarf,
  setFilterBedarf,
  filterMittagessen,
  setFilterMittagessen,
  filterFruehdienst,
  setFilterFruehdienst,
  resetFilters,
  filteredBookings,
  getChildById,
  getGroupName,
  isPeriodModalOpen,
  setPeriodModalOpen,
  editingPeriod,
  newPeriodName,
  handleSetNewPeriodName,
  newPeriodStart,
  handleSetNewPeriodStart,
  newPeriodEnd,
  handleSetNewPeriodEnd,
  newPeriodDeadline,
  handleSetNewPeriodDeadline,
  handleSavePeriod
}) => (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-gray-800">Feriendienst Verwaltung</h1>
      <Button onClick={() => handleOpenPeriodModal()}>+ Neuer Zeitraum</Button>
    </div>

    {isLoading ? (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    ) : (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {periods.map(p => (
            <Card key={p.id} onClick={() => setSelectedPeriod(p)} className={`hover:bg-cyan-50 flex flex-col ${selectedPeriod?.id === p.id ? 'ring-2 ring-cyan-500' : ''}`}>
              <div className="p-6 flex-grow">
                <h2 className="text-xl font-bold text-gray-800">{p.name}</h2>
                <p className="text-gray-600">{formatDate(p.startDate)} - {formatDate(p.endDate)}</p>
                <p className="text-sm text-red-600 mt-1">Anmeldefrist: {formatDate(p.deadline)}</p>
              </div>
              <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                <Button onClick={(e) => { e.stopPropagation(); handleOpenPeriodModal(p); }} variant="secondary">Bearbeiten</Button>
                <Button onClick={(e) => { e.stopPropagation(); handleDeletePeriod(p.id); }} variant="danger">Löschen</Button>
              </div>
            </Card>
          ))}
        </div>
      
        {selectedPeriod && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Buchungen für: {selectedPeriod.name}</h2>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-wrap items-end gap-4 border">
              <div>
                <label htmlFor="filter-name" className="block text-sm font-medium text-gray-700">Name des Kindes</label>
                <input type="text" id="filter-name" value={filterName} onChange={e => setFilterName(e.target.value)} placeholder="Suchen..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"/>
              </div>
              <div>
                <label htmlFor="filter-group" className="block text-sm font-medium text-gray-700">Gruppe</label>
                <select id="filter-group" value={filterGruppe} onChange={e => setFilterGruppe(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md">
                  <option value="all">Alle Gruppen</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="filter-bedarf" className="block text-sm font-medium text-gray-700">Bedarf</label>
                <select id="filter-bedarf" value={filterBedarf} onChange={e => setFilterBedarf(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md">
                  <option value="all">Alle</option>
                  <option value="yes">Ja</option>
                  <option value="no">Nein</option>
                </select>
              </div>
              <div>
                <label htmlFor="filter-mittagessen" className="block text-sm font-medium text-gray-700">Mittagessen</label>
                <select id="filter-mittagessen" value={filterMittagessen} onChange={e => setFilterMittagessen(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md">
                  <option value="all">Alle</option>
                  <option value="yes">Ja</option>
                  <option value="no">Nein</option>
                </select>
              </div>
              <div>
                <label htmlFor="filter-fruehdienst" className="block text-sm font-medium text-gray-700">Frühdienst</label>
                <select id="filter-fruehdienst" value={filterFruehdienst} onChange={e => setFilterFruehdienst(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md">
                  <option value="all">Alle</option>
                  <option value="yes">Ja</option>
                  <option value="no">Nein</option>
                </select>
              </div>
              <div>
                <Button onClick={resetFilters} variant="secondary">Filter zurücksetzen</Button>
              </div>
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kind (Gruppe)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bedarf</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zeitraum</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uhrzeit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mittagessen</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frühdienst</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.length > 0 ? filteredBookings.map(b => {
                      const child = getChildById(b.childId);
                      const groupName = child ? getGroupName(child.groupId) : 'N/A';
                      return (
                        <tr key={b.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {child?.name || 'Unbekanntes Kind'}
                            <span className="ml-1 text-gray-500">({groupName})</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {b.needsCare ? 
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Ja</span> : 
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Nein</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{b.needsCare ? `${formatDate(b.bookedFromDate!)} - ${formatDate(b.bookedToDate!)}` : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{b.needsCare ? `${b.bookedFromTime} - ${b.bookedToTime}` : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{b.needsCare ? (b.withLunch ? 'Ja' : 'Nein') : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{b.needsCare ? (b.earlyService ? 'Ja' : 'Nein') : '-'}</td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-500">
                          Keine Buchungen für die aktuellen Filter gefunden.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </>
    )}

    <PeriodFormModal
      isOpen={isPeriodModalOpen}
      onClose={() => setPeriodModalOpen(false)}
      editingPeriod={editingPeriod}
      newPeriodName={newPeriodName}
      setNewPeriodName={handleSetNewPeriodName}
      newPeriodStart={newPeriodStart}
      setNewPeriodStart={handleSetNewPeriodStart}
      newPeriodEnd={newPeriodEnd}
      setNewPeriodEnd={handleSetNewPeriodEnd}
      newPeriodDeadline={newPeriodDeadline}
      setNewPeriodDeadline={handleSetNewPeriodDeadline}
      onSave={handleSavePeriod}
    />
  </div>
));

const PeriodFormModal = React.memo<{
  isOpen: boolean;
  onClose: () => void;
  editingPeriod: HolidayPeriod | null;
  newPeriodName: string;
  setNewPeriodName: (value: string) => void;
  newPeriodStart: string;
  setNewPeriodStart: (value: string) => void;
  newPeriodEnd: string;
  setNewPeriodEnd: (value: string) => void;
  newPeriodDeadline: string;
  setNewPeriodDeadline: (value: string) => void;
  onSave: () => void;
}>(({ isOpen, onClose, editingPeriod, newPeriodName, setNewPeriodName, newPeriodStart, setNewPeriodStart, newPeriodEnd, setNewPeriodEnd, newPeriodDeadline, setNewPeriodDeadline, onSave }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={editingPeriod ? 'Zeitraum bearbeiten' : 'Neuen Ferienzeitraum erstellen'}>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input 
          type="text" 
          value={newPeriodName} 
          onChange={e => setNewPeriodName(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Startdatum</label>
          <input 
            type="date" 
            value={newPeriodStart} 
            onChange={e => setNewPeriodStart(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Enddatum</label>
          <input 
            type="date" 
            value={newPeriodEnd} 
            onChange={e => setNewPeriodEnd(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Anmeldefrist</label>
        <input 
          type="date" 
          value={newPeriodDeadline} 
          onChange={e => setNewPeriodDeadline(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
        />
      </div>
      <div className="flex justify-end pt-4">
        <Button onClick={onSave}>
          {editingPeriod ? 'Änderungen speichern' : 'Erstellen'}
        </Button>
      </div>
    </div>
  </Modal>
));

interface FeriendienstProps {
  addNotification: (message: string) => void;
}

const Feriendienst: React.FC<FeriendienstProps> = ({ addNotification }) => {
  const { user, activeChild } = useAuth();
  const [periods, setPeriods] = useState<HolidayPeriod[]>([]);
  const [bookings, setBookings] = useState<HolidayCareBooking[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getChildById = (childId: number): Child | undefined => children.find(c => c.id === childId);
  const getGroupName = (groupId: number): string => groups.find(g => g.id === groupId)?.name || 'N/A';

  // Admin state
  const [selectedPeriod, setSelectedPeriod] = useState<HolidayPeriod | null>(null);
  const [isPeriodModalOpen, setPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<HolidayPeriod | null>(null);
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newPeriodStart, setNewPeriodStart] = useState('');
  const [newPeriodEnd, setNewPeriodEnd] = useState('');
  const [newPeriodDeadline, setNewPeriodDeadline] = useState('');

  // Stabilize callbacks to prevent re-renders
  const handleSetNewPeriodName = useCallback((value: string) => setNewPeriodName(value), []);
  const handleSetNewPeriodStart = useCallback((value: string) => setNewPeriodStart(value), []);
  const handleSetNewPeriodEnd = useCallback((value: string) => setNewPeriodEnd(value), []);
  const handleSetNewPeriodDeadline = useCallback((value: string) => setNewPeriodDeadline(value), []);
  
  // Admin filter state
  const [filterName, setFilterName] = useState('');
  const [filterGruppe, setFilterGruppe] = useState('all');
  const [filterBedarf, setFilterBedarf] = useState('all');
  const [filterMittagessen, setFilterMittagessen] = useState('all');
  const [filterFruehdienst, setFilterFruehdienst] = useState('all');

  // Parent state
  const [editingBooking, setEditingBooking] = useState<HolidayCareBooking | null>(null);
  const [formNeedsCare, setFormNeedsCare] = useState<boolean | null>(null);
  const [formFromDate, setFormFromDate] = useState('');
  const [formToDate, setFormToDate] = useState('');
  const [formFromTime, setFormFromTime] = useState('08:00');
  const [formToTime, setFormToTime] = useState('14:00');
  const [formWithLunch, setFormWithLunch] = useState(false);
  const [formEarlyService, setFormEarlyService] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [
          { data: periodsData, error: periodsError },
          { data: bookingsData, error: bookingsError },
          { data: groupsData, error: groupsError }
        ] = await Promise.all([
          supabase.from('holiday_periods').select('*').order('start_date', { ascending: true }),
          supabase.from('holiday_bookings').select('*'),
          supabase.from('groups').select('*')
        ]);

        if (periodsError) throw periodsError;
        if (bookingsError) throw bookingsError;
        if (groupsError) throw groupsError;

        setPeriods(periodsData.map(p => ({ id: p.id, name: p.name, startDate: p.start_date, endDate: p.end_date, deadline: p.deadline })));
        setBookings(bookingsData.map(b => ({ id: b.id, childId: b.child_id, periodId: b.period_id, needsCare: b.needs_care, bookedFromDate: b.booked_from_date, bookedToDate: b.booked_to_date, bookedFromTime: b.booked_from_time, bookedToTime: b.booked_to_time, withLunch: b.with_lunch, earlyService: b.early_service })));
        setGroups(groupsData);

        if (user.role === UserRole.ADMIN || user.role === UserRole.GRUPPENLEITUNG) {
          const { data: childrenData, error: childrenError } = await supabase.from('children').select('*');
          if (childrenError) throw childrenError;
          setChildren(childrenData.map(c => ({ id: c.id, name: c.name, groupId: c.group_id, avatarUrl: c.avatar_url || '' })));
        } else {
          setChildren(user.children);
        }

      } catch (error) {
        console.error('Fehler beim Laden der Feriendienst-Daten:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user, activeChild]);

  const handleOpenPeriodModal = (period: HolidayPeriod | null = null) => {
    if (period) {
        setEditingPeriod(period);
        setNewPeriodName(period.name);
        setNewPeriodStart(period.startDate);
        setNewPeriodEnd(period.endDate);
        setNewPeriodDeadline(period.deadline);
    } else {
        setEditingPeriod(null);
        setNewPeriodName('');
        setNewPeriodStart('');
        setNewPeriodEnd('');
        setNewPeriodDeadline('');
    }
    setPeriodModalOpen(true);
  };

  const handleSavePeriod = async () => {
    if (!newPeriodName || !newPeriodStart || !newPeriodEnd || !newPeriodDeadline) {
      alert('Bitte alle Felder ausfüllen.');
      return;
    }

    setIsLoading(true);
    try {
      const periodData = {
        name: newPeriodName,
        start_date: newPeriodStart,
        end_date: newPeriodEnd,
        deadline: newPeriodDeadline,
      };

      if (editingPeriod) {
        const { data, error } = await supabase
          .from('holiday_periods')
          .update(periodData)
          .eq('id', editingPeriod.id)
          .select()
          .single();
        if (error) throw error;
        const updatedPeriod = { id: data.id, name: data.name, startDate: data.start_date, endDate: data.end_date, deadline: data.deadline };
        setPeriods(periods.map(p => p.id === editingPeriod.id ? updatedPeriod : p));
      } else {
        const { data, error } = await supabase
          .from('holiday_periods')
          .insert(periodData)
          .select()
          .single();
        if (error) throw error;
        const newPeriod = { id: data.id, name: data.name, startDate: data.start_date, endDate: data.end_date, deadline: data.deadline };
        setPeriods([newPeriod, ...periods]);
      }

      setPeriodModalOpen(false);
      setEditingPeriod(null);
      setNewPeriodName('');
      setNewPeriodStart('');
      setNewPeriodEnd('');
      setNewPeriodDeadline('');
    } catch (error) {
      console.error('Fehler beim Speichern des Zeitraums:', error);
      alert('Fehler beim Speichern des Zeitraums. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePeriod = async (periodId: number) => {
      const periodHasBookings = bookings.some(b => b.periodId === periodId);
      if (periodHasBookings) {
          alert('Dieser Zeitraum kann nicht gelöscht werden, da bereits Buchungen dafür existieren.');
          return;
      }
      if (window.confirm('Sind Sie sicher, dass Sie diesen Ferienzeitraum löschen möchten?')) {
          setIsLoading(true);
          try {
            const { error } = await supabase.from('holiday_periods').delete().eq('id', periodId);
            if (error) throw error;
            setPeriods(periods.filter(p => p.id !== periodId));
            if (selectedPeriod?.id === periodId) {
                setSelectedPeriod(null);
            }
          } catch (error) {
            console.error('Fehler beim Löschen des Zeitraums:', error);
            alert('Fehler beim Löschen des Zeitraums. Bitte versuchen Sie es erneut.');
          } finally {
            setIsLoading(false);
          }
      }
  };

  const startEditingBooking = (period: HolidayPeriod) => {
    if (!activeChild) return;
    const existingBooking = bookings.find(b => b.childId === activeChild.id && b.periodId === period.id);
    const newEditingBooking: HolidayCareBooking = existingBooking || {
      id: 0,
      childId: activeChild.id,
      periodId: period.id,
      needsCare: false
    };
    setEditingBooking(newEditingBooking);
    setFormNeedsCare(newEditingBooking.needsCare);
    setFormFromDate(newEditingBooking.bookedFromDate || period.startDate);
    setFormToDate(newEditingBooking.bookedToDate || period.endDate);
    setFormFromTime(newEditingBooking.bookedFromTime || '08:00');
    setFormToTime(newEditingBooking.bookedToTime || '14:00');
    setFormWithLunch(newEditingBooking.withLunch || false);
    setFormEarlyService(newEditingBooking.earlyService || false);
  };

  const handleSaveBooking = async () => {
    if (!editingBooking || formNeedsCare === null) return;

    let bookingData: any = {
      period_id: editingBooking.periodId,
      child_id: editingBooking.childId,
      needs_care: formNeedsCare,
      booked_from_date: null,
      booked_to_date: null,
      booked_from_time: null,
      booked_to_time: null,
      with_lunch: null,
      early_service: null,
    };

    if (formNeedsCare) {
      if (!formFromDate || !formToDate || !formFromTime || !formToTime) {
        alert('Bitte geben Sie den genauen Betreuungszeitraum an.');
        return;
      }
      bookingData = {
        ...bookingData,
        booked_from_date: formFromDate,
        booked_to_date: formToDate,
        booked_from_time: formFromTime,
        booked_to_time: formToTime,
        with_lunch: formWithLunch,
        early_service: formEarlyService,
      };
    }

    setIsLoading(true);
    try {
      if (editingBooking.id === 0) {
        const { data, error } = await supabase.from('holiday_bookings').insert(bookingData).select().single();
        if (error) throw error;
        const newBooking = { id: data.id, childId: data.child_id, periodId: data.period_id, needsCare: data.needs_care, bookedFromDate: data.booked_from_date, bookedToDate: data.booked_to_date, bookedFromTime: data.booked_from_time, bookedToTime: data.booked_to_time, withLunch: data.with_lunch, earlyService: data.early_service };
        setBookings([...bookings, newBooking]);
      } else {
        const { data, error } = await supabase.from('holiday_bookings').update(bookingData).eq('id', editingBooking.id).select().single();
        if (error) throw error;
        const updatedBooking = { id: data.id, childId: data.child_id, periodId: data.period_id, needsCare: data.needs_care, bookedFromDate: data.booked_from_date, bookedToDate: data.booked_to_date, bookedFromTime: data.booked_from_time, bookedToTime: data.booked_to_time, withLunch: data.with_lunch, earlyService: data.early_service };
        setBookings(bookings.map(b => b.id === editingBooking.id ? updatedBooking : b));
      }
      
      const period = periods.find(p => p.id === editingBooking.periodId);
      if(activeChild && period){
        addNotification(`Feriendienst-Buchung für ${activeChild.name} (${period.name}) wurde gespeichert.`);
      }

      setEditingBooking(null);
    } catch (error) {
      console.error('Fehler beim Speichern der Buchung:', error);
      alert('Fehler beim Speichern der Buchung. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (!selectedPeriod) return [];
    
    return bookings
      .filter(b => b.periodId === selectedPeriod.id)
      .filter(b => {
        const child = getChildById(b.childId);
        return !filterName || child?.name.toLowerCase().includes(filterName.toLowerCase());
      })
      .filter(b => {
        if (filterGruppe === 'all') return true;
        const child = getChildById(b.childId);
        return child?.groupId === Number(filterGruppe);
      })
      .filter(b => {
        if (filterBedarf === 'all') return true;
        return filterBedarf === 'yes' ? b.needsCare : !b.needsCare;
      })
      .filter(b => {
        if (filterMittagessen === 'all' || !b.needsCare) return true;
        return filterMittagessen === 'yes' ? b.withLunch : !b.withLunch;
      })
      .filter(b => {
        if (filterFruehdienst === 'all' || !b.needsCare) return true;
        return filterFruehdienst === 'yes' ? b.earlyService : !b.earlyService;
      });
  }, [bookings, selectedPeriod, filterName, filterGruppe, filterBedarf, filterMittagessen, filterFruehdienst]);

  const resetFilters = useCallback(() => {
    setFilterName('');
    setFilterGruppe('all');
    setFilterBedarf('all');
    setFilterMittagessen('all');
    setFilterFruehdienst('all');
  }, []);
  
  const ParentView = () => {
    if (!activeChild) {
      return <div><h1 className="text-3xl font-bold text-gray-800">Feriendienst</h1><p className="mt-4 text-gray-600">Bitte wählen Sie ein Kind aus, um die Feriendienst-Buchungen zu verwalten.</p></div>;
    }

    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Feriendienst für {activeChild.name}</h1>
        <p className="mt-2 text-gray-600">Melden Sie hier Ihren Betreuungsbedarf für die Ferien an.</p>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
        ) : (
          <div className="space-y-6 mt-8">
            {periods.map(period => {
              const booking = bookings.find(b => b.childId === activeChild.id && b.periodId === period.id);
              const isEditingThis = editingBooking?.periodId === period.id;
              const deadlinePassed = new Date(period.deadline) < new Date();

              if (isEditingThis) {
                return (
                  <Card key={period.id}>
                    <div className="p-6">
                      <h2 className="text-xl font-bold text-gray-800">{period.name}</h2>
                      <p className="text-gray-600 mb-4">{formatDate(period.startDate)} - {formatDate(period.endDate)}</p>
                      <div className="space-y-4">
                        <p className="font-semibold">Benötigen Sie Betreuung?</p>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center"><input type="radio" name={`needsCare-${period.id}`} checked={formNeedsCare === true} onChange={() => setFormNeedsCare(true)} className="form-radio h-4 w-4 text-cyan-600"/> <span className="ml-2">Ja</span></label>
                          <label className="flex items-center"><input type="radio" name={`needsCare-${period.id}`} checked={formNeedsCare === false} onChange={() => setFormNeedsCare(false)} className="form-radio h-4 w-4 text-cyan-600"/> <span className="ml-2">Nein</span></label>
                        </div>

                        {formNeedsCare && (
                          <div className="p-4 bg-gray-50 rounded-lg space-y-4 border">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div><label className="block text-sm font-medium text-gray-700">Von Datum</label><input type="date" value={formFromDate} onChange={e => setFormFromDate(e.target.value)} min={period.startDate} max={period.endDate} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/></div>
                              <div><label className="block text-sm font-medium text-gray-700">Bis Datum</label><input type="date" value={formToDate} onChange={e => setFormToDate(e.target.value)} min={period.startDate} max={period.endDate} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div><label className="block text-sm font-medium text-gray-700">Von Uhrzeit</label><input type="time" value={formFromTime} onChange={e => setFormFromTime(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/></div>
                              <div><label className="block text-sm font-medium text-gray-700">Bis Uhrzeit</label><input type="time" value={formToTime} onChange={e => setFormToTime(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/></div>
                            </div>
                            <div className="flex items-center"><input id={`lunch-${period.id}`} type="checkbox" checked={formWithLunch} onChange={e => setFormWithLunch(e.target.checked)} className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"/> <label htmlFor={`lunch-${period.id}`} className="ml-2 block text-sm text-gray-900">Mit Mittagessen</label></div>
                            <div className="flex items-center"><input id={`early-service-${period.id}`} type="checkbox" checked={formEarlyService} onChange={e => setFormEarlyService(e.target.checked)} className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"/> <label htmlFor={`early-service-${period.id}`} className="ml-2 block text-sm text-gray-900">Frühdienst</label></div>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                        <Button onClick={() => setEditingBooking(null)} variant="secondary">Abbrechen</Button>
                        <Button onClick={handleSaveBooking}>Speichern</Button>
                      </div>
                    </div>
                  </Card>
                )
              }

              return (
                <Card key={period.id}>
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">{period.name}</h2>
                        <p className="text-gray-600">{formatDate(period.startDate)} - {formatDate(period.endDate)}</p>
                        <p className={`text-sm mt-1 font-semibold ${deadlinePassed ? 'text-gray-500' : 'text-red-600'}`}>Anmeldefrist: {formatDate(period.deadline)}</p>
                      </div>
                      {!deadlinePassed && <Button onClick={() => startEditingBooking(period)}>{booking ? 'Bearbeiten' : 'Anmelden'}</Button>}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      {booking ? (
                        booking.needsCare ? (
                          <div>
                            <p className="font-semibold text-green-700">Betreuung gebucht</p>
                            <p className="text-sm text-gray-600">Zeitraum: {formatDate(booking.bookedFromDate!)} bis {formatDate(booking.bookedToDate!)}</p>
                            <p className="text-sm text-gray-600">Uhrzeit: {booking.bookedFromTime} bis {booking.bookedToTime}</p>
                            <p className="text-sm text-gray-600">Mittagessen: {booking.withLunch ? 'Ja' : 'Nein'}</p>
                            <p className="text-sm text-gray-600">Frühdienst: {booking.earlyService ? 'Ja' : 'Nein'}</p>
                          </div>
                        ) : (
                          <p className="font-semibold text-red-700">Keine Betreuung benötigt.</p>
                        )
                      ) : (
                        <p className="text-gray-500 italic">Noch keine Rückmeldung für diesen Zeitraum abgegeben.</p>
                      )}
                      {deadlinePassed && !booking && <p className="text-red-600 font-semibold mt-2">Die Anmeldefrist ist abgelaufen.</p>}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    );
  };

  return user?.role === UserRole.ADMIN || user?.role === UserRole.GRUPPENLEITUNG ? (
    <AdminView
      isLoading={isLoading}
      periods={periods}
      selectedPeriod={selectedPeriod}
      setSelectedPeriod={setSelectedPeriod}
      handleOpenPeriodModal={handleOpenPeriodModal}
      handleDeletePeriod={handleDeletePeriod}
      bookings={bookings}
      children={children}
      groups={groups}
      filterName={filterName}
      setFilterName={setFilterName}
      filterGruppe={filterGruppe}
      setFilterGruppe={setFilterGruppe}
      filterBedarf={filterBedarf}
      setFilterBedarf={setFilterBedarf}
      filterMittagessen={filterMittagessen}
      setFilterMittagessen={setFilterMittagessen}
      filterFruehdienst={filterFruehdienst}
      setFilterFruehdienst={setFilterFruehdienst}
      resetFilters={resetFilters}
      filteredBookings={filteredBookings}
      getChildById={getChildById}
      getGroupName={getGroupName}
      isPeriodModalOpen={isPeriodModalOpen}
      setPeriodModalOpen={setPeriodModalOpen}
      editingPeriod={editingPeriod}
      newPeriodName={newPeriodName}
      handleSetNewPeriodName={handleSetNewPeriodName}
      newPeriodStart={newPeriodStart}
      handleSetNewPeriodStart={handleSetNewPeriodStart}
      newPeriodEnd={newPeriodEnd}
      handleSetNewPeriodEnd={handleSetNewPeriodEnd}
      newPeriodDeadline={newPeriodDeadline}
      handleSetNewPeriodDeadline={handleSetNewPeriodDeadline}
      handleSavePeriod={handleSavePeriod}
    />
  ) : <ParentView />;
};

export default Feriendienst;