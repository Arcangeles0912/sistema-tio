import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

interface RegisterViewProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: (message: string) => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const { register, resendConfirmation } = useAppContext();
  const [organizationName, setOrganizationName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPendingConfirmation, setIsPendingConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPendingConfirmation(false);
    
    if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }
    
    const { success, message, email: returnedEmail } = await register({ organizationName, name, email, password });
    
    if (!success) {
      setError(message || 'No se pudo completar el registro.');
    } else if (message === 'pending_confirmation') {
      setIsPendingConfirmation(true);
      setPendingEmail(returnedEmail || email);
    } else {
      onRegisterSuccess(message || 'Registro exitoso. Por favor, revisa tu correo para confirmar tu cuenta.');
    }
  };

  const handleResend = async () => {
      setIsResending(true);
      setResendSuccess('');
      const { success, message } = await resendConfirmation(pendingEmail);
      setIsResending(false);
      if (success) {
          setResendSuccess(message || 'Correo reenviado con éxito.');
      } else {
          setError(message || 'No se pudo reenviar el correo.');
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
            Crea tu cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Comienza a gestionar tu negocio hoy mismo.
          </p>
        </div>

        {isPendingConfirmation ? (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg shadow-sm animate-fade-in-down">
                <div className="flex items-center mb-3">
                    <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-lg font-bold text-amber-800">Validación Pendiente</h3>
                    </div>
                </div>
                <div className="text-sm text-amber-700 space-y-4">
                    <p>Ya existe una cuenta registrada con el correo <strong>{pendingEmail}</strong>, pero aún no ha sido validada.</p>
                    <p>Por favor, revisa tu bandeja de entrada (y la carpeta de spam) para confirmar tu registro.</p>
                    
                    {resendSuccess ? (
                        <div className="mt-2 text-green-600 font-semibold flex items-center gap-2">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                            {resendSuccess}
                        </div>
                    ) : (
                        <button 
                            onClick={handleResend}
                            disabled={isResending}
                            className="w-full flex justify-center py-2 px-4 border border-amber-500 text-sm font-bold rounded-md text-amber-800 bg-transparent hover:bg-amber-100 transition-colors focus:outline-none disabled:opacity-50"
                        >
                            {isResending ? 'Enviando...' : 'Reenviar Correo de Confirmación'}
                        </button>
                    )}
                </div>
                <div className="mt-6 pt-4 border-t border-amber-200">
                    <button onClick={() => setIsPendingConfirmation(false)} className="text-xs text-amber-600 hover:text-amber-800 font-medium">
                        ← Intentar con otro correo
                    </button>
                </div>
            </div>
        ) : (
            <form className="mt-8 space-y-6" onSubmit={handleRegister}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="org-name" className="sr-only">Nombre de la Empresa</label>
                  <input
                    id="org-name"
                    name="organizationName"
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm"
                    placeholder="Nombre de la Empresa"
                  />
                </div>
                <div>
                  <label htmlFor="user-name" className="sr-only">Tu Nombre Completo</label>
                  <input
                    id="user-name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm"
                    placeholder="Tu Nombre Completo (Administrador)"
                  />
                </div>
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
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm"
                    placeholder="Correo Electrónico"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">Contraseña</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm"
                    placeholder="Contraseña"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
        )}

        <p className="mt-8 text-center text-sm text-slate-600">
            ¿Ya tienes una cuenta?{' '}
            <button onClick={onSwitchToLogin} className="font-medium text-sky-600 hover:text-sky-500 focus:outline-none">
                Inicia Sesión
            </button>
        </p>
      </div>
       <div className="absolute bottom-4 right-4 text-xs text-slate-500">
        Versión {process.env.REACT_APP_VERSION}
      </div>
    </div>
  );
};

export default RegisterView;