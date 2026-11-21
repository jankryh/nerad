import React from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellRing, X } from 'lucide-react';
import { getAvailableLeads, getNextLead } from '../utils/departureAlerts';
import type { AlertToast } from '../hooks/useDepartureAlerts';

interface AlertButtonProps {
  /** Formatted effective departure time, e.g. "18:53" */
  timeLabel: string;
  /** Effective departure time in ms */
  departureTime: number;
  leadMinutes: number | null;
  /** Too close to departure for any lead time */
  tooLate?: boolean;
  onChange: (leadMinutes: number | null) => void;
}

/** Repeated clicks cycle the lead time: off → 5 → 10 → 15 min → off */
export const AlertButton: React.FC<AlertButtonProps> = ({ timeLabel, departureTime, leadMinutes, tooLate = false, onChange }) => {
  const active = leadMinutes !== null;
  const disabled = !active && tooLate;

  const handleClick = () => {
    const next = getNextLead(leadMinutes, getAvailableLeads(departureTime, Date.now()));
    if (next !== leadMinutes) onChange(next);
  };

  const label = active
    ? `Připomenout odjezd ${timeLabel}, ${leadMinutes} min předem`
    : `Připomenout odjezd ${timeLabel}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={disabled ? 'Odjezd je příliš brzy' : active ? `Připomínka ${leadMinutes} min předem — kliknutím změníte` : 'Připomenout odjezd'}
      className={`inline-flex items-center justify-center gap-0.5 rounded-md w-8 h-8 px-0.5 transition-colors duration-150 focus-ring disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? 'text-primary-400 bg-primary-500/15 hover:bg-primary-500/25'
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
      }`}
    >
      {active
        ? <BellRing className="w-4 h-4" aria-hidden="true" />
        : <Bell className="w-4 h-4" aria-hidden="true" />}
      {active && <span className="text-[10px] font-bold leading-none" aria-hidden="true">{leadMinutes}</span>}
    </button>
  );
};

interface AlertToastsProps {
  toasts: AlertToast[];
  onDismiss: (id: string) => void;
}

/** In-page fallback when system notifications are unavailable or not permitted */
export const AlertToasts: React.FC<AlertToastsProps> = ({ toasts, onDismiss }) => {
  if (!toasts.length || typeof document === 'undefined') return null;
  // Portal: a backdrop-filter ancestor (.glass) would otherwise become the containing block of `fixed`
  return createPortal(
    <div className="fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className="glass pointer-events-auto flex items-center gap-3 rounded-xl border border-primary-500/30 px-4 py-3 shadow-lg max-w-md w-full"
        >
          <BellRing className="w-5 h-5 flex-shrink-0 text-primary-400" aria-hidden="true" />
          <p className="flex-1 text-sm font-semibold text-white">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Zavřít připomínku"
            className="inline-flex items-center justify-center min-w-11 min-h-11 sm:min-w-8 sm:min-h-8 rounded-md text-zinc-400 hover:text-zinc-300 hover:bg-white/5 focus-ring"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
};
