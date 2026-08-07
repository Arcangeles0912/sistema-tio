import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { TrashIcon } from './icons';
import { formatCurrency } from '../utils';

interface DailySalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DailySalesModal: React.FC<DailySalesModalProps> = ({ isOpen, onClose }) => {
  const { sales, deleteSale } = useAppContext();

  const dailySales = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= today;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold text-slate-800">Ventas Realizadas Hoy</h3>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          {dailySales.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No se han realizado ventas hoy.</p>
          ) : (
            dailySales.map((sale, index) => (
              <details key={sale.id} className="bg-slate-50 rounded-lg group">
                <summary className="flex justify-between items-center p-4 cursor-pointer list-none">
                    <div>
                        <span className="font-bold text-slate-800">Factura #{sale.id}</span>
                        <span className="text-sm text-slate-500 ml-3">
                           {new Date(sale.date).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-bold text-lg text-slate-800 mr-4">${formatCurrency(sale.total)}</span>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                deleteSale(sale.id);
                            }}
                            data-tour-id={`delete-sale-${index}`}
                            className="text-slate-500 p-2 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"
                            aria-label="Eliminar venta"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                        <span className="ml-2 transform transition-transform group-open:rotate-90">▶</span>
                    </div>
                </summary>
                <div className="border-t border-slate-200 px-4 pt-3 pb-4">
                    <h4 className="font-semibold text-sm text-slate-600 mb-2">Artículos:</h4>
                    <ul className="space-y-1 text-sm">
                        {(sale.items || []).map((item, index) => (
                           <li key={index} className="flex justify-between">
                               <span>
                                   {item.name}
                                   {item.plateNumber && <span className="text-xs text-slate-400 ml-1">(Placa: {item.plateNumber})</span>}
                               </span>
                               <span>${formatCurrency(item.price)}</span>
                           </li>
                        ))}
                    </ul>
                </div>
              </details>
            ))
          )}
        </div>
        <div className="px-6 py-4 bg-slate-100 rounded-b-lg flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailySalesModal;