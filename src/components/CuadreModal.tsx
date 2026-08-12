import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../utils';

interface CuadreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CuadreSummary {
  lastCuadreAt: string | null;
  totalSales: number;
  totalExpenses: number;
  cashInBox: number;
  salesCount: number;
  expensesCount: number;
}

const CuadreModal: React.FC<CuadreModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, settings } = useAppContext();
  const [summary, setSummary] = useState<CuadreSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchSummary();
    }
  }, [isOpen, currentUser]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cuadre/summary?userId=${currentUser?.id}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintCuadreTicket = (cuadreData: CuadreSummary, closedAtDate: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      const lastText = cuadreData.lastCuadreAt
        ? new Date(cuadreData.lastCuadreAt).toLocaleString('es-DO')
        : 'Inicio del Sistema';
      const closedText = new Date(closedAtDate).toLocaleString('es-DO');

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>CUADRE DE CAJA</title>
            <style>
              body {
                width: 78mm;
                font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
                font-size: 10.5pt;
                color: #000;
                margin: 0 auto;
                padding: 1mm 0;
                line-height: 1.3;
              }
              @page {
                size: 80mm auto;
                margin: 0;
              }
              .receipt {
                padding: 3mm 1mm;
              }
              .receipt-logo {
                font-size: 16pt;
                font-weight: bold;
                text-align: center;
                margin-bottom: 1.5mm;
                text-transform: uppercase;
              }
              .receipt-header {
                text-align: center;
                font-size: 9.5pt;
                margin-bottom: 3.5mm;
              }
              .receipt-header p { margin: 0.5mm 0; }
              .receipt-hr {
                border: 0;
                border-top: 1.5px dashed #000;
                margin: 2.5mm 0;
              }
              .receipt-row {
                display: flex;
                justify-content: space-between;
                font-size: 10pt;
                margin: 1.5mm 0;
              }
              .receipt-row span:last-child {
                font-weight: bold;
              }
              .receipt-total {
                font-size: 12pt;
                font-weight: bold;
                margin-top: 3mm;
                border-top: 1px solid #000;
                border-bottom: 1px solid #000;
                padding: 1.5mm 0;
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="receipt-logo">${settings.logo_text || 'LevelBlack'}</div>
              <div class="receipt-header">
                ${settings.address ? `<p>${settings.address}</p>` : ''}
                ${settings.rnc ? `<p>RNC: ${settings.rnc}</p>` : ''}
                <p style="font-weight: bold; margin-top: 2mm;">COMPROBANTE DE CUADRE DE CAJA</p>
                <p>${closedText}</p>
              </div>
              <div class="receipt-hr"></div>
              <div class="receipt-row"><span>Admin Responsable:</span> <span>${currentUser?.name || ''}</span></div>
              <div class="receipt-row"><span>Desde:</span> <span>${lastText}</span></div>
              <div class="receipt-row"><span>Hasta:</span> <span>${closedText}</span></div>
              <div class="receipt-hr"></div>
              <div class="receipt-row"><span>Ventas Totales (${cuadreData.salesCount}):</span> <span>$${formatCurrency(cuadreData.totalSales)}</span></div>
              <div class="receipt-row"><span>Gastos Deducidos (${cuadreData.expensesCount}):</span> <span>-$${formatCurrency(cuadreData.totalExpenses)}</span></div>
              <div class="receipt-hr"></div>
              <div class="receipt-row receipt-total"><span>EFECTIVO A ENTREGAR:</span> <span>$${formatCurrency(cuadreData.cashInBox)}</span></div>
              <div class="receipt-hr"></div>
              <div style="text-align: center; margin-top: 6mm; font-size: 9pt;">
                <p>FIRMA DEL ADMINISTRADOR</p>
                <br/><br/>
                <p>___________________________</p>
              </div>
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 300);
    }
  };

  const handleConfirmClose = async () => {
    if (!summary) return;
    if (!window.confirm('¿Confirmas realizar el Cuadre de Caja? El contador de caja se reiniciará para el próximo periodo.')) return;

    setClosing(true);
    try {
      const res = await fetch('/api/cuadre/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditedBy: currentUser?.id })
      });
      if (res.ok) {
        const data = await res.json();
        handlePrintCuadreTicket(summary, data.cuadre.closedAt);
        alert('¡Cuadre de caja realizado exitosamente!');
        onClose();
      }
    } catch (e) {
      console.error(e);
      alert('Error al realizar el cuadre.');
    } finally {
      setClosing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Cuadre de Caja (Administrador)</h3>
        
        {loading ? (
          <p className="text-slate-500 py-8 text-center">Calculando acumulado en caja...</p>
        ) : summary ? (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Desde último cuadre:</span>
                <span className="font-semibold text-slate-800">
                  {summary.lastCuadreAt ? new Date(summary.lastCuadreAt).toLocaleString('es-DO') : 'Inicio de Sistema'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ventas Acumuladas ({summary.salesCount}):</span>
                <span className="font-semibold text-green-600">${formatCurrency(summary.totalSales)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Gastos Deducidos ({summary.expensesCount}):</span>
                <span className="font-semibold text-red-600">-${formatCurrency(summary.totalExpenses)}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between text-base font-bold text-slate-900">
                <span>Efectivo en Caja a Retirar:</span>
                <span className="text-sky-700">${formatCurrency(summary.cashInBox)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 italic">
              * Al realizar el cuadre, se registrará el efectivo entregado al Administrador y el siguiente cuadre iniciará el conteo desde cero.
            </p>
          </div>
        ) : (
          <p className="text-red-500 text-center py-4">Error al cargar información de cuadre.</p>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium">
            Cancelar
          </button>
          <button
            onClick={handleConfirmClose}
            disabled={closing || loading}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-bold disabled:opacity-50"
          >
            {closing ? 'Procesando...' : 'Realizar Cuadre e Imprimir'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CuadreModal;
