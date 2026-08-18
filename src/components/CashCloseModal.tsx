import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../utils';

interface CashCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CashCloseModal: React.FC<CashCloseModalProps> = ({ isOpen, onClose }) => {
  const { sales, expenses, currentUser, settings, products } = useAppContext();

  // Default dates to today's date in local YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDateTime, setStartDateTime] = useState(`${getTodayString()}T00:00`);
  const [endDateTime, setEndDateTime] = useState(`${getTodayString()}T23:59`);

  const parseLocalDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return new Date();
    const [datePart, timePart] = dateTimeStr.split('T');
    if (!datePart || !timePart) return new Date();
    const [year, month, day] = datePart.split('-').map(Number);
    const timeParts = timePart.split(':').map(Number);
    const hours = timeParts[0] || 0;
    const minutes = timeParts[1] || 0;
    const seconds = timeParts[2] || 0;
    return new Date(year, month - 1, day, hours, minutes, seconds, 0);
  };

  const formatDateTimeDMY = (dateObj: Date | string) => {
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatDateDMY = (dateObj: Date | string) => {
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Filter sales and expenses by period (inclusive of minutes)
  const filteredData = useMemo(() => {
    const start = parseLocalDateTime(startDateTime);
    const end = parseLocalDateTime(endDateTime);
    // Cover the full last minute (up to 59s, 999ms)
    end.setSeconds(59, 999);

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
  }, [sales, expenses, startDateTime, endDateTime]);

  const handlePrint = (isTodayOnly: boolean = false) => {
    let reportData = filteredData;
    let startStr = startDateTime;
    let endStr = endDateTime;

    if (isTodayOnly) {
      const todayStr = getTodayString();
      startStr = `${todayStr}T00:00`;
      endStr = `${todayStr}T23:59`;

      const start = parseLocalDateTime(startStr);
      const end = parseLocalDateTime(endStr);
      end.setSeconds(59, 999);

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

    // Calculate product breakdown for printing
    const productSummaryMap: Record<number, { name: string; soldQty: number; currentStock: number }> = {};
    (products || []).forEach(p => {
      productSummaryMap[p.id] = {
        name: p.name,
        soldQty: 0,
        currentStock: Number(p.stock)
      };
    });

    (reportData.sales || []).forEach(sale => {
      (sale.items || []).forEach(item => {
        if (item.type === 'product') {
          if (productSummaryMap[item.id]) {
            productSummaryMap[item.id].soldQty += 1;
          } else {
            productSummaryMap[item.id] = {
              name: item.name,
              soldQty: 1,
              currentStock: 0
            };
          }
        }
      });
    });

    const printedProductDetails = Object.values(productSummaryMap).filter(p => p.soldQty > 0);

    const productDetailsHtml = printedProductDetails.length > 0 
      ? `
        <div class="receipt-hr"></div>
        <div style="font-weight: bold; text-align: center; margin-bottom: 1.5mm; font-size: 8.5pt; text-transform: uppercase;">Detalle de Productos</div>
        <table class="receipt-summary-table" style="font-size: 8pt;">
          <thead>
            <tr style="border-bottom: 1px dashed #000; font-weight: bold;">
              <td>Producto</td>
              <td style="text-align: center; width: 15mm;">Cant.</td>
              <td style="text-align: right; width: 15mm;">Stock</td>
            </tr>
          </thead>
          <tbody>
            ${printedProductDetails.map(p => `
              <tr>
                <td>${p.name}</td>
                <td style="text-align: center;">${p.soldQty}</td>
                <td style="text-align: right;">${p.currentStock}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` 
      : '';

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cuadre de Caja - ${formatDateDMY(new Date())}</title>
            <style>
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: auto !important;
                background-color: #fff;
                font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
                font-size: 8.5pt;
                color: #000;
                line-height: 1.2;
                overflow: visible !important;
              }
              body {
                display: block;
              }
              @page {
                size: 80mm auto;
                margin: 0 !important;
              }
              .receipt {
                width: 100%;
                max-width: 76mm;
                margin: 0 auto;
                padding: 1mm 1.5mm;
                box-sizing: border-box;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .receipt-logo {
                font-size: 12pt;
                font-weight: bold;
                text-align: center;
                margin-bottom: 0.3mm;
                text-transform: uppercase;
              }
              .receipt-header {
                text-align: center;
                font-size: 8pt;
                margin-bottom: 1.5mm;
              }
              .receipt-header p { margin: 0.1mm 0; }
              .receipt-title {
                text-align: center;
                font-size: 10pt;
                font-weight: bold;
                margin: 1mm 0;
                border-top: 1px solid #000;
                border-bottom: 1px solid #000;
                padding: 0.8mm 0;
              }
              .receipt-info {
                font-size: 8pt;
                margin-bottom: 1.5mm;
              }
              .receipt-info p {
                margin: 0.3mm 0;
                clear: both;
                overflow: hidden;
              }
              .receipt-info p span:first-child {
                float: left;
              }
              .receipt-info p span:last-child {
                float: right;
                font-weight: bold;
              }
              .receipt-hr {
                border: 0;
                border-top: 1px dashed #000;
                margin: 1mm 0;
                clear: both;
              }
              .receipt-summary-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 8.5pt;
                clear: both;
              }
              .receipt-summary-table td {
                padding: 0.6mm 0;
              }
              .receipt-summary-table .bold-row {
                font-weight: bold;
                font-size: 9.5pt;
              }
              .receipt-summary-table .price {
                text-align: right;
                font-weight: bold;
              }
              .receipt-footer {
                text-align: center;
                margin-top: 2.5mm;
                font-size: 7.5pt;
                line-height: 1.25;
                clear: both;
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
                <p><span>F. Inicio:</span> <span>${formatDateTimeDMY(parseLocalDateTime(startStr))}</span></p>
                <p><span>F. Fin:</span> <span>${formatDateTimeDMY(parseLocalDateTime(endStr))}</span></p>
                <p><span>Impreso:</span> <span>${formatDateTimeDMY(new Date())}</span></p>
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
                  <tr>
                    <td>(-) Egresos / Gastos:</td>
                    <td class="price">-$${formatCurrency(reportData.expensesTotal)}</td>
                  </tr>
                  <tr style="border-top: 1.5px solid #000; border-bottom: 1.5px solid #000;" class="bold-row">
                    <td>BALANCE NETO EN CAJA:</td>
                    <td class="price">$${formatCurrency(reportData.netBalance)}</td>
                  </tr>
                </tbody>
              </table>
              
              ${productDetailsHtml}
              
              <div class="receipt-hr"></div>
              
              <div class="receipt-footer">
                <p>Cierre de Turno de Caja</p>
                <p>${settings.logo_text || 'LevelBlack'} Hotel Management</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
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
              <label htmlFor="startDateTime" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Fecha / Hora Desde
              </label>
              <input
                type="datetime-local"
                id="startDateTime"
                value={startDateTime}
                onChange={e => setStartDateTime(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label htmlFor="endDateTime" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Fecha / Hora Hasta
              </label>
              <input
                type="datetime-local"
                id="endDateTime"
                value={endDateTime}
                onChange={e => setEndDateTime(e.target.value)}
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
                        <p className="text-[10px] text-slate-500 mt-0.5">{formatDateTimeDMY(s.date)}</p>
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
                        <p className="text-[10px] text-slate-500 mt-0.5">{e.type} | {formatDateDMY(e.date)}</p>
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
            {/* Day Close Report */}
            <button
              onClick={() => handlePrint(true)}
              className="px-4 py-2 text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 rounded-md shadow-sm transition-all duration-200"
            >
              🖨️ Imprimir Ventas del Día
            </button>
            
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
