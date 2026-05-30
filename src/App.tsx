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
import CustomDatePicker, { DateRange, PresetType } from './components/CustomDatePicker';

export default function App() {
  const [trades, setTrades] = useState<Trade[]>(mockTrades);
  const [isLoading, setIsLoading] = useState(false); // Cambiado a false porque ya tenemos mockTrades
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRange, setSelectedRange] = useState<DateRange>({ start: null, end: null });
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('all');
  const [activeMenu, setActiveMenu] = useState<'FOREX' | 'COMMODITIES' | 'ACCIONES'>('FOREX');
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 40;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRange, selectedPreset, activeMenu]);

  const fetchTrades = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsInitialLoad(true);
      setIsLoading(true);
      setError(null);
      
      const apiUrl = '/api/trades';
      const response = await fetch(apiUrl);

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
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const SkeletonRow = () => (
    <tr className="animate-pulse border-b border-slate-50">
      <td className="px-5 py-4"><div className="h-3 w-16 bg-slate-100 rounded"></div></td>
      <td className="px-5 py-4"><div className="h-3 w-24 bg-slate-100 rounded"></div></td>
      <td className="px-5 py-4"><div className="h-3 w-24 bg-slate-100 rounded"></div></td>
      <td className="px-5 py-4"><div className="h-3 w-12 bg-slate-100 rounded font-bold"></div></td>
      <td className="px-5 py-4"><div className="h-5 w-12 bg-slate-100 rounded-lg"></div></td>
      <td className="px-5 py-4"><div className="h-3 w-10 bg-slate-100 rounded ml-auto"></div></td>
      <td className="px-5 py-4"><div className="h-3 w-10 bg-slate-100 rounded ml-auto"></div></td>
      <td className="px-5 py-4"><div className="h-3 w-14 bg-slate-100 rounded ml-auto"></div></td>
      <td className="px-5 py-4"><div className="h-3 w-14 bg-slate-100 rounded ml-auto"></div></td>
      <td className="px-5 py-4"><div className="h-3 w-10 bg-slate-100 rounded ml-auto"></div></td>
      <td className="px-5 py-4"><div className="h-5 w-12 bg-slate-100 rounded-md ml-auto"></div></td>
      <td className="px-5 py-4"><div className="h-5 w-12 bg-slate-100 rounded-md ml-auto"></div></td>
      <td className="px-5 py-4"><div className="h-5 w-12 bg-slate-100 rounded-md ml-auto"></div></td>
      <td className="px-5 py-4"><div className="h-3 w-16 bg-slate-100 rounded"></div></td>
    </tr>
  );

  const SkeletonCard = () => (
    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-slate-100 rounded"></div>
            <div className="h-4 w-10 bg-slate-100 rounded"></div>
          </div>
          <div className="h-3 w-12 bg-slate-100 rounded"></div>
        </div>
        <div className="space-y-2 text-right">
          <div className="h-4 w-12 bg-slate-100 rounded ml-auto"></div>
          <div className="h-3 w-10 bg-slate-100 rounded ml-auto"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-3 border-t border-slate-50">
        {[1, 2, 3, 4].map(i => (
          <div key={i}>
            <div className="h-2 w-10 bg-slate-50 rounded mb-1"></div>
            <div className="h-3 w-20 bg-slate-100 rounded"></div>
          </div>
        ))}
        <div className="col-span-2 bg-slate-50 p-2 rounded-lg flex justify-between">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-4 w-8 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );

  // helper to parse MM/DD/YYYY HH:mm to Date object
  const parseTradeDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr === '-') return null;
    const parts = dateStr.split(' ');
    const dateParts = parts[0].split('/');
    if (dateParts.length !== 3) return null;
    
    const month = parseInt(dateParts[0], 10) - 1;
    const day = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
    
    let hours = 0;
    let minutes = 0;
    if (parts[1]) {
      const timeParts = parts[1].split(':');
      hours = parseInt(timeParts[0], 10) || 0;
      minutes = parseInt(timeParts[1], 10) || 0;
    }
    
    return new Date(year, month, day, hours, minutes);
  };

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.ticket.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = (() => {
      if (selectedPreset === 'all') return true;
      
      const tradeDate = parseTradeDate(trade.openDate);
      if (!tradeDate) return false;

      const start = selectedRange.start;
      const end = selectedRange.end;

      if (start && end) {
        return tradeDate >= start && tradeDate <= end;
      } else if (start) {
        return tradeDate >= start;
      }
      return true;
    })();

    const matchesCategory = trade.category === activeMenu;
    const matchesStatus = !trade.status || trade.status === 'HISTÓRICO';
    
    return matchesSearch && matchesDate && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTrades.length / ROWS_PER_PAGE);
  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col p-3 md:p-8 transition-colors duration-200">
      
      {/* Header */}
      <header className="w-full max-w-[1600px] mx-auto mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
          <div className="bg-primary text-white p-2 md:p-2.5 rounded-xl flex items-center justify-center h-10 w-10 md:h-12 md:w-12 shadow-sm shrink-0">
            <Server size={22} className="md:w-[28px] md:h-[28px]" />
          </div>
          <div className="min-w-0 flex-grow">
            <h1 className="text-base md:text-2xl font-bold tracking-tight text-primary uppercase leading-tight truncate">
              Libro de Operaciones Caishen Capital Group
            </h1>
            <p className="text-[8px] md:text-[11px] font-semibold tracking-[0.05em] md:tracking-[0.1em] text-slate-500 uppercase opacity-80 truncate">
              Verificación Institucional • Caishen Capital
            </p>
          </div>
        </div>
        
        <nav className="bg-white border border-slate-200 rounded-2xl p-1 flex items-center shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveMenu('FOREX')}
            className={`flex items-center justify-center gap-2 px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap flex-1 md:flex-none ${
              activeMenu === 'FOREX' 
                ? 'bg-accent text-primary shadow-sm' 
                : 'text-slate-500 hover:text-primary hover:bg-slate-50'
            }`}
          >
            <Globe size={14} className="md:w-[16px] md:h-[16px]" />
            FOREX
          </button>
          <button 
            onClick={() => setActiveMenu('COMMODITIES')}
            className={`flex items-center justify-center gap-2 px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap flex-1 md:flex-none ${
              activeMenu === 'COMMODITIES' 
                ? 'bg-accent text-primary shadow-sm' 
                : 'text-slate-500 hover:text-primary hover:bg-slate-50'
            }`}
          >
            <LinkIcon size={14} className="md:w-[16px] md:h-[16px]" />
            COMMODITIES
          </button>
          <button 
            onClick={() => setActiveMenu('ACCIONES')}
            className={`flex items-center justify-center gap-2 px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap flex-1 md:flex-none ${
              activeMenu === 'ACCIONES' 
                ? 'bg-accent text-primary shadow-sm' 
                : 'text-slate-500 hover:text-primary hover:bg-slate-50'
            }`}
          >
            <CandlestickChart size={14} className="md:w-[16px] md:h-[16px]" />
            ACCIONES
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[1600px] mx-auto bg-white rounded-2xl md:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col flex-grow relative">
        
        {/* Loading Bar */}
        {isLoading && !isInitialLoad && (
          <div className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden">
            <div className="h-full bg-accent animate-progress origin-left"></div>
          </div>
        )}
        
        {/* Toolbar */}
        <div className="p-4 md:p-8 border-b border-slate-100 focus-within:z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 w-full">
            <div className="relative flex-grow sm:max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="text-slate-400" size={18} />
              </span>
              <input 
                className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl md:rounded-2xl leading-5 bg-white text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-xs md:text-sm font-medium transition-all" 
                placeholder="Buscar por símbolo o ticket..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                id="search_trades_input"
              />
            </div>

            <CustomDatePicker
              onDateChange={(range, preset) => {
                setSelectedRange(range);
                setSelectedPreset(preset);
              }}
              selectedPreset={selectedPreset}
              selectedRange={selectedRange}
            />

            <button 
              onClick={() => fetchTrades(true)}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2.5 px-5 py-3 border border-slate-200 rounded-xl md:rounded-2xl bg-white shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto sm:ml-auto shrink-0 ${isLoading ? 'animate-pulse' : ''}`}
              id="sync_cloud_button_unified"
            >
              <span className={`h-2 w-2 md:h-2.5 md:w-2.5 bg-accent rounded-full ${isLoading ? 'animate-spin' : 'animate-pulse'} shadow-[0_0_10px_#ceff04]`}></span>
              <span className="text-xs font-bold text-primary tracking-wide">
                {isLoading ? 'SINCRONIZANDO...' : 'NUBE INSTITUCIONAL'}
              </span>
            </button>
          </div>
        </div>

        {/* Table / Card Container */}
        <div className="flex-grow overflow-hidden relative bg-white">
          {/* Desktop Table View */}
          <div className="hidden md:block h-full overflow-auto custom-scrollbar">
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
                {isInitialLoad ? (
                  Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
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
                          onClick={() => fetchTrades(true)}
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
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden h-full overflow-auto p-4 space-y-4 custom-scrollbar">
            {isInitialLoad ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            ) : error ? (
              <div className="py-8 text-center px-4">
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle size={20} />
                </div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Error de Sincronización</h3>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-4">
                  No se pudo conectar con la Nube Institucional.
                </p>
                <button 
                  onClick={() => fetchTrades(true)}
                  className="w-full py-3 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-slate-200"
                >
                  Reintentar
                </button>
              </div>
            ) : paginatedTrades.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                No se encontraron operaciones.
              </div>
            ) : paginatedTrades.map((trade) => (
              <div key={trade.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary">{trade.symbol}</span>
                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded-md ${
                        trade.action.toUpperCase() === 'BUY' 
                          ? 'bg-buy-bg text-buy-text' 
                          : 'bg-sell-bg text-sell-text'
                      }`}>
                        {trade.action}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">#{trade.ticket}</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold ${trade.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                      {trade.profit > 0 ? '+' : ''}{trade.profit}
                    </div>
                    <div className={`text-[9px] font-bold ${trade.gain >= 0 ? 'text-success' : 'text-danger'} opacity-80`}>
                      {trade.gain > 0 ? '+' : ''}{trade.gain}%
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-3 border-t border-slate-50">
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Apertura</p>
                    <p className="text-[10px] text-primary font-medium">{trade.openDate}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cierre</p>
                    <p className="text-[10px] text-primary font-medium">{trade.closeDate}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Precio Entrada</p>
                    <p className="text-[10px] text-primary font-medium">{trade.openPrice}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Precio Salida</p>
                    <p className="text-[10px] text-primary font-medium">{trade.closePrice}</p>
                  </div>
                  <div className="flex justify-between col-span-2 bg-slate-50 p-2 rounded-lg">
                    <div className="text-center flex-1 border-r border-slate-200">
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">SL</p>
                      <p className="text-[10px] text-primary font-bold">{trade.sl}</p>
                    </div>
                    <div className="text-center flex-1 border-r border-slate-200">
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">TP</p>
                      <p className="text-[10px] text-primary font-bold">{trade.tp}</p>
                    </div>
                    <div className="text-center flex-1 border-r border-slate-200">
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Pips</p>
                      <p className={`text-[10px] font-bold ${trade.pips >= 0 ? 'text-success' : 'text-danger'}`}>
                        {trade.pips > 0 ? '+' : ''}{trade.pips}
                      </p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Duración</p>
                      <p className="text-[10px] text-primary font-bold">{trade.duration || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer / Pagination */}
        <div className="px-4 md:px-8 py-4 md:py-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
          <div className="text-center sm:text-left">
            <span className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Mostrando: <span className="text-primary ml-1 mr-2 md:mr-4">{paginatedTrades.length} de {filteredTrades.length}</span>
              <span className="hidden sm:inline">Total Nube: <span className="text-primary ml-1">{trades.length}</span></span>
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="p-2 rounded-lg md:rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-primary disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronLeft size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
            <div className="flex items-center">
              <span className="text-[9px] md:text-[11px] font-bold text-primary tracking-widest uppercase whitespace-nowrap">
                Página {currentPage} / {totalPages || 1}
              </span>
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0 || isLoading}
              className="p-2 rounded-lg md:rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-primary disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronRight size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
