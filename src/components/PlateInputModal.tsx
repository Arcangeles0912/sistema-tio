import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils';

interface PlateInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (plate: string, isAmanecida: boolean, additionalPrice: number) => void;
  roomNumber?: string;
  roomPrice?: number;
}

const PlateInputModal: React.FC<PlateInputModalProps> = ({ isOpen, onClose, onConfirm, roomNumber, roomPrice = 0 }) => {
  const [plate, setPlate] = useState('');
  const [isAmanecida, setIsAmanecida] = useState(false);
  const [additionalPrice, setAdditionalPrice] = useState<number>(0);
  const [customAdditional, setCustomAdditional] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPlate('');
      setIsAmanecida(false);
      setAdditionalPrice(0);
      setCustomAdditional('');
    }
  }, [isOpen]);

  const handleQuickAdd = (amount: number) => {
    setAdditionalPrice(amount);
    setCustomAdditional('');
  };

  const handleCustomChange = (val: string) => {
    setCustomAdditional(val);
    const parsed = parseFloat(val);
    setAdditionalPrice(isNaN(parsed) ? 0 : parsed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(plate.trim(), isAmanecida, additionalPrice);
  };

  if (!isOpen) {
    return null;
  }

  const basePrice = roomPrice;
  const priceBeforeAmanecida = basePrice + additionalPrice;
  const finalPrice = isAmanecida ? priceBeforeAmanecida * 1.20 : priceBeforeAmanecida;

  const quickAdditions = [0, 200, 300, 400, 500];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-800">
                Alquilar Habitación {roomNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configura los detalles de la venta de la habitación.
              </p>
            </div>

            {/* Placa Input (Optional) */}
            <div>
              <label htmlFor="plate" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Número de Placa (Opcional)
              </label>
              <input
                type="text"
                id="plate"
                data-tour-id="plate-input"
                value={plate}
                onChange={e => setPlate(e.target.value)}
                autoFocus
                className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm"
                placeholder="Ej. ABC-123"
              />
            </div>

            {/* Price Increase Options */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Incremento de Tarifa
              </label>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {quickAdditions.map(amount => {
                  const isActive = additionalPrice === amount && customAdditional === '';
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleQuickAdd(amount)}
                      className={`py-1.5 text-xs font-bold rounded border transition-colors ${
                        isActive
                          ? 'bg-sky-600 border-sky-600 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      +{amount}
                    </button>
                  );
                })}
              </div>

              <div>
                <input
                  type="number"
                  placeholder="Otro monto adicional..."
                  value={customAdditional}
                  onChange={e => handleCustomChange(e.target.value)}
                  className="block w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-xs"
                />
              </div>
            </div>

            {/* Amanecida Checkbox */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center">
                <input
                  id="amanecida"
                  name="amanecida"
                  type="checkbox"
                  checked={isAmanecida}
                  onChange={(e) => setIsAmanecida(e.target.checked)}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                />
                <label htmlFor="amanecida" className="ml-2 block text-xs font-medium text-slate-700">
                  Venta tipo Amanecida (+20% al subtotal)
                </label>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1.5 font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Precio Base:</span>
                <span>${formatCurrency(basePrice)}</span>
              </div>
              {additionalPrice > 0 && (
                <div className="flex justify-between text-sky-600">
                  <span>Incremento adicional:</span>
                  <span>+${formatCurrency(additionalPrice)}</span>
                </div>
              )}
              {isAmanecida && (
                <div className="flex justify-between text-amber-600">
                  <span>Recargo Amanecida (20%):</span>
                  <span>+${formatCurrency(priceBeforeAmanecida * 0.20)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-800 pt-1.5 border-t border-dashed border-slate-200">
                <span>Precio Final:</span>
                <span>${formatCurrency(finalPrice)}</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-100 rounded-b-lg flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" data-tour-id="plate-confirm-button" className="px-4 py-2 text-xs font-semibold bg-sky-600 text-white rounded-md hover:bg-sky-700 shadow-sm">
              Confirmar y Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlateInputModal;