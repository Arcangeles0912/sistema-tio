import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ProductFormModal from '../components/ProductFormModal';
import ExpenseFormModal from '../components/ExpenseFormModal';
import { EditIcon, PlusIcon, TrashIcon } from '../components/icons';
import type { Product } from '../types';
import { formatCurrency } from '../utils';

const InventoryView: React.FC = () => {
  const { products, expenses, deleteExpense, currentUser } = useAppContext();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const isAdmin = currentUser?.role === 'ADMINISTRADOR';
  const isReadOnly = !isAdmin && currentUser?.role === 'VENDEDOR';

  const openAddModal = () => {
    setProductToEdit(undefined);
    setIsProductModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setProductToEdit(product);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setProductToEdit(undefined);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Control de Inventario</h1>
        {isAdmin && (
          <button
            onClick={openAddModal}
            data-tour-id="add-product-button"
            className="px-4 py-2 bg-sky-600 text-white rounded-md font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          >
            Agregar Producto
          </button>
        )}
      </div>
      <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Producto / Servicio</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Precio</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Existencias</th>
              {!isReadOnly && <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={product.id} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-sky-50`}>
                <td className="px-5 py-4 text-sm text-slate-900">{product.id}</td>
                <td className="px-5 py-4 text-sm text-slate-900">{product.name}</td>
                <td className="px-5 py-4 text-sm text-slate-900">${formatCurrency(product.price)}</td>
                <td className="px-5 py-4 text-sm text-slate-900">{product.stock}</td>
                {isAdmin && (
                  <td className="px-5 py-4 text-sm">
                      <button 
                        onClick={() => openEditModal(product)} 
                        className="text-slate-500 p-1 hover:text-sky-600 rounded-full hover:bg-sky-100 transition-colors duration-200"
                        aria-label="Editar producto"
                      >
                        <EditIcon className="h-5 w-5" />
                      </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={closeProductModal}
        productToEdit={productToEdit}
      />

      {/* Expenses Section */}
      {isAdmin && (
        <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Control de Gastos</h2>
                <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                <PlusIcon className="h-5 w-5" />
                Agregar Gasto
                </button>
            </div>
            <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
            <table className="min-w-full leading-normal">
                <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Descripción</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tipo</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Monto</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
                </tr>
                </thead>
                <tbody>
                {expenses.map((expense, index) => (
                    <tr key={expense.id} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-sky-50`}>
                    <td className="px-5 py-4 text-sm text-slate-900">{new Date(expense.date).toLocaleDateString('es-DO')}</td>
                    <td className="px-5 py-4 text-sm text-slate-900">{expense.description}</td>
                    <td className="px-5 py-4 text-sm text-slate-900">{expense.type}</td>
                    <td className="px-5 py-4 text-sm text-slate-900 text-right">-${formatCurrency(expense.amount)}</td>
                    <td className="px-5 py-4 text-sm">
                        <button 
                            onClick={() => deleteExpense(expense.id)} 
                            className="text-slate-500 p-1 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors duration-200"
                            aria-label="Eliminar gasto"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
      )}
      <ExpenseFormModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} />
    </>
  );
};

export default InventoryView;