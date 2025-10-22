import React, { useState, useEffect } from 'react';
import { UserRole, Document } from '../types';
import { documentsAPI } from '../lib/client';
import { useAuth } from '../hooks/useAuth';

const Dokumente: React.FC = () => {
  const { user, activeChild } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await documentsAPI.getAll();
        setDocuments(data);
      } catch (err: any) {
        console.error('Fehler beim Laden der Dokumente:', err);
        setError('Fehler beim Laden der Dokumente. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);
  
  if (!user) {
    return null;
  }

  const displayedDocuments = (user.role === UserRole.ADMIN) 
    ? documents 
    : activeChild 
      ? documents.filter(doc => doc.childId === activeChild.id)
      : [];
  
  const handleUpload = () => {
    alert("Dokument-Upload für Admins (simuliert).");
  }

  return (
    <div>
       <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {user.role === UserRole.ADMIN ? 'Alle Dokumente' : `Dokumente für ${activeChild?.name || ''}`}
        </h1>
        {user.role === UserRole.ADMIN && (
          <button onClick={handleUpload} className="px-4 py-2 rounded-lg font-semibold text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors duration-200">
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hochgeladen am</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Download</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedDocuments.length > 0 ? displayedDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                            <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.uploadDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href={doc.url} className="text-cyan-600 hover:text-cyan-900">
                        Download
                      </a>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-gray-500">
                      {user.role === UserRole.PARENT ? 'Für dieses Kind sind keine Dokumente vorhanden.' : 'Keine Dokumente gefunden.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dokumente;