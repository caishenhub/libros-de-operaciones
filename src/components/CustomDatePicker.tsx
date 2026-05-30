import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export type PresetType = 'all' | 'today' | '7d' | '30d' | 'jan2026' | 'feb2026' | 'custom';

interface CustomDatePickerProps {
  onDateChange: (range: DateRange, preset: PresetType) => void;
  selectedPreset: PresetType;
  selectedRange: DateRange;
}

export default function CustomDatePicker({
  onDateChange,
  selectedPreset,
  selectedRange,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Month and Year for calendar display
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Quick preset definitions
  const presets: { id: PresetType; label: string; description: string }[] = [
    { id: 'all', label: 'Historial Completo', description: 'Todas las operaciones registradas' },
    { id: 'today', label: 'Hoy', description: 'Operaciones de las últimas 24h' },
    { id: '7d', label: 'Últimos 7 días', description: 'Rango de la última semana' },
    { id: '30d', label: 'Últimos 30 días', description: 'Rango del último mes' },
    { id: 'jan2026', label: 'Enero 2026', description: 'Operaciones históricas de Enero' },
    { id: 'feb2026', label: 'Febrero 2026', description: 'Operaciones históricas de Febrero' },
    { id: 'custom', label: 'Rango Personalizado', description: 'Seleccionar en el calendario' },
  ];

  // If a range is selected from the calendar, we default the calendar view to that year/month
  useEffect(() => {
    if (selectedRange.start) {
      setCurrentMonth(selectedRange.start.getMonth());
      setCurrentYear(selectedRange.start.getFullYear());
    } else {
      // Default to Feb 2026 for historical records relevance
      setCurrentMonth(1); 
      setCurrentYear(2026);
    }
  }, [selectedRange.start, isOpen]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calendar math generators
  const daysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Preset Selection Click Handler
  const handlePresetSelect = (presetId: PresetType) => {
    const today = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    if (presetId === 'all') {
      start = null;
      end = null;
    } else if (presetId === 'today') {
      start = new Date(today);
      start.setHours(0, 0, 0, 0);
      end = new Date(today);
      end.setHours(23, 59, 59, 999);
    } else if (presetId === '7d') {
      start = new Date();
      start.setDate(today.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end = new Date(today);
      end.setHours(23, 59, 59, 999);
    } else if (presetId === '30d') {
      start = new Date();
      start.setDate(today.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end = new Date(today);
      end.setHours(23, 59, 59, 999);
    } else if (presetId === 'jan2026') {
      start = new Date(2026, 0, 1, 0, 0, 0);
      end = new Date(2026, 0, 31, 23, 59, 59);
    } else if (presetId === 'feb2026') {
      start = new Date(2026, 1, 1, 0, 0, 0);
      end = new Date(2026, 1, 28, 23, 59, 59); // 2026 is not leap year
    } else if (presetId === 'custom') {
      // Keeps the current range to let user adjust
      return;
    }

    onDateChange({ start, end }, presetId);
  };

  // Day Grid click handler - Range Selection Logic
  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    
    // Logic:
    // 1. If start is null, or both start and end are already selected, set this as start and reset end
    // 2. If start is selected but end is null:
    //    a. If clickedDate is before start, make this new start
    //    b. Else, make this end
    let newStart = selectedRange.start;
    let newEnd = selectedRange.end;

    if (!newStart || (newStart && newEnd)) {
      newStart = clickedDate;
      newEnd = null;
    } else if (newStart && !newEnd) {
      if (clickedDate < newStart) {
        newStart = clickedDate;
      } else {
        newEnd = clickedDate;
        // set times to cover full day
        newEnd.setHours(23, 59, 59, 999);
      }
    }

    onDateChange({ start: newStart, end: newEnd }, 'custom');
  };

  // Helper to check if a day is selected or inside range
  const getDayStatus = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateMs = date.getTime();
    
    const startMs = selectedRange.start ? new Date(selectedRange.start).setHours(0,0,0,0) : null;
    const endMs = selectedRange.end ? new Date(selectedRange.end).setHours(23,59,59,999) : null;

    if (startMs && dateMs === startMs) {
      return 'start';
    }
    if (endMs && dateMs === endMs) {
      return 'end';
    }
    if (startMs && endMs && dateMs > startMs && dateMs < endMs) {
      return 'in-range';
    }
    return 'none';
  };

  // Human Readable Month translation
  const monthsSpanish = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Weekdays header
  const weekdays = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

  // Render trigger button text
  const getTriggerText = () => {
    if (selectedPreset !== 'custom') {
      const preset = presets.find(p => p.id === selectedPreset);
      return preset ? preset.label : 'Filtrar por Fecha';
    }

    if (selectedRange.start && selectedRange.end) {
      const format = (d: Date) => {
        const day = d.getDate();
        const monthShort = monthsSpanish[d.getMonth()].substring(0, 3);
        const year = d.getFullYear();
        return `${day} ${monthShort}, ${year}`;
      };
      return `${format(selectedRange.start)} - ${format(selectedRange.end)}`;
    } else if (selectedRange.start) {
      const format = (d: Date) => {
        const day = d.getDate();
        const monthShort = monthsSpanish[d.getMonth()].substring(0, 3);
        return `${day} ${monthShort}`;
      };
      return `Desde ${format(selectedRange.start)}...`;
    }

    return 'Todas las fechas';
  };

  // Clean / Clear handler
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateChange({ start: null, end: null }, 'all');
  };

  const totalDays = daysInMonth(currentMonth, currentYear);
  const firstDay = firstDayOfMonth(currentMonth, currentYear);
  const calendarDays = [];

  // Previous month padding days
  const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = daysInMonth(prevMonthIndex, prevMonthYear);
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      month: prevMonthIndex,
      year: prevMonthYear
    });
  }

  // Active month days
  for (let i = 1; i <= totalDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      month: currentMonth,
      year: currentYear
    });
  }

  // Next month padding days
  const remainingCells = 42 - calendarDays.length; // 6 rows of 7
  const nextMonthIndex = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      month: nextMonthIndex,
      year: nextMonthYear
    });
  }

  return (
    <div className="relative flex-grow lg:flex-none" ref={dropdownRef} id="custom_datepicker_container">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-3 w-full lg:w-72 px-4 py-3 border rounded-xl md:rounded-2xl text-xs md:text-sm font-semibold transition-all shadow-sm ${
          isOpen 
            ? 'border-accent bg-slate-50 ring-2 ring-accent/20' 
            : selectedPreset !== 'all'
              ? 'border-accent bg-accent/5 text-primary'
              : 'border-slate-200 bg-white text-primary hover:border-slate-300'
        }`}
        id="datepicker_trigger_button"
      >
        <div className="flex items-center gap-2.5 truncate">
          <Calendar size={15} className={selectedPreset !== 'all' ? 'text-primary' : 'text-slate-400'} />
          <span className="truncate">{getTriggerText()}</span>
        </div>
        
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          {selectedPreset !== 'all' && (
            <span
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-danger hover:bg-red-50 transition-colors"
              title="Limpiar filtro de fecha"
            >
              <X size={12} />
            </span>
          )}
          <ChevronRight size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 mt-2 z-50 bg-white border border-slate-100 rounded-2xl md:rounded-[1.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-hidden w-full md:w-[620px] max-w-[calc(100vw-1.5rem)]"
            id="datepicker_popover_panel"
          >
            {/* Quick Presets Menu */}
            <div className="w-full md:w-[220px] p-3 md:p-4 bg-slate-50/50 flex flex-col gap-1 overflow-y-auto max-h-[300px] md:max-h-[400px]">
              <div className="px-2 py-1 mb-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={10} className="text-primary animate-pulse" />
                  Accesos Rápidos
                </span>
              </div>
              {presets.map(preset => {
                const isActive = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`flex flex-col items-start gap-0.5 px-3 py-2 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-sm shadow-primary/10'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold leading-tight">{preset.label}</span>
                      {isActive && <Check size={11} className="text-accent" />}
                    </div>
                    <span className={`text-[9px] leading-snug font-medium truncate w-[160px] ${
                      isActive ? 'text-accent/80' : 'text-slate-400'
                    }`}>
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Calendar Selection */}
            <div className="flex-1 p-4 md:p-5 flex flex-col bg-white">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs md:text-sm font-bold text-primary uppercase tracking-wide">
                  {monthsSpanish[currentMonth]} {currentYear}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Day Header row */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1 bg-slate-50 py-1 rounded-lg">
                {weekdays.map(day => (
                  <span key={day} className="text-[8px] md:text-[9px] font-bold text-slate-400">
                    {day}
                  </span>
                ))}
              </div>

              {/* Days grid layout */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((cell, idx) => {
                  if (!cell.isCurrentMonth) {
                    return (
                      <div
                        key={`pad-${idx}`}
                        className="aspect-square flex items-center justify-center text-[10px] md:text-xs text-slate-300 font-medium cursor-not-allowed select-none"
                      >
                        {cell.day}
                      </div>
                    );
                  }

                  const status = getDayStatus(cell.day);
                  const isBoundary = status === 'start' || status === 'end';
                  
                  return (
                    <button
                      key={`day-${cell.day}`}
                      onClick={() => handleDayClick(cell.day)}
                      className={`aspect-square flex flex-col items-center justify-center text-[10px] md:text-xs rounded-lg transition-all relative ${
                        status === 'start'
                          ? 'bg-primary text-white font-bold rounded-lg shadow-sm'
                          : status === 'end'
                            ? 'bg-primary text-white font-bold rounded-lg shadow-sm'
                            : status === 'in-range'
                              ? 'bg-accent/20 text-primary font-bold hover:bg-accent/30'
                              : 'text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      {/* Highlight start/end connection overlays */}
                      {status === 'start' && selectedRange.end && (
                        <div className="absolute right-0 top-0 bottom-0 left-1/2 bg-accent/20 -z-10" />
                      )}
                      {status === 'end' && selectedRange.start && (
                        <div className="absolute left-0 top-0 bottom-0 right-1/2 bg-accent/20 -z-10" />
                      )}

                      <span>{cell.day}</span>
                      
                      {/* Tiny indicator if current cell matches today's real date */}
                      {new Date().getDate() === cell.day && 
                       new Date().getMonth() === currentMonth && 
                       new Date().getFullYear() === currentYear && !isBoundary && (
                        <div className={`h-1 w-1 rounded-full absolute bottom-1 ${
                          status === 'in-range' ? 'bg-primary' : 'bg-accent shadow-[0_0_4px_#ceff04]'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Calendar Legend/Helper Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] md:text-[10px] text-slate-400 font-medium bg-slate-50/40 p-2 rounded-xl">
                <span>⚡ Haz click para elegir inicio y fin</span>
                {selectedRange.start && (
                  <button
                    onClick={() => {
                      onDateChange({ start: null, end: null }, 'all');
                    }}
                    className="text-primary font-bold hover:underline"
                  >
                    Restablecer
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
