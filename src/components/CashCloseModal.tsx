import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../utils';

interface CashCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CashCloseModal: React.FC<CashCloseModalProps> = ({ isOpen, onClose }) => {
  const { sales, expenses, currentUser, settings } = useAppContext();

  // Default dates to today's date in local YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());

  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Filter sales and expenses by period (inclusive of whole days)
  const filteredData = useMemo(() => {
    const start = parseLocalDate(startDate);
    start.setHours(0, 0, 0, 0);

    const end = parseLocalDate(endDate);
    end.setHours(23, 59, 59, 999);

    const periodSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= start && saleDate <= end;
    });

    const periodExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= start && expDate <= end;
    });

    // Desglose
    let roomSalesTotal = 0;
    let productSalesTotal = 0;

    periodSales.forEach(sale => {
      (sale.items || []).forEach(item => {
        if (item.type === 'room') {
          roomSalesTotal += Number(item.price);
        } else {
          productSalesTotal += Number(item.price);
        }
      });
    });

    const salesTotal = roomSalesTotal + productSalesTotal;
    const expensesTotal = periodExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netBalance = salesTotal - expensesTotal;

    return {
      sales: periodSales,
      expenses: periodExpenses,
      roomSalesTotal,
      productSalesTotal,
      salesTotal,
      expensesTotal,
      netBalance
    };
  }, [sales, expenses, startDate, endDate]);

  const handlePrint = (isTodayOnly: boolean = false) => {
    let reportData = filteredData;
    let startStr = startDate;
    let endStr = endDate;

    if (isTodayOnly) {
      const todayStr = getTodayString();
      startStr = todayStr;
      endStr = todayStr;

      const start = parseLocalDate(todayStr);
      start.setHours(0, 0, 0, 0);
      const end = parseLocalDate(todayStr);
      end.setHours(23, 59, 59, 999);

      const periodSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= start && saleDate <= end;
      });

      const periodExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= start && expDate <= end;
      });

      let roomSalesTotal = 0;
      let productSalesTotal = 0;
      periodSales.forEach(sale => {
        (sale.items || []).forEach(item => {
          if (item.type === 'room') roomSalesTotal += Number(item.price);
          else productSalesTotal += Number(item.price);
        });
      });

      const salesTotal = roomSalesTotal + productSalesTotal;
      const expensesTotal = periodExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const netBalance = salesTotal - expensesTotal;

      reportData = {
        sales: periodSales,
        expenses: periodExpenses,
        roomSalesTotal,
        productSalesTotal,
        salesTotal,
        expensesTotal,
        netBalance
      };
    }

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
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Cuadre de Caja - ${new Date().toLocaleDateString('es-DO')}</title>
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
                size: 80mm;
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
              .receipt-title {
                text-align: center;
                font-size: 12pt;
                font-weight: bold;
                margin: 2.5mm 0;
                border-top: 1.5px solid #000;
                border-bottom: 1.5px solid #000;
                padding: 1.5mm 0;
              }
              .receipt-info {
                font-size: 9.5pt;
                margin-bottom: 3mm;
              }
              .receipt-info p {
                margin: 0.8mm 0;
                display: flex;
                justify-content: space-between;
              }
              .receipt-hr {
                border: 0;
                border-top: 1.5px dashed #000;
                margin: 2.5mm 0;
              }
              .receipt-summary-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10pt;
              }
              .receipt-summary-table td {
                padding: 1.2mm 0;
              }
              .receipt-summary-table .bold-row {
                font-weight: bold;
                font-size: 11.5pt;
              }
              .receipt-summary-table .price {
                text-align: right;
                font-weight: bold;
              }
              .receipt-footer {
                text-align: center;
                margin-top: 5mm;
                font-size: 9pt;
                line-height: 1.4;
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="receipt-logo">${settings.logo_text || 'LevelBlack'}</div>
              <div class="receipt-header">
                ${settings.address ? `<p>${settings.address}</p>` : ''}
                ${settings.rnc ? `<p>RNC: ${settings.rnc}</p>` : ''}
              </div>
              <div class="receipt-title">CUADRE DE CAJA</div>
              
              <div class="receipt-info">
                <p><span>F. Inicio:</span> <span>${parseLocalDate(startStr).toLocaleDateString('es-DO')}</span></p>
                <p><span>F. Fin:</span> <span>${parseLocalDate(endStr).toLocaleDateString('es-DO')}</span></p>
                <p><span>Impreso:</span> <span>${new Date().toLocaleDateString('es-DO')} ${new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</span></p>
                <p><span>Usuario:</span> <span>${currentUser?.name || ''}</span></p>
              </div>
              
              <div class="receipt-hr"></div>
              
              <table class="receipt-summary-table">
                <tbody>
                  <tr>
                    <td>Ventas Habitaciones:</td>
                    <td class="price">$${formatCurrency(reportData.roomSalesTotal)}</td>
                  </tr>
                  <tr>
                    <td>Ventas Productos:</td>
                    <td class="price">$${formatCurrency(reportData.productSalesTotal)}</td>
                  </tr>
                  <tr style="border-top: 1px dashed #000;">
                    <td style="font-weight: bold;">Ventas Totales:</td>
                    <td class="price" style="font-weight: bold;">$${formatCurrency(reportData.salesTotal)}</td>
                  </tr>
                  <tr style="color: #000;">
                    <td>(-) Egresos / Gastos:</td>
                    <td class="price">-$${formatCurrency(reportData.expensesTotal)}</td>
                  </tr>
                  <tr class="receipt-hr"></tr>
                  <tr class="bold-row" style="border-top: 1.5px solid #000; border-bottom: 1.5px solid #000;">
                    <td>BALANCE NETO EN CAJA:</td>
                    <td class="price">$${formatCurrency(reportData.netBalance)}</td>
                  </tr>
                </tbody>
              </table>
              
              <div class="receipt-hr"></div>
              
              <div class="receipt-footer">
                <p>Cierre de Turno de Caja</p>
                <p>${settings.logo_text || 'LevelBlack'} Hotel Management</p>
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-lg">
          <div>
            <h3 className="text-xl font-bold text-slate-800">📊 Módulo de Cuadre de Caja</h3>
            <p className="text-xs text-slate-500 mt-0.5">Controla y audita los balances de caja por períodos.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div>
              <label htmlFor="startDate" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          {/* KPI Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Ventas Hab.</p>
              <p className="text-xl font-extrabold text-emerald-950 mt-1">${formatCurrency(filteredData.roomSalesTotal)}</p>
            </div>
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
              <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Ventas Prod.</p>
              <p className="text-xl font-extrabold text-teal-950 mt-1">${formatCurrency(filteredData.productSalesTotal)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Egresos / Gastos</p>
              <p className="text-xl font-extrabold text-red-950 mt-1">-${formatCurrency(filteredData.expensesTotal)}</p>
            </div>
            <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
              <p className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">Balance en Caja</p>
              <p className="text-xl font-extrabold text-sky-950 mt-1">${formatCurrency(filteredData.netBalance)}</p>
            </div>
          </div>

          {/* Details Tables tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Sales List */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Ventas en el Período ({filteredData.sales.length})</span>
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-200 text-xs">
                {filteredData.sales.length === 0 ? (
                  <p className="text-slate-400 text-center py-6">No hay registros de venta</p>
                ) : (
                  filteredData.sales.map(s => (
                    <div key={s.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-800">Factura #{s.id}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{new Date(s.date).toLocaleDateString('es-DO')} {new Date(s.date).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className="font-bold text-slate-800">${formatCurrency(s.total)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Expenses List */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Egresos / Gastos ({filteredData.expenses.length})</span>
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-200 text-xs">
                {filteredData.expenses.length === 0 ? (
                  <p className="text-slate-400 text-center py-6">No hay registros de gastos</p>
                ) : (
                  filteredData.expenses.map(e => (
                    <div key={e.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-800">{e.description}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{e.type} | {new Date(e.date).toLocaleDateString('es-DO')}</p>
                      </div>
                      <span className="font-bold text-red-600">-${formatCurrency(e.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 rounded-b-lg flex justify-between items-center border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">
            Cerrar
          </button>
          
          <div className="flex space-x-3">
            {/* Period Close Report */}
            <button
              onClick={() => handlePrint(false)}
              className="px-4 py-2 text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 rounded-md shadow-sm transition-all duration-200"
            >
              🖨️ Imprimir Cuadre del Período
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CashCloseModal;
