import React, { useState, useEffect } from 'react';
import type { WeeklyReport, Group } from '../types';
import { useAuth } from '../hooks/useAuth';
import Card from './Card';
import Button from './Button';
import Modal from './Modal';
import { supabase } from '../integrations/supabase/client';

interface WochenberichtProps {
  addNotification: (message: string) => void;
}

const Wochenbericht: React.FC<WochenberichtProps> = ({ addNotification }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<WeeklyReport | null>(null);
  
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [dailyReport, setDailyReport] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        { data: reportsData, error: reportsError },
        { data: groupsData, error: groupsError }
      ] = await Promise.all([
        supabase.from('weekly_reports').select('*, group:groups(name)').order('date', { ascending: false }),
        supabase.from('groups').select('*')
      ]);

      if (reportsError) throw reportsError;
      if (groupsError) throw groupsError;

      const formattedReports: WeeklyReport[] = reportsData.map((r: any) => ({
          id: r.id,
          groupId: r.group_id,
          groupName: r.group.name,
          date: r.date,
          dailyReport: r.daily_report,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
      }));

      setReports(formattedReports);
      setGroups(groupsData);
      
      if (user?.role === 'gruppenleitung' && user.assignedGroupId) {
        setSelectedGroupId(user.assignedGroupId);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (report: WeeklyReport | null = null) => {
    if (report) {
      setEditingReport(report);
      setSelectedGroupId(report.groupId);
      setSelectedDate(report.date);
      setDailyReport(report.dailyReport);
    } else {
      setEditingReport(null);
      if (user?.role === 'gruppenleitung' && user.assignedGroupId) {
        setSelectedGroupId(user.assignedGroupId);
      } else {
        setSelectedGroupId(groups.length > 0 ? groups[0].id : null);
      }
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setDailyReport('');
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSaveReport = async () => {
    if (!selectedGroupId || !selectedDate || !dailyReport) {
      alert("Bitte alle Felder ausfüllen.");
      return;
    }

    setIsLoading(true);
    try {
      if (editingReport) {
        const { data, error } = await supabase
          .from('weekly_reports')
          .update({ daily_report: dailyReport })
          .eq('id', editingReport.id)
          .select('*, group:groups(name)')
          .single();
        if (error) throw error;
        
        const updatedReport: WeeklyReport = {
          id: data.id,
          groupId: data.group_id,
          groupName: data.group.name,
          date: data.date,
          dailyReport: data.daily_report,
        };
        setReports(reports.map(r => r.id === editingReport.id ? updatedReport : r));
        addNotification('Bericht erfolgreich aktualisiert');
      } else {
        const { data, error } = await supabase
          .from('weekly_reports')
          .insert({
            group_id: selectedGroupId,
            date: selectedDate,
            daily_report: dailyReport
          })
          .select('*, group:groups(name)')
          .single();
        if (error) throw error;

        const newReport: WeeklyReport = {
          id: data.id,
          groupId: data.group_id,
          groupName: data.group.name,
          date: data.date,
          dailyReport: data.daily_report,
        };
        setReports([newReport, ...reports]);
        addNotification('Bericht erfolgreich erstellt');
      }
      handleCloseModal();
    } catch (error: any) {
      console.error('Fehler beim Speichern:', error);
      alert(error.message || 'Fehler beim Speichern des Berichts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm('Möchten Sie diesen Bericht wirklich löschen?')) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('weekly_reports').delete().eq('id', id);
      if (error) throw error;
      setReports(reports.filter(r => r.id !== id));
      addNotification('Bericht erfolgreich gelöscht');
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen des Berichts');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const canEdit = user?.role === 'admin' || user?.role === 'gruppenleitung';

  const availableGroups = user?.role === 'gruppenleitung' && user.assignedGroupId
    ? groups.filter(g => g.id === user.assignedGroupId)
    : groups;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Wochenberichte</h2>
          <p className="text-gray-600 mt-1">
            {user?.role === 'admin' && 'Alle Gruppenberichte verwalten'}
            {user?.role === 'gruppenleitung' && 'Berichte Ihrer Gruppe verwalten'}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => handleOpenModal()} disabled={isLoading}>
            ➕ Neuer Bericht
          </Button>
        )}
      </div>

      {isLoading && reports.length === 0 ? (
        <Card>
          <p className="text-center py-8 text-gray-500">Laden...</p>
        </Card>
      ) : reports.length === 0 ? (
        <Card>
          <p className="text-center py-8 text-gray-500">
            Noch keine Berichte vorhanden.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {report.groupName || 'Unbekannt'}
                      </span>
                      <span className="text-gray-600 text-sm">
                        {formatDate(report.date)}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      Tagesablauf
                    </h3>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {report.dailyReport}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleOpenModal(report)}
                        className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Bearbeiten"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-red-600 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="Löschen"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingReport ? 'Bericht bearbeiten' : 'Neuer Bericht'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gruppe
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(parseInt(e.target.value))}
              disabled={!!editingReport || (user?.role === 'gruppenleitung')}
            >
              <option value="">Gruppe auswählen</option>
              {availableGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datum
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={!!editingReport}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagesablauf
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={10}
              value={dailyReport}
              onChange={(e) => setDailyReport(e.target.value)}
              placeholder="Beschreiben Sie den Tagesablauf in der Gruppe..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={handleCloseModal} variant="secondary" disabled={isLoading}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveReport} disabled={isLoading}>
              {isLoading ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Wochenbericht;