import React, { useEffect, useId, useState } from 'react';
import { MapPin } from 'lucide-react';
import { getVehiclePosition } from '../api/pidApi';
import { REFRESH_INTERVAL } from '../constants';
import { VehiclePosition as Position } from '../types';
import { formatTime } from '../utils/timeCalculations';

type State = { status: 'loading' } | { status: 'error' } | { status: 'ok'; position: Position | null };

const describe = (state: State): string => {
  if (state.status === 'loading') return 'Načítám polohu…';
  if (state.status === 'error') return 'Polohu se nepodařilo načíst';
  const { position } = state;
  if (!position || (!position.lastStop && !position.nextStop)) return 'Poloha není k dispozici';

  const where = position.lastStop && position.nextStop && position.lastStop !== position.nextStop
    ? `${position.lastStop} → ${position.nextStop}`
    : `u zastávky ${position.lastStop ?? position.nextStop}`;
  const delay = position.delay === null ? ''
    : position.delay > 0 ? `, +${position.delay} min`
    : position.delay < 0 ? `, ${position.delay} min`
    : ', včas';
  const at = position.timestamp ? ` (${formatTime(position.timestamp)})` : '';
  return `Poloha: ${where}${delay}${at}`;
};

/** On-demand vehicle position: renders a toggle cell and, when open, a full-width detail cell (parent row must flex-wrap). */
export const VehiclePosition: React.FC<{ tripId: string; line: string }> = ({ tripId, line }) => {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ status: 'loading' });
  const detailId = useId();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = () => {
      getVehiclePosition(tripId)
        .then((position) => { if (!cancelled) setState({ status: 'ok', position }); })
        .catch(() => { if (!cancelled) setState({ status: 'error' }); });
    };
    setState({ status: 'loading' });
    load();
    // At most one request per 30 s and only while this row is open; skip while the tab is hidden.
    const intervalId = setInterval(() => { if (!document.hidden) load(); }, REFRESH_INTERVAL);
    return () => { cancelled = true; clearInterval(intervalId); };
  }, [open, tripId]);

  return (
    <>
      <div className="w-7 flex-shrink-0 flex justify-end" role="cell">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={detailId}
          aria-label={`Kde je spoj ${line}?`}
          title="Kde je?"
          className={`focus-ring rounded p-1 hover:bg-white/5 ${open ? 'text-primary-400' : 'text-zinc-500'}`}
        >
          <MapPin className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <div id={detailId} className="basis-full text-xs text-zinc-400" role="cell" aria-live="polite" hidden={!open}>
        {open ? describe(state) : null}
      </div>
    </>
  );
};
