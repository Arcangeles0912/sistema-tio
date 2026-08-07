import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../utils';
import type { Sale, Expense } from '../types';

interface ReportData {
  startDate: string;
  endDate: string;
  salesSummary: {
    totalRevenue: number;
    salesCount: number;
    sales: Sale[];
  };
  roomSummary: { [roomNumber: string]: number };
  productSummary: { [productName: string]: { count: number; revenue: number } };
  expensesSummary: {
    totalExpenses: number;
    expenses: Expense[];
  };
}

const AnalyticsView: React.FC = () => {
  const { sales, expenses, rooms } = useAppContext();
  const [historicalMonth, setHistoricalMonth] = useState('');
  
  // Report generation state
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [generatedReport, setGeneratedReport] = useState<ReportData | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);


  const dailyFinancials = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= today && saleDate <= endOfToday;
    });

    const todayExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= today && expenseDate <= endOfToday;
    });

    const totalIncome = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netCashFlow = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, netCashFlow, salesCount: todaySales.length };
  }, [sales, expenses]);
  
  const historicalAnalysis = useMemo(() => {
    const now = new Date();

    // Weekly Net
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Assuming Sunday is the first day
    startOfWeek.setHours(0, 0, 0, 0);
    const weeklyIncome = sales.filter(s => new Date(s.date) >= startOfWeek).reduce((acc, s) => acc + s.total, 0);
    const weeklyExpenses = expenses.filter(e => new Date(e.date) >= startOfWeek).reduce((acc, e) => acc + e.amount, 0);
    const weeklyNet = weeklyIncome - weeklyExpenses;

    // Monthly Net
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyIncome = sales.filter(s => new Date(s.date) >= startOfMonth).reduce((acc, s) => acc + s.total, 0);
    const monthlyExpenses = expenses.filter(e => new Date(e.date) >= startOfMonth).reduce((acc, e) => acc + e.amount, 0);
    const monthlyNet = monthlyIncome - monthlyExpenses;
    
    // Chart Data (last 6 months)
    const chartData = [];
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth();
        
        const monthIncome = sales
            .filter(s => { const sd = new Date(s.date); return sd.getFullYear() === year && sd.getMonth() === month; })
            .reduce((acc, s) => acc + s.total, 0);

        const monthExpensesValue = expenses
            .filter(e => { const ed = new Date(e.date); return ed.getFullYear() === year && ed.getMonth() === month; })
            .reduce((acc, e) => acc + e.amount, 0);

        chartData.push({
            monthLabel: `${monthNames[month]} '${year.toString().slice(-2)}`,
            income: monthIncome,
            expense: monthExpensesValue,
        });
    }

    return { weeklyNet, monthlyNet, chartData };
  }, [sales, expenses]);

  const historicalLookupResult = useMemo(() => {
    if (!historicalMonth) return null;

    const [year, month] = historicalMonth.split('-').map(Number);
    
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1); // Start of next month
    
    const income = sales
        .filter(s => { const d = new Date(s.date); return d >= start && d < end; })
        .reduce((acc, s) => acc + s.total, 0);

    const expense = expenses
        .filter(e => { const d = new Date(e.date); return d >= start && d < end; })
        .reduce((acc, e) => acc + e.amount, 0);

    return { net: income - expense, income, expense };
  }, [sales, expenses, historicalMonth]);

  const maxValueForChart = Math.max(...historicalAnalysis.chartData.flatMap(d => [d.income, d.expense]), 1);

  const handleGenerateReport = () => {
    if (!reportStartDate || !reportEndDate) {
        alert('Por favor, selecciona un rango de fechas válido.');
        return;
    }

    const start = new Date(reportStartDate);
    start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
    start.setHours(0,0,0,0);
    const end = new Date(reportEndDate);
    end.setMinutes(end.getMinutes() + end.getTimezoneOffset());
    end.setHours(23,59,59,999);

    const filteredSales = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= start && saleDate <= end;
    });

    const filteredExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= start && expenseDate <= end;
    });

    // Sales Summary
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const salesCount = filteredSales.length;

    // Room Summary
    const roomSummary: { [roomNumber: string]: number } = {};
    filteredSales.forEach(sale => {
        sale.items.forEach(item => {
            if (item.type === 'room') {
                const room = rooms.find(r => r.id === item.id);
                if (room) {
                    roomSummary[room.number] = (roomSummary[room.number] || 0) + 1;
                }
            }
        });
    });
    
    // Product Summary
    const productSummary: { [productName: string]: { count: number; revenue: number } } = {};
    filteredSales.forEach(sale => {
        sale.items.forEach(item => {
            if (item.type === 'product') {
                if (!productSummary[item.name]) {
                    productSummary[item.name] = { count: 0, revenue: 0 };
                }
                productSummary[item.name].count++;
                productSummary[item.name].revenue += item.price;
            }
        });
    });
    
    // Expenses Summary
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    setGeneratedReport({
        startDate: start.toLocaleDateString('es-DO'),
        endDate: end.toLocaleDateString('es-DO'),
        salesSummary: { totalRevenue, salesCount, sales: filteredSales },
        roomSummary,
        productSummary,
        expensesSummary: { totalExpenses, expenses: filteredExpenses },
    });
  };

  const handleDownloadPdf = async () => {
    if (!generatedReport || !reportRef.current) return;
    setIsDownloadingPdf(true);
  
    const reportElement = reportRef.current;
  
    try {
      // @ts-ignore
      const { default: jsPDF } = await import(/* webpackIgnore: true */ 'jspdf');
      // @ts-ignore
      const { default: html2canvas } = await import(/* webpackIgnore: true */ 'html2canvas');
      
      const canvas = await html2canvas(reportElement, {
        scale: 2, // Improve resolution
        useCORS: true,
        onclone: (document: Document) => {
          // Ensure details tags are open in the cloned document for capture
          document.querySelectorAll('details').forEach(detail => {
            detail.setAttribute('open', '');
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
  
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
  
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
  
      const ratio = canvasWidth / canvasHeight;
      const widthInPdf = pdfWidth - margin * 2;
      let heightInPdf = widthInPdf / ratio;
      
      let heightLeft = heightInPdf;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, widthInPdf, heightInPdf);
      heightLeft -= (pdfHeight - margin*2);

      while (heightLeft > 0) {
        position = -heightLeft - margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, widthInPdf, heightInPdf);
        heightLeft -= (pdfHeight - margin*2);
      }
      
      const safeStartDate = generatedReport.startDate.replace(/\//g, '-');
      const safeEndDate = generatedReport.endDate.replace(/\//g, '-');
      pdf.save(`Reporte_${safeStartDate}_a_${safeEndDate}.pdf`);
      
    } catch (err) {
      console.error("Error generating PDF", err);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };


  return (
    <>
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Métricas Financieras</h1>
         <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">Resumen Financiero del Día</h2>
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="px-4 py-5 bg-white shadow-sm rounded-lg overflow-hidden sm:p-6">
                    <dt className="text-sm font-medium text-green-600 truncate">Ingresos Totales (Hoy)</dt>
                    <dd className="mt-1 text-3xl font-semibold text-slate-900">${formatCurrency(dailyFinancials.totalIncome)}</dd>
                    <p className="text-sm text-slate-500">{dailyFinancials.salesCount} ventas</p>
                </div>
                <div className="px-4 py-5 bg-white shadow-sm rounded-lg overflow-hidden sm:p-6">
                    <dt className="text-sm font-medium text-red-600 truncate">Gastos Totales (Hoy)</dt>
                    <dd className="mt-1 text-3xl font-semibold text-slate-900">${formatCurrency(dailyFinancials.totalExpenses)}</dd>
                     <p className="text-sm text-slate-500">Pagos y servicios</p>
                </div>
                <div className="px-4 py-5 bg-white shadow-sm rounded-lg overflow-hidden sm:p-6">
                    <dt className={`text-sm font-medium truncate ${dailyFinancials.netCashFlow >= 0 ? 'text-sky-600' : 'text-orange-500'}`}>Flujo de Caja Neto (Hoy)</dt>
                    <dd className="mt-1 text-3xl font-semibold text-slate-900">${formatCurrency(dailyFinancials.netCashFlow)}</dd>
                    <p className="text-sm text-slate-500">Ingresos - Gastos</p>
                </div>
            </dl>
          </div>
        
        {/* --- Historical Analysis Section --- */}
        <div className="mt-8 bg-white p-6 md:p-8 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">Análisis Histórico y Mensual</h2>
            
            {/* Weekly/Monthly Cards */}
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-8">
                <div className="px-4 py-5 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden sm:p-6">
                    <dt className={`text-sm font-medium truncate ${historicalAnalysis.weeklyNet >= 0 ? 'text-sky-600' : 'text-orange-500'}`}>Flujo de Caja (Esta Semana)</dt>
                    <dd className="mt-1 text-3xl font-semibold text-slate-900">${formatCurrency(historicalAnalysis.weeklyNet)}</dd>
                </div>
                <div className="px-4 py-5 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden sm:p-6">
                    <dt className={`text-sm font-medium truncate ${historicalAnalysis.monthlyNet >= 0 ? 'text-sky-600' : 'text-orange-500'}`}>Flujo de Caja (Este Mes)</dt>
                    <dd className="mt-1 text-3xl font-semibold text-slate-900">${formatCurrency(historicalAnalysis.monthlyNet)}</dd>
                </div>
            </dl>
            
            {/* Bar Chart */}
             <div className="mb-8">
                <h3 className="text-lg font-medium text-slate-600 mb-4">Ingresos vs Gastos (Últimos 6 Meses)</h3>
                <div className="flex justify-around items-end h-64 bg-slate-50 p-4 rounded-lg border border-slate-200 w-full" aria-label="Gráfico de ingresos y gastos mensuales">
                    {historicalAnalysis.chartData.map((item, index) => (
                        <div key={index} className="flex flex-col items-center w-1/6 text-center" role="group" aria-label={`Datos para ${item.monthLabel}`}>
                            <div className="flex items-end h-full w-full justify-center gap-1">
                                <div
                                    className="w-1/3 bg-green-400 hover:bg-green-500 transition-colors"
                                    style={{ height: `${(item.income / maxValueForChart) * 100}%` }}
                                    title={`Ingresos: $${formatCurrency(item.income)}`}
                                    aria-label={`Ingresos de ${formatCurrency(item.income)} dólares`}
                                ></div>
                                <div
                                    className="w-1/3 bg-red-400 hover:bg-red-500 transition-colors"
                                    style={{ height: `${(item.expense / maxValueForChart) * 100}%` }}
                                    title={`Gastos: $${formatCurrency(item.expense)}`}
                                    aria-label={`Gastos de ${formatCurrency(item.expense)} dólares`}
                                ></div>
                            </div>
                            <span className="text-xs text-slate-500 mt-2">{item.monthLabel}</span>
                        </div>
                    ))}
                </div>
             </div>

            {/* Historical Lookup */}
            <div>
                 <h3 className="text-lg font-medium text-slate-600 mb-4">Buscar Resumen Mensual</h3>
                 <div className="flex items-end gap-4">
                    <div>
                        <label htmlFor="month-picker" className="block text-sm font-medium text-slate-600 mb-1">Seleccionar mes y año</label>
                        <input
                            type="month"
                            id="month-picker"
                            value={historicalMonth}
                            onChange={(e) => setHistoricalMonth(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                    {historicalLookupResult && (
                        <div className="px-4 py-2 bg-white border rounded-lg animate-fade-in">
                           <dt className={`text-sm font-medium truncate ${historicalLookupResult.net >= 0 ? 'text-sky-600' : 'text-orange-500'}`}>Flujo de Caja Neto</dt>
                           <dd className="text-xl font-semibold text-slate-900">${formatCurrency(historicalLookupResult.net)}</dd>
                        </div>
                    )}
                 </div>
            </div>
        </div>

        {/* --- Report Generation Section --- */}
        <div className="mt-8 bg-white p-6 md:p-8 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">Generación de Reportes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-4 rounded-md border">
                <div>
                    <label htmlFor="report-start-date" className="block text-sm font-medium text-slate-600 mb-1">Fecha de Inicio</label>
                    <input type="date" id="report-start-date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
                </div>
                <div>
                    <label htmlFor="report-end-date" className="block text-sm font-medium text-slate-600 mb-1">Fecha de Fin</label>
                    <input type="date" id="report-end-date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} min={reportStartDate} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
                </div>
                <button onClick={handleGenerateReport} className="w-full px-6 py-2 bg-sky-600 text-white rounded-md font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 h-10">
                    Generar Reporte
                </button>
            </div>
            
            {generatedReport && (
                <div className="mt-6 animate-fade-in-down">
                    <div className="flex justify-end items-center mb-4">
                        <button 
                            onClick={handleDownloadPdf}
                            disabled={isDownloadingPdf}
                            className="px-4 py-2 bg-slate-600 text-white rounded-md font-semibold hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400"
                        >
                            {isDownloadingPdf ? 'Generando PDF...' : 'Descargar PDF'}
                        </button>
                    </div>
                    <div ref={reportRef} className="p-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">
                            Reporte del {generatedReport.startDate} al {generatedReport.endDate}
                        </h3>
                        <div className="space-y-6">
                            {/* Sales and Expenses Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-slate-700 mb-2">Resumen de Ventas</h4>
                                    <p>Ingresos Totales: <span className="font-bold text-green-600">${formatCurrency(generatedReport.salesSummary.totalRevenue)}</span></p>
                                    <p>Número de Ventas: <span className="font-bold">{generatedReport.salesSummary.salesCount}</span></p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-slate-700 mb-2">Resumen de Gastos</h4>
                                    <p>Gastos Totales: <span className="font-bold text-red-600">${formatCurrency(generatedReport.expensesSummary.totalExpenses)}</span></p>
                                </div>
                            </div>

                            {/* Room and Product Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-slate-700 mb-2">Ventas por Habitación</h4>
                                    <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
                                        {Object.keys(generatedReport.roomSummary).length > 0 ? 
                                            Object.entries(generatedReport.roomSummary).sort(([,a],[,b]) => (b as number) - (a as number)).map(([number, count]) => (
                                                <li key={number} className="flex justify-between"><span>{number}:</span> <span className="font-semibold">{count as number} veces</span></li>
                                            )) : <p className="text-slate-500">No se vendieron habitaciones.</p>
                                        }
                                    </ul>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-slate-700 mb-2">Productos Vendidos</h4>
                                    <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
                                        {Object.keys(generatedReport.productSummary).length > 0 ? 
                                            Object.entries(generatedReport.productSummary).sort(([,a],[,b]) => (b as {count: number}).count - (a as {count: number}).count).map(([name, data]) => (
                                                <li key={name} className="flex justify-between"><span>{name}:</span> <span className="font-semibold">{(data as {count: number}).count} unidades</span></li>
                                            )) : <p className="text-slate-500">No se vendieron productos.</p>
                                        }
                                    </ul>
                                </div>
                            </div>
                            {/* Details Sections */}
                            <div>
                                <details className="bg-slate-50 rounded-lg border">
                                    <summary className="p-4 font-semibold text-slate-700 cursor-pointer">Detalle de Ventas ({generatedReport.salesSummary.salesCount})</summary>
                                    <div className="border-t p-4 max-h-96 overflow-y-auto">
                                        <table className="min-w-full text-sm">
                                            <thead><tr className="border-b"><th className="text-left py-2">ID</th><th className="text-left py-2">Fecha</th><th className="text-left py-2">Usuario</th><th className="text-right py-2">Total</th></tr></thead>
                                            <tbody>
                                                {generatedReport.salesSummary.sales.map(s => (
                                                    <tr key={s.id} className="border-b"><td className="py-1">{s.id}</td><td className="py-1">{new Date(s.date).toLocaleString('es-DO')}</td><td className="py-1">{s.user_name || 'N/A'}</td><td className="text-right py-1">${formatCurrency(s.total)}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </details>
                            </div>
                            <div>
                            <details className="bg-slate-50 rounded-lg border">
                                    <summary className="p-4 font-semibold text-slate-700 cursor-pointer">Detalle de Gastos ({generatedReport.expensesSummary.expenses.length})</summary>
                                    <div className="border-t p-4 max-h-96 overflow-y-auto">
                                        <table className="min-w-full text-sm">
                                            <thead><tr className="border-b"><th className="text-left py-2">Fecha</th><th className="text-left py-2">Descripción</th><th className="text-left py-2">Tipo</th><th className="text-right py-2">Monto</th></tr></thead>
                                            <tbody>
                                                {generatedReport.expensesSummary.expenses.map(e => (
                                                    <tr key={e.id} className="border-b"><td className="py-1">{new Date(e.date).toLocaleDateString('es-DO')}</td><td className="py-1">{e.description}</td><td className="py-1">{e.type}</td><td className="text-right py-1">-${formatCurrency(e.amount)}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </>
  );
};

export default AnalyticsView;