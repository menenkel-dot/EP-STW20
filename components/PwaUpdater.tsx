import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import Button from './Button';

function PwaUpdater() {
  const {
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
    setNeedRefresh(false);
  };

  if (needRefresh) {
    return (
      <div className="fixed bottom-4 right-4 z-50 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-gray-800 dark:text-gray-200 mr-4">Eine neue Version ist verfügbar.</span>
          <div>
            <Button onClick={() => updateServiceWorker(true)} className="mr-2">
              Aktualisieren
            </Button>
            <Button onClick={close} variant="secondary">
              Schließen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default PwaUpdater;