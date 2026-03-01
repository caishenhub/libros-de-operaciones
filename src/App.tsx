import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Globe, 
  CandlestickChart, 
  Link as LinkIcon, 
  History, 
  TrendingUp, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Moon,
  Sun,
  AlertCircle,
  X,
  Calendar
} from 'lucide-react';
import { mockTrades } from './data/mockTrades';
import { Trade } from './types';

export default function App() {
  const [trades, setTrades] = useState<Trade[]>(mockTrades);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [activeMenu, setActiveMenu] = useState<'FOREX' | 'ACCIONES' | 'COMMODITIES'>('FOREX');
  const [viewType, setViewType] = useState<'HISTÓRICO' | 'EN CURSO'>('HISTÓRICO');
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 40;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, activeMenu, viewType]);

  const fetchTrades = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ahora consultamos a nuestro propio servidor (proxy) para evitar problemas de CORS
      const response = await fetch('/api/trades');

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          setTrades(data);
        } else if (data.error) {
          throw new Error(data.details || data.error);
        } else {
          throw new Error('El formato de datos recibido no es válido.');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `Error del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
      setError(error instanceof Error ? error.message : 'Error de conexión con el servidor proxy.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.ticket.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || (() => {
      // dateFilter is YYYY-MM-DD
      // trade.openDate is MM/DD/YYYY HH:mm
      const [year, month, day] = dateFilter.split('-');
      const formattedFilter = `${month}/${day}/${year}`;
      return trade.openDate.startsWith(formattedFilter);
    })();
    const matchesCategory = trade.category === activeMenu;
    const matchesStatus = trade.status === viewType;
    
    return matchesSearch && matchesDate && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTrades.length / ROWS_PER_PAGE);
  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  return (
    <div className="bg-white text-text-main font-sans min-h-screen flex flex-col p-4 md:p-8 transition-colors duration-200">
      
      {/* Header */}
      <header className="w-full max-w-[1600px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-primary text-white p-2.5 rounded-xl flex items-center justify-center h-12 w-12 shadow-sm">
            <Server size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary uppercase leading-none mb-1">
              Libro de Operaciones
            </h1>
            <p className="text-[11px] font-semibold tracking-[0.1em] text-text-neutral uppercase opacity-80">
              Verificación Institucional • Caishen Capital
            </p>
          </div>
        </div>
        
        <nav className="bg-white border border-slate-200 rounded-2xl p-1.5 flex items-center shadow-sm self-end md:self-auto">
          <button 
            onClick={() => setActiveMenu('FOREX')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeMenu === 'FOREX' 
                ? 'bg-accent text-primary shadow-sm' 
                : 'text-text-neutral hover:text-primary hover:bg-slate-50'
            }`}
          >
            <Globe size={16} />
            FOREX
          </button>
          <button 
            onClick={() => setActiveMenu('ACCIONES')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeMenu === 'ACCIONES' 
                ? 'bg-accent text-primary shadow-sm' 
                : 'text-text-neutral hover:text-primary hover:bg-slate-50'
            }`}
          >
            <CandlestickChart size={16} />
            ACCIONES
          </button>
          <button 
            onClick={() => setActiveMenu('COMMODITIES')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeMenu === 'COMMODITIES' 
                ? 'bg-accent text-primary shadow-sm' 
                : 'text-text-neutral hover:text-primary hover:bg-slate-50'
            }`}
          >
            <LinkIcon size={16} />
            COMMODITIES
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[1600px] mx-auto bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col flex-grow">
        
        {/* Toolbar */}
        <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="bg-slate-50 p-1.5 rounded-2xl flex items-center w-full lg:w-auto border border-slate-100">
            <button 
              onClick={() => setViewType('HISTÓRICO')}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-xs font-bold transition-all ${
                viewType === 'HISTÓRICO'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                  : 'text-text-neutral hover:text-primary'
              }`}
            >
              <History size={16} />
              HISTÓRICO
            </button>
            <button 
              onClick={() => setViewType('EN CURSO')}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-xs font-bold transition-all ${
                viewType === 'EN CURSO'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                  : 'text-text-neutral hover:text-primary'
              }`}
            >
              <TrendingUp size={16} />
              EN CURSO
            </button>
          </div>
          
          <div className="flex items-center gap-6 w-full lg:w-auto">
            <div className="relative flex-grow lg:w-96">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="text-slate-400" size={20} />
              </span>
              <input 
                className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl leading-5 bg-white text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent sm:text-sm font-medium transition-all" 
                placeholder="Buscar por símbolo o ticket..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative flex-grow lg:w-48">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                {dateFilter ? (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setDateFilter('');
                    }}
                    className="pointer-events-auto text-slate-400 hover:text-primary transition-colors"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <Calendar className="text-slate-400" size={16} />
                )}
              </span>
              <input 
                className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl leading-5 bg-white text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent sm:text-sm font-medium transition-all" 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <button 
              onClick={() => fetchTrades()}
              disabled={isLoading}
              className={`hidden sm:flex items-center gap-2.5 px-5 py-3.5 border border-slate-200 rounded-2xl bg-white shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isLoading ? 'animate-pulse' : ''}`}
            >
              <span className={`h-2.5 w-2.5 bg-accent rounded-full ${isLoading ? 'animate-spin' : 'animate-pulse'} shadow-[0_0_10px_#ceff04]`}></span>
              <span className="text-xs font-bold text-primary tracking-wide">
                {isLoading ? 'SINCRONIZANDO...' : 'NUBE INSTITUCIONAL'}
              </span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-grow overflow-x-auto custom-scrollbar relative bg-white">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">Ticket</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">Open Date</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">Close Date</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">Symbol</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">Action</th>
                <th className="px-5 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">SL</th>
                <th className="px-5 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">TP</th>
                <th className="px-5 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">Open Price</th>
                <th className="px-5 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">Close Price</th>
                <th className="px-5 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">Swap</th>
                <th className="px-5 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">Pips</th>
                <th className="px-5 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">Profit</th>
                <th className="px-5 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">Gain</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">Duration</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={14} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-accent border-t-primary rounded-full animate-spin"></div>
                      <p className="text-xs font-bold text-primary tracking-widest uppercase animate-pulse">
                        Sincronizando con Nube Institucional...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={14} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                      <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
                        <AlertCircle size={24} />
                      </div>
                      <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Error de Sincronización</h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        No se pudo conectar con la Nube Institucional. Esto puede deberse a la configuración de permisos del Apps Script o a un problema de red.
                      </p>
                      <button 
                        onClick={() => fetchTrades()}
                        className="mt-4 px-6 py-2.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                      >
                        Reintentar Conexión
                      </button>
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg w-full text-left">
                        <p className="text-[9px] font-mono text-slate-400 break-all">
                          Detalle: {error}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : paginatedTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-5 py-4 whitespace-nowrap text-[11px] font-semibold text-slate-400 group-hover:text-primary transition-colors">{trade.ticket}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-[11px] text-primary font-medium">{trade.openDate}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-[11px] text-primary font-medium">{trade.closeDate}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-[11px] font-bold text-primary">{trade.symbol}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-[9px] leading-3 font-bold rounded-lg ${
                      trade.action.toUpperCase() === 'BUY' 
                        ? 'bg-buy-bg text-buy-text shadow-sm shadow-blue-500/5' 
                        : 'bg-sell-bg text-sell-text shadow-sm shadow-red-500/5'
                    }`}>
                      {trade.action}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-[11px] text-right text-primary font-medium">{trade.sl}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-[11px] text-right text-primary font-medium">{trade.tp}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-[11px] text-right text-primary font-medium">{trade.openPrice}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-[11px] text-right text-primary font-medium">{trade.closePrice}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-[11px] text-right text-primary font-medium">{trade.swap}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-[11px] font-bold text-right">
                    <span className={`px-2.5 py-1 rounded-md inline-block ${trade.pips >= 0 ? 'text-success bg-success-bg' : 'text-danger bg-danger-bg'}`}>
                      {trade.pips > 0 ? '+' : ''}{trade.pips}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-[11px] font-bold text-right">
                    <span className={`px-2.5 py-1 rounded-md inline-block ${trade.profit >= 0 ? 'text-success bg-success-bg' : 'text-danger bg-danger-bg'}`}>
                      {trade.profit > 0 ? '+' : ''}{trade.profit}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-[11px] font-bold text-right">
                    <span className={`px-2.5 py-1 rounded-md inline-block ${trade.gain >= 0 ? 'text-success bg-success-bg' : 'text-danger bg-danger-bg'}`}>
                      {trade.gain > 0 ? '+' : ''}{trade.gain}%
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-[11px] text-primary font-medium">{trade.duration}</td>
                </tr>
              ))}
              {filteredTrades.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={14} className="px-8 py-16 text-center text-sm text-slate-400 font-medium">
                    No se encontraron operaciones que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-8 py-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Mostrando: <span className="text-primary ml-1 mr-4">{paginatedTrades.length} de {filteredTrades.length}</span>
              Total Nube: <span className="text-primary ml-1">{trades.length}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-primary disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-primary tracking-widest uppercase">
                Página {currentPage} / {totalPages || 1}
              </span>
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0 || isLoading}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-primary disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
