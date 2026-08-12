
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Settings } from '../types';

const ConfigurationView: React.FC = () => {
  const { settings, updateSettings, currentUser, testEmail } = useAppContext();
  
  const [formState, setFormState] = useState<Settings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean, message: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // File states for Super Admin
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = currentUser?.email === 'ruddy.felix@leveledups.com' || currentUser?.isSuperAdmin;

  useEffect(() => {
    setFormState(settings);
    if (settings.has_custom_logo === 'true') {
        setLogoPreview(`/api/images/logo.png?t=${new Date().getTime()}`);
    }
    if (settings.has_custom_favicon === 'true') {
        setFaviconPreview(`/api/images/favicon.ico?t=${new Date().getTime()}`);
    }
  }, [settings]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (file) {
        if (type === 'logo') {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        } else {
            setFaviconFile(file);
            setFaviconPreview(URL.createObjectURL(file));
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData();
      
      // Añadir todos los campos de texto
      Object.entries(formState).forEach(([key, value]) => {
          if (value !== undefined) formData.append(key, String(value));
      });
      
      // Añadir archivos si existen
      if (logoFile) formData.append('logo', logoFile);
      if (faviconFile) formData.append('favicon', faviconFile);
      
      // Audited by se añade en el context, pero lo pasamos aquí si enviamos FormData directamente
      formData.append('auditedBy', String(currentUser?.id));

      await updateSettings(formData, { 
        noReload: false, // Forzar recarga para que el navegador pille el nuevo favicon/logo
        message: 'Configuración guardada exitosamente.' 
      });
    } catch (error) {
      alert("Error al intentar guardar la configuración.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
      if (!testEmailAddress) return alert('Por favor, ingresa un correo de destino.');
      setIsTestingEmail(true);
      setTestResult(null);
      try {
          const result = await testEmail(testEmailAddress);
          setTestResult(result);
      } catch (error: any) {
          setTestResult({ success: false, message: error.message });
      } finally {
          setIsTestingEmail(false);
      }
  };

  const getBackupString = (): string => {
    const backupData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('levelblack_db_')) {
        const val = localStorage.getItem(key);
        if (val) backupData[key] = val;
      }
    }
    return JSON.stringify(backupData, null, 2);
  };

  const handleExportBackup = async () => {
    try {
      const backupStr = getBackupString();
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `levelblack_backup_${dateStr}.json`;

      // 1. Intentar compartir en móviles
      if (navigator.share) {
        try {
          const file = new File([backupStr], fileName, { type: 'application/json' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Respaldo LevelBlack',
              text: 'Archivo de copia de seguridad local de LevelBlack.'
            });
            return;
          }
        } catch (shareErr) {
          console.log('Compartir falló, usando descarga estándar:', shareErr);
        }
      }

      // 2. Descarga estándar en navegadores normales
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(backupStr)}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', fileName);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      alert('Error al exportar la copia de seguridad.');
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const backupStr = getBackupString();
      await navigator.clipboard.writeText(backupStr);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
      alert('Copia de seguridad copiada al portapapeles en formato de texto.');
    } catch (error) {
      alert('Error al copiar al portapapeles.');
    }
  };

  const restoreDatabase = (json: any) => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('levelblack_db_')) {
        localStorage.removeItem(key);
      }
    }

    Object.entries(json).forEach(([key, val]) => {
      if (key.startsWith('levelblack_db_') && typeof val === 'string') {
        localStorage.setItem(key, val);
      }
    });

    alert('Respaldo restaurado con éxito. La aplicación se reiniciará para aplicar los cambios.');
    window.location.reload();
  };

  const validateAndRestore = (jsonText: string) => {
    try {
      const json = JSON.parse(jsonText);
      if (!json || typeof json !== 'object') {
        throw new Error('Formato no válido.');
      }

      const keys = Object.keys(json);
      const hasDbKeys = keys.some(k => k.startsWith('levelblack_db_'));
      if (!hasDbKeys) {
        alert('El texto no contiene un respaldo válido de LevelBlack.');
        return;
      }

      if (window.confirm('¿Estás seguro de restaurar este respaldo? Se sobrescribirán todos los datos actuales de este teléfono y la aplicación se reiniciará.')) {
        restoreDatabase(json);
      }
    } catch (error) {
      alert('Error: Los datos no corresponden a un formato JSON de respaldo válido.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      validateAndRestore(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleRestoreFromClipboard = () => {
    const pastedText = prompt('Pega aquí el texto completo del respaldo que copiaste al portapapeles:');
    if (pastedText) {
      validateAndRestore(pastedText.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in-down">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Configuración del Sistema</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
         <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
                <span className="mr-2">🏢</span> Datos de la Empresa
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Comercial (Logo Texto)</label>
                    <input type="text" name="logo_text" value={formState.logo_text || ''} onChange={handleTextChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Nombre que aparecerá en facturas" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dirección Física</label>
                    <input type="text" name="address" value={formState.address || ''} onChange={handleTextChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-sky-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">RNC / Identificación Tributaria</label>
                    <input type="text" name="rnc" value={formState.rnc || ''} onChange={handleTextChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-sky-500 outline-none" />
                </div>
            </div>
          </div>

          {isSuperAdmin && (
            <>
              {/* Identidad Visual - Solo Super Admin */}
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-amber-500 border-t border-b border-r border-slate-200">
                  <h2 className="text-xl font-semibold text-amber-700 mb-4 flex items-center">
                      <span className="mr-2">🎨</span> Identidad Visual (Branding)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Logo Upload */}
                      <div className="flex flex-col items-center p-4 border-2 border-dashed border-slate-200 rounded-lg">
                          <label className="block text-sm font-bold text-slate-700 mb-3 text-center uppercase tracking-wide">Logo de Aplicación (PNG)</label>
                          <div className="w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden mb-4 border relative group">
                              {logoPreview ? (
                                  <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                              ) : (
                                  <span className="text-slate-400 text-xs">Sin Logo</span>
                              )}
                              <div onClick={() => logoInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                  <span className="text-white text-xs font-bold">Cambiar Logo</span>
                              </div>
                          </div>
                          <input type="file" ref={logoInputRef} onChange={(e) => handleFileChange(e, 'logo')} accept="image/png" className="hidden" />
                          <button type="button" onClick={() => logoInputRef.current?.click()} className="text-xs text-amber-600 font-bold hover:underline">Seleccionar Imagen (PNG)</button>
                      </div>

                      {/* Favicon Upload */}
                      <div className="flex flex-col items-center p-4 border-2 border-dashed border-slate-200 rounded-lg">
                          <label className="block text-sm font-bold text-slate-700 mb-3 text-center uppercase tracking-wide">Icono de Navegador (ICO)</label>
                          <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center overflow-hidden mb-4 border relative group">
                              {faviconPreview ? (
                                  <img src={faviconPreview} alt="Favicon Preview" className="w-8 h-8 object-contain" />
                              ) : (
                                  <span className="text-slate-400 text-[10px]">ICO</span>
                              )}
                              <div onClick={() => faviconInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                  <span className="text-white text-[10px] font-bold">Edit</span>
                              </div>
                          </div>
                          <input type="file" ref={faviconInputRef} onChange={(e) => handleFileChange(e, 'favicon')} accept="image/x-icon,image/vnd.microsoft.icon" className="hidden" />
                          <button type="button" onClick={() => faviconInputRef.current?.click()} className="text-xs text-amber-600 font-bold hover:underline">Seleccionar Icono (ICO)</button>
                          <p className="text-[10px] text-slate-400 mt-2">Recomendado: 32x32px</p>
                      </div>
                  </div>
              </div>

              {/* SMTP Settings */}
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-indigo-500 border-t border-b border-r border-slate-200">
                  <h2 className="text-xl font-semibold text-indigo-700 mb-4 flex items-center">
                      <span className="mr-2">📧</span> Servidor de Correo Global (SMTP)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Host SMTP</label>
                          <input type="text" name="smtp_host" value={formState.smtp_host || ''} onChange={handleTextChange} placeholder="ej: mail.leveledups.com" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Puerto</label>
                          <input type="text" name="smtp_port" value={formState.smtp_port || ''} onChange={handleTextChange} placeholder="465 (SSL) o 587 (TLS)" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Seguridad</label>
                          <select name="smtp_secure" value={formState.smtp_secure || 'false'} onChange={handleTextChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none">
                              <option value="true">SSL/TLS (Puerto 465)</option>
                              <option value="false">STARTTLS / Ninguna (Puerto 587/25)</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Usuario (Email)</label>
                          <input type="text" name="smtp_user" value={formState.smtp_user || ''} onChange={handleTextChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                          <input type="password" name="smtp_pass" value={formState.smtp_pass || ''} onChange={handleTextChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Remitente</label>
                          <input type="text" name="smtp_from" value={formState.smtp_from || ''} onChange={handleTextChange} placeholder="ej: Notificaciones LevelBlack <no-reply@dominio.com>" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Responder a (Reply-To)</label>
                          <input type="text" name="smtp_reply_to" value={formState.smtp_reply_to || ''} onChange={handleTextChange} placeholder="no-reply@dominio.com" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-400 italic">Nota: Esta configuración es global y afectará a todos los envíos de confirmación y recuperación de contraseña.</p>
              </div>
            </>
          )}

          <div className="flex justify-end sticky bottom-4 z-10">
            <button type="submit" disabled={isSaving} className="px-10 py-3 bg-sky-600 text-white rounded-full font-bold hover:bg-sky-700 shadow-xl transition-all active:scale-95 disabled:bg-slate-400">
              {isSaving ? 'Aplicando Cambios...' : 'Guardar Configuración'}
            </button>
          </div>
      </form>

      {isSuperAdmin && (
        <div className="mt-12 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <span className="mr-2">⚡</span> Prueba de Conectividad SMTP
            </h3>
            <div className="flex flex-col sm:flex-row gap-4">
                <input type="email" value={testEmailAddress} onChange={(e) => setTestEmailAddress(e.target.value)} placeholder="Correo para recibir prueba" className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" />
                <button onClick={handleTestEmail} disabled={isTestingEmail} className="px-8 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                    {isTestingEmail ? 'Enviando...' : 'Probar Envío'}
                </button>
            </div>
            {testResult && (
                <div className={`mt-4 p-4 rounded-md text-sm border ${testResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {testResult.success ? (
                        <div className="flex items-center"><span className="mr-2 text-lg">✅</span> {testResult.message}</div>
                    ) : (
                        <div className="flex items-start"><span className="mr-2 text-lg">❌</span> <div><b>Error de Conexión:</b> {testResult.message}</div></div>
                    )}
                </div>
            )}
        </div>
      )}

      {/* Sección de Respaldo de Datos */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
              <span className="mr-2">💾</span> Copia de Seguridad y Restauración
          </h3>
          <p className="text-sm text-slate-600 mb-6">
              Exporta los datos de la aplicación (productos, habitaciones, ventas, gastos, configuración, etc.) para guardarlos o importarlos en otro dispositivo. **Ideal para transferir datos entre teléfonos.**
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Export Box */}
              <div className="p-4 border border-slate-100 rounded-lg bg-slate-50/50 flex flex-col justify-between">
                  <div>
                      <h4 className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                          📥 Respaldar Datos
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">
                          Comparte el archivo de respaldo o copia los datos como texto.
                      </p>
                  </div>
                  <div className="space-y-2">
                      <button type="button" onClick={handleExportBackup} className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-all transform active:scale-[0.98] shadow-sm flex items-center justify-center gap-2">
                          <span>📤</span> Compartir / Descargar Respaldo
                      </button>
                      <button type="button" onClick={handleCopyToClipboard} className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all transform active:scale-[0.98] shadow-sm flex items-center justify-center gap-2">
                          <span>📋</span> {isCopied ? '¡Copiado!' : 'Copiar como Texto (Portapapeles)'}
                      </button>
                  </div>
              </div>

              {/* Import Box */}
              <div className="p-4 border border-slate-100 rounded-lg bg-slate-50/50 flex flex-col justify-between">
                  <div>
                      <h4 className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                          📤 Restaurar Datos
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">
                          Sube un archivo de respaldo o pega el texto desde el portapapeles.
                      </p>
                  </div>
                  <div className="space-y-2">
                      <input type="file" ref={fileInputRef} onChange={handleImportBackup} accept=".json" className="hidden" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all transform active:scale-[0.98] shadow-sm flex items-center justify-center gap-2">
                          <span>📂</span> Cargar Archivo de Respaldo
                      </button>
                      <button type="button" onClick={handleRestoreFromClipboard} className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all transform active:scale-[0.98] shadow-sm flex items-center justify-center gap-2">
                          <span>📋</span> Pegar Texto (Portapapeles)
                      </button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ConfigurationView;
