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
  const [activeTab, setActiveTab] = useState<'products' | 'rooms'>('products');
  
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
    setLastSale({ ...newSale, items: cart });
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
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Nueva Venta</h1>
          <button 
            onClick={() => setIsCashCloseModalOpen(true)}
            className="px-3 py-2 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 rounded-lg shadow-sm flex items-center gap-1 transition-all active:scale-95"
          >
            📊 Cuadre de Caja
          </button>
        </div>
        <div className="w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Buscar productos o habitaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products and Rooms Tab Container */}
        <div className="lg:col-span-2">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            {/* Mobile Tab Selectors */}
            <div className="flex border border-slate-200 mb-6 bg-slate-50/50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`flex-1 py-2 text-center text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'products'
                    ? 'bg-white text-sky-600 shadow-sm border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <span>🛍️</span> Productos y Servicios
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rooms')}
                className={`flex-1 py-2 text-center text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'rooms'
                    ? 'bg-white text-teal-600 shadow-sm border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <span>🛏️</span> Habitaciones
              </button>
            </div>

            {/* Catalog Content */}
            <div>
              {activeTab === 'products' ? (
                <div>
                  <h2 className="text-lg font-bold mb-4 text-slate-700 hidden lg:block">Productos y Servicios</h2>
                  {filteredProducts.filter(p => p.stock > 0).length === 0 ? (
                    <p className="text-slate-400 text-center py-10 text-sm">No se encontraron productos disponibles.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-none lg:max-h-[500px] overflow-y-visible lg:overflow-y-auto pr-1">
                      {filteredProducts.filter(p => p.stock > 0).map((p, index) => (
                        <div key={p.id} className="p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between transition-colors gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-800 text-sm md:text-base break-words whitespace-normal leading-tight">{p.name}</h3>
                            <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                              <span className="bg-sky-50 text-sky-700 font-extrabold px-2 py-0.5 rounded border border-sky-100">
                                ${formatCurrency(p.price)}
                              </span>
                              <span className="text-slate-500 font-medium">
                                Disponibles: <b className="text-slate-700 font-bold">{p.stock}</b>
                              </span>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => addToCart({...p, type: 'product'})} 
                            data-tour-id={`add-product-to-cart-${index}`} 
                            className="py-2 px-4 text-xs font-bold bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-full transition-all active:scale-95 shadow-sm whitespace-nowrap"
                          >
                            Agregar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-bold mb-4 text-slate-700 hidden lg:block">Habitaciones</h2>
                  {filteredRooms.filter(r => r.status === 'disponible').length === 0 ? (
                    <p className="text-slate-400 text-center py-10 text-sm">No se encontraron habitaciones disponibles.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-none lg:max-h-[500px] overflow-y-visible lg:overflow-y-auto pr-1">
                      {filteredRooms.filter(r => r.status === 'disponible').map((r, index) => (
                        <div 
                          key={r.id} 
                          onClick={() => handleSellRoomClick(r)}
                          data-tour-id={`sell-room-to-cart-${index}`}
                          className="p-4 bg-teal-50/40 hover:bg-teal-50 border border-teal-100/50 rounded-2xl flex flex-col justify-between items-center text-center cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm group"
                        >
                          <div className="w-10 h-10 bg-teal-100/50 rounded-full flex items-center justify-center text-lg mb-2 text-teal-600 transition-colors group-hover:bg-teal-100">
                            🛏️
                          </div>
                          <span className="font-extrabold text-teal-950 text-sm md:text-base leading-tight">Hab. {r.number}</span>
                          <span className="text-xs text-teal-700 font-bold mt-1 bg-teal-100/30 px-2 py-0.5 rounded-md border border-teal-100/40">
                            ${formatCurrency(r.price)}
                          </span>
                          <span className="text-[10px] text-teal-600 font-bold mt-3 uppercase tracking-wider group-hover:underline">
                            Vender ➔
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart / Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 lg:sticky lg:top-8">
            <h2 className="text-lg font-bold mb-4 text-slate-700">Resumen de Venta</h2>
            <div className="space-y-2 max-h-[40vh] lg:max-h-[50vh] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <p className="text-slate-400 text-center py-6 text-sm">El carrito está vacío.</p>
              ) : (
                cart.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex justify-between items-start bg-slate-50 border border-slate-100 p-3 rounded-xl gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm break-words whitespace-normal leading-tight">{item.name}</p>
                      {item.plateNumber && (
                        <p className="text-[10px] text-slate-500 font-medium mt-1">Placa: {item.plateNumber}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-800">${formatCurrency(item.price)}</span>
                      <button 
                        type="button"
                        onClick={() => removeFromCart(item.id, index)} 
                        className="text-red-500 hover:text-red-750 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-4.5 w-4.5"/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t mt-4 pt-4 space-y-3">
              <div className="flex justify-between font-extrabold text-slate-800 text-lg">
                <span>Total:</span>
                <span>${formatCurrency(cartTotal)}</span>
              </div>
              
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsDailySalesModalOpen(true)}
                  data-tour-id="daily-sales-button"
                  className="w-full bg-slate-600 text-white py-2.5 px-4 rounded-xl font-bold hover:bg-slate-750 focus:outline-none transition-all active:scale-95 text-xs"
                >
                  Ver Ventas del Día
                </button>
              )}
              
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
                data-tour-id="complete-sale-button"
                className="w-full bg-sky-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-sky-700 focus:outline-none transition-all active:scale-95 disabled:bg-slate-350 disabled:scale-100 text-xs"
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