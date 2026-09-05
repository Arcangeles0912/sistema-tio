import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../utils';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrintReportModal: React.FC<PrintReportModalProps> = ({ isOpen, onClose }) => {
  const { sales, settings } = useAppContext();
  
  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());

  if (!isOpen) return null;

  const setPresetToday = () => {
    const today = getTodayString();
    setStartDate(today);
    setEndDate(today);
  };

  const setPresetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterdayStr = d.toISOString().split('T')[0];
    setStartDate(yesterdayStr);
    setEndDate(yesterdayStr);
  };

  const setPresetMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(getTodayString());
  };

  const handlePrintReport = () => {
    if (!startDate || !endDate) return;

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

    const filteredSales = sales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= start && saleDate <= end;
    });

    const totalAmount = filteredSales.reduce((sum, s) => sum + s.total, 0);

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
      const rangeText = startDate === endDate
        ? new Date(`${startDate}T00:00:00`).toLocaleDateString('es-DO')
        : `${new Date(`${startDate}T00:00:00`).toLocaleDateString('es-DO')} al ${new Date(`${endDate}T00:00:00`).toLocaleDateString('es-DO')}`;

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>REPORTE DE VENTAS</title>
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
              <div class="receipt-logo">${settings.logo_text || 'Cabañas y Hotel Subway'}</div>
              <div class="receipt-header">
                <p>REPORTE DE VENTAS</p>
                <p>${rangeText}</p>
              </div>
              <div class="receipt-hr"></div>
              <div class="receipt-row"><span>Total Operaciones:</span> <span>${filteredSales.length}</span></div>
              <div class="receipt-hr"></div>
              ${filteredSales.map(s => `
                <div class="receipt-row">
                  <span>#${s.id} (${new Date(s.date).toLocaleDateString('es-DO', { month: 'numeric', day: 'numeric' })} ${new Date(s.date).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })})</span>
                  <span>$${formatCurrency(s.total)}</span>
                </div>
              `).join('')}
              <div class="receipt-hr"></div>
              <div class="receipt-row receipt-total"><span>TOTAL RECAUDADO:</span> <span>$${formatCurrency(totalAmount)}</span></div>
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

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5">
        <h3 className="text-lg font-bold text-slate-800 mb-3 border-b pb-2 flex justify-between items-center">
          <span>📅 Imprimir Reporte de Ventas</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold">&times;</button>
        </h3>

        <div className="space-y-3">
          <div className="flex gap-1.5">
            <button onClick={setPresetToday} className="flex-1 py-1 px-2 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded text-xs font-semibold border border-sky-200">
              Hoy
            </button>
            <button onClick={setPresetYesterday} className="flex-1 py-1 px-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-semibold border border-slate-200">
              Ayer
            </button>
            <button onClick={setPresetMonth} className="flex-1 py-1 px-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-semibold border border-slate-200">
              Este Mes
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Desde:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Hasta:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end space-x-2">
          <button onClick={onClose} className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded text-xs font-medium hover:bg-gray-300">
            Cancelar
          </button>
          <button
            onClick={handlePrintReport}
            className="px-4 py-1.5 bg-sky-600 text-white rounded text-xs font-bold hover:bg-sky-700 shadow-sm"
          >
            🖨️ Imprimir Reporte
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintReportModal;
