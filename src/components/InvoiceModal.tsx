import React, { useRef } from 'react';
import type { Sale } from '../types';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../utils';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, sale }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { currentUser, settings } = useAppContext();

  const handlePrint = () => {
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
      const itemsList = sale.items || [];
      const saleDate = new Date(sale.date);
      const dateStr = saleDate.toLocaleDateString('es-DO');
      const timeStr = saleDate.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Factura ${sale.id}</title>
             <style>
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              body {
                width: 78mm;
                font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
                font-size: 10.5pt;
                color: #000;
                margin: 0 auto;
                padding: 0.5mm 0;
                line-height: 1.3;
              }
              @page {
                size: 80mm auto;
                margin: 0;
              }
              .receipt {
                padding: 2mm 1mm;
              }
              .receipt-logo {
                font-size: 15pt;
                font-weight: bold;
                text-align: center;
                text-transform: uppercase;
                margin-bottom: 1.5mm;
              }
              .receipt-sub {
                text-align: center;
                font-size: 9pt;
                margin-bottom: 1.5mm;
                font-weight: 550;
              }
              .receipt-hr {
                border: 0;
                border-top: 1.5px dashed #000;
                margin: 2mm 0;
              }
              .receipt-info {
                font-size: 9.5pt;
                margin-bottom: 1.5mm;
              }
              .receipt-info div {
                display: flex;
                justify-content: space-between;
                margin: 0.5mm 0;
              }
              .receipt-items {
                width: 100%;
                border-collapse: collapse;
                font-size: 10pt;
              }
              .receipt-items th {
                text-align: left;
                padding: 1.2mm 0;
                font-size: 10pt;
                border-bottom: 1.5px dashed #000;
              }
              .receipt-items th.price {
                text-align: right;
              }
              .receipt-items td {
                padding: 1.2mm 0;
                vertical-align: top;
              }
              .receipt-items td.price {
                text-align: right;
                white-space: nowrap;
                font-weight: bold;
              }
              .subtext {
                font-size: 8.5pt;
                color: #000;
                font-weight: bold;
                margin-top: 0.5mm;
              }
              .receipt-total {
                display: flex;
                justify-content: space-between;
                font-size: 13pt;
                font-weight: bold;
                padding: 2mm 0;
                border-top: 1.5px solid #000;
                border-bottom: 1.5px solid #000;
              }
              .receipt-footer {
                text-align: center;
                font-size: 9.5pt;
                margin-top: 3mm;
                padding-bottom: 1mm;
                line-height: 1.4;
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="receipt-logo">${settings.logo_text || 'LevelBlack'}</div>
              ${settings.rnc ? `<div class="receipt-sub">RNC: ${settings.rnc}</div>` : ''}
              ${settings.address ? `<div class="receipt-sub">${settings.address}</div>` : ''}
              
              <div class="receipt-hr"></div>

              <div class="receipt-info">
                <div><span>Factura: #${sale.id}</span> <span>${dateStr} ${timeStr}</span></div>
                <div><span>Cajero: ${currentUser?.name || 'Caja'}</span></div>
              </div>

              <div class="receipt-hr"></div>

              <table class="receipt-items">
                <thead>
                  <tr>
                    <th>Desc.</th>
                    <th class="price">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList.map(item => `
                    <tr>
                      <td>
                        ${item.name}
                        ${item.plateNumber ? `<div class="subtext">Placa: ${item.plateNumber}</div>` : ''}
                      </td>
                      <td class="price">$${formatCurrency(item.price)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="receipt-hr"></div>

              <div class="receipt-total">
                <span>TOTAL:</span>
                <span>$${formatCurrency(sale.total)}</span>
              </div>

              <div class="receipt-hr"></div>

              <div class="receipt-footer">
                <p>¡Gracias por su preferencia!</p>
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

  if (!isOpen || !sale) return null;
  const itemsList = sale.items || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start pt-8 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs">
        <div ref={invoiceRef} className="p-4 bg-white text-black font-mono text-xs border-b">
          <div className="text-center font-bold text-base uppercase mb-1">{settings.logo_text || 'LevelBlack'}</div>
          {settings.rnc && <div className="text-center text-[10px] text-gray-600">RNC: {settings.rnc}</div>}
          {settings.address && <div className="text-center text-[10px] text-gray-600 mb-1">{settings.address}</div>}

          <div className="border-t border-dashed border-gray-400 my-2"></div>

          <div className="flex justify-between text-[11px] mb-0.5">
            <span>Factura: #{sale.id}</span>
            <span>{new Date(sale.date).toLocaleDateString('es-DO')}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>Cajero: {currentUser?.name}</span>
            <span>{new Date(sale.date).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="border-t border-dashed border-gray-400 my-2"></div>

          <div className="space-y-1">
            {itemsList.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex justify-between text-[11px]">
                <div className="pr-2">
                  <div>{item.name}</div>
                  {item.plateNumber && <div className="text-[10px] text-gray-500">Placa: {item.plateNumber}</div>}
                </div>
                <div className="font-semibold whitespace-nowrap">${formatCurrency(item.price)}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-400 my-2"></div>

          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL:</span>
            <span>${formatCurrency(sale.total)}</span>
          </div>

          <div className="border-t border-dashed border-gray-400 my-2"></div>
          <div className="text-center text-[10px] text-gray-600">¡Gracias por su preferencia!</div>
        </div>

        <div className="px-4 py-3 bg-slate-50 rounded-b-lg flex justify-end space-x-2">
          <button onClick={onClose} className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded text-xs font-medium hover:bg-gray-300">
            Cerrar
          </button>
          <button onClick={handlePrint} className="px-4 py-1.5 bg-sky-600 text-white rounded text-xs font-bold hover:bg-sky-700 shadow-sm">
            🖨️ Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;