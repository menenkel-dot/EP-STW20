import React, { useState, useEffect } from 'react';
import { UserRole, Document, Child } from '../types';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../integrations/supabase/client';

// Helper to convert base64 string to a File object for uploading
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Invalid data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

const Dokumente: React.FC = () => {
  const { user, activeChild } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  
  // Upload form state
  const [fileName, setFileName] = useState<string>('');
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [fileData, setFileData] = useState<string>('');
  
  useEffect(() => {
    loadDocuments();
    if (user?.role === UserRole.ADMIN) {
      loadChildren();
    }
  }, [user]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('documents').select('*');
      if (error) throw error;

      const formattedDocuments: Document[] = data.map(doc => {
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(doc.storage_path);
        return {
          id: doc.id,
          name: doc.name,
          uploadDate: new Date(doc.upload_date).toLocaleDateString('de-DE'),
          url: publicUrl,
          storagePath: doc.storage_path,
          childId: doc.child_id,
          uploaderId: doc.uploader_id,
        };
      });
      setDocuments(formattedDocuments);
    } catch (err: any) {
      console.error('Fehler beim Laden der Dokumente:', err);
      setError('Fehler beim Laden der Dokumente. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async () => {
    try {
      const { data, error } = await supabase.from('children').select('*');
      if (error) throw error;
      setChildren(data.map(c => ({ id: c.id, name: c.name, groupId: c.group_id, avatarUrl: c.avatar_url })));
    } catch (err: any) {
      console.error('Fehler beim Laden der Kinder:', err);
    }
  };
  
  if (!user) {
    return null;
  }

  const displayedDocuments = (user.role === UserRole.ADMIN) 
    ? documents 
    : documents.filter(doc => doc.childId === null || (activeChild && doc.childId === activeChild.id));
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // Max 10MB
      alert('Datei ist zu groß. Maximale Größe: 10MB');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => setFileData(reader.result as string);
    reader.onerror = () => alert('Fehler beim Lesen der Datei');
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!fileName || !fileData || !user) {
      alert('Bitte wählen Sie eine Datei aus');
      return;
    }

    try {
      setUploadLoading(true);
      const file = dataURLtoFile(fileData, fileName);
      const filePath = `public/${user.id}/${Date.now()}-${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('documents').insert({
        name: fileName,
        storage_path: filePath,
        child_id: selectedChildId,
        uploader_id: user.id,
      });

      if (dbError) throw dbError;
      
      setShowUploadModal(false);
      setFileName('');
      setFileData('');
      setSelectedChildId(null);
      await loadDocuments();
    } catch (err: any) {
      console.error('Fehler beim Hochladen:', err);
      alert(err.message || 'Fehler beim Hochladen des Dokuments');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm('Möchten Sie dieses Dokument wirklich löschen?')) {
      return;
    }

    try {
      const { error: storageError } = await supabase.storage.from('documents').remove([doc.storagePath]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from('documents').delete().eq('id', doc.id);
      if (dbError) throw dbError;

      await loadDocuments();
    } catch (err: any) {
      console.error('Fehler beim Löschen:', err);
      alert(err.message || 'Fehler beim Löschen des Dokuments');
    }
  };

  const getChildName = (childId: number | null) => {
    if (!childId) return 'Alle';
    const child = children.find(c => c.id === childId);
    return child?.name || 'Unbekannt';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {user.role === UserRole.ADMIN ? 'Alle Dokumente' : `Dokumente für ${activeChild?.name || ''}`}
        </h1>
        {user.role === UserRole.ADMIN && (
          <button 
            onClick={() => setShowUploadModal(true)} 
            className="px-4 py-2 rounded-lg font-semibold text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors duration-200"
          >
            Dokument hochladen
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-lg p-10 text-center">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
          <p className="mt-4 text-gray-600">Dokumente werden geladen...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-lg p-10 text-center">
          <div className="text-red-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dateiname</th>
                  {user.role === UserRole.ADMIN && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zugewiesen an</th>
                  )}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hochgeladen am</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Aktionen</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedDocuments.length > 0 ? displayedDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                      </div>
                    </td>
                    {user.role === UserRole.ADMIN && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getChildName(doc.childId)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.uploadDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <a 
                        href={doc.url} 
                        download={doc.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-600 hover:text-cyan-900"
                      >
                        Download
                      </a>
                      {user.role === UserRole.ADMIN && (
                        <button
                          onClick={() => handleDelete(doc)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Löschen
                        </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={user.role === UserRole.ADMIN ? 4 : 3} className="text-center py-10 text-gray-500">
                      {user.role === UserRole.PARENT ? 'Für dieses Kind sind keine Dokumente vorhanden.' : 'Keine Dokumente gefunden.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Dokument hochladen</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datei auswählen
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                />
                {fileName && (
                  <p className="mt-2 text-sm text-gray-600">Ausgewählt: {fileName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kind zuweisen (optional, sonst für alle sichtbar)
                </label>
                <select
                  value={selectedChildId || ''}
                  onChange={(e) => setSelectedChildId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Alle Kinder</option>
                  {children.map(child => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setFileName('');
                  setFileData('');
                  setSelectedChildId(null);
                }}
                disabled={uploadLoading}
                className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadLoading || !fileName}
                className="px-4 py-2 rounded-lg font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
              >
                {uploadLoading ? 'Lädt hoch...' : 'Hochladen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dokumente;