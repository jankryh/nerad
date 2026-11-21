import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { getVehiclePosition } from '../api/pidApi';
import { REFRESH_INTERVAL } from '../constants';
import { VehiclePosition as Position } from '../types';
import { formatTime } from '../utils/timeCalculations';

type State = { status: 'loading' } | { status: 'error' } | { status: 'ok'; position: Position | null };

const describe = (position: Position): string => {
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

/** Live position of the nearest departure; renders nothing until a position is known */
export const VehiclePosition: React.FC<{ tripId: string }> = ({ tripId }) => {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      getVehiclePosition(tripId)
        .then((position) => { if (!cancelled) setState({ status: 'ok', position }); })
        .catch(() => { if (!cancelled) setState({ status: 'error' }); });
    };
    setState({ status: 'loading' });
    load();
    // At most one request per 30 s; skip while the tab is hidden.
    const intervalId = setInterval(() => { if (!document.hidden) load(); }, REFRESH_INTERVAL);
    return () => { cancelled = true; clearInterval(intervalId); };
  }, [tripId]);

  // Hide loading/error/unknown states: the hint only helps when a real position is known
  if (state.status !== 'ok' || !state.position || (!state.position.lastStop && !state.position.nextStop)) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 pb-2 -mt-1 text-xs text-zinc-400" role="row">
      <MapPin className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" aria-hidden="true" />
      <div role="cell">{describe(state.position)}</div>
    </div>
  );
};
