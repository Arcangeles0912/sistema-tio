import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

interface LoginConfig {
  logoText: string;
  customLogoUrl: string | null;
}

interface LoginProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  notification?: string | null;
}

const HotelIllustration = () => (
  <svg viewBox="0 0 400 400" className="w-full h-full max-w-lg mx-auto drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
    {/* Background Aura */}
    <circle cx="200" cy="200" r="150" fill="#fbbf24" fillOpacity="0.05" className="animate-pulse" />
    
    {/* Clouds */}
    <path d="M50 80 Q70 60 90 80 T130 80" stroke="white" strokeWidth="2" fill="none" className="animate-cloud" style={{ opacity: 0.3 }} />
    <path d="M280 60 Q300 40 320 60 T360 60" stroke="white" strokeWidth="2" fill="none" className="animate-cloud" style={{ animationDelay: '2s', opacity: 0.3 }} />

    {/* Ground */}
    <rect x="0" y="350" width="400" height="50" fill="#0f172a" />
    <line x1="0" y1="350" x2="400" y2="350" stroke="#fbbf24" strokeWidth="2" />

    {/* Hotel Building Main Body */}
    <rect x="100" y="100" width="200" height="250" fill="#1e293b" stroke="#334155" strokeWidth="2" />
    
    {/* Roof Detail */}
    <rect x="90" y="90" width="220" height="10" fill="#fbbf24" />
    <rect x="110" y="80" width="180" height="10" fill="#1e293b" stroke="#fbbf24" strokeWidth="1" />

    {/* Entrance Canopy */}
    <path d="M130 350 L130 320 L270 320 L270 350" fill="#0f172a" stroke="#fbbf24" strokeWidth="2" />
    <path d="M130 320 L150 300 L250 300 L270 320" fill="#fbbf24" opacity="0.8" />
    <rect x="170" y="320" width="60" height="30" fill="#fbbf24" fillOpacity="0.2" /> {/* Door Light */}

    {/* Vertical Lines (Architecture) */}
    <line x1="150" y1="100" x2="150" y2="300" stroke="#334155" strokeWidth="1" />
    <line x1="250" y1="100" x2="250" y2="300" stroke="#334155" strokeWidth="1" />

    {/* Windows (Grid) */}
    {/* Row 1 */}
    <rect x="120" y="120" width="20" height="30" className="animate-window-1" fill="#1e293b" stroke="#475569" strokeWidth="1" />
    <rect x="160" y="120" width="20" height="30" fill="#fbbf24" stroke="#475569" strokeWidth="1" />
    <rect x="220" y="120" width="20" height="30" className="animate-window-2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
    <rect x="260" y="120" width="20" height="30" fill="#1e293b" stroke="#475569" strokeWidth="1" />

    {/* Row 2 */}
    <rect x="120" y="170" width="20" height="30" fill="#1e293b" stroke="#475569" strokeWidth="1" />
    <rect x="160" y="170" width="20" height="30" className="animate-window-3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
    <rect x="220" y="170" width="20" height="30" fill="#fbbf24" stroke="#475569" strokeWidth="1" />
    <rect x="260" y="170" width="20" height="30" className="animate-window-4" fill="#1e293b" stroke="#475569" strokeWidth="1" />

    {/* Row 3 */}
    <rect x="120" y="220" width="20" height="30" className="animate-window-5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
    <rect x="160" y="220" width="20" height="30" fill="#1e293b" stroke="#475569" strokeWidth="1" />
    <rect x="220" y="220" width="20" height="30" className="animate-window-1" fill="#1e293b" stroke="#475569" strokeWidth="1" />
    <rect x="260" y="220" width="20" height="30" fill="#fbbf24" stroke="#475569" strokeWidth="1" />

    {/* Guests Animation */}
    <circle r="3" cy="345" fill="#fbbf24" className="animate-guest-left" />
    <circle r="3" cy="345" fill="white" className="animate-guest-right" />
    <circle r="3" cy="345" fill="#94a3b8" className="animate-guest-left" style={{ animationDelay: '2s' }} />
  </svg>
);

const Login: React.FC<LoginProps> = ({ onSwitchToRegister, onSwitchToForgotPassword, notification }) => {
  const { login } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginConfig, setLoginConfig] = useState<LoginConfig>({ logoText: 'LevelBlack V2', customLogoUrl: null });

  useEffect(() => {
    const fetchLoginConfig = async () => {
      try {
        const response = await fetch('/api/public-settings');
        if (response.ok) {
          const data = await response.json();
          setLoginConfig({
            logoText: data.logoText,
            customLogoUrl: data.hasCustomLogo ? `/api/images/login_logo.png?t=${new Date().getTime()}` : null
          });
        }
      } catch (error) {
        console.error("Failed to fetch public settings for login page", error);
      }
    };
    fetchLoginConfig();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const { success, message } = await login(email, password);
    setIsLoading(false);
    if (!success) {
      setError(message || 'Correo o contraseña no válidos.');
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      
      {/* LEFT SIDE: Hero / Animation */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden flex-col p-12">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-600 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg">
            <HotelIllustration />
            <div className="text-center mt-8">
                <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Gestión Hotelera de Excelencia</h2>
                <p className="text-slate-400 text-lg">Optimiza tus operaciones, controla tu inventario y mejora la experiencia de tus huéspedes con LevelBlack.</p>
            </div>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 animate-fade-in-down">
          
          <div className="text-center">
            <div className="mx-auto h-24 mb-4 flex items-center justify-center">
              {loginConfig.customLogoUrl ? (
                <img 
                  src={loginConfig.customLogoUrl} 
                  alt="Logo" 
                  className="max-h-full w-auto drop-shadow-sm" 
                />
              ) : (
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {loginConfig.logoText}
                </h1>
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              Bienvenido de nuevo
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Ingresa tus credenciales para acceder al panel
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {notification && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md text-sm shadow-sm" role="alert">
                <p className="font-medium">¡Éxito!</p>
                <p>{notification}</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm shadow-sm" role="alert">
                <p className="font-medium">Error de autenticación</p>
                <p>{error}</p>
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  id="email-address"
                  name="email"
                  type="text"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition-all duration-200 shadow-sm"
                  placeholder="ejemplo@hotel.com"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">Contraseña</label>
                    <button
                        onClick={onSwitchToForgotPassword}
                        type="button"
                        className="text-sm font-medium text-sky-600 hover:text-sky-500 transition-colors"
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition-all duration-200 shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all duration-200 shadow-lg hover:shadow-xl transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Iniciar Sesión'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
               ¿No tienes una cuenta?{' '}
               <button onClick={onSwitchToRegister} className="font-bold text-sky-600 hover:text-sky-500 transition-colors">
                  Regístrate aquí
               </button>
            </p>
          </div>
          
          <div className="text-center mt-6 text-slate-400 text-xs">
            <p>&copy; {new Date().getFullYear()} LevelBlack CRM. Todos los derechos reservados.</p>
            {process.env.REACT_APP_VERSION && (
              <p className="mt-1 text-[10px] text-slate-400 opacity-75 font-mono">v{process.env.REACT_APP_VERSION}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;