import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

interface ResetPasswordViewProps {
  token: string;
  onResetSuccess: (message: string) => void;
  onInvalidToken: () => void;
}

const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ token, onResetSuccess, onInvalidToken }) => {
  const { resetPassword } = useAppContext();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    
    setIsSubmitting(true);
    const { success, message } = await resetPassword(token, password);
    setIsSubmitting(false);

    if (success) {
      onResetSuccess(message || 'Contraseña actualizada con éxito.');
    } else {
      if (message && message.includes('expirado')) {
        onInvalidToken();
      } else {
        setError(message || 'Ocurrió un error. Por favor, intenta de nuevo.');
      }
    }
  };

  return (
    <div className="relative min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-100">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-5xl font-extrabold text-slate-900">
            LevelBlack V2
          </h1>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-800">
            Establecer Nueva Contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Por favor, ingresa tu nueva contraseña a continuación.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleReset}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">Nueva Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm"
                placeholder="Nueva Contraseña"
              />
            </div>
             <div>
              <label htmlFor="confirm-password" className="sr-only">Confirmar Nueva Contraseña</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm"
                placeholder="Confirmar Nueva Contraseña"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Nueva Contraseña'}
            </button>
          </div>
        </form>
        {process.env.REACT_APP_VERSION && (
          <div className="text-center mt-6 text-slate-400 text-[10px] font-mono opacity-75">
            v{process.env.REACT_APP_VERSION}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordView;