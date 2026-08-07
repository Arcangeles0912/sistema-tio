import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { SaleItem, Room, Sale } from '../types';
import { TrashIcon } from '../components/icons';
import InvoiceModal from '../components/InvoiceModal';
import PlateInputModal from '../components/PlateInputModal';
import DailySalesModal from '../components/DailySalesModal';
import CashCloseModal from '../components/CashCloseModal';
import { formatCurrency } from '../utils';

const SalesView: React.FC = () => {
  const { products, rooms, addSale, currentUser } = useAppContext();
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  
  const [isPlateModalOpen, setIsPlateModalOpen] = useState(false);
  const [isDailySalesModalOpen, setIsDailySalesModalOpen] = useState(false);
  const [isCashCloseModalOpen, setIsCashCloseModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const isAdmin = currentUser?.role === 'ADMINISTRADOR';

  const addToCart = (item: SaleItem) => {
    setCart(prev => [...prev, item]);
  };

  const removeFromCart = (itemId: number, index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleSellRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsPlateModalOpen(true);
  };
  
  const handleConfirmPlate = (plateNumber: string, isAmanecida: boolean, additionalPrice: number) => {
    if (selectedRoom) {
      const baseRoomPrice = Number(selectedRoom.price);
      const priceBeforeAmanecida = baseRoomPrice + additionalPrice;
      const finalPrice = isAmanecida ? priceBeforeAmanecida * 1.20 : priceBeforeAmanecida;
      
      let finalName = `Habitación ${selectedRoom.number}`;
      if (additionalPrice > 0) {
        finalName += ` (+${additionalPrice})`;
      }
      if (isAmanecida) {
        finalName += ` (Amanecida)`;
      }

      addToCart({
        id: selectedRoom.id,
        name: finalName,
        price: finalPrice,
        type: 'room',
        plateNumber: plateNumber || undefined,
      });
    }
    setIsPlateModalOpen(false);
    setSelectedRoom(null);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    const newSale = await addSale(cart);
    setLastSale(newSale);
    setCart([]);
    setShowInvoice(true);
  };
  
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRooms = rooms.filter(r =>
    `habitación ${r.number}`.toLowerCase().includes(searchTerm.toLowerCase()) || r.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-slate-800">Nueva Venta</h1>
          <button 
            onClick={() => setIsCashCloseModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 rounded-md shadow flex items-center gap-1 transition-colors"
          >
            📊 Cuadre de Caja
          </button>
        </div>
         <div className="w-full max-w-xs">
            <input
                type="text"
                placeholder="Buscar productos o habitaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products and Rooms */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-slate-700">Productos y Servicios</h2>
            <div className="max-h-72 overflow-y-auto border rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Producto</th>
                            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Precio</th>
                            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Disp.</th>
                            <th scope="col" className="relative px-4 py-2">
                                <span className="sr-only">Agregar</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredProducts.filter(p => p.stock > 0).map((p, index) => (
                            <tr key={p.id} className="hover:bg-slate-50">
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-900">{p.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-500 text-right">${formatCurrency(p.price)}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-500 text-right">{p.stock}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => addToCart({...p, type: 'product'})} data-tour-id={`add-product-to-cart-${index}`} className="px-3 py-1 text-xs font-semibold bg-sky-100 text-sky-700 rounded-full hover:bg-sky-200 transition-colors">
                                        Agregar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <h2 className="text-xl font-semibold my-4 pt-4 border-t text-slate-700">Habitaciones</h2>
             <div className="max-h-72 overflow-y-auto border rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Habitación</th>
                            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Precio</th>
                            <th scope="col" className="relative px-4 py-2">
                                <span className="sr-only">Vender</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredRooms.filter(r => r.status === 'disponible').map((r, index) => (
                            <tr key={r.id} className="hover:bg-slate-50">
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-900">{r.number}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-500 text-right">${formatCurrency(r.price)}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleSellRoomClick(r)} data-tour-id={`sell-room-to-cart-${index}`} className="px-3 py-1 text-xs font-semibold bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-colors">
                                        Vender
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm sticky top-8">
            <h2 className="text-xl font-semibold mb-4 text-slate-700">Resumen de Venta</h2>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {cart.length === 0 ? <p className="text-gray-500">El carrito está vacío.</p> :
                cart.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex justify-between items-start bg-slate-50 p-3 rounded">
                    <div className="flex-1 mr-2">
                      <p className="font-medium text-slate-800">{item.name}</p>
                      {item.plateNumber && (
                        <p className="text-xs text-slate-500 mt-0.5">Placa: {item.plateNumber}</p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-4 text-slate-800">${formatCurrency(item.price)}</span>
                      <button onClick={() => removeFromCart(item.id, index)} className="text-red-500 hover:text-red-700">
                        <TrashIcon className="h-5 w-5"/>
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between font-bold text-lg text-slate-800">
                <span>Total:</span>
                <span>${formatCurrency(cartTotal)}</span>
              </div>
               {isAdmin && (
                <button
                    onClick={() => setIsDailySalesModalOpen(true)}
                    data-tour-id="daily-sales-button"
                    className="mt-4 w-full bg-slate-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                    Ver Ventas del Día
                </button>
              )}
              <button
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
                data-tour-id="complete-sale-button"
                className="mt-2 w-full bg-sky-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-400"
              >
                Completar Venta e Imprimir Factura
              </button>
            </div>
          </div>
        </div>
      </div>
      {showInvoice && lastSale && (
        <InvoiceModal
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          sale={lastSale}
        />
      )}
      {selectedRoom && (
        <PlateInputModal
            isOpen={isPlateModalOpen}
            onClose={() => {
                setIsPlateModalOpen(false);
                setSelectedRoom(null);
            }}
            onConfirm={handleConfirmPlate}
            roomNumber={selectedRoom?.number}
            roomPrice={Number(selectedRoom.price)}
        />
      )}
      {isAdmin && (
        <DailySalesModal 
            isOpen={isDailySalesModalOpen}
            onClose={() => setIsDailySalesModalOpen(false)}
        />
      )}
      {isCashCloseModalOpen && (
        <CashCloseModal 
            isOpen={isCashCloseModalOpen}
            onClose={() => setIsCashCloseModalOpen(false)}
        />
      )}
    </>
  );
};

export default SalesView;