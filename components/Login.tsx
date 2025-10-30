import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Modal from './Modal';
import Datenschutz from './Datenschutz';
import Impressum from './Impressum';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDatenschutz, setShowDatenschutz] = useState(false);
  const [showImpressum, setShowImpressum] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Benutzername oder Passwort ungültig.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const spaceElements = [
    { emoji: '🚀', animation: 'bounce', top: '10%', left: '15%', delay: '0s', size: '2.5rem' },
    { emoji: '🪐', animation: 'pulse', top: '20%', left: '80%', delay: '1s', size: '3rem' },
    { emoji: '⭐', animation: 'twinkle', top: '15%', left: '50%', delay: '0.5s', size: '1.8rem' },
    { emoji: '🌙', animation: 'float', top: '70%', left: '10%', delay: '2s', size: '2.8rem' },
    { emoji: '🛸', animation: 'bounce', top: '60%', left: '85%', delay: '1.5s', size: '2.2rem' },
    { emoji: '🌟', animation: 'twinkle', top: '40%', left: '5%', delay: '0.8s', size: '2rem' },
    { emoji: '☄️', animation: 'float', top: '30%', left: '90%', delay: '0.3s', size: '2rem' },
    { emoji: '🌍', animation: 'pulse', top: '80%', left: '75%', delay: '1.2s', size: '3.2rem' },
    { emoji: '🛰️', animation: 'bounce', top: '50%', left: '20%', delay: '2.5s', size: '2rem' },
    { emoji: '✨', animation: 'twinkle', top: '25%', left: '35%', delay: '0.2s', size: '1.5rem' },
    { emoji: '👽', animation: 'float', top: '65%', left: '50%', delay: '1.8s', size: '2.5rem' },
    { emoji: '🌈', animation: 'pulse', top: '45%', left: '92%', delay: '0.7s', size: '2.8rem' },
    { emoji: '⭐', animation: 'twinkle', top: '75%', left: '40%', delay: '1.3s', size: '1.6rem' },
    { emoji: '🚀', animation: 'bounce', top: '35%', left: '70%', delay: '2.2s', size: '2.3rem' },
    { emoji: '🌟', animation: 'twinkle', top: '85%', left: '25%', delay: '0.9s', size: '1.8rem' },
    { emoji: '🪐', animation: 'pulse', top: '55%', left: '60%', delay: '1.6s', size: '2.6rem' },
  ];

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-100 to-cyan-200 overflow-hidden">
      {/* CSS Animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(-5deg); }
          50% { transform: translateY(-25px) rotate(0deg); }
          75% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.15); opacity: 0.25; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.3; transform: scale(1.2) rotate(180deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-12px) translateX(8px); }
          66% { transform: translateY(-8px) translateX(-8px); }
        }
      `}</style>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {spaceElements.map((element, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              top: element.top,
              left: element.left,
              fontSize: element.size,
              animation: `${element.animation} ${
                element.animation === 'bounce' ? '3s' :
                element.animation === 'pulse' ? '4s' :
                element.animation === 'twinkle' ? '2.5s' : '5s'
              } ease-in-out ${element.delay} infinite`,
              opacity: 0.2,
            }}
          >
            {element.emoji}
          </div>
        ))}
      </div>

      {/* Login Form */}
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-2xl relative z-10">
        <div className="text-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 whitespace-nowrap">Kinderhaus St. Wolfgang</h1>
          <p className="mt-2 text-gray-600">Willkommen im Elternportal</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="username"
                name="username"
                type="text"
                required
                disabled={isLoading}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Benutzername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={isLoading}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition duration-150 ease-in-out disabled:bg-cyan-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Anmelden...
                </>
              ) : (
                'Anmelden'
              )}
            </button>
          </div>
        </form>

        {/* Footer mit Links zu Impressum und Datenschutz */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <button
            onClick={() => setShowDatenschutz(true)}
            className="hover:text-cyan-600 underline"
          >
            Datenschutzerklärung
          </button>
          <span className="mx-2">•</span>
          <button
            onClick={() => setShowImpressum(true)}
            className="hover:text-cyan-600 underline"
          >
            Impressum
          </button>
        </div>
      </div>

      {/* Datenschutz Modal */}
      {showDatenschutz && (
        <Modal isOpen={showDatenschutz} onClose={() => setShowDatenschutz(false)} title="Datenschutzerklärung">
          <div className="overflow-y-auto max-h-[70vh]">
            <Datenschutz />
          </div>
        </Modal>
      )}

      {/* Impressum Modal */}
      {showImpressum && (
        <Modal isOpen={showImpressum} onClose={() => setShowImpressum(false)} title="Impressum">
          <div className="overflow-y-auto max-h-[70vh]">
            <Impressum />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Login;
