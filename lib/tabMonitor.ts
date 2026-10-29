// This module provides Page Visibility API utilities (server-safe)

export type TabSwitchCallback = (count: number) => void;
export type DisqualifyCallback = () => void;

export interface TabMonitorConfig {
  maxSwitches: number;
  onSwitch: TabSwitchCallback;
  onDisqualify?: DisqualifyCallback;
  mode: 'learning' | 'practice' | 'exam';
}

export function createTabMonitor(config: TabMonitorConfig) {
  let switchCount = 0;
  let isActive = false;

  function handleVisibilityChange() {
    if (document.hidden) {
      switchCount++;
      config.onSwitch(switchCount);

      if (config.mode === 'exam' && config.onDisqualify) {
        if (switchCount >= config.maxSwitches) {
          config.onDisqualify();
        }
      }
    }
  }

  function start() {
    if (typeof window === 'undefined') return;
    if (isActive) return;
    isActive = true;
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  function stop() {
    if (typeof window === 'undefined') return;
    isActive = false;
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }

  function getCount() {
    return switchCount;
  }

  function reset() {
    switchCount = 0;
  }

  return { start, stop, getCount, reset };
}
