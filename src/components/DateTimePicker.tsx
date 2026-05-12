import React from 'react';
import { Calendar, Radio } from 'lucide-react';

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

const toInputValue = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange }) => {
  const now = new Date();
  const maxDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      onChange(null);
      return;
    }
    const date = new Date(val);
    if (!isNaN(date.getTime())) {
      onChange(date);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center">
        <Calendar className="absolute left-2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" aria-hidden="true" />
        <input
          type="datetime-local"
          value={value ? toInputValue(value) : ''}
          onChange={handleChange}
          min={toInputValue(now)}
          max={toInputValue(maxDate)}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg pl-7 pr-2 py-1.5 text-sm text-white font-mono focus-ring appearance-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          aria-label="Vybrat datum a čas odjezdu"
          title="Vybrat datum a čas"
        />
      </div>

      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors duration-150 focus-ring"
          aria-label="Přepnout na živé odjezdy"
          title="Zpět na živé odjezdy"
        >
          <Radio className="w-3 h-3" aria-hidden="true" />
          Živě
        </button>
      )}
    </div>
  );
};
