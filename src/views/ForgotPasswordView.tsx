import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

interface ForgotPasswordViewProps {
  onSwitchToLogin: () => void;
  onEmailSent: (message: string) => void;
}

const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onSwitchToLogin, onEmailSent }) => {
  const { forgotPassword } = useAppContext();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    const { success, message } = await forgotPassword(email);
    
    setIsSubmitting(false);

    if (success) {
      onEmailSent(message || 'Se ha enviado un correo de recuperación.');
    } else {
      setError(message || 'Ocurrió un error. Por favor, intenta de nuevo.');
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
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRequest}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">Correo Electrónico</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="Correo Electrónico"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Correo de Recuperación'}
            </button>
          </div>
        </form>
        <p className="mt-8 text-center text-sm text-slate-600">
            ¿Recordaste tu contraseña?{' '}
            <button onClick={onSwitchToLogin} className="font-medium text-sky-600 hover:text-sky-500 focus:outline-none">
                Volver a Iniciar Sesión
            </button>
        </p>
        {process.env.REACT_APP_VERSION && (
          <div className="text-center mt-6 text-slate-400 text-[10px] font-mono opacity-75">
            v{process.env.REACT_APP_VERSION}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordView;