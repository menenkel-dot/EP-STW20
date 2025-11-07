import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Absence, AbsenceReason, Child, Group } from '../types';
import { UserRole } from '../types';
import Card from './Card';
import Button from './Button';
import { supabase } from '../integrations/supabase/client';

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

interface AbwesenheitProps {
  addNotification: (message: string) => void;
}

interface ParentViewProps {
  activeChild: Child | null;
  absences: Absence[];
  isLoading: boolean;
  reason: AbsenceReason;
  setReason: (reason: AbsenceReason) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  symptoms: string;
  setSymptoms: (symptoms: string) => void;
  handleReportAbsence: () => void;
  handleDeleteAbsence: (id: number) => void;
}

const ParentViewComponent: React.FC<ParentViewProps> = React.memo(({ 
  activeChild, absences, isLoading, reason, setReason, startDate, setStartDate,
  endDate, setEndDate, symptoms, setSymptoms, handleReportAbsence, handleDeleteAbsence
}) => {
  if (!activeChild) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Abwesenheit melden</h1>
        <p className="mt-4 text-gray-600">Bitte wählen Sie ein Kind aus dem Header-Menü aus, um eine Abwesenheit zu melden.</p>
      </div>
    );
  }

  const myAbsences = absences.filter(a => a.childId === activeChild.id);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Abwesenheit für {activeChild.name} melden</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Neue Meldung</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Grund der Abwesenheit</label>
                <div className="mt-2 flex space-x-4">
                  <label className="flex items-center">
                    <input type="radio" value="krank" checked={reason === 'krank'} onChange={() => setReason('krank')} className="form-radio h-4 w-4 text-cyan-600"/>
                    <span className="ml-2 text-gray-700">Krankheit</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" value="sonstige" checked={reason === 'sonstige'} onChange={() => setReason('sonstige')} className="form-radio h-4 w-4 text-cyan-600"/>
                    <span className="ml-2 text-gray-700">Sonstige</span>
                  </label>
                </div>
              </div>
              {reason === 'krank' && (
                <div>
                  <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700">Symptome (Pflichtfeld)</label>
                  <textarea id="symptoms" value={symptoms} onChange={e => setSymptoms(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"></textarea>
                </div>
              )}
              {reason === 'sonstige' && (
                <div>
                  <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700">Grund (z.B. Arzttermin)</label>
                  <textarea id="symptoms" value={symptoms} onChange={e => setSymptoms(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"></textarea>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Von</label>
                  <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Bis (einschließlich)</label>
                  <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                </div>
              </div>
              <div className="text-right pt-2">
                <Button onClick={handleReportAbsence}>Meldung absenden</Button>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Gemeldete Abwesenheiten</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
              </div>
            ) : myAbsences.length > 0 ? (
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {myAbsences.map(a => (
                  <li key={a.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{formatDate(a.startDate)} - {formatDate(a.endDate)}</p>
                      <p className="text-sm text-gray-700">Grund: <span className="capitalize">{a.reason === 'krank' ? 'Krankheit' : 'Sonstiges'}</span></p>
                      {a.symptoms && <p className="text-sm text-gray-500">Details: {a.symptoms}</p>}
                    </div>
                    <button 
                      onClick={() => handleDeleteAbsence(a.id)} 
                      className="ml-4 text-gray-400 hover:text-red-600 focus:outline-none"
                      title="Meldung löschen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Für {activeChild.name} wurden noch keine Abwesenheiten gemeldet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
});

const Abwesenheit: React.FC<AbwesenheitProps> = ({ addNotification }) => {
    const { user, activeChild } = useAuth();
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [children, setChildren] = useState<Child[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Form state for parents
    const [reason, setReason] = useState<AbsenceReason>('krank');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [symptoms, setSymptoms] = useState('');

    // Filter state for admin view
    const [filterChild, setFilterChild] = useState<string>('');
    const [filterGroup, setFilterGroup] = useState<string>('');
    const [filterReason, setFilterReason] = useState<string>('');
    const [filterDate, setFilterDate] = useState<string>('');
    
    // Admin manual reporting state
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
    const [adminReason, setAdminReason] = useState<AbsenceReason>('krank');
    const [adminStartDate, setAdminStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [adminEndDate, setAdminEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [adminSymptoms, setAdminSymptoms] = useState('');

    const getChildById = (childId: number): Child | undefined => children.find(c => c.id === childId);
    const getGroupName = (groupId: number): string => groups.find(g => g.id === groupId)?.name || 'N/A';

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                if (user?.role === UserRole.ADMIN || user?.role === UserRole.GRUPPENLEITUNG) {
                    const [
                        { data: childrenData, error: childrenError },
                        { data: groupsData, error: groupsError },
                        { data: absencesData, error: absencesError }
                    ] = await Promise.all([
                        supabase.from('children').select('*'),
                        supabase.from('groups').select('*'),
                        supabase.from('absences').select('*')
                    ]);

                    if (childrenError) throw childrenError;
                    if (groupsError) throw groupsError;
                    if (absencesError) throw absencesError;

                    setChildren(childrenData.map(c => ({ id: c.id, name: c.name, groupId: c.group_id, avatarUrl: c.avatar_url })));
                    setGroups(groupsData);
                    setAbsences(absencesData.map(a => ({ id: a.id, childId: a.child_id, startDate: a.start_date, endDate: a.end_date, reason: a.reason, symptoms: a.symptoms, reportedAt: a.reported_at })));
                } else if (activeChild) {
                    const { data: absencesData, error: absencesError } = await supabase
                        .from('absences')
                        .select('*')
                        .eq('child_id', activeChild.id);
                    if (absencesError) throw absencesError;
                    setAbsences(absencesData.map(a => ({ id: a.id, childId: a.child_id, startDate: a.start_date, endDate: a.end_date, reason: a.reason, symptoms: a.symptoms, reportedAt: a.reported_at })));
                } else {
                    setAbsences([]);
                }
                // Always load groups for everyone
                const { data: groupsData, error: groupsError } = await supabase.from('groups').select('*');
                if (groupsError) throw groupsError;
                setGroups(groupsData);

            } catch (error) {
                console.error('Fehler beim Laden der Daten:', error);
                addNotification('Fehler beim Laden der Daten');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [activeChild, user]);

    const handleReportAbsence = async () => {
        if (!activeChild) {
            alert('Bitte wählen Sie ein Kind aus.');
            return;
        }
        if (reason === 'krank' && !symptoms.trim()) {
            alert('Bitte geben Sie die Symptome an.');
            return;
        }
        if (!startDate || !endDate) {
            alert('Bitte geben Sie einen gültigen Zeitraum an.');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('absences')
                .insert({
                    child_id: activeChild.id,
                    start_date: startDate,
                    end_date: endDate,
                    reason,
                    symptoms: reason === 'krank' ? symptoms : undefined,
                })
                .select()
                .single();

            if (error) throw error;

            const newAbsence: Absence = { id: data.id, childId: data.child_id, startDate: data.start_date, endDate: data.end_date, reason: data.reason, symptoms: data.symptoms, reportedAt: data.reported_at };
            setAbsences(prev => [newAbsence, ...prev]);
            addNotification(`Abwesenheit für ${activeChild.name} wurde gemeldet.`);

            // Reset form
            setReason('krank');
            setStartDate(new Date().toISOString().split('T')[0]);
            setEndDate(new Date().toISOString().split('T')[0]);
            setSymptoms('');
        } catch (error) {
            console.error('Fehler beim Melden der Abwesenheit:', error);
            alert('Fehler beim Melden der Abwesenheit. Bitte versuchen Sie es erneut.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteAbsence = async (absenceId: number) => {
        if (window.confirm("Sind Sie sicher, dass Sie diese Abwesenheitsmeldung löschen möchten?")) {
            const absenceToDelete = absences.find(a => a.id === absenceId);
            if (absenceToDelete) {
                setIsLoading(true);
                try {
                    const { error } = await supabase.from('absences').delete().eq('id', absenceId);
                    if (error) throw error;

                    setAbsences(prev => prev.filter(a => a.id !== absenceId));
                    const childName = activeChild?.name || getChildById(absenceToDelete.childId)?.name || 'dem Kind';
                    addNotification(`Abwesenheitsmeldung für ${childName} vom ${formatDate(absenceToDelete.startDate)} wurde gelöscht.`);
                } catch (error) {
                    console.error('Fehler beim Löschen der Abwesenheit:', error);
                    alert('Fehler beim Löschen der Abwesenheit. Bitte versuchen Sie es erneut.');
                } finally {
                    setIsLoading(false);
                }
            }
        }
    };
    
    const handleAdminReportAbsence = async () => {
        if (!selectedChildId) {
            alert('Bitte wählen Sie ein Kind aus.');
            return;
        }
        if (adminReason === 'krank' && !adminSymptoms.trim()) {
            alert('Bitte geben Sie die Symptome an.');
            return;
        }
        if (!adminStartDate || !adminEndDate) {
            alert('Bitte geben Sie einen gültigen Zeitraum an.');
            return;
        }

        const selectedChild = children.find(c => c.id === selectedChildId);
        if (!selectedChild) {
            alert('Kind nicht gefunden.');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('absences')
                .insert({
                    child_id: selectedChildId,
                    start_date: adminStartDate,
                    end_date: adminEndDate,
                    reason: adminReason,
                    symptoms: adminReason === 'krank' ? adminSymptoms : undefined,
                })
                .select()
                .single();
            
            if (error) throw error;

            const newAbsence: Absence = { id: data.id, childId: data.child_id, startDate: data.start_date, endDate: data.end_date, reason: data.reason, symptoms: data.symptoms, reportedAt: data.reported_at };
            setAbsences(prev => [newAbsence, ...prev]);
            addNotification(`Abwesenheit für ${selectedChild.name} wurde gemeldet.`);

            // Reset form
            setSelectedChildId(null);
            setAdminReason('krank');
            setAdminStartDate(new Date().toISOString().split('T')[0]);
            setAdminEndDate(new Date().toISOString().split('T')[0]);
            setAdminSymptoms('');
        } catch (error) {
            console.error('Fehler beim Melden der Abwesenheit:', error);
            alert('Fehler beim Melden der Abwesenheit. Bitte versuchen Sie es erneut.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredAbsences = React.useMemo(() => {
        return absences.filter(absence => {
            const child = getChildById(absence.childId);
            const groupName = child ? getGroupName(child.groupId) : 'N/A';
            
            if (filterChild && child && !child.name.toLowerCase().includes(filterChild.toLowerCase())) return false;
            if (filterGroup && !groupName.toLowerCase().includes(filterGroup.toLowerCase())) return false;
            if (filterReason && absence.reason !== filterReason) return false;
            
            if (filterDate) {
                const filterDateObj = new Date(filterDate);
                const startDateObj = new Date(absence.startDate);
                const endDateObj = new Date(absence.endDate);
                if (filterDateObj < startDateObj || filterDateObj > endDateObj) return false;
            }
            
            return true;
        });
    }, [absences, filterChild, filterGroup, filterReason, filterDate, children, groups]);

    const AdminView = () => {
        return (
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Übersicht der Abwesenheiten</h1>
                
                <Card>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Abwesenheit manuell melden</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Kind auswählen</label>
                                <select
                                    value={selectedChildId || ''}
                                    onChange={(e) => setSelectedChildId(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                                >
                                    <option value="">-- Bitte wählen Sie ein Kind --</option>
                                    {children.sort((a, b) => a.name.localeCompare(b.name)).map(child => (
                                        <option key={child.id} value={child.id}>
                                            {child.name} ({getGroupName(child.groupId)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Grund</label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center"><input type="radio" value="krank" checked={adminReason === 'krank'} onChange={() => setAdminReason('krank')} className="form-radio h-4 w-4 text-cyan-600"/> <span className="ml-2">Krankheit</span></label>
                                    <label className="flex items-center"><input type="radio" value="sonstige" checked={adminReason === 'sonstige'} onChange={() => setAdminReason('sonstige')} className="form-radio h-4 w-4 text-cyan-600"/> <span className="ml-2">Sonstige</span></label>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="adminStartDate" className="block text-sm font-medium text-gray-700 mb-2">Von</label>
                                    <input type="date" id="adminStartDate" value={adminStartDate} onChange={e => setAdminStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                                </div>
                                <div>
                                    <label htmlFor="adminEndDate" className="block text-sm font-medium text-gray-700 mb-2">Bis</label>
                                    <input type="date" id="adminEndDate" value={adminEndDate} onChange={e => setAdminEndDate(e.target.value)} min={adminStartDate} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"/>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="adminSymptoms" className="block text-sm font-medium text-gray-700 mb-2">{adminReason === 'krank' ? 'Symptome (Pflichtfeld)' : 'Grund (optional)'}</label>
                                <textarea id="adminSymptoms" value={adminSymptoms} onChange={e => setAdminSymptoms(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"></textarea>
                            </div>
                            <div className="md:col-span-2 text-right">
                                <Button onClick={handleAdminReportAbsence}>Abwesenheit erfassen</Button>
                            </div>
                        </div>
                    </div>
                </Card>
                
                <Card>
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <input type="text" value={filterChild} onChange={(e) => setFilterChild(e.target.value)} placeholder="Kind..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"/>
                            <input type="text" value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} placeholder="Gruppe..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"/>
                            <select value={filterReason} onChange={(e) => setFilterReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="">Alle Gründe</option><option value="krank">Krank</option><option value="sonstige">Sonstige</option></select>
                            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"/>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div></div>
                        ) : filteredAbsences.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">{absences.length === 0 ? 'Keine Abwesenheiten gemeldet.' : 'Keine Abwesenheiten für Filter gefunden.'}</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kind</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gruppe</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zeitraum</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grund</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gemeldet am</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                               {filteredAbsences.sort((a,b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()).map(absence => {
                                    const child = getChildById(absence.childId);
                                    const groupName = child ? getGroupName(child.groupId) : 'N/A';
                                    return (
                                        <tr key={absence.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{child?.name || 'Unbekannt'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{groupName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(absence.startDate)} - {formatDate(absence.endDate)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${absence.reason === 'krank' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>{absence.reason === 'krank' ? 'Krank' : 'Sonstige'}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{absence.symptoms || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(absence.reportedAt).toLocaleString('de-DE')}</td>
                                        </tr>
                                    )
                               })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>
            </div>
        );
    };

    return (user?.role === UserRole.ADMIN || user?.role === UserRole.GRUPPENLEITUNG) ? (
        <AdminView />
    ) : (
        <ParentViewComponent
            activeChild={activeChild}
            absences={absences}
            isLoading={isLoading}
            reason={reason}
            setReason={setReason}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            symptoms={symptoms}
            setSymptoms={setSymptoms}
            handleReportAbsence={handleReportAbsence}
            handleDeleteAbsence={handleDeleteAbsence}
        />
    );
};

export default Abwesenheit;