import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

function PwaUpdater() {
  useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error);
    },
  });

  return null;
}

export default PwaUpdater;