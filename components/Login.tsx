import React, { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../src/integrations/supabase/client';
import Modal from './Modal';
import Datenschutz from './Datenschutz';
import Impressum from './Impressum';
import { useTheme } from '../hooks/useTheme';

interface LoginProps {
  error?: string | null;
}

const Login: React.FC<LoginProps> = ({ error }) => {
  const { theme } = useTheme();
  const [showDatenschutz, setShowDatenschutz] = useState(false);
  const [showImpressum, setShowImpressum] = useState(false);

  const spaceElements = [
    { emoji: '🚀', animation: 'bounce', top: '10%', left: '15%', delay: '0s', size: '2.5rem' },
    { emoji: '🪐', animation: 'pulse', top: '20%', left: '80%', delay: '1s', size: '3rem' },
    { emoji: '⭐', animation: 'twinkle', top: '15%', left: '50%', delay: '0.5s', size: '1.8rem' },
    { emoji: '🌙', animation: 'float', top: '70%', left: '10%', delay: '2s', size: '2.8rem' },
    { emoji: '🛸', animation: 'bounce', top: '60%', left: '85%', delay: '1.5s', size: '2.2rem' },
    { emoji: '🌟', animation: 'twinkle', top: '40%', left: '5%', delay: '0.8s', size: '2rem' },
    { emoji: '🌈', animation: 'float', top: '85%', left: '50%', delay: '0.2s', size: '3.5rem' },
    { emoji: '☀️', animation: 'pulse', top: '5%', left: '5%', delay: '1.2s', size: '3.2rem' },
    { emoji: '🦄', animation: 'bounce', top: '45%', left: '60%', delay: '2.5s', size: '2.5rem' },
  ];

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-100 to-cyan-200 overflow-hidden">
      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; } }
        @keyframes twinkle { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
      `}</style>

      <div className="absolute inset-0 pointer-events-none opacity-60">
        {spaceElements.map((element, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              top: element.top,
              left: element.left,
              fontSize: element.size,
              animation: `${element.animation} ${Math.random() * 2 + 3}s ease-in-out ${element.delay} infinite`,
            }}
          >
            {element.emoji}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">Kinderhaus St. Wolfgang</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Willkommen im Elternportal</p>
        </div>
        {error && (
          <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
            <h3 className="font-bold">Fehler beim Laden des Profils</h3>
            <p className="mt-1">Ihre Anmeldedaten sind korrekt, aber Ihr Benutzerprofil konnte nicht geladen werden. Dies liegt meist an einem Datenkonflikt.</p>
            <p className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">Fehlerdetails: {error}</p>
          </div>
        )}
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          showLinks={false}
          view="sign_in"
          theme={theme}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Benutzername',
                password_label: 'Passwort',
                email_input_placeholder: 'Ihr Benutzername',
                password_input_placeholder: 'Ihr Passwort',
                button_label: 'Anmelden',
                loading_button_label: 'Anmelden ...',
              },
            },
          }}
        />
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <button onClick={() => setShowDatenschutz(true)} className="hover:text-cyan-600 dark:hover:text-cyan-400 underline">
            Datenschutzerklärung
          </button>
          <span className="mx-2">•</span>
          <button onClick={() => setShowImpressum(true)} className="hover:text-cyan-600 dark:hover:text-cyan-400 underline">
            Impressum
          </button>
        </div>
      </div>

      {showDatenschutz && (
        <Modal isOpen={showDatenschutz} onClose={() => setShowDatenschutz(false)} title="Datenschutzerklärung">
          <div className="overflow-y-auto max-h-[70vh]"><Datenschutz /></div>
        </Modal>
      )}
      {showImpressum && (
        <Modal isOpen={showImpressum} onClose={() => setShowImpressum(false)} title="Impressum">
          <div className="overflow-y-auto max-h-[70vh]"><Impressum /></div>
        </Modal>
      )}
    </div>
  );
};

export default Login;