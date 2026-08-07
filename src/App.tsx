import React, { useEffect, useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { useAppContext } from './context/AppContext';
import RegisterView from './views/RegisterView';
import ForgotPasswordView from './views/ForgotPasswordView';
import ResetPasswordView from './views/ResetPasswordView';
import OnboardingFlow from './components/OnboardingFlow';

// Toast Notification Component
const Toast: React.FC<{ message: string }> = ({ message }) => (
    <div
      className="fixed top-5 right-5 bg-sky-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-down"
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
);


const App: React.FC = () => {
  const { currentUser, logout, isLoading, checkUserSession, toast, onboardingStatus } = useAppContext();
  const [view, setView] = useState<'login' | 'register' | 'forgotPassword' | 'resetPassword'>('login');
  const [notification, setNotification] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);


  useEffect(() => {
    checkUserSession();
    
    // Check for confirmation status from URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('confirmed') === 'true') {
        setNotification('¡Tu cuenta ha sido confirmada! Ahora puedes iniciar sesión.');
        window.history.replaceState({}, document.title, "/");
    } else if (params.get('confirmed') === 'false') {
        const error = params.get('error');
        if (error === 'invalid_token') {
            setNotification('El enlace de confirmación no es válido o ha expirado. Por favor, regístrate de nuevo.');
        } else {
            setNotification('Ocurrió un error al confirmar tu cuenta.');
        }
        window.history.replaceState({}, document.title, "/");
    }

    const token = params.get('token');
    if (window.location.pathname.startsWith('/reset-password') && token) {
        setView('resetPassword');
        setResetToken(token);
        window.history.replaceState({}, document.title, "/");
    }

  }, [checkUserSession]);

  useEffect(() => {
    // If the view is set to resetPassword but we don't have a token,
    // it's an invalid state. We should switch back to the login page.
    if (view === 'resetPassword' && !resetToken) {
      setView('login');
    }
  }, [view, resetToken]);


  const handleRegisterSuccess = (message: string) => {
    setNotification(message);
    setView('login');
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full bg-slate-100">
            <div className="text-2xl font-semibold text-slate-700">Cargando...</div>
        </div>
    );
  }
  
  const renderLoginViews = () => {
    switch(view) {
        case 'register':
            return <RegisterView 
                onSwitchToLogin={() => setView('login')} 
                onRegisterSuccess={handleRegisterSuccess}
            />;
        case 'forgotPassword':
            return <ForgotPasswordView 
                onSwitchToLogin={() => setView('login')}
                onEmailSent={(message) => {
                    setNotification(message);
                    setView('login');
                }}
            />;
        case 'resetPassword':
            return resetToken ? <ResetPasswordView 
                token={resetToken}
                onResetSuccess={(message) => {
                    setNotification(message);
                    setView('login');
                }}
                onInvalidToken={() => {
                    setNotification('El token para restablecer la contraseña no es válido o ha expirado.');
                    setView('login');
                }}
            /> : null;

        case 'login':
        default:
            return <Login 
                onSwitchToRegister={() => {
                    setNotification(null);
                    setView('register');
                }}
                onSwitchToForgotPassword={() => {
                    setNotification(null);
                    setView('forgotPassword');
                }}
                notification={notification}
              />;
    }
  }

  return (
    <>
      {toast && <Toast message={toast} />}
      {!currentUser ? renderLoginViews() : <Dashboard user={currentUser} onLogout={logout} />}
      {currentUser && onboardingStatus === 'pending' && <OnboardingFlow />}
    </>
  );
};

export default App;