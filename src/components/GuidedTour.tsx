import React, { useState, useEffect, useMemo, FC } from 'react';

interface TourStep {
    selector: string;
    title: string;
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    action?: 'click' | 'type';
}

const TOUR_STEPS: TourStep[] = [
    {
        selector: '[data-tour-id="sidebar-inventory"]',
        title: "Paso 1: Inventario",
        content: "Aquí gestionas tus productos y servicios. Haz clic para continuar.",
        action: 'click'
    },
    {
        selector: '[data-tour-id="add-product-button"]',
        title: "Agregar Producto",
        content: "Usa este botón para añadir nuevos artículos a tu inventario. Haz clic en él.",
        action: 'click'
    },
    {
        selector: '[data-tour-id="product-name-input"]',
        title: "Detalles del Producto",
        content: "Ingresa el nombre de tu producto. Escribe 'Refresco' y presiona Siguiente.",
        action: 'type'
    },
    {
        selector: '[data-tour-id="product-price-input"]',
        title: "Precio",
        content: "Ahora, asigna un precio. Escribe '100' y presiona Siguiente.",
        action: 'type'
    },
     {
        selector: '[data-tour-id="product-stock-input"]',
        title: "Existencias",
        content: "Define la cantidad disponible. Escribe '20' y presiona Siguiente.",
        action: 'type'
    },
    {
        selector: '[data-tour-id="save-product-button"]',
        title: "Guardar Producto",
        content: "¡Excelente! Ahora guarda el producto haciendo clic aquí.",
        action: 'click'
    },
    {
        selector: '[data-tour-id="sidebar-rooms"]',
        title: "Paso 2: Habitaciones",
        content: "Ahora, vamos a la sección de habitaciones. Haz clic aquí.",
        action: 'click'
    },
    {
        selector: '[data-tour-id="add-room-button"]',
        title: "Agregar Habitación",
        content: "Este botón te permite crear nuevas habitaciones. Haz clic en él.",
        action: 'click'
    },
    {
        selector: '[data-tour-id="room-number-input"]',
        title: "Número de Habitación",
        content: "Escribe un identificador, como 'H-101', y presiona Siguiente.",
        action: 'type'
    },
    {
        selector: '[data-tour-id="room-price-input"]',
        title: "Precio de la Habitación",
        content: "Define el precio por uso. Escribe '1200' y presiona Siguiente.",
        action: 'type'
    },
    {
        selector: '[data-tour-id="save-room-button"]',
        title: "Guardar Habitación",
        content: "Perfecto. Guarda la nueva habitación.",
        action: 'click'
    },
     {
        selector: '[data-tour-id="sidebar-sales"]',
        title: "Paso 3: Realizar una Venta",
        content: "Ahora combinemos todo en una venta. Haz clic aquí para ir al punto de venta.",
        action: 'click'
    },
    {
        selector: '[data-tour-id="add-product-to-cart-0"]',
        title: "Agregar Producto al Carrito",
        content: "Busca el 'Refresco' que creaste y haz clic en 'Agregar' para añadirlo a la venta.",
        action: 'click'
    },
    {
        selector: '[data-tour-id="sell-room-to-cart-0"]',
        title: "Vender Habitación",
        content: "Ahora, haz clic en 'Vender' en la habitación que creaste.",
        action: 'click'
    },
    {
        selector: '[data-tour-id="plate-input"]',
        title: "Registrar Placa",
        content: "Es importante registrar la placa del vehículo. Escribe una, por ejemplo, 'A123456', y presiona Siguiente.",
        action: 'type'
    },
    {
        selector: '[data-tour-id="plate-confirm-button"]',
        title: "Confirmar Placa",
        content: "Haz clic para confirmar y agregar la habitación al carrito.",
        action: 'click'
    },
    {
        selector: '[data-tour-id="complete-sale-button"]',
        title: "Completar Venta",
        content: "Tu carrito está listo. Haz clic aquí para completar la venta y generar la factura.",
        action: 'click'
    },
    {
        selector: '[data-tour-id="daily-sales-button"]',
        title: "Paso 4: Ver y Anular Venta",
        content: "La factura se cerrará automáticamente. Ahora, para ver las ventas del día, haz clic en este botón.",
        action: 'click',
    },
    {
        selector: '[data-tour-id="delete-sale-0"]',
        title: "Anular Factura",
        content: "Aquí puedes ver la venta que acabas de hacer. Para anularla y devolver los productos al inventario, haz clic en el ícono de la papelera.",
        action: 'click'
    },
];

const GuidedTour: FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const currentStep = useMemo(() => TOUR_STEPS[stepIndex], [stepIndex]);

    useEffect(() => {
        if (!currentStep) {
            onComplete();
            return;
        }

        let cleanup: (() => void) | undefined;

        const findElement = () => {
            const element = document.querySelector<HTMLElement>(currentStep.selector);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                
                // Give a moment for scroll to finish before getting rect
                setTimeout(() => {
                    setTargetRect(element.getBoundingClientRect());

                    if (currentStep.action === 'click') {
                        const listener = () => {
                            setStepIndex(i => i + 1);
                        };
                        element.addEventListener('click', listener);
                        
                        cleanup = () => {
                            element.removeEventListener('click', listener);
                        };
                    }
                }, 150);

            } else {
                setTimeout(findElement, 200);
            }
        };

        const timeoutId = setTimeout(findElement, 100);

        return () => {
            clearTimeout(timeoutId);
            if (cleanup) {
                cleanup();
            }
        };

    }, [currentStep, onComplete]);
    
    const handleNext = () => setStepIndex(i => i + 1);

    const tooltipStyle: React.CSSProperties = useMemo(() => {
        if (!targetRect) return { display: 'none' };
        
        const style: React.CSSProperties = {
            position: 'fixed',
            transform: 'translate3d(0,0,0)',
            zIndex: 102
        };
        const offset = 10;
        
        switch(currentStep.placement) {
            case 'top':
                style.top = targetRect.top - offset;
                style.left = targetRect.left + targetRect.width / 2;
                style.transform = 'translate(-50%, -100%)';
                break;
            case 'left':
                style.top = targetRect.top + targetRect.height / 2;
                style.left = targetRect.left - offset;
                style.transform = 'translate(-100%, -50%)';
                break;
            case 'right':
                 style.top = targetRect.top + targetRect.height / 2;
                 style.left = targetRect.right + offset;
                 style.transform = 'translate(0, -50%)';
                 break;
            case 'bottom':
            default:
                style.top = targetRect.bottom + offset;
                style.left = targetRect.left + targetRect.width / 2;
                style.transform = 'translateX(-50%)';
        }
        return style;
    }, [targetRect, currentStep]);

    if (!targetRect || !currentStep) return null;

    return (
       <>
         <div 
             className="fixed inset-0 z-[100] bg-black/70"
             style={{
                 clipPath: `path('${`
                     M-1,-1 L-1,${window.innerHeight + 1}
                     L${window.innerWidth + 1},${window.innerHeight + 1}
                     L${window.innerWidth + 1},-1 Z
                     M${targetRect.left - 4},${targetRect.top - 4}
                     L${targetRect.right + 4},${targetRect.top - 4}
                     L${targetRect.right + 4},${targetRect.bottom + 4}
                     L${targetRect.left - 4},${targetRect.bottom + 4} Z
                 `}')`
             }}
         ></div>
        
         {currentStep.action === 'click' && targetRect && (
            <div
                style={{
                    position: 'fixed',
                    top: targetRect.top,
                    left: targetRect.left,
                    width: targetRect.width,
                    height: targetRect.height,
                    zIndex: 101,
                    cursor: 'pointer',
                }}
                onClick={() => {
                    const element = document.querySelector<HTMLElement>(currentStep.selector);
                    element?.click();
                }}
            />
         )}

          <div style={tooltipStyle} className="bg-white rounded-lg shadow-2xl w-72 p-4 animate-fade-in-down">
                <h3 className="font-bold text-sky-700 text-lg mb-2">{currentStep.title}</h3>
                <p className="text-sm text-slate-600 mb-4">{currentStep.content}</p>
                <div className="flex justify-between items-center">
                    <button onClick={onComplete} className="text-xs text-slate-500 hover:underline">Saltar recorrido</button>
                    {currentStep.action === 'type' && (
                        <button onClick={handleNext} className="px-4 py-1.5 bg-sky-600 text-white rounded-md font-semibold text-sm">
                            Siguiente
                        </button>
                    )}
                </div>
            </div>
       </>
    );
};

export default GuidedTour;