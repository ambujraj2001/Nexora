import React, { useEffect, useRef } from 'react';
import { aiEventBus } from '../features/activity/aiEventBus';
import { useAIStore, type AIState } from './store/aiStore';

const ActivitySimulator: React.FC = () => {
  const lastEventTime = useRef<number>(0);
  const storeStatus = useAIStore((state: AIState) => state.currentStatus);

  useEffect(() => {
    lastEventTime.current = Date.now();
    const isDev = window.location.hostname === 'localhost';
    if (!isDev) return;

    // Listen to all events to update lastEventTime
    const unsubscribe = aiEventBus.subscribe(() => {
      lastEventTime.current = Date.now();
    });

    const interval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastEventTime.current;

      // If idle for 10 seconds and status is idle
      if (idleTime > 10000 && storeStatus === 'idle') {
        const mockEvents = [
          "System idle — monitoring background tasks",
          "Optimizing memory indices...",
          "Checking for new calendar updates",
          "AI Core standing by for instructions",
          "Analyzing local context for improvements"
        ];
        
        const message = mockEvents[Math.floor(Math.random() * mockEvents.length)];
        
        aiEventBus.emit({
          id: `mock-${now}`,
          type: 'thinking',
          message,
          status: 'info',
          timestamp: now
        });
        
        lastEventTime.current = now;
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [storeStatus]);

  return null;
};

export default ActivitySimulator;
