import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Absence, AbsenceReason, Child, Group } from '../types';
import { UserRole } from '../types';
import Card from './Card';
import Button from './Button';
import { absencesAPI, childrenAPI, groupsAPI } from '../lib/client';

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

interface AbwesenheitProps {
  addNotification: (message: string) => void;
}

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

    const getChildById = (childId: number): Child | undefined => children.find(c => c.id === childId);
    const getGroupName = (groupId: number): string => groups.find(g => g.id === groupId)?.name || 'N/A';

    useEffect(() => {
        const loadData = async () => {
            if (user?.role === UserRole.ADMIN || user?.role === UserRole.GRUPPENLEITUNG) {
                setIsLoading(true);
                try {
                    const [childrenData, groupsData, absencesData] = await Promise.all([
                        childrenAPI.getAll(),
                        groupsAPI.getAll(),
                        absencesAPI.getAll()
                    ]);
                    setChildren(childrenData);
                    setGroups(groupsData);
                    setAbsences(absencesData);
                } catch (error) {
                    console.error('Fehler beim Laden der Daten:', error);
                    addNotification('Fehler beim Laden der Daten');
                } finally {
                    setIsLoading(false);
                }
                return;
            }
            if (!activeChild) {
                setAbsences([]);
                return;
            }
            setIsLoading(true);
            try {
                const [absencesData, groupsData] = await Promise.all([
                    absencesAPI.getByChildId(activeChild.id),
                    groupsAPI.getAll()
                ]);
                setAbsences(absencesData);
                setGroups(groupsData);
            } catch (error) {
                console.error('Fehler beim Laden der Abwesenheiten:', error);
                addNotification('Fehler beim Laden der Abwesenheiten');
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
            const newAbsence = await absencesAPI.create({
                childId: activeChild.id,
                startDate,
                endDate,
                reason,
                symptoms: reason === 'krank' ? symptoms : undefined,
            });

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
            if (absenceToDelete && activeChild) {
                setIsLoading(true);
                try {
                    await absencesAPI.delete(absenceId);
                    setAbsences(prev => prev.filter(a => a.id !== absenceId));
                    addNotification(`Abwesenheitsmeldung für ${activeChild.name} vom ${formatDate(absenceToDelete.startDate)} wurde gelöscht.`);
                } catch (error) {
                    console.error('Fehler beim Löschen der Abwesenheit:', error);
                    alert('Fehler beim Löschen der Abwesenheit. Bitte versuchen Sie es erneut.');
                } finally {
                    setIsLoading(false);
                }
            }
        }
    };


    const ParentView = () => {
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
    };

    // Gefilterte Abwesenheiten mit useMemo
    const filteredAbsences = React.useMemo(() => {
        return absences.filter(absence => {
            const child = getChildById(absence.childId);
            const groupName = child ? getGroupName(child.groupId) : 'N/A';
            
            // Kind-Filter
            if (filterChild && child && !child.name.toLowerCase().includes(filterChild.toLowerCase())) {
                return false;
            }
            
            // Gruppen-Filter
            if (filterGroup && !groupName.toLowerCase().includes(filterGroup.toLowerCase())) {
                return false;
            }
            
            // Grund-Filter
            if (filterReason && absence.reason !== filterReason) {
                return false;
            }
            
            // Datum-Filter (prüft ob das gefilterte Datum im Zeitraum liegt)
            if (filterDate) {
                const filterDateObj = new Date(filterDate);
                const startDateObj = new Date(absence.startDate);
                const endDateObj = new Date(absence.endDate);
                if (filterDateObj < startDateObj || filterDateObj > endDateObj) {
                    return false;
                }
            }
            
            return true;
        });
    }, [absences, filterChild, filterGroup, filterReason, filterDate, children, groups]);

    const AdminView = () => {

        return (
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Übersicht der Abwesenheiten</h1>
                
                {/* Filter Section */}
                <Card>
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Kind</label>
                                <input
                                    type="text"
                                    value={filterChild}
                                    onChange={(e) => setFilterChild(e.target.value)}
                                    placeholder="Name eingeben..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Gruppe</label>
                                <input
                                    type="text"
                                    value={filterGroup}
                                    onChange={(e) => setFilterGroup(e.target.value)}
                                    placeholder="Gruppe eingeben..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Grund</label>
                                <select
                                    value={filterReason}
                                    onChange={(e) => setFilterReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                                >
                                    <option value="">Alle</option>
                                    <option value="krank">Krank</option>
                                    <option value="sonstige">Sonstige</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Datum (im Zeitraum)</label>
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>
                        </div>
                        {(filterChild || filterGroup || filterReason || filterDate) && (
                            <div className="mt-3 flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    {filteredAbsences.length} von {absences.length} Abwesenheiten
                                </p>
                                <button
                                    onClick={() => {
                                        setFilterChild('');
                                        setFilterGroup('');
                                        setFilterReason('');
                                        setFilterDate('');
                                    }}
                                    className="text-sm text-cyan-600 hover:text-cyan-800 font-medium"
                                >
                                    Filter zurücksetzen
                                </button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Table */}
                <Card>
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                            </div>
                        ) : filteredAbsences.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                {absences.length === 0 
                                    ? 'Keine Abwesenheiten gemeldet.' 
                                    : 'Keine Abwesenheiten gefunden, die den Filterkriterien entsprechen.'}
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kind</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gruppe</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zeitraum</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grund</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details / Symptome</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gemeldet am</th>
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${absence.reason === 'krank' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {absence.reason === 'krank' ? 'Krank' : 'Sonstige'}
                                                </span>
                                            </td>
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

    return (user?.role === UserRole.ADMIN || user?.role === UserRole.GRUPPENLEITUNG) ? <AdminView /> : <ParentView />;
};

export default Abwesenheit;