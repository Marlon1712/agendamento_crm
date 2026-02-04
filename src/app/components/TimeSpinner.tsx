
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TimeSpinnerProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export default function TimeSpinner({ value = '09:00', onChange, disabled = false }: TimeSpinnerProps) {
    const adjustTime = (timeStr: string, type: 'hour' | 'minute', amount: number) => {
        if (!timeStr) timeStr = '00:00';
        const parts = timeStr.split(':');
        let h = parseInt(parts[0] || '0');
        let m = parseInt(parts[1] || '0');

        if (type === 'hour') {
            h = (h + amount + 24) % 24;
        } else {
            m = (m + amount + 60) % 60;
            // Step 5
            m = Math.round(m / 5) * 5;
            if (m === 60) m = 0;
        }
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const handleAdjust = (type: 'hour' | 'minute', amount: number) => {
        if (disabled) return;
        onChange(adjustTime(value, type, amount));
    };

    const [h, m] = (value || '00:00').split(':');

    return (
        <div className={`flex items-center justify-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Hour */}
            <div className="flex flex-col items-center">
                <button type="button" onClick={() => handleAdjust('hour', 1)} className="text-slate-400 hover:text-fuchsia-500 p-0.5"><ChevronUp size={14}/></button>
                <span className="text-sm font-bold text-white w-5 text-center">{h}</span>
                <button type="button" onClick={() => handleAdjust('hour', -1)} className="text-slate-400 hover:text-fuchsia-500 p-0.5"><ChevronDown size={14}/></button>
            </div>
            <span className="text-slate-500 font-bold mb-0.5 text-xs">:</span>
            {/* Minute */}
            <div className="flex flex-col items-center">
                <button type="button" onClick={() => handleAdjust('minute', 5)} className="text-slate-400 hover:text-fuchsia-500 p-0.5"><ChevronUp size={14}/></button>
                <span className="text-sm font-bold text-white w-5 text-center">{m}</span>
                <button type="button" onClick={() => handleAdjust('minute', -5)} className="text-slate-400 hover:text-fuchsia-500 p-0.5"><ChevronDown size={14}/></button>
            </div>
        </div>
    );
}
