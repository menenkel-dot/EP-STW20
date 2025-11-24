import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import Button from './Button';

function PwaUpdater() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <div className="p-4 rounded-lg shadow-lg bg-white dark:bg-gray-800 border dark:border-gray-700 flex items-center space-x-4">
        <div className="flex-1">
          {needRefresh ? (
            <p className="text-sm text-gray-800 dark:text-gray-100">Eine neue Version ist verfügbar. Aktualisieren?</p>
          ) : (
            <p className="text-sm text-gray-800 dark:text-gray-100">App ist für Offline-Nutzung bereit.</p>
          )}
        </div>
        {needRefresh && (
          <Button onClick={() => updateServiceWorker(true)}>
            Neu laden
          </Button>
        )}
        <button onClick={close} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default PwaUpdater;