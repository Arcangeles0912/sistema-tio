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
    const printContent = invoiceRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Factura ${sale.id}</title>
              <style>
                /* Styles optimized for 80mm thermal receipt paper */
                body {
                  width: 78mm; /* A little less than 80mm for margins */
                  font-family: 'Courier New', Courier, monospace;
                  font-size: 10pt;
                  color: #000;
                  margin: 0 auto;
                  padding: 1mm 0;
                }
                @page {
                  size: 80mm;
                  margin: 0;
                }
                .receipt {
                  padding: 4mm;
                }
                .receipt-logo {
                  font-size: 20pt;
                  font-weight: bold;
                  text-align: center;
                  margin-bottom: 3mm;
                }
                .receipt-header {
                  text-align: center;
                  font-size: 9pt;
                  margin-bottom: 4mm;
                }
                .receipt-header p {
                  margin: 1mm 0;
                }
                .receipt-info {
                  font-size: 8pt;
                  margin-bottom: 2mm;
                }
                .receipt-info p {
                  margin: 0.5mm 0;
                  display: flex;
                  justify-content: space-between;
                }
                .receipt-hr {
                  border: 0;
                  border-top: 1px dashed #000;
                  margin: 3mm 0;
                }
                .receipt-items, .receipt-totals {
                  width: 100%;
                  border-collapse: collapse;
                }
                .receipt-items th {
                  font-size: 9pt;
                  text-align: left;
                  padding-bottom: 2mm;
                  border-bottom: 1px dashed #000;
                }
                .receipt-items th.price {
                   text-align: right;
                }
                .receipt-items td {
                  padding: 1.5mm 0;
                  vertical-align: top;
                }
                .receipt-items td .subtext {
                  font-size: 8pt;
                  color: #333;
                  padding-top: 0.5mm;
                }
                .receipt-items td.price {
                  text-align: right;
                  white-space: nowrap;
                }
                .receipt-totals td {
                  padding: 1.5mm 0;
                }
                .receipt-totals .total td {
                  font-weight: bold;
                  font-size: 12pt;
                  padding-top: 2mm;
                }
                .receipt-totals .total td.price {
                    text-align: right;
                }
                .receipt-footer {
                  text-align: center;
                  margin-top: 5mm;
                  font-size: 9pt;
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start pt-12 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div ref={invoiceRef}>
          {/* This inner div is what gets printed. It uses semantic classes for printing. */}
          {/* Inline styles are added to make the on-screen preview look like a receipt. */}
          <div className="receipt" style={{ fontFamily: "'Courier New', Courier, monospace", color: 'black' }}>
              <div className="receipt-logo">{settings.logo_text}</div>
              <div className="receipt-header">
                  <p>{settings.address}</p>
                  <p>RNC: {settings.rnc}</p>
              </div>

              <div className="receipt-info">
                  <p><span>Factura #:</span> <span>{sale.id}</span></p>
                  <p><span>Fecha:</span> <span>{new Date(sale.date).toLocaleDateString('es-DO')}</span></p>
                  <p><span>Hora:</span> <span>{new Date(sale.date).toLocaleTimeString('es-DO')}</span></p>
                  <p><span>Cajero:</span> <span>{currentUser?.name}</span></p>
              </div>

              <div className="receipt-hr"></div>

              <table className="receipt-items">
                  <thead>
                      <tr>
                          <th>Descripción</th>
                          <th className="price">Precio</th>
                      </tr>
                  </thead>
                  <tbody>
                      {sale.items.map((item, index) => (
                          <tr key={`${item.id}-${index}`}>
                              <td>
                                  {item.name}
                                  {item.plateNumber && (
                                      <div className="subtext">Placa: {item.plateNumber}</div>
                                  )}
                              </td>
                              <td className="price">${formatCurrency(item.price)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>

              <div className="receipt-hr"></div>

              <table className="receipt-totals">
                  <tbody>
                      <tr className="total">
                          <td>TOTAL</td>
                          <td className="price">${formatCurrency(sale.total)}</td>
                      </tr>
                  </tbody>
              </table>
              
              <div className="receipt-footer">
                  <p>¡Gracias por su compra!</p>
              </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 rounded-b-lg flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cerrar</button>
          <button onClick={handlePrint} className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">Imprimir</button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;