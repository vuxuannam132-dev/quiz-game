'use client';

import { useRef, useCallback, useEffect } from 'react';
import { SoundType, UseSoundReturn } from '@/types';

// Public domain sound URLs
const SOUND_URLS: Record<SoundType, string> = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
  countdown: 'https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3',
  reveal: 'https://assets.mixkit.co/active_storage/sfx/888/888-preview.mp3',
  finish: 'https://assets.mixkit.co/active_storage/sfx/1993/1993-preview.mp3',
  tick: 'https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3',
};

export function useSound(enabled: boolean): UseSoundReturn {
  const soundsRef = useRef<Record<string, Howl>>({});
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isLoadedRef.current) return;
    
    const loadHowler = async () => {
      const { Howl } = await import('howler');
      isLoadedRef.current = true;
      
      Object.entries(SOUND_URLS).forEach(([key, url]) => {
        soundsRef.current[key] = new Howl({
          src: [url],
          volume: 0.7,
          preload: false,
          html5: true,
        });
      });
    };

    loadHowler();
  }, []);

  const play = useCallback(
    (sound: SoundType) => {
      if (!enabled || typeof window === 'undefined') return;
      
      const howl = soundsRef.current[sound];
      if (howl) {
        howl.play();
      }
    },
    [enabled]
  );

  const stop = useCallback((sound?: SoundType) => {
    if (sound) {
      soundsRef.current[sound]?.stop();
    } else {
      Object.values(soundsRef.current).forEach((h) => h.stop());
    }
  }, []);

  return { play, stop };
}
