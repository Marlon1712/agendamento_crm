'use client';

import { useState, useEffect } from 'react';

interface CalendarRangeProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  compact?: boolean;
}

export default function CalendarRange({ startDate, endDate, onChange, compact }: CalendarRangeProps) {
  // Parsing initial date for View
  // We prioritize startDate for view focus, else today.
  const [currentDate, setCurrentDate] = useState(() => 
    startDate ? new Date(startDate + 'T00:00:00') : new Date()
  );

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
  
  const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleSelect = (day: number) => {
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    const dateStr = `${year}-${m}-${d}`;

    // Logic:
    // 1. If no start, set start.
    // 2. If start exists but no end:
    //    a. If date < start, New start = date, Old start becomes end? Or just set new start. (Lets just swap/reset)
    //    b. If date >= start, set End = date.
    // 3. If both exist, Reset: Start = date, End = ''

    if (!startDate || (startDate && endDate)) {
        // Reset or First Click
        onChange(dateStr, '');
    } else if (startDate && !endDate) {
        // Second Click
        if (dateStr < startDate) {
            // User clicked before start, swap them
            onChange(dateStr, startDate);
        } else {
            onChange(startDate, dateStr);
        }
    }
  };

  const daysResult = [];
  // Empty slots
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysResult.push(<div key={`empty-${i}`} className="p-2"></div>);
  }
  
  // Days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    
    const isStart = startDate === dateStr;
    const isEnd = endDate === dateStr;
    const isInRange = startDate && endDate && dateStr > startDate && dateStr < endDate;
    
    // Styling
    let cellBg = "";
    if (isInRange) cellBg = "bg-[#EAD1F0]";
    if (isStart && endDate) cellBg = "bg-gradient-to-r from-transparent 50% to-[#EAD1F0] 50%"; // Half fill right
    if (isEnd && startDate) cellBg = "bg-gradient-to-l from-transparent 50% to-[#EAD1F0] 50%"; // Half fill left
    
    // Circle Style
    let circleClass = `${compact ? 'w-6 h-6 text-xs' : 'w-8 h-8'} flex items-center justify-center rounded-full transition-colors`;
    if (isStart || isEnd) {
        circleClass += " bg-[#3b0764] text-white shadow-sm font-bold scale-105"; // Deep purple
    } else if (isInRange) {
        circleClass += " text-[#3b0764] font-bold";
    } else {
        circleClass += " text-gray-700 hover:bg-gray-100";
    }

    daysResult.push(
      <div 
        key={i} 
        onClick={() => handleSelect(i)}
        className={`aspect-square flex items-center justify-center p-0 cursor-pointer ${cellBg}`}
      >
         <div className={circleClass}>{i}</div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 mx-auto select-none ${compact ? 'p-2 max-w-[260px]' : 'p-4 max-w-sm'}`}>
      <div className="relative flex items-center justify-center mb-4 pt-2">
        <button 
            type="button" 
            onClick={prevMonth} 
            className="absolute left-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-full transition-all active:scale-95"
            title="Mês anterior"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
        </button>
        
        <span className={`font-bold text-gray-800 capitalize select-none ${compact ? 'text-sm' : 'text-lg'}`}>
            {MONTHS[month]} <span className="text-fuchsia-600">{year}</span>
        </span>
        
        <button 
            type="button" 
            onClick={nextMonth} 
            className="absolute right-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-full transition-all active:scale-95"
            title="Próximo mês"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 text-center mb-2">
        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map((d, i) => (
            <span key={i} className={`font-bold text-gray-400 tracking-wider ${compact ? 'text-[8px]' : 'text-[10px]'}`}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center gap-y-1">
        {daysResult}
      </div>
    </div>
  );
}
