'use client';

import { useState, useEffect } from 'react';

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  blockedDates?: string[]; // strings 'YYYY-MM-DD'
  closedDays?: number[]; // [0, 1... 6]
}

export default function Calendar({ selectedDate, onSelectDate, blockedDates = [], closedDays = [] }: CalendarProps) {
  // If selectedDate is empty (""), new Date("") -> Invalid Date. 
  // We must fallback to current date for the VIEW, but keep selectedDate logic separate.
  const [currentDate, setCurrentDate] = useState(() => {
    const d = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  });

  // Sync view when selectedDate changes (e.g. initialDate passed from modal)
  useEffect(() => {
      if (selectedDate) {
          const d = new Date(selectedDate + 'T00:00:00');
          if (!isNaN(d.getTime())) {
              setCurrentDate(d);
          }
      }
  }, [selectedDate]);

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
    // Construct YYYY-MM-DD manually to avoid timezone bugs
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    onSelectDate(`${year}-${m}-${d}`);
  };

  const days = [];
  // Empty slots
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="p-2"></div>);
  }
  // Days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    const isSelected = selectedDate === dateStr;
    const isBlocked = blockedDates.includes(dateStr); 
    
    // Check if past date
    const today = new Date();
    today.setHours(0,0,0,0);
    const currentDayDate = new Date(year, month, i);
    const isPast = currentDayDate < today;
    
    // Check if Closed Day of Week (0=Sun, 6=Sat)
    const dayOfWeek = currentDayDate.getDay();
    const isClosed = closedDays.includes(dayOfWeek);

    let bgClass = '';
    if (isSelected) bgClass = 'bg-fuchsia-600 text-white shadow-lg scale-105';
    if (isSelected) bgClass = 'bg-fuchsia-600 text-white shadow-lg scale-105';
    else if (isPast) bgClass = 'bg-slate-950 text-slate-700 cursor-not-allowed'; // Past
    else if (isClosed) bgClass = 'bg-slate-950 text-slate-600 cursor-not-allowed'; // Closed Weekday
    else if (isBlocked) bgClass = 'bg-slate-950 text-slate-700 cursor-not-allowed opacity-50'; // Blocked
    else bgClass = 'hover:bg-slate-800 hover:text-fuchsia-500 text-slate-300 cursor-pointer font-bold';

    days.push(
      <div 
        key={i} 
        onClick={() => {
            if (!isPast && !isBlocked && !isClosed) handleSelect(i);
        }}
        className={`
          aspect-square flex items-center justify-center rounded-xl text-base font-bold transition-all w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14
          ${bgClass}
        `}
      >
        {i}
      </div>
    );
  }


  return (
    <div className="bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-700">
      <div className="relative flex items-center justify-center mb-6 pt-2">
        <button 
            type="button" 
            onClick={prevMonth} 
            className="absolute left-0 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all active:scale-95"
            title="Mês anterior"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
        </button>
        
        <span className="font-bold text-white text-lg capitalize select-none">
            {MONTHS[month]} <span className="text-fuchsia-500">{year}</span>
        </span>
        
        <button 
            type="button" 
            onClick={nextMonth} 
            className="absolute right-0 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all active:scale-95"
            title="Próximo mês"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 text-center mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <span key={i} className="text-xs font-bold text-slate-500">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center gap-0.5">
        {days}
      </div>
    </div>
  );
}
