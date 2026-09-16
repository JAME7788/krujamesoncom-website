import { useEffect, useState } from 'react';
import { createGameTimers } from '../utils/gameTimers';

export const useGameTimers = (roundKey?: string | number) => {
  const [timers] = useState(createGameTimers);
  useEffect(() => timers.clear, [timers, roundKey]);
  return timers;
};
