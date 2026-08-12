import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Product } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, productToEdit }) => {
  const { addProduct, updateProduct } = useAppContext();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (productToEdit) {
            setName(productToEdit.name);
            setPrice(productToEdit.price.toString());
            setStock(productToEdit.stock.toString());
        } else {
            setName('');
            setPrice('');
            setStock('');
        }
    }
  }, [productToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name,
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
    };

    try {
      if (productToEdit) {
        await updateProduct({ ...productData, id: productToEdit.id });
      } else {
        await addProduct(productData);
      }
      onClose();
    } catch (err: any) {
      alert('Error al guardar el producto/servicio: ' + err.message);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">
              {productToEdit ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nombre del Producto/Servicio</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  data-tour-id="product-name-input"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-700">Precio</label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  data-tour-id="product-price-input"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-slate-700">Existencias</label>
                <input
                  type="number"
                  id="stock"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  required
                  min="0"
                  step="1"
                  data-tour-id="product-stock-input"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 rounded-b-lg flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" data-tour-id="save-product-button" className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;